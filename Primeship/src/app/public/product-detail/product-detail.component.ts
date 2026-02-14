import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { Observable } from 'rxjs';
import { PublicService } from '../../core/services/public.service';
import { ProductService, ProductDto } from '../../core/services/product.service';

import { Product } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, ButtonModule, FormsModule, ReactiveFormsModule],

  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss']
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;
  relatedProducts: any[] = [];
  quantity: number = 1;
  selectedSize: string = '';
  selectedColor: string = '';
  isLoading = true;

  // New properties for enhanced functionality

  activeTab: 'description' | 'specifications' | 'reviews' = 'description';

  // Gallery items for product images
  galleryItems: { image: string, title: string }[] = [];

  // Key features for the product
  keyFeatures: { icon: string, text: string }[] = [];

  // Default specifications if none provided
  specs: { key: string, value: string }[] = [];


  sizes: string[] = [];
  colors: string[] = [];

  reviews = [];


  // Additional properties for related products
  isLoadingMore = false;
  allRelatedProducts: Product[] = [];
  showAllProducts = false;
  maxProductsToShow = 8;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private publicService: PublicService,
    private productService: ProductService,
    private authService: AuthService,
    private cartService: CartService,
    private toastService: ToastService,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.loadProduct();
  }


  private loadProduct(): void {
    const id = this.route.snapshot.queryParamMap.get('id');
    const sku = this.route.snapshot.queryParamMap.get('sku');
    const slug = this.route.snapshot.paramMap.get('slug');

    if (!id && !sku && !slug) {
      this.router.navigate(['/home']);
      return;
    }

    this.isLoading = true;

    // Strategy: Try looking up by ID (Marketplace/Supplier direct), then SKU, then Slug.
    // All these now hit the clean PublicAppService which has no "Store" dependency.
    let lookup$: Observable<ProductDto>;

    if (id) {
      lookup$ = this.publicService.getProductDetail(id);
    } else if (sku) {
      lookup$ = this.publicService.getProductBySku(sku);
    } else {
      lookup$ = this.publicService.getProductBySlug(slug!);
    }

    lookup$.subscribe({
      next: (dto: ProductDto) => this.handleProductLoadSuccess(dto),
      error: (err) => this.handleLoadError(err)
    });
  }

  private handleProductLoadSuccess(dto: ProductDto): void {
    // Robust normalization for ProductDto (Public Marketplace Model)
    const id = dto.id;
    const name = dto.name;
    const description = dto.description || '';
    const brand = dto.brandName || 'Generic';

    // Image handling
    const images = this.productService.parseImages(dto.images);
    const mainImage = images.length > 0 ? images[0] : `https://placehold.co/600x400/f85606/ffffff?text=${encodeURIComponent(name)}`;

    // Price and Stock handling
    const price = (dto as any).supplierPrice || (dto as any).SupplierPrice || 0;
    const originalPrice = (dto as any).resellerMaxPrice || (dto as any).ResellerMaxPrice || price;
    const discount = (dto as any).discountPercentage || (dto as any).DiscountPercentage || 0;
    const inStock = dto.stockQuantity > 0;
    const sku = dto.sku || (dto as any).SKU || 'N/A';

    // Options mapping
    this.sizes = this.productService.parseSizeOptions(dto.sizeOptions);
    this.colors = this.productService.parseColorOptions(dto.colorOptions);

    // Populate Gallery/Specs as before
    this.galleryItems = images.map((img: string, idx: number) => ({
      image: img,
      title: idx === 0 ? 'Main View' : `Detail View ${idx}`
    }));

    const categoryName = dto.categoryName || 'Marketplace';

    this.specs = [
      { key: 'SKU', value: sku },
      { key: 'Brand', value: brand },
      { key: 'Category', value: categoryName },
      { key: 'Origin', value: 'Global' }
    ];

    this.keyFeatures = [
      { icon: 'pi pi-check-circle', text: 'Verified Authenticity' },
      { icon: 'pi pi-box', text: 'Wholesale Ready' },
      { icon: 'pi pi-globe', text: 'Global Sourcing' }
    ];

    this.product = {
      id,
      name,
      slug: dto.slug || '',
      price,
      originalPrice,
      discount,
      rating: 4.8,
      reviewCount: Math.floor(Math.random() * 50) + 10,
      image: mainImage,
      images,
      inStock,
      description,
      fullDescription: description,
      category: categoryName,
      specifications: this.specs,
      brand,
      sku
    };

    this.isLoading = false;
    if (dto.categoryId) {
      this.loadRelatedProducts(dto.categoryId);
    }
  }

  private handleLoadError(error: any): void {
    console.error('❌ Error loading product:', error);
    this.router.navigate(['/home']);
  }

  private loadRelatedProducts(categoryId: string): void {
    this.publicService.getProductsByCategory('', undefined, categoryId).subscribe({
      next: (products) => {

        this.relatedProducts = (products || [])
          .filter(p => p.slug !== this.product?.slug)
          .slice(0, 4)
          .map(p => ({
            ...p,
            images: this.productService.parseImages(p.images),
            image: this.getFirstImage(p),
            price: (p as any).SupplierPrice || p.supplierPrice || 0,
            originalPrice: p.resellerMaxPrice || 0,
            discount: p.discountPercentage || 0,
            reviewCount: Math.floor(Math.random() * 20) + 5
          }));

      },
      error: (err) => console.error('Error loading related products:', err)
    });
  }


  increaseQuantity(): void {
    if (this.quantity < 10) {
      this.quantity++;
    }
  }

  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  addToCart(): void {
    if (!this.authService.isAuthenticated()) {
      this.toastService.showInfo('Please login to add items to cart');
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    if (this.product) {
      this.cartService.addToCart(this.product, this.quantity, this.selectedSize, this.selectedColor);
      this.toastService.showSuccess(`${this.product.name} added to cart!`);
    }
  }

  addToWishlist(): void {
    if (this.product) {
      console.log('Adding to wishlist:', this.product);
      alert('Product added to wishlist!');
    }
  }

  calculateSavings(): number {
    if (this.product?.originalPrice && this.product?.price) {
      return this.product.originalPrice - this.product.price;
    }
    return 0;
  }

  loadAllRelatedProducts(): void {
    if (this.isLoadingMore) return;
    this.isLoadingMore = true;
    setTimeout(() => {
      this.isLoadingMore = false;
      this.showAllProducts = true;
    }, 1500);
  }

  toggleViewAll(): void {
    if (!this.showAllProducts) {
      this.loadAllRelatedProducts();
    } else {
      this.showAllProducts = false;
    }
  }

  getFirstImage(p: any): string {
    const images = this.productService.parseImages(p.images);
    return images.length > 0 ? images[0] : `https://placehold.co/600x400/f85606/ffffff?text=${encodeURIComponent(p.name)}`;
  }

  selectImage(product: Product, imageIndex: number): void {
    if (product.images && product.images[imageIndex]) {
      product.image = product.images[imageIndex];
    }
  }


  buyNow(): void {
    if (this.product) {
      console.log('Buying now:', {
        product: this.product,
        quantity: this.quantity,
        size: this.selectedSize,
        color: this.selectedColor
      });

      // Implement buy now logic - usually adds to cart and redirects to checkout
      this.addToCart();
      this.router.navigate(['/checkout']);
    }
  }

  onRelatedProductClick(product: any): void {
    if (product && product.slug) {
      this.router.navigate(['/product', product.slug]);
      // Scroll to top when navigating to a new product
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}
