import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, catchError, forkJoin, throwError } from 'rxjs';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { PublicService } from '../../core/services/public.service';
import { ProductService, ProductDto } from '../../core/services/product.service';
import { Product } from '../../core/models';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ButtonModule],
  templateUrl: './product-list-fixed.html',
  styleUrls: ['./product-list-interactive.scss']
})
export class ProductListComponent implements OnInit {
  products: any[] = [];
  filteredProducts: any[] = [];
  categories: any[] = [];
  categoriesWithCount: any[] = [];
  isLoading = true;

  // New UI Properties
  categoryTitle: string = 'Explore Products';
  categoryDescription: string = 'Discover high-performance products selected for quality and style.';
  categoryImage: string = 'assets/images/61+DG4Np+zL._AC_SX425_.jpg';

  // Filters
  filtersForm: FormGroup;
  searchTerm = '';
  sortBy = 'newest';
  maxPriceFilter = 250000; // Increased for larger prices
  currentCategorySlug = '';

  constructor(
    private publicService: PublicService,
    private productService: ProductService,
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.filtersForm = this.fb.group({
      sortBy: ['newest'],
      category: [''],
      minPrice: [0],
      maxPrice: [250000]
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.currentCategorySlug = params.get('slug') || '';
      this.loadData();
    });

    // Handle filter changes
    this.filtersForm.valueChanges.subscribe(val => {
      this.sortBy = val.sortBy;
      this.maxPriceFilter = val.maxPrice;
      if (val.category && val.category !== this.currentCategorySlug) {
        this.router.navigate(['/category', val.category]);
      } else {
        this.applyFilters();
      }
    });
  }

  loadData(): void {
    this.isLoading = true;
    forkJoin({
      cats: this.publicService.getCategories(),
      prods: this.publicService.getProducts()
    }).subscribe({
      next: (data) => {
        this.categories = data.cats || [];
        const allProducts = data.prods || [];

        // Map products for template compatibility
        this.products = allProducts.map(p => ({
          ...p,
          image: this.getFirstImage(p),
          price: this.getDiscountedPrice(p),
          originalPrice: p.resellerMaxPrice,
          discount: p.discountPercentage,
          reviewCount: Math.floor(Math.random() * 100) + 10 // Still dummy but consistent
        }));

        this.updateCategoryInfo();
        this.calculateCategoryCounts();
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('❌ ProductListComponent: Error loading data:', err);
        this.isLoading = false;
      }
    });
  }

  private calculateCategoryCounts(): void {
    this.categoriesWithCount = this.categories.map(cat => ({
      ...cat,
      count: this.products.filter(p =>
        p.categoryId === cat.id ||
        (p.categoryName && cat.name && p.categoryName.toLowerCase() === cat.name.toLowerCase())
      ).length
    }));
  }

  private matchingCategoryId: string = '';

  private updateCategoryInfo(): void {
    this.matchingCategoryId = '';
    if (this.currentCategorySlug) {
      const cat = this.categories.find(c =>
        c.slug === this.currentCategorySlug ||
        this.productService.generateSlug(c.name) === this.currentCategorySlug
      );
      if (cat) {
        this.categoryTitle = cat.name;
        this.matchingCategoryId = cat.id;
        this.categoryDescription = `Explore our curated ${cat.name} collection.`;
        this.categoryImage = cat.imageUrl || this.getDefaultCategoryImage(cat.name);
      } else {
        // Fallback for custom slugs
        this.categoryTitle = this.currentCategorySlug.replace(/-/g, ' ').toUpperCase();
        this.categoryDescription = `Showing results for ${this.categoryTitle}`;
      }
    } else {
      this.categoryTitle = 'All Products';
      this.categoryDescription = 'Discover high-performance products selected for quality and style.';
      this.categoryImage = 'assets/images/61+DG4Np+zL._AC_SX425_.jpg';
    }
  }

  applyFilters(): void {
    let result = [...this.products];

    // Category Filter (URL based)
    if (this.currentCategorySlug) {
      result = result.filter(p =>
        (this.matchingCategoryId && p.categoryId === this.matchingCategoryId) ||
        this.productService.generateSlug(p.categoryName || '') === this.currentCategorySlug ||
        this.currentCategorySlug === 'all'
      );
    }

    // Search Filter
    if (this.searchTerm) {
      const lower = this.searchTerm.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(lower) ||
        p.description?.toLowerCase().includes(lower) ||
        p.categoryName?.toLowerCase().includes(lower)
      );
    }

    // Price Filter
    const val = this.filtersForm.value;
    result = result.filter(p =>
      p.price >= (val.minPrice || 0) &&
      p.price <= (val.maxPrice || 1000000)
    );

    // Sorting
    switch (this.sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        // Assuming ID or internal order is newest
        result.reverse();
        break;
      case 'rating':
        result.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
    }

    this.filteredProducts = result;
  }

  onSearch(): void {
    this.applyFilters();
  }

  onSort(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.filtersForm.patchValue({
      sortBy: 'newest',
      category: '',
      minPrice: 0,
      maxPrice: 250000
    });
    this.searchTerm = '';
    this.applyFilters();
  }

  getFirstImage(p: any): string {
    const images = this.productService.parseImages(p.images);
    if (images.length > 0) return images[0];
    return this.getDefaultCategoryImage(p.categoryName || '');
  }

  getDiscountedPrice(p: any): number {
    const original = p.resellerMaxPrice || 0;
    const discount = p.discountPercentage || 0;
    return original - (original * discount / 100);
  }

  onProductClick(p: any): void {
    this.router.navigate(['/product', p.slug]);
  }

  onCategoryToggle(cat: any): void {
    this.router.navigate(['/category', cat.slug]);
  }

  handleImageError(event: any, name: string): void {
    const img = event.target;
    img.src = `https://placehold.co/600x400/f85606/ffffff?text=${encodeURIComponent(name)}`;
    img.onerror = null;
  }

  private getDefaultCategoryImage(categoryName: string): string {
    const defaults: { [key: string]: string } = {
      'Electronics': 'assets/images/61+DG4Np+zL._AC_SX425_.jpg',
      'Fashion': 'assets/images/71NpF4JP7HL._AC_SY879_.jpg',
      'Beauty': 'assets/images/81BrD6Y4ieL._AC_SX425_.jpg',
      'Home': 'assets/images/81jgetrp87L._AC_SX679_.jpg',
      'Sports': 'assets/images/81ec6uY7eML._AC_SX425_.jpg',
      'Accessories': 'assets/images/61BKAbqOL5L._AC_SX679_.jpg'
    };
    for (const key in defaults) {
      if (categoryName && categoryName.toLowerCase().includes(key.toLowerCase())) return defaults[key];
    }
    return 'https://placehold.co/600x400/f85606/ffffff?text=' + encodeURIComponent(categoryName || 'Product');
  }
}
