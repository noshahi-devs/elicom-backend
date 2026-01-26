import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
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
  products: ProductDto[] = [];
  filteredProducts: any[] = []; // Changed to any to support the template's property access
  categories: any[] = [];
  isLoading = true;

  // New UI Properties
  categoryTitle: string = 'Explore Products';
  categoryDescription: string = 'Discover high-performance products selected for quality and style.';
  categoryImage: string = 'assets/images/61+DG4Np+zL._AC_SX425_.jpg';

  // Filters
  filtersForm: FormGroup;
  searchTerm = '';
  sortBy = 'newest';
  maxPriceFilter = 2500;
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
      maxPrice: [2500]
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.route.paramMap.subscribe(params => {
      this.currentCategorySlug = params.get('slug') || '';
      this.loadProducts();
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

  loadCategories(): void {
    this.publicService.getCategories().subscribe(cats => {
      this.categories = cats;
      this.updateCategoryInfo();
    });
  }

  private updateCategoryInfo(): void {
    if (this.currentCategorySlug) {
      const cat = this.categories.find(c => this.productService.generateSlug(c.name) === this.currentCategorySlug);
      if (cat) {
        this.categoryTitle = cat.name;
        this.categoryDescription = `Explore our curated ${cat.name} collection.`;
        this.categoryImage = cat.imageUrl || this.getDefaultCategoryImage(cat.name);
      }
    } else {
      this.categoryTitle = 'All Products';
      this.categoryDescription = 'Discover high-performance products selected for quality and style.';
      this.categoryImage = 'assets/images/61+DG4Np+zL._AC_SX425_.jpg';
    }
  }

  loadProducts(): void {
    this.isLoading = true;
    this.publicService.getProducts().subscribe({
      next: (data) => {
        this.products = data || [];
        this.applyFilters();
        this.isLoading = false;
        this.updateCategoryInfo();
      },
      error: (err) => {
        console.error('❌ ProductListComponent: Error loading products:', err);
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    let result = [...this.products];

    // Category Filter
    if (this.currentCategorySlug) {
      result = result.filter(p => this.productService.generateSlug(p.categoryName) === this.currentCategorySlug);
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
    result = result.filter(p => this.getDiscountedPrice(p) <= this.maxPriceFilter);

    // Sorting
    switch (this.sortBy) {
      case 'price-low':
        result.sort((a, b) => this.getDiscountedPrice(a) - this.getDiscountedPrice(b));
        break;
      case 'price-high':
        result.sort((a, b) => this.getDiscountedPrice(b) - this.getDiscountedPrice(a));
        break;
      case 'popular':
        // Dummy popularity
        result.sort((a, b) => (b.stockQuantity || 0) - (a.stockQuantity || 0));
        break;
      case 'newest':
      default:
        // Already sorted by newest from API usually, but let's be safe
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
      maxPrice: 2500
    });
    this.searchTerm = '';
    this.applyFilters();
  }

  getFirstImage(p: ProductDto): string {
    const images = this.productService.parseImages(p.images);
    return images.length > 0 ? images[0] : 'https://via.placeholder.com/400x400?text=No+Image';
  }

  getDiscountedPrice(p: ProductDto): number {
    const original = p.resellerMaxPrice || 0;
    const discount = p.discountPercentage || 0;
    return original - (original * discount / 100);
  }

  onProductClick(p: any): void {
    this.router.navigate(['/product', p.slug]);
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
      if (categoryName.toLowerCase().includes(key.toLowerCase())) return defaults[key];
    }
    return 'assets/images/61+DG4Np+zL._AC_SX425_.jpg';
  }
}
