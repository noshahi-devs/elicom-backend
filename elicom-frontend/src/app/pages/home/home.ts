import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroCarouselComponent } from '../../shared/components/hero-carousel/hero-carousel';
import { CategoryCarouselComponent } from '../../shared/components/category-carousel/category-carousel';
import { DealCardComponent } from '../../shared/components/deal-card/deal-card';
import { ProductGridComponent } from '../../shared/components/product-grid/product-grid';
import { ProductService, GlobalMarketplaceProduct } from '../../services/product';
import { CategoryService, Category } from '../../services/category';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    HeroCarouselComponent,
    CategoryCarouselComponent,
    DealCardComponent,
    ProductGridComponent
  ],
  templateUrl: './home.html',
  styleUrls: ['./home.scss']
})
export class HomeComponent implements OnInit {

  products: GlobalMarketplaceProduct[] = [];
  categoriesDebug: Category[] = [];

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    if (this.authService.isAuthenticated) {
      if (this.authService.isAdmin() || this.authService.isSeller()) {
        this.authService.navigateToDashboard();
        return;
      }
    }
    this.loadProducts();
    this.loadCategories();
  }

  loadProducts() {
    Swal.fire({
      title: 'Loading Products...',
      didOpen: () => {
        Swal.showLoading();
      },
      allowOutsideClick: false,
      showConfirmButton: false,
      timer: 2000, // Safety timer
    });

    console.log('HomeComponent: Loading products...');
    // Using getProductsForCards to fetch all products as requested ("sary product")
    this.productService.getProductsForCards(0, 50).subscribe({
      next: (res: any) => {
        Swal.close();
        // Handle response robustly (checking result/items)
        let items: any[] = [];
        if (Array.isArray(res)) items = res;
        else if (res && Array.isArray(res.items)) items = res.items;
        else if (res && Array.isArray(res.result)) items = res.result;

        console.log('HomeComponent: Products received:', items.length);
        this.products = items;
        this.cdr.detectChanges(); // Trigger immediately
      },
      error: (err: any) => {
        console.error('HomeComponent: Products error:', err);
      }
    });
  }

  loadCategories() {
    console.log('HomeComponent: Triggering robust category load...');
    // We subscribe to the shared cache stream. 
    // If it's already loading from another component (e.g. Nav), we will just join the stream.
    this.categoryService.getAllCategories().subscribe({
      next: (res: any[]) => {
        console.log('HomeComponent: Categories arrived reliably. Count:', res.length);
        this.categoriesDebug = res;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('HomeComponent: Critical category load failure', err);
      }
    });
  }
}
