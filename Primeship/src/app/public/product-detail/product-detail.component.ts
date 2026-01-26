import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { PublicService } from '../../core/services/public.service';
import { ProductService, ProductDto } from '../../core/services/product.service';
import { Product3DViewerComponent } from '../../shared/components/product-3d-viewer/product-3d-viewer.component';
import { Product } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, ButtonModule, FormsModule, ReactiveFormsModule, Product3DViewerComponent],
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
  activeVisualTab: 'images' | '3d' = 'images';
  activeTab: 'description' | 'specifications' | 'reviews' = 'description';

  // Gallery items for product images
  galleryItems = [
    { image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop&crop=center', title: 'Main View' },
    { image: 'https://images.unsplash.com/photo-1484704849700-f032be544e0e?w=400&h=300&fit=crop&crop=center', title: 'Side View' },
    { image: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=300&fit=crop&crop=center', title: 'Back View' },
    { image: 'https://images.unsplash.com/photo-1484704849700-f032be544e0e?w=400&h=300&fit=crop&crop=center', title: 'Detail View' }
  ];

  // Key features for the product
  keyFeatures = [
    { icon: 'pi pi-volume-up', text: 'Industry-leading noise cancellation' },
    { icon: 'pi pi-clock', text: '30-hour battery life' },
    { icon: 'pi pi-hand', text: 'Touch sensor controls' },
    { icon: 'pi pi-compress', text: 'Foldable design' },
    { icon: 'pi pi-bluetooth', text: 'Bluetooth 5.0 connectivity' },
    { icon: 'pi pi-shield', text: 'Premium build quality' }
  ];

  // Default specifications if none provided
  defaultSpecs = [
    { key: 'Brand', value: 'AudioTech' },
    { key: 'Model', value: 'WH-1000XM4' },
    { key: 'Battery Life', value: '30 hours' },
    { key: 'Connectivity', value: 'Bluetooth 5.0' },
    { key: 'Weight', value: '254g' },
    { key: 'Driver Size', value: '40mm' },
    { key: 'Frequency Response', value: '4Hz-40,000Hz' },
    { key: 'Charging Time', value: '3 hours' }
  ];

  sizes: string[] = [];
  colors: string[] = [];

  reviews = [
    {
      author: 'John Doe',
      rating: 5,
      date: '2024-01-15',
      content: 'Great product! Exactly as described and fast shipping.'
    },
    {
      author: 'Jane Smith',
      rating: 4,
      date: '2024-01-10',
      content: 'Good quality, but sizing runs a bit small.'
    }
  ];

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
    this.loadRelatedProducts();
  }

  private loadProduct(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) {
      this.router.navigate(['/home']);
      return;
    }

    this.isLoading = true;
    this.publicService.getProductBySlug(slug).subscribe({
      next: (dto: ProductDto) => {
        // Parse images
        const images = this.productService.parseImages(dto.images);

        // Parse sizes and colors
        this.sizes = this.productService.parseSizeOptions(dto.sizeOptions);
        this.colors = this.productService.parseColorOptions(dto.colorOptions);

        // Map DTO to template model
        const originalPrice = dto.resellerMaxPrice;
        const discount = dto.discountPercentage || 0;
        const price = originalPrice - (originalPrice * discount / 100);

        this.product = {
          id: dto.id,
          name: dto.name,
          slug: dto.slug,
          price: price,
          originalPrice: originalPrice,
          discount: discount,
          rating: 4.8,
          reviewCount: 156,
          image: images.length > 0 ? images[0] : 'https://via.placeholder.com/400',
          images: images.length > 0 ? images : ['https://via.placeholder.com/400'],
          inStock: dto.stockQuantity > 0,
          description: dto.description,
          fullDescription: dto.description,
          category: dto.categoryName,
          specifications: [
            { key: 'SKU', value: dto.sku },
            { key: 'Brand', value: dto.brandName || 'Store Brand' },
            { key: 'Stock', value: `${dto.stockQuantity} units` }
          ]
        };

        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error loading product:', error);
        this.router.navigate(['/home']);
      }
    });
  }

  private loadRelatedProducts(): void {
    // TODO: Replace with actual API call
    this.relatedProducts = [
      {
        id: 'prod-2',
        name: 'Wireless Earbuds Pro',
        slug: 'wireless-earbuds-pro',
        price: 199,
        originalPrice: 249,
        discount: 20,
        rating: 4,
        reviewCount: 156,
        image: 'https://images.unsplash.com/photo-1588423771023-c78a61730421?w=400&h=400&fit=crop&crop=center',
        images: [
          'https://images.unsplash.com/photo-1588423771023-c78a61730421?w=400&h=400&fit=crop&crop=center'
        ],
        inStock: true,
        category: 'electronics'
      },
      {
        id: 'prod-3',
        name: 'Bluetooth Speaker',
        slug: 'bluetooth-speaker',
        price: 89,
        originalPrice: 129,
        discount: 31,
        rating: 4,
        reviewCount: 89,
        image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop&crop=center',
        images: [
          'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop&crop=center'
        ],
        inStock: true,
        category: 'electronics'
      }
    ];
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
