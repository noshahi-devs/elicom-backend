import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SearchSidebar } from '../../shared/components/search-sidebar/search-sidebar';
import { ProductGridComponent } from '../../shared/components/product-grid/product-grid';
import { SearchService } from '../../services/search.service';

@Component({
  selector: 'app-search-result',
  standalone: true,
  imports: [CommonModule, FormsModule, SearchSidebar, ProductGridComponent],
  templateUrl: './search-result.html',
  styleUrl: './search-result.scss',
})
export class SearchResult implements OnInit {
  filterData: any = {};
  categoryTitle: string = '';
  isSidebarOpen: boolean = false;

  // Dynamic Options for Sidebar
  availableCategories: string[] = [];
  availableColors: string[] = [];
  availableSizes: string[] = [];
  availableTypes: string[] = [];
  availableFits: string[] = [];
  availableLengths: string[] = [];
  priceRange = { min: 0, max: 10000 };

  constructor(
    private route: ActivatedRoute,
    private searchService: SearchService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    // 1. Listen for Category from Route (Home page clicks)
    this.route.queryParams.subscribe(params => {
      const cat = params['cat'];
      if (cat) {
        this.categoryTitle = cat;
        this.filterData = { ...this.filterData, category: cat };
        this.searchService.setSearchTerm(cat);
      }
    });

    // Also handle dynamic search terms
    this.searchService.searchTerm$.subscribe(term => {
      if (term && term !== this.categoryTitle) {
        this.categoryTitle = term;
        this.filterData = { ...this.filterData, category: term };
      }
    });
  }

  onProductsLoaded(products: any[]) {
    // Derive filters from actually loaded products in this category
    const cats = new Set<string>();
    const colors = new Set<string>();
    const sizes = new Set<string>();
    const types = new Set<string>();
    const fits = new Set<string>();
    const lengths = new Set<string>();

    let min = Infinity;
    let max = -Infinity;

    products.forEach(p => {
      if (p.categoryName) cats.add(p.categoryName);

      // Dynamic Attributes (Check standard fields and potential custom properties)
      const raw = p as any;
      if (raw.color) colors.add(raw.color);
      if (raw.size) sizes.add(raw.size);
      if (raw.type) types.add(raw.type);
      if (raw.fit) fits.add(raw.fit);
      if (raw.length) lengths.add(raw.length);

      if (p.price < min) min = p.price;
      if (p.price > max) max = p.price;
    });

    this.availableCategories = Array.from(cats).sort();
    this.availableColors = Array.from(colors).sort();
    this.availableSizes = Array.from(sizes).sort();
    this.availableTypes = Array.from(types).sort();
    this.availableFits = Array.from(fits).sort();
    this.availableLengths = Array.from(lengths).sort();

    if (min !== Infinity) {
      this.priceRange = { min: Math.floor(min), max: Math.ceil(max) };
    }

    // Logic for "Smart Suggestions" - If very few results, we might want to tell the grid
    // to show some popular items as well. (Handled via ProductGrid's fallback or matching tags)

    this.cdr.detectChanges();
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  onFilterChange(event: any) {
    this.filterData = { ...this.filterData, ...event };
    // Category title might come from sidebar radio now
    if (event.category) {
      this.categoryTitle = event.category;
    }
  }

  /* SORTING Logic */
  showSortDropdown = false;

  toggleSortDropdown() {
    this.showSortDropdown = !this.showSortDropdown;
  }

  onSortChange(value: string) {
    this.filterData = { ...this.filterData, sort: value };
    this.showSortDropdown = false;
  }

  getSortLabel(value: string): string {
    const map: any = {
      'recommended': 'Recommended',
      'newest': 'Newest',
      'price-low': 'Price: Low to High',
      'price-high': 'Price: High to Low'
    };
    return map[value] || 'Recommended';
  }
}
