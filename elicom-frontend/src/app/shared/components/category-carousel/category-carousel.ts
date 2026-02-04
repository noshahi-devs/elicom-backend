import { Component, HostListener, OnInit, ChangeDetectorRef, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoryService } from '../../../services/category';
import { Router } from '@angular/router';
import { SearchService } from '../../../services/search.service';

@Component({
  selector: 'app-category-carousel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './category-carousel.html',
  styleUrls: ['./category-carousel.scss']
})
export class CategoryCarouselComponent implements OnInit, OnChanges {

  @Input() categories: any[] = [];
  slides: any[][] = [];

  constructor(
    private adeel: CategoryService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private searchService: SearchService
  ) { }
  currentSlide = 0;
  enableCarousel = false;

  // responsive vars
  itemsPerRow = 8;
  rows = 2;
  itemsPerSlide = 16;

  ngOnInit(): void {
    this.calculateLayout();
    if (!this.categories || this.categories.length === 0) {
      this.loadMyCategories();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['categories'] && this.categories) {
      console.log('Carousel: Received items via Input. Count:', this.categories.length);
      this.buildSlides();
      this.cdr.detectChanges();
    }
  }

  // ... (existing layout code)

  loadMyCategories() {
    console.log('Carousel: Falling back to global robust stream...');
    // Use the shared cached observable from the service
    this.adeel.getAllCategories().subscribe({
      next: (res: any[]) => {
        console.log('Carousel: Categories received via shared stream. Count:', res.length);
        this.categories = res || [];
        this.buildSlides();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Carousel: Robust category load failure', err);
      }
    });
  }

  /* 🔹 RESPONSIVE LOGIC */
  @HostListener('window:resize')
  calculateLayout() {
    const width = window.innerWidth;

    if (width < 480) {
      this.itemsPerRow = 2;
    } else if (width < 768) {
      this.itemsPerRow = 4;
    } else if (width < 1200) {
      this.itemsPerRow = 6;
    } else {
      this.itemsPerRow = 8;
    }

    this.itemsPerSlide = this.itemsPerRow * this.rows;

    this.buildSlides();
    this.cdr.detectChanges(); // Refresh on resize
  }

  /* 🔹 SLIDE BUILDER */
  buildSlides() {
    this.slides = [];
    this.currentSlide = 0;

    for (let i = 0; i < this.categories.length; i += this.itemsPerSlide) {
      this.slides.push(
        this.categories.slice(i, i + this.itemsPerSlide)
      );
    }

    // 🔥 MAIN RULE
    this.enableCarousel = this.categories.length > this.itemsPerSlide;
  }

  getCategoryImage(cat: any): string {
    if (cat.imageUrl && cat.imageUrl !== 'string' && cat.imageUrl.includes('.')) {
      if (cat.imageUrl.startsWith('http')) return cat.imageUrl;
      const img = cat.imageUrl.toLowerCase();
      if (img === 'test.jpg' || img === 'category.png' || img === 'hair.png') {
        return `https://picsum.photos/seed/${cat.name}/110/110`;
      }
      return `https://localhost:44311/images/products/${cat.imageUrl}`;
    }
    const seed = cat.id || cat.categoryId || cat.name || 'default';
    return `https://picsum.photos/seed/${seed}/110/110`;
  }

  handleImageError(event: any, cat: any) {
    const seed = cat.id || cat.categoryId || cat.name || 'default';
    const fallbackUrl = `https://picsum.photos/seed/${seed}/110/110`;

    if (event.target.src === fallbackUrl) return;
    event.target.src = fallbackUrl;
  }

  onCategoryClick(cat: any) {
    const term = cat.name;
    this.searchService.setSearchTerm(term);
    // Navigate to search-result (or reuse component if already there)
    this.router.navigate(['/search-result'], { queryParams: { cat: term } });
  }

  next() {
    if (this.currentSlide < this.slides.length - 1) {
      this.currentSlide++;
    }
  }

  prev() {
    if (this.currentSlide > 0) {
      this.currentSlide--;
    }
  }
}
