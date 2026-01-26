import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { PublicService } from '../../core/services/public.service';
import { CategoryDto } from '../../core/services/category.service';
import { ProductService, ProductDto } from '../../core/services/product.service';

// Temporary interface for compatibility with existing template
interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
}

interface Product {
  id: string;
  name: string;
  category: string;
  slug: string;
  price: number;
  originalPrice: number;
  discount: number;
  rating: number;
  reviewCount: number;
  image: string;
  inStock: boolean;
  isFeatured?: boolean;
  isNew?: boolean;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ButtonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})

export class HomeComponent implements OnInit {
  categories: Category[] = [];
  featuredProducts: Product[] = [];
  latestProducts: Product[] = [];
  isLoading = true;
  flashSaleTime = { hours: 12, minutes: 45, seconds: 30 };

  // Pagination for products
  visibleFeaturedCount = 8;
  visibleLatestCount = 8;
  readonly PRODUCTS_PER_LOAD = 8;

  constructor(
    private publicService: PublicService,
    private productService: ProductService,
    private router: Router
  ) { }

  ngOnInit(): void {
    console.log('🏠 HomeComponent initialized');
    this.startCountdown();
    this.loadCategories();
    this.loadProducts();
  }

  private startCountdown() {
    setInterval(() => {
      if (this.flashSaleTime.seconds > 0) {
        this.flashSaleTime.seconds--;
      } else {
        this.flashSaleTime.seconds = 59;
        if (this.flashSaleTime.minutes > 0) {
          this.flashSaleTime.minutes--;
        } else {
          this.flashSaleTime.minutes = 59;
          if (this.flashSaleTime.hours > 0) {
            this.flashSaleTime.hours--;
          }
        }
      }
    }, 1000);
  }

  private loadCategories(): void {
    console.log('📥 Loading categories from Public API...');

    this.publicService.getCategories().subscribe({
      next: (categories: CategoryDto[]) => {
        console.log('✅ Categories loaded:', categories.length);

        // Convert CategoryDto to Category for template compatibility
        this.categories = categories
          .slice(0, 6) // Show first 6 categories
          .map(c => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            image: c.imageUrl || this.getDefaultCategoryImage(c.name)
          }));

        console.log('✅ Categories formatted for display:', this.categories.length);
      },
      error: (error) => {
        console.error('❌ Error loading categories:', error);
        // Fallback to default categories if API fails
        this.loadDefaultCategories();
      }
    });
  }

  private loadProducts(): void {
    console.log('📥 Loading products from Public API...');

    this.publicService.getProducts().subscribe({
      next: (products: ProductDto[]) => {
        console.log('✅ Products loaded:', products.length);

        // Convert ProductDto to Product for template compatibility
        const convertedProducts = products
          .map(p => this.convertProductDto(p));

        // Split into featured and latest
        this.featuredProducts = convertedProducts.slice(0, 20); // First 20 as featured
        this.latestProducts = convertedProducts.slice(0, 20).reverse(); // Reverse for latest

        this.isLoading = false;
        console.log('✅ Products formatted - Featured:', this.featuredProducts.length, 'Latest:', this.latestProducts.length);
      },
      error: (error) => {
        console.error('❌ Error loading products:', error);
        this.isLoading = false;
        // Fallback to default products if API fails
        this.loadDefaultProducts();
      }
    });
  }

  private convertProductDto(dto: ProductDto): Product {
    // Parse images
    const images = this.productService.parseImages(dto.images);
    const firstImage = images.length > 0 ? images[0] : this.getDefaultProductImage();

    // Calculate discount percentage
    const discount = dto.discountPercentage || 0;
    const originalPrice = dto.resellerMaxPrice;
    const price = originalPrice - (originalPrice * discount / 100);

    return {
      id: dto.id,
      name: dto.name,
      category: dto.categoryName || 'General',
      slug: dto.slug,
      price: price,
      originalPrice: originalPrice,
      discount: discount,
      rating: 4.5, // Default rating
      reviewCount: Math.floor(Math.random() * 500) + 100, // Random review count
      image: firstImage,
      inStock: dto.stockQuantity > 0,
      isFeatured: true,
      isNew: true
    };
  }

  private getDefaultCategoryImage(categoryName: string): string {
    // Default images based on category name
    const defaults: { [key: string]: string } = {
      'Electronics': 'assets/images/61+DG4Np+zL._AC_SX425_.jpg',
      'Fashion': 'assets/images/71NpF4JP7HL._AC_SY879_.jpg',
      'Beauty': 'assets/images/81BrD6Y4ieL._AC_SX425_.jpg',
      'Home': 'assets/images/81jgetrp87L._AC_SX679_.jpg',
      'Sports': 'assets/images/81ec6uY7eML._AC_SX425_.jpg',
      'Accessories': 'assets/images/61BKAbqOL5L._AC_SX679_.jpg'
    };

    // Try to match category name
    for (const key in defaults) {
      if (categoryName.toLowerCase().includes(key.toLowerCase())) {
        return defaults[key];
      }
    }

    return 'assets/images/placeholder.jpg';
  }

  private getDefaultProductImage(): string {
    return 'https://via.placeholder.com/400x400?text=No+Image';
  }

  private loadDefaultCategories(): void {
    console.log('⚠️ Using default categories as fallback');
    this.categories = [
      { id: '1', name: 'Electronics', slug: 'electronics', image: 'assets/images/61+DG4Np+zL._AC_SX425_.jpg' },
      { id: '2', name: 'Fashion', slug: 'fashion', image: 'assets/images/71NpF4JP7HL._AC_SY879_.jpg' },
      { id: '3', name: 'Beauty', slug: 'beauty', image: 'assets/images/81BrD6Y4ieL._AC_SX425_.jpg' },
      { id: '4', name: 'Home Living', slug: 'home-living', image: 'assets/images/81jgetrp87L._AC_SX679_.jpg' },
      { id: '5', name: 'Activewear', slug: 'sports', image: 'assets/images/81ec6uY7eML._AC_SX425_.jpg' },
      { id: '6', name: 'Accessories', slug: 'accessories', image: 'assets/images/61BKAbqOL5L._AC_SX679_.jpg' },
    ];
  }

  private loadDefaultProducts(): void {
    console.log('⚠️ Using default products as fallback');
    const assetImages = [
      'assets/images/91NNZo3825L._AC_SX679_.jpg',
      'assets/images/91P2724BW3L._AC_SX679_.jpg',
      'assets/images/61ZY6ZP0V6L._AC_SL1024_.jpg',
      'assets/images/81OT48ieUNL._AC_SL1500_.jpg',
      'assets/images/81eUg-ixCSL._AC_SX679_.jpg',
      'assets/images/71J6P8L6ORL._AC_SX679_.jpg'
    ];

    const proNames = ['Aura Wireless Pro', 'Eclipse Smartwatch', 'Urban Explorer Tote', 'Velvet Matt Lipstick', 'Nordic Desk Lamp', 'Prime Fit Sneakers'];
    const proCats = ['Electronics', 'Electronics', 'Fashion', 'Beauty', 'Home Living', 'Activewear'];

    this.featuredProducts = proNames.map((name, i) => ({
      id: `feat-${i + 1}`,
      name: name,
      category: proCats[i],
      slug: name.toLowerCase().replace(/ /g, '-'),
      price: [299, 199, 89, 29, 149, 120][i],
      originalPrice: [399, 249, 120, 45, 199, 150][i],
      discount: Math.floor(Math.random() * 20) + 10,
      rating: 4.8,
      reviewCount: 1240,
      image: assetImages[i] || 'assets/images/placeholder.jpg',
      inStock: true,
      isFeatured: true
    }));

    this.latestProducts = [...this.featuredProducts];
  }

  get visibleFeaturedProducts(): Product[] {
    return this.featuredProducts.slice(0, this.visibleFeaturedCount);
  }

  get visibleLatestProducts(): Product[] {
    return this.latestProducts.slice(0, this.visibleLatestCount);
  }

  get canLoadMoreFeatured(): boolean {
    return this.visibleFeaturedCount < this.featuredProducts.length;
  }

  get canLoadMoreLatest(): boolean {
    return this.visibleLatestCount < this.latestProducts.length;
  }

  loadMoreFeatured(): void {
    this.visibleFeaturedCount += this.PRODUCTS_PER_LOAD;
  }

  loadMoreLatest(): void {
    this.visibleLatestCount += this.PRODUCTS_PER_LOAD;
  }

  onCategorySelected(category: Category): void {
    console.log('📂 Category selected:', category.name);
    this.router.navigate(['/category', category.slug]);
  }

  onProductSelected(product: Product): void {
    console.log('📦 Product selected:', product.name);
    this.router.navigate(['/product', product.slug]);
  }
}
