import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { PublicService } from '../../core/services/public.service';
import { CategoryDto } from '../../core/services/category.service';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="category-list-page animate-fade">
      <div class="container">
        <!-- Breadcrumbs -->
        <nav class="breadcrumb-nav">
          <a routerLink="/">Home</a>
          <i class="pi pi-chevron-right"></i>
          <span>All Categories</span>
        </nav>

        <div class="page-header">
          <h1>Global <span>Marketplace</span> Categories</h1>
          <p>Explore our curated collections from trusted vendors worldwide.</p>
        </div>

        <div class="categories-grid" *ngIf="!isLoading; else loader">
          <div class="category-card shadow-premium" *ngFor="let cat of categories" (click)="onCategoryClick(cat)">
            <div class="category-image">
              <img [src]="cat.imageUrl || getDefaultImage(cat.name)" [alt]="cat.name">
              <div class="category-overlay">
                <span class="view-btn">Browse Collection</span>
              </div>
            </div>
            <div class="category-info">
              <h3>{{ cat.name }}</h3>
              <div class="category-meta">
                <span class="count">{{ getRandomCount() }} Products</span>
                <i class="pi pi-arrow-right"></i>
              </div>
            </div>
          </div>
        </div>

        <ng-template #loader>
          <div class="loader-container">
            <i class="pi pi-spin pi-spinner"></i>
            <p>Curating collections...</p>
          </div>
        </ng-template>

        <div class="no-data" *ngIf="!isLoading && categories.length === 0">
          <i class="pi pi-inbox"></i>
          <h3>No Categories Found</h3>
          <p>We're currently updating our catalog. Please check back soon.</p>
          <button class="btn-premium" routerLink="/">Return Home</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .category-list-page {
      padding: 4rem 0;
      min-height: 80vh;
      background: #f8fafc;
    }

    .container {
      max-width: 1300px;
      margin: 0 auto;
      padding: 0 24px;
    }

    .breadcrumb-nav {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 2rem;
      font-size: 14px;
      color: #64748b;
    }

    .breadcrumb-nav a {
      color: var(--primary);
      text-decoration: none;
      font-weight: 500;
      transition: opacity 0.2s;
    }

    .breadcrumb-nav a:hover {
      opacity: 0.8;
    }

    .page-header {
      margin-bottom: 4rem;
      text-align: center;
    }

    .page-header h1 {
      font-size: 3rem;
      font-weight: 800;
      color: #1e293b;
      margin-bottom: 1rem;
      letter-spacing: -1px;
    }

    .page-header h1 span {
      background: linear-gradient(135deg, var(--primary) 0%, #ff6b35 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .page-header p {
      font-size: 1.125rem;
      color: #64748b;
      max-width: 600px;
      margin: 0 auto;
    }

    .categories-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 2.5rem;
    }

    .category-card {
      background: #fff;
      border-radius: 24px;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      border: 1px solid rgba(0,0,0,0.05);
    }

    .category-card:hover {
      transform: translateY(-12px);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
    }

    .category-image {
      height: 240px;
      position: relative;
      overflow: hidden;
    }

    .category-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.6s;
    }

    .category-card:hover .category-image img {
      transform: scale(1.1);
    }

    .category-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s;
      backdrop-filter: blur(4px);
    }

    .category-card:hover .category-overlay {
      opacity: 1;
    }

    .view-btn {
      color: #fff;
      font-weight: 700;
      font-size: 1.1rem;
      padding: 12px 24px;
      border: 2px solid #fff;
      border-radius: 30px;
    }

    .category-info {
      padding: 2rem;
    }

    .category-info h3 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 0.75rem;
    }

    .category-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: var(--primary);
    }

    .category-meta .count {
      font-weight: 600;
      font-size: 0.95rem;
      color: #64748b;
    }

    .category-meta i {
      font-size: 1.25rem;
      transition: transform 0.3s;
    }

    .category-card:hover .category-meta i {
      transform: translateX(8px);
    }

    .loader-container, .no-data {
      padding: 6rem;
      text-align: center;
      background: #fff;
      border-radius: 24px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.05);
    }

    .loader-container i {
      font-size: 3rem;
      color: var(--primary);
      margin-bottom: 1.5rem;
    }

    .no-data i {
      font-size: 4rem;
      color: #cbd5e1;
      margin-bottom: 2rem;
    }
  `]
})
export class CategoryListComponent implements OnInit {
  categories: CategoryDto[] = [];
  isLoading = true;

  constructor(
    private publicService: PublicService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.isLoading = true;
    this.publicService.getCategories().subscribe({
      next: (data) => {
        this.categories = data || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('CategoryListComponent: Error fetching categories', err);
        this.isLoading = false;
      }
    });
  }

  onCategoryClick(cat: CategoryDto): void {
    this.router.navigate(['/category', cat.slug]);
  }

  getRandomCount(): number {
    return Math.floor(Math.random() * 200) + 12;
  }

  getDefaultImage(name: string): string {
    const defaults: { [key: string]: string } = {
      'Electronics': 'assets/images/61+DG4Np+zL._AC_SX425_.jpg',
      'Fashion': 'assets/images/71NpF4JP7HL._AC_SY879_.jpg',
      'Beauty': 'assets/images/81BrD6Y4ieL._AC_SX425_.jpg',
      'Home': 'assets/images/81jgetrp87L._AC_SX679_.jpg',
      'Sports': 'assets/images/81ec6uY7eML._AC_SX425_.jpg',
      'Accessories': 'assets/images/61BKAbqOL5L._AC_SX679_.jpg'
    };

    for (const key in defaults) {
      if (name.toLowerCase().includes(key.toLowerCase())) return defaults[key];
    }
    return 'https://via.placeholder.com/400x400?text=' + encodeURIComponent(name);
  }
}
