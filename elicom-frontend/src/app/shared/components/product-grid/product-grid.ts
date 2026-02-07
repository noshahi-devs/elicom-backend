import { Component, Input, OnChanges, SimpleChanges, OnInit, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductService, ProductCardDto } from '../../../services/product';
import { CartService } from '../../../services/cart.service';
import Swal from 'sweetalert2';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-product-grid-new',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-grid.html',
  styleUrls: ['./product-grid.scss']
})
export class ProductGridComponent implements OnInit, OnChanges {
  @Input() filterData: any = {};
  @Input() products: any[] | null = null;
  @Input() visibleCountOverride: number | null = null;
  @Output() productsLoaded = new EventEmitter<any[]>();

  allProducts: ProductCardDto[] = [];
  visibleProducts: ProductCardDto[] = [];

  visibleCount = 30; // 6 rows * 5 columns

  constructor(
    private productService: ProductService,
    private cdr: ChangeDetectorRef,
    private cartService: CartService // Inject
  ) { }

  ngOnInit() {
    if (this.visibleCountOverride) this.visibleCount = this.visibleCountOverride;

    if (this.products && this.products.length > 0) {
      this.allProducts = this.products;
      this.applyFilters();
    } else {
      this.loadProducts();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['products'] && this.products) {
      this.allProducts = this.products;
      this.applyFilters();
    }
    if (changes['filterData']) {
      this.applyFilters();
    }
  }

  loadProducts() {
    if (this.products && this.products.length > 0) return;

    // Using real API for product cards
    this.productService.getProductsForCards(0, 200).subscribe({
      next: (res: any) => {
        // Handle various response shapes robustly
        let items: ProductCardDto[] = [];
        if (Array.isArray(res)) {
          items = res;
        } else if (res && Array.isArray(res.items)) {
          items = res.items;
        } else if (res && Array.isArray(res.result)) {
          // fallback if result wrapper was not stripped by service
          items = res.result;
        }

        this.allProducts = items;
        this.productsLoaded.emit(this.allProducts);
        this.applyFilters();
        this.cdr.detectChanges(); // Fix NG0100
      },
      error: (err) => {
        console.error('Failed to load products', err);
        // Fallback or empty state could be handled here
      }
    });
  }

  applyFilters() {
    if (!this.allProducts.length) return;

    let filtered = [...this.allProducts];

    // 1. Category Filter (Strict or fuzzy)
    if (this.filterData.category) {
      const cat = this.filterData.category.toLowerCase();
      filtered = filtered.filter(p =>
        (p.categoryName && p.categoryName.toLowerCase().includes(cat)) ||
        (p.title && p.title.toLowerCase().includes(cat))
      );
    }

    // 2. Custom Filters (Size, Color, etc. from sidebar chips)
    if (this.filterData.filters && this.filterData.filters.length > 0) {
      this.filterData.filters.forEach((f: string) => {
        const lowF = f.toLowerCase();
        if (lowF.startsWith('price:')) return; // handled separately

        // Check if it's a color or size match
        filtered = filtered.filter(p =>
          ((p as any).color && (p as any).color.toLowerCase() === lowF) ||
          ((p as any).size && (p as any).size.toLowerCase() === lowF) ||
          (p.categoryName && p.categoryName.toLowerCase() === lowF)
        );
      });
    }

    // 3. Price Filter
    if (this.filterData.price) {
      // Only filter if price range is explicitly set/changed from default
      // The default max is 6062, so if max is less, we filter.
      if (this.filterData.price.max < 6062 || this.filterData.price.min > 0) {
        filtered = filtered.filter(p => p.price >= this.filterData.price.min && p.price <= this.filterData.price.max);
      }
    }

    // 4. Sort
    if (this.filterData.sort) {
      if (this.filterData.sort === 'price-low') {
        filtered.sort((a, b) => a.price - b.price);
      } else if (this.filterData.sort === 'price-high') {
        filtered.sort((a, b) => b.price - a.price);
      } else if (this.filterData.sort === 'newest') {
        // Assuming there is a date field, or just by ID roughly if incremental
        // If no date field, we might skip or use randomness/mock
        // filtered.sort((a: any, b: any) => new Date(b.creationTime).getTime() - new Date(a.creationTime).getTime());
      }
    }

    this.visibleProducts = filtered.slice(0, this.visibleCount);
  }

  get showViewMore(): boolean {
    return this.allProducts.length > 30 && this.visibleProducts.length < this.allProducts.length;
  }

  viewMore() {
    this.visibleCount += 30; // Add 6 more rows
    this.applyFilters(); // Re-slice
  }

  getFirstImage(product: any): string {
    // 1. Get raw value from one of the possible fields
    let val = product.image1 || product.productImage || product.imageUrl || product.image2;

    // 2. Name-based fallback (copied from product-info logic)
    if (!val || val === 'string' || val.trim() === '') {
      const name = (this.getTitle(product) || '').toLowerCase();
      if (name.includes('hair removal') || name.includes('hair removel') || name.includes('hair remover') || name.includes('epilator')) {
        return 'https://picsum.photos/seed/beauty1/300/400';
      }
      if (name.includes('laptop bag')) return 'https://picsum.photos/seed/bag1/300/400';
      if (name.includes('women summer floral dress')) return 'https://picsum.photos/seed/dress1/300/400';
      // Default fallback
      return `https://picsum.photos/seed/${product.id || product.productId || 'p'}/300/400`;
    }

    // 3. Handle comma-separated strings
    if (val && typeof val === 'string' && val.includes(',')) {
      val = val.split(',')[0]; // Take first
    }
    val = val ? val.trim() : '';
    if (!val) return 'assets/images/card_1.jpg'; // Ultimate fallback

    // 4. Broken CDN or Missing File Fix (MUST BE BEFORE http CHECK)
    if (val.includes('cdn.elicom.com') || val.includes('hair.png')) {
      const seed = val.split('/').pop() || (this.getTitle(product));
      return `https://picsum.photos/seed/${seed}/300/400`;
    }

    // 5. Absolute vs Relative
    if (val.startsWith('http')) return val;

    // 6. Prepend Base URL
    const baseUrl = environment.apiUrl;

    if (!val.startsWith('/')) {
      if (val.indexOf('/') === -1) {
        return `${baseUrl}/images/products/${val}`;
      }
      return `${baseUrl}/${val}`;
    }

    return `${baseUrl}${val}`;
  }

  getSecondImage(product: any): string | null {
    let val = null;

    // source selection
    if (product.image2 && product.image2 !== product.image1) {
      val = product.image2;
    } else if (product.images && Array.isArray(product.images) && product.images.length > 1) {
      val = product.images[1];
    } else {
      // Check if primary field has multiple comma-separated
      const primary = product.image1 || product.productImage || product.imageUrl;
      if (primary && primary.includes(',')) {
        const parts = primary.split(',').map((s: string) => s.trim()).filter((s: string) => s);
        if (parts.length > 1) val = parts[1];
      }
    }

    if (!val || typeof val !== 'string') return null;

    // cleanup
    if (val.includes(',')) val = val.split(',')[0].trim();

    // Broken CDN or Missing File Fix
    if (val.includes('cdn.elicom.com') || val.includes('hair.png')) {
      const seed = val.split('/').pop() || 'p2';
      return `https://picsum.photos/seed/${seed}/300/400`;
    }

    if (val.startsWith('http')) return val;

    const baseUrl = environment.apiUrl;
    if (!val.startsWith('/')) {
      if (val.indexOf('/') === -1) {
        return `${baseUrl}/images/products/${val}`;
      }
      return `${baseUrl}/${val}`;
    }
    return `${baseUrl}${val}`;
  }

  getTitle(product: any): string {
    const t = product.title || product.productName || product.name || 'Untitled Product';
    return t.trim();
  }

  handleImageError(event: any, product: any, type: string) {
    const title = this.getTitle(product).toLowerCase();
    let fallbackUrl = '';

    // Specific Fallbacks for Known Broken Products or filenames
    if (title.includes('hair remov') || (product.imageUrl && product.imageUrl.includes('hair.png'))) {
      fallbackUrl = type === 'main'
        ? 'https://picsum.photos/seed/hair1/300/400'
        : 'https://picsum.photos/seed/hair2/300/400';
    } else if (title.includes('laptop bag')) {
      fallbackUrl = type === 'main'
        ? 'https://picsum.photos/seed/bag1/300/400'
        : 'https://picsum.photos/seed/bag2/300/400';
    } else if (title.includes('women summer floral dress')) {
      fallbackUrl = type === 'main'
        ? 'https://picsum.photos/seed/dress1/300/400'
        : 'https://picsum.photos/seed/dress2/300/400';
    } else {
      // Generic consistent random fallback
      const seed = (product.id || product.productId || title || 'default').toString();
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
        hash = seed.charCodeAt(i) + ((hash << 5) - hash);
      }

      const totalCards = 8;
      const index = Math.abs(hash) % totalCards + 1;

      // For main image
      if (type !== 'hover') {
        fallbackUrl = `assets/images/card_${index}.jpg`;
      } else {
        // For hover, ensure it's different
        const nextIndex = (index % totalCards) + 1;
        fallbackUrl = `assets/images/card_${nextIndex}.jpg`;
      }
    }

    // Prevent infinite loop
    if (event.target.src === fallbackUrl || event.target.src.includes(fallbackUrl)) return;

    event.target.src = fallbackUrl;
  }

  // Add To Cart Logic
  addToCart(product: any, event: Event) {
    event.stopPropagation(); // prevent navigating to detail page

    // For grid, we usually don't have size/color selected, so we might send defaults or null
    // If logic requires size/color, we might need to open a Quick View modal instead.
    // For now assuming we can add base product.

    // Check if auth happens in service
    // We Subscribe to trigger execution
    // Inject CartService first (which I need to add to constructor)
    if (!this.cartService) {
      console.error('CartService not injected');
      return;
    }

    const image = this.getFirstImage(product);

    // ...

    this.cartService.addToCart(product, 1, '', '', image).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Added to Cart!',
          text: `${this.getTitle(product)} added to your bag.`,
          timer: 2000,
          showConfirmButton: false
        });
      },
      error: (err) => {
        console.error('[ProductGrid] Add to cart failed:', err);
      }
    });
  }
}
