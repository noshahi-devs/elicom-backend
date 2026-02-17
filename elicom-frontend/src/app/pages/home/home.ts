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
  categories: Category[] = [];
  productError: string = '';
  categoryError: string = '';
  isLoadingCategories: boolean = false;
  isLoadingProducts: boolean = false;

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
    this.isLoadingProducts = true;
    this.productError = '';

    Swal.fire({
      title: 'Loading Products...',
      didOpen: () => {
        Swal.showLoading();
      },
      allowOutsideClick: false,
      showConfirmButton: false,
      timer: 5000,
    });

    console.log('HomeComponent: Loading products...');
    this.productService.getProductsForCards(0, 20).subscribe({
      next: (res: any) => {
        Swal.close();
        this.isLoadingProducts = false;
        let items: any[] = [];
        if (Array.isArray(res)) items = res;
        else if (res && Array.isArray(res.items)) items = res.items;
        else if (res && Array.isArray(res.result)) items = res.result;

        console.log('HomeComponent: Products received:', items.length);
        this.products = items;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        Swal.close();
        this.isLoadingProducts = false;
        console.error('HomeComponent: Products error:', err);
        this.productError = this.extractErrorMessage(err, 'Failed to load products');
        this.cdr.detectChanges();
      }
    });
  }

  loadCategories() {
    this.isLoadingCategories = true;
    this.categoryError = '';
    console.log('HomeComponent: Triggering robust category load...');
    this.categoryService.getAllCategories(8).subscribe({
      next: (res: any[]) => {
        this.isLoadingCategories = false;
        console.log('HomeComponent: Categories arrived reliably. Count:', res.length);
        this.categories = res;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoadingCategories = false;
        console.error('HomeComponent: Critical category load failure', err);
        this.categoryError = this.extractErrorMessage(err, 'Failed to load categories');
        this.cdr.detectChanges();
      }
    });
  }

  private extractErrorMessage(err: any, defaultMsg: string): string {
    if (err.error?.error?.message) {
      return err.error.error.message;
    }
    if (err.error?.message) {
      return err.error.message;
    }
    if (err.statusText) {
      return `Server Error: ${err.statusText} (${err.status})`;
    }
    return defaultMsg;
  }
}
