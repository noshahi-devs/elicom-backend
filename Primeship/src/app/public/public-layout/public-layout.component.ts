import { Component, HostListener, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { CategoryService, CategoryLookupDto } from '../../core/services/category.service';
import { filter } from 'rxjs/operators';
import { NavigationEnd } from '@angular/router';
import { PublicService } from '../../core/services/public.service';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, CurrencyPipe, FormsModule, ReactiveFormsModule],
  template: `
    <div class="storefront-shell">
      <!-- Premium Top Bar -->
      <div class="top-bar" [ngClass]="{'hidden': isScrolled}">
        <div class="top-bar-container">
          <div class="top-bar-left">
            <div class="promo-tag">
              <i class="pi pi-bolt"></i>
              <span>Free Shipping on Orders Over $50</span>
            </div>
            <a routerLink="/home" class="top-link">
              <i class="pi pi-briefcase"></i>
              Shop Now
            </a>
            <a routerLink="/home" class="top-link">
              <i class="pi pi-question-circle"></i>
              Help Center
            </a>
          </div>
          <div class="top-bar-right">
            <div class="language-selector">
              <i class="pi pi-globe"></i>
              <span>EN / USD</span>
              <i class="pi pi-chevron-down"></i>
            </div>
            <div class="auth-links" *ngIf="!authService.isAuthenticated()">
              <a routerLink="/auth/login" class="auth-link">
                <i class="pi pi-sign-in"></i>
                Login
              </a>
              <span class="separator">|</span>
              <a routerLink="/auth/register" class="auth-link register">
                <i class="pi pi-user-plus"></i>
                Register
              </a>
            </div>
            <div class="auth-links" *ngIf="authService.isAuthenticated()">
              <a (click)="logout()" class="auth-link cursor-pointer">
                <i class="pi pi-sign-out"></i>
                Logout
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Header -->
      <header class="main-header">
        <div class="header-container">
          <div class="header-content">
            <!-- Premium Brand Logo -->
            <a routerLink="/" class="brand-logo">
              <div class="logo-icon">
                <span class="logo-letter">P</span>
                <div class="logo-shine"></div>
              </div>
              <div class="brand-text">
                <span class="brand-name">PRIME</span>
                <span class="brand-tagline">SHIP</span>
              </div>
            </a>

            <!-- Enhanced Search Bar -->
            <div class="search-container">
              <div class="search-wrapper">
                <div class="search-category-container" (mouseleave)="showCategoryDropdown = false">
                  <button class="category-dropdown" (click)="toggleCategoryDropdown()">
                    <span>{{ selectedCategory }}</span>
                    <i class="pi pi-chevron-down"></i>
                  </button>
                  <div class="search-category-menu" [class.show]="showCategoryDropdown">
                    <ul class="search-cat-list">
                      <li [class.active]="!selectedCategorySlug" (click)="selectSearchCategory('All')">
                        <i class="pi pi-th-large"></i>
                        All Categories
                      </li>
                      <li *ngFor="let cat of categories" 
                          [class.active]="selectedCategorySlug === cat.slug"
                          (click)="selectSearchCategory(cat.name, cat.slug)">
                        <i class="pi pi-tag"></i>
                        {{ cat.name }}
                      </li>
                    </ul>
                  </div>
                </div>
                <div class="search-input-group">
                  <i class="pi pi-search search-icon"></i>
                  <input 
                    type="text" 
                    [(ngModel)]="searchTerm"
                    class="search-input" 
                    placeholder="Search for products, brands, and more..."
                    (keyup.enter)="onSearch()"
                  >
                </div>
                <button class="search-submit" (click)="onSearch()">
                  <i class="pi pi-search"></i>
                  <span>Search</span>
                </button>
              </div>
            </div>

            <!-- Premium Action Buttons -->
            <div class="header-actions">
              <a [routerLink]="getPortalUrl()" class="action-btn account-btn">
                <div class="action-icon">
                  <i class="pi pi-user"></i>
                </div>
                <div class="action-text">
                  <span class="action-label">Hello, {{ userName }}</span>
                  <span class="action-title">Account</span>
                </div>
              </a>

              <a [routerLink]="authService.isAuthenticated() ? '/wishlist' : '/auth/login'" class="action-btn wishlist-btn">
                <div class="action-icon">
                  <i class="pi pi-heart"></i>
                  <span class="action-badge">0</span>
                </div>
                <div class="action-text">
                  <span class="action-title">Wishlist</span>
                </div>
              </a>

              <a [routerLink]="authService.isAuthenticated() ? '/cart' : '/auth/login'" class="action-btn cart-btn">
                <div class="action-icon">
                  <i class="pi pi-shopping-cart"></i>
                  <span class="action-badge pulse" *ngIf="cartCount > 0">{{ cartCount }}</span>
                </div>
                <div class="action-text">
                  <span class="action-label">{{ authService.isAuthenticated() ? 'Welcome' : 'Your Cart' }}</span>
                  <span class="action-title">{{ cartTotal | currency }}</span>
                </div>
              </a>

              <button class="mobile-toggle">
                <i class="pi pi-bars"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Premium Navigation Bar -->
        <nav class="main-nav">
          <div class="nav-container">
            <div class="nav-content">

              
              <ul class="nav-menu">
                <li class="nav-menu-item">
                  <a routerLink="/home" routerLinkActive="active" class="nav-menu-link">
                    <i class="pi pi-home"></i>
                    Home
                  </a>
                </li>
                <li class="nav-menu-item hot">
                  <a routerLink="/shop" [queryParams]="{ sortBy: 'price-low' }" class="nav-menu-link">
                    <i class="pi pi-bolt"></i>
                    Flash Deals
                    <span class="hot-badge">HOT</span>
                  </a>
                </li>
                <li class="nav-menu-item">
                  <a routerLink="/shop" [queryParams]="{ sortBy: 'newest' }" class="nav-menu-link">
                    <i class="pi pi-star"></i>
                    New Arrivals
                  </a>
                </li>
                <li class="nav-menu-item">
                  <a routerLink="/shop" class="nav-menu-link">
                    <i class="pi pi-chart-line"></i>
                    Best Sellers
                  </a>
                </li>
                
              </ul>

              <a [routerLink]="getPortalUrl()" class="merchant-portal">
                <i class="pi pi-briefcase"></i>
                <span>Merchant Portal</span>
                <i class="pi pi-arrow-right"></i>
              </a>
            </div>
          </div>
        </nav>
      </header>

      <!-- Main View Content -->
      <main class="page-content">
        <router-outlet></router-outlet>
      </main>

      <!-- Simple Clean Footer -->
      <footer class="simple-footer">
        <div class="footer-container">
          <div class="footer-grid">
            <div class="footer-col footer-brand-col">
              <h3 class="footer-brand">PRIME<span>SHIP</span></h3>
              <p class="footer-desc">Your trusted global marketplace for premium products.</p>
            </div>
            <div class="footer-col">
              <h6 class="footer-heading">Shop</h6>
              <ul class="footer-links">
                <li *ngFor="let cat of categories | slice:0:5">
                  <a [routerLink]="['/category', cat.slug]">{{ cat.name }}</a>
                </li>
                <li><a routerLink="/shop">View All Products</a></li>
              </ul>
            </div>
            <div class="footer-col">
              <h6 class="footer-heading">Support</h6>
              <ul class="footer-links">
                <li><a routerLink="/home">Help Center</a></li>
                <li><a routerLink="/home">Track Order</a></li>
                <li><a routerLink="/home">Returns</a></li>
              </ul>
            </div>
            <div class="footer-col">
              <h6 class="footer-heading">Company</h6>
              <ul class="footer-links">
                <li><a routerLink="/home">About Us</a></li>
                <li><a routerLink="/home">Careers</a></li>
              </ul>
            </div>
            <div class="footer-col">
              <h6 class="footer-heading">Follow Us</h6>
              <div class="social-links">
                <a href="https://facebook.com" target="_blank" rel="noopener" aria-label="Facebook">
                  <i class="pi pi-facebook"></i>
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener" aria-label="Instagram">
                  <i class="pi pi-instagram"></i>
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener" aria-label="Twitter">
                  <i class="pi pi-twitter"></i>
                </a>
              </div>
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          <div class="footer-container">
            <div class="footer-bottom-content">
              <p class="copyright">&copy; 2026 Prime Ship. All rights reserved.</p>
              <div class="payment-methods">
                <span class="payment-badge visa">VISA</span>
                <span class="payment-badge mastercard">Mastercard</span>
                <span class="payment-badge paypal">PayPal</span>
                <span class="payment-badge amex">AMEX</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .storefront-shell { 
      min-height: 100vh; 
      display: flex; 
      flex-direction: column; 
      background: #f4f7f9; 
    }

    /* ===== PREMIUM TOP BAR ===== */
    .top-bar { 
      background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
      color: #fff; 
      padding: 10px 0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out;
      transform: translateY(0);
      opacity: 1;
    }
    
    .top-bar.hidden {
      transform: translateY(-100%);
      opacity: 0;
      pointer-events: none;
    }
    
    .top-bar-container {
      max-width: 1300px;
      margin: 0 auto;
      padding: 0 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 2rem;
    }
    
    .top-bar-left,
    .top-bar-right {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      flex-wrap: wrap;
    }
    
    .promo-tag {
      display: flex;
      align-items: center;
      gap: 8px;
      background: linear-gradient(135deg, var(--primary) 0%, #ff6b35 100%);
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.3px;
      box-shadow: 0 4px 12px rgba(248, 86, 6, 0.3);
      animation: glow 2s ease-in-out infinite;
    }
    
    @keyframes glow {
      0%, 100% { box-shadow: 0 4px 12px rgba(248, 86, 6, 0.3); }
      50% { box-shadow: 0 4px 20px rgba(248, 86, 6, 0.5); }
    }
    
    .top-link {
      display: flex;
      align-items: center;
      gap: 6px;
      color: rgba(255,255,255,0.85);
      font-size: 13px;
      font-weight: 500;
      text-decoration: none;
      transition: all 0.3s;
    }
    
    .top-link:hover {
      color: var(--primary);
      transform: translateY(-1px);
    }
    
    .language-selector {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: rgba(255,255,255,0.1);
      border-radius: 8px;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.3s;
    }
    
    .language-selector:hover {
      background: rgba(255,255,255,0.15);
    }
    
    .auth-links {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .auth-link {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #fff;
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.3s;
    }
    
    .auth-link:hover {
      color: var(--primary);
    }
    
    .auth-link.register {
      background: var(--primary);
      padding: 6px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(248, 86, 6, 0.3);
    }
    
    .auth-link.register:hover {
      background: var(--primary-dark);
      color: #fff;
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(248, 86, 6, 0.4);
    }
    
    .separator {
      color: rgba(255,255,255,0.3);
    }

    /* ===== MAIN HEADER ===== */
    .main-header { 
      background: #fff; 
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      position: sticky;
      top: 0;
      z-index: 1000;
    }
    
    .header-container {
      max-width: 1300px;
      margin: 0 auto;
      padding: 0 24px;
    }
    
    .header-content { 
      display: flex; 
      align-items: center; 
      justify-content: space-between; 
      padding: 1.5rem 0;
      gap: 2rem;
    }
    
    /* ===== PREMIUM BRAND LOGO ===== */
    .brand-logo { 
      display: flex; 
      align-items: center; 
      gap: 14px; 
      text-decoration: none;
      transition: transform 0.3s;
    }
    
    .brand-logo:hover {
      transform: scale(1.05);
    }
    
    .logo-icon { 
      width: 52px; 
      height: 52px; 
      background: linear-gradient(135deg, #F85606 0%, #FF2E00 100%); 
      border-radius: 14px; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      box-shadow: 0 8px 20px rgba(248, 86, 6, 0.35);
      position: relative;
      overflow: hidden;
    }
    
    .logo-letter { 
      color: #fff; 
      font-weight: 900; 
      font-size: 28px;
      position: relative;
      z-index: 2;
    }
    
    .logo-shine {
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: linear-gradient(45deg, transparent, rgba(255,255,255,0.3), transparent);
      animation: shine 3s infinite;
    }
    
    @keyframes shine {
      0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
      100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
    }
    
    .brand-text { 
      display: flex; 
      flex-direction: column; 
      line-height: 1;
      gap: 2px;
    }
    
    .brand-name { 
      color: #1a202c; 
      font-weight: 900; 
      font-size: 1.4rem; 
      letter-spacing: -0.5px;
      font-family: 'Outfit', sans-serif;
    }
    
    .brand-tagline { 
      color: var(--primary); 
      font-weight: 900; 
      font-size: 1.4rem; 
      letter-spacing: -0.5px;
      font-family: 'Outfit', sans-serif;
    }

    /* ===== ENHANCED SEARCH BAR ===== */
    .search-container { 
      flex: 1; 
      max-width: 700px;
    }
    
    .search-wrapper { 
      display: flex; 
      align-items: stretch;
      background: #fff; 
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      /* removed overflow: hidden to allow dropdown */
      transition: all 0.3s;
      height: 52px;
    }
    
    .search-wrapper:focus-within {
      border-color: var(--primary);
      box-shadow: 0 0 0 4px rgba(248, 86, 6, 0.1);
    }
    
    .category-dropdown {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 18px;
      background: #f7fafc;
      border: none;
      border-right: 1px solid #e2e8f0;
      font-size: 14px;
      font-weight: 600;
      color: #4a5568;
      cursor: pointer;
      transition: all 0.3s;
      white-space: nowrap;
      height: 100%;
      border-top-left-radius: 10px;
      border-bottom-left-radius: 10px;
    }

    .search-category-container {
      position: relative;
      display: flex;
      align-items: stretch;
    }

    .search-category-menu {
      position: absolute;
      top: calc(100% + 8px);
      left: 0;
      width: 240px;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.15);
      border: 1px solid #e2e8f0;
      opacity: 0;
      visibility: hidden;
      transform: translateY(10px);
      transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      z-index: 1100;
      overflow: hidden;
    }

    .search-category-menu.show {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }

    .search-cat-list {
      list-style: none;
      padding: 8px 0;
      margin: 0;
      max-height: 350px;
      overflow-y: auto;
    }

    .search-cat-list li {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 20px;
      color: #4a5568;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .search-cat-list li i {
      color: #a0aec0;
      font-size: 14px;
    }

    .search-cat-list li:hover {
      background: #f8fafc;
      color: var(--primary);
    }

    .search-cat-list li.active {
      background: #fff5f0;
      color: var(--primary);
    }

    .search-cat-list li.active i {
      color: var(--primary);
    }

    .search-cat-list li:hover i {
      color: var(--primary);
    }
    
    .category-dropdown:hover {
      background: #edf2f7;
      color: var(--primary);
    }
    
    .search-input-group {
      flex: 1;
      display: flex;
      align-items: center;
      padding: 0 16px;
      gap: 12px;
    }
    
    .search-icon {
      color: #a0aec0;
      font-size: 18px;
    }
    
    .search-input { 
      flex: 1;
      border: none; 
      background: transparent; 
      outline: none; 
      font-size: 15px;
      font-weight: 500;
      color: #2d3748;
    }
    
    .search-input::placeholder {
      color: #a0aec0;
    }
    
    .search-submit { 
      background: linear-gradient(135deg, var(--primary) 0%, #ff6b35 100%);
      color: #fff; 
      border: none; 
      padding: 0 28px;
      font-weight: 700;
      font-size: 14px;
      display: flex; 
      align-items: center;
      gap: 8px;
      cursor: pointer;
      transition: all 0.3s;
      border-top-right-radius: 10px;
      border-bottom-right-radius: 10px;
    }
    
    .search-submit:hover { 
      background: linear-gradient(135deg, var(--primary-dark) 0%, #ff5722 100%);
      box-shadow: inset 0 0 20px rgba(0,0,0,0.1);
    }

    /* ===== PREMIUM ACTION BUTTONS ===== */
    .header-actions { 
      display: flex; 
      align-items: center; 
      gap: 1rem;
    }
    
    .action-btn { 
      display: flex; 
      align-items: center; 
      gap: 12px; 
      text-decoration: none; 
      color: #2d3748;
      padding: 10px 14px;
      border-radius: 10px;
      transition: all 0.3s;
      position: relative;
    }
    
    .action-btn:hover {
      background: #f7fafc;
      transform: translateY(-2px);
    }
    
    .action-icon {
      position: relative;
      font-size: 24px;
      color: #4a5568;
      transition: all 0.3s;
    }
    
    .action-btn:hover .action-icon {
      color: var(--primary);
    }
    
    .action-badge {
      position: absolute;
      top: -8px;
      right: -8px;
      background: var(--primary);
      color: #fff;
      font-size: 11px;
      font-weight: 800;
      padding: 3px 7px;
      border-radius: 12px;
      border: 2px solid #fff;
      min-width: 20px;
      text-align: center;
    }
    
    .action-badge.pulse {
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
    
    .action-text { 
      display: flex; 
      flex-direction: column;
      line-height: 1.2;
      gap: 2px;
    }
    
    .action-label { 
      font-size: 11px; 
      color: #718096;
      font-weight: 500;
    }
    
    .action-title { 
      font-size: 14px; 
      font-weight: 700;
      color: #2d3748;
    }
    
    .cart-btn {
      background: linear-gradient(135deg, #fff5f0 0%, #ffe8dc 100%);
      border: 2px solid #ffd4c1;
    }
    
    .cart-btn:hover {
      background: linear-gradient(135deg, #ffede3 0%, #ffd4c1 100%);
      border-color: var(--primary);
    }
    
    .cart-btn .action-icon {
      color: var(--primary);
    }
    
    .mobile-toggle {
      display: none;
      background: #f7fafc;
      border: 2px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px 16px;
      cursor: pointer;
      font-size: 20px;
      color: #2d3748;
      transition: all 0.3s;
    }
    
    .mobile-toggle:hover {
      background: var(--primary);
      border-color: var(--primary);
      color: #fff;
    }

    /* ===== PREMIUM NAVIGATION BAR ===== */
    .main-nav { 
      background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
      border-top: 1px solid #e2e8f0;
    }
    
    .nav-container {
      max-width: 1300px;
      margin: 0 auto;
      padding: 0 24px;
    }
    
    .nav-content {
      display: flex;
      align-items: center;
      gap: 2rem;
      padding: 0.8rem 0;
    }
    
    .nav-categories {
      display: flex;
      align-items: center;
      gap: 10px;
      background: linear-gradient(135deg, var(--primary) 0%, #ff6b35 100%);
      color: #fff;
      border: none;
      padding: 12px 24px;
      border-radius: 10px;
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.3s;
      box-shadow: 0 4px 12px rgba(248, 86, 6, 0.25);
      white-space: nowrap;
    }
    
    .nav-categories:hover {
      background: linear-gradient(135deg, var(--primary-dark) 0%, #ff5722 100%);
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(248, 86, 6, 0.35);
    }

    .nav-categories-wrapper {
      position: relative;
    }

    .categories-dropdown {
      position: absolute;
      top: calc(100% + 10px);
      left: 0;
      width: 280px;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.15);
      border: 1px solid #e2e8f0;
      opacity: 0;
      visibility: hidden;
      transform: translateY(10px);
      transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      z-index: 1000;
      overflow: hidden;
    }

    .categories-dropdown.show {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }

    .dropdown-header {
      padding: 16px 20px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      gap: 10px;
      color: #1a202c;
      font-weight: 700;
      font-size: 14px;
    }

    .dropdown-header i {
      color: var(--primary);
    }

    .categories-list {
      list-style: none;
      padding: 10px 0;
      margin: 0;
    }

    .categories-list li a {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 20px;
      color: #4a5568;
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.2s;
    }

    .categories-list li a i {
      font-size: 10px;
      color: #a0aec0;
      transition: all 0.2s;
    }

    .categories-list li a:hover {
      background: #fff5f0;
      color: var(--primary);
      padding-left: 24px;
    }

    .categories-list li a:hover i {
      color: var(--primary);
      transform: translateX(3px);
    }

    .view-all {
      border-top: 1px solid #f1f5f9;
      margin-top: 5px;
    }

    .view-all a {
      color: var(--primary) !important;
      justify-content: space-between;
    }

    .view-all a i {
      font-size: 12px !important;
      color: var(--primary) !important;
    }
    
    .nav-menu {
      display: flex;
      align-items: center;
      list-style: none;
      padding: 0;
      margin: 0;
      gap: 0.5rem;
      flex: 1;
    }
    
    .nav-menu-item {
      position: relative;
    }
    
    .nav-menu-link {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      color: #4a5568;
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
      border-radius: 8px;
      transition: all 0.3s;
      position: relative;
    }
    
    .nav-menu-link:hover,
    .nav-menu-link.active {
      color: var(--primary);
      background: #fff;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }
    
    .nav-menu-item.hot .nav-menu-link {
      color: var(--primary);
    }
    
    .hot-badge {
      background: linear-gradient(135deg, #ff4757 0%, #ff6348 100%);
      color: #fff;
      font-size: 9px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 10px;
      letter-spacing: 0.5px;
      animation: bounce 1s infinite;
    }
    
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-3px); }
    }
    
    .merchant-portal {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      background: #fff;
      border: 2px solid var(--primary);
      border-radius: 10px;
      color: var(--primary);
      font-weight: 700;
      font-size: 14px;
      text-decoration: none;
      transition: all 0.3s;
      margin-left: auto;
      white-space: nowrap;
    }
    
    .merchant-portal:hover {
      background: var(--primary);
      color: #fff;
      transform: translateX(4px);
      box-shadow: 0 4px 12px rgba(248, 86, 6, 0.25);
    }

    /* Simple Footer Styles */
    .simple-footer { 
      background: #fff; 
      border-top: 1px solid #e5e7eb; 
      margin-top: auto; 
    }
    
    .footer-container {
      max-width: 1300px;
      margin: 0 auto;
      padding: 0 24px;
    }
    
    .footer-grid {
      display: grid;
      grid-template-columns: 2fr repeat(4, 1fr);
      gap: 3rem;
      padding: 3rem 0;
    }
    
    .footer-col {
      display: flex;
      flex-direction: column;
    }
    
    .footer-brand { 
      font-size: 1.5rem; 
      font-weight: 800; 
      color: #1a202c; 
      margin-bottom: 1rem;
    }
    .footer-brand span { 
      color: var(--primary); 
    }
    
    .footer-desc {
      color: #6b7280;
      font-size: 14px;
      line-height: 1.6;
      margin: 0;
    }
    
    .footer-heading { 
      font-size: 14px; 
      font-weight: 700; 
      color: #1a202c; 
      margin-bottom: 1rem; 
      text-transform: uppercase; 
      letter-spacing: 0.5px;
    }
    
    .footer-links { 
      list-style: none; 
      padding: 0; 
      margin: 0; 
    }
    .footer-links li { 
      margin-bottom: 10px; 
    }
    .footer-links a { 
      color: #6b7280; 
      font-size: 14px; 
      text-decoration: none; 
      transition: color 0.2s; 
      display: inline-block;
    }
    .footer-links a:hover { 
      color: var(--primary); 
      transform: translateX(3px);
    }
    
    .social-links { 
      display: flex; 
      gap: 12px; 
      flex-wrap: wrap;
    }
    .social-links a { 
      width: 36px; 
      height: 36px; 
      background: #f3f4f6; 
      border-radius: 50%; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      color: #6b7280; 
      transition: all 0.2s; 
      text-decoration: none;
    }
    .social-links a:hover { 
      background: var(--primary); 
      color: #fff; 
      transform: translateY(-3px);
    }
    
    .footer-bottom { 
      background: #f9fafb; 
      border-top: 1px solid #e5e7eb; 
      padding: 1.5rem 0;
    }
    
    .footer-bottom-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
    
    .copyright {
      margin: 0;
      font-size: 14px;
      color: #6b7280;
    }
    
    .payment-methods { 
      display: flex; 
      gap: 10px; 
      align-items: center;
      flex-wrap: wrap;
    }
    
    .payment-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      border: 1.5px solid;
      transition: all 0.2s;
      cursor: default;
    }
    
    .payment-badge.visa {
      background: #1434CB;
      color: #fff;
      border-color: #1434CB;
    }
    
    .payment-badge.mastercard {
      background: #EB001B;
      color: #fff;
      border-color: #EB001B;
    }
    
    .payment-badge.paypal {
      background: #003087;
      color: #fff;
      border-color: #003087;
    }
    
    .payment-badge.amex {
      background: #006FCF;
      color: #fff;
      border-color: #006FCF;
    }
    
    .payment-badge:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }

    @media (max-width: 1200px) {
      .footer-grid {
        grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
        gap: 2rem;
      }
    }

    /* ===== RESPONSIVE DESIGN ===== */
    @media (max-width: 1200px) {
      .search-container {
        max-width: 500px;
      }
      
      .nav-menu {
        gap: 0.3rem;
      }
      
      .nav-menu-link {
        padding: 10px 14px;
        font-size: 13px;
      }
      
      .footer-grid {
        grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
        gap: 2rem;
      }
    }

    @media (max-width: 991px) {
      .top-bar-left,
      .top-bar-right {
        gap: 1rem;
      }
      
      .promo-tag {
        font-size: 12px;
        padding: 5px 12px;
      }
      
      .top-link {
        font-size: 12px;
      }
      
      .header-content {
        flex-wrap: wrap;
        padding: 1.2rem 0;
      }
      
      .search-container {
        order: 3;
        width: 100%;
        max-width: 100%;
      }
      
      .action-text {
        display: none;
      }
      
      .account-btn,
      .wishlist-btn {
        padding: 10px;
      }
      
      .main-nav {
        display: none;
      }
      
      .mobile-toggle {
        display: flex;
      }
      
      .footer-grid {
        grid-template-columns: repeat(3, 1fr);
        gap: 2rem;
      }
      
      .footer-brand-col {
        grid-column: 1 / -1;
      }
    }

    @media (max-width: 768px) {
      .top-bar {
        padding: 8px 0;
      }
      
      .top-bar-container {
        flex-direction: column;
        gap: 0.8rem;
      }
      
      .top-bar-left,
      .top-bar-right {
        width: 100%;
        justify-content: center;
      }
      
      .language-selector {
        display: none;
      }
      
      .brand-logo {
        gap: 10px;
      }
      
      .logo-icon {
        width: 45px;
        height: 45px;
      }
      
      .logo-letter {
        font-size: 24px;
      }
      
      .brand-name,
      .brand-tagline {
        font-size: 1.2rem;
      }
      
      .category-dropdown {
        padding: 0 12px;
        font-size: 13px;
      }
      
      .search-submit span {
        display: none;
      }
      
      .cart-btn {
        border: none;
      }
    }

    @media (max-width: 640px) {
      .top-link:not(:first-child) {
        display: none;
      }
      
      .auth-link span {
        display: none;
      }
      
      .header-content {
        gap: 1rem;
      }
      
      .search-wrapper {
        height: 48px;
      }
      
      .category-dropdown {
        display: none;
      }
      
      .search-input-group {
        padding: 0 12px;
      }
      
      .search-submit {
        padding: 0 20px;
      }
      
      .action-icon {
        font-size: 22px;
      }
      
      .footer-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 2rem;
        padding: 2rem 0;
      }
      
      .footer-bottom-content {
        flex-direction: column;
        text-align: center;
      }
      
      .payment-methods {
        justify-content: center;
      }
    }

    @media (max-width: 480px) {
      .promo-tag span {
        display: none;
      }
      
      .brand-text {
        display: none;
      }
      
      .header-actions {
        gap: 0.5rem;
      }
      
      .wishlist-btn {
        display: none;
      }
      
      .footer-grid {
        grid-template-columns: 1fr;
        gap: 2rem;
      }
      
      .payment-badge {
        font-size: 10px;
        padding: 5px 12px;
      }
    }

  `]
})
export class PublicLayoutComponent implements OnInit {
  isScrolled = false;
  selectedCategory = 'All';
  showCategoryDropdown = false;
  cartCount = 0;
  cartTotal = 0;
  userName = 'Guest';
  categories: CategoryLookupDto[] = [];

  searchTerm = '';
  selectedCategorySlug = '';

  private lastScrollTop = 0;

  constructor(
    public cartService: CartService,
    public authService: AuthService,
    private categoryService: CategoryService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private publicService: PublicService
  ) { }

  ngOnInit(): void {
    this.cartService.cartItems$.subscribe(items => {
      this.cartCount = this.cartService.getCartCount();
      this.cartTotal = this.cartService.getCartTotal();
    });

    this.authService.currentUser$.subscribe(user => {
      if (user) {
        // Try getting name from token first for instant UI response
        const nameFromToken = this.authService.getUserName();
        this.userName = nameFromToken || 'User';

        // Then fetch full profile for "Real Name" if available
        this.publicService.getProfile().subscribe({
          next: (profile: any) => {
            if (profile && (profile.name || profile.surname)) {
              this.userName = `${profile.name || ''} ${profile.surname || ''}`.trim();
              this.cdr.detectChanges();
            }
          },
          error: () => {
            // Keep token name on error
          }
        });
      } else {
        this.userName = 'Guest';
      }
    });

    this.loadCategories();

    // Subscribe to router events to sync category label
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.syncCategoryWithUrl();
    });
  }

  private syncCategoryWithUrl(): void {
    const url = this.router.url;
    // Extract slug from /category/:slug or /category/:slug?queryParams
    const match = url.match(/\/category\/([^?\/]+)/);
    if (match && match[1]) {
      this.selectedCategorySlug = match[1];
      // If categories are loaded, find the name
      if (this.categories.length > 0) {
        const cat = this.categories.find(c => c.slug === this.selectedCategorySlug);
        if (cat) {
          this.selectedCategory = cat.name;
        } else {
          this.selectedCategory = this.selectedCategorySlug.replace(/-/g, ' ');
        }
      }
    } else if (url.includes('/shop')) {
      this.selectedCategory = 'All';
      this.selectedCategorySlug = '';
    } else if (url.includes('/home') || url === '/') {
      this.selectedCategory = 'All';
      this.selectedCategorySlug = '';
    }
  }

  loadCategories(): void {
    this.categoryService.getLookup().subscribe({
      next: (data) => {
        this.categories = data;
        this.syncCategoryWithUrl(); // Sync after data is loaded
        this.cdr.detectChanges(); // Manually trigger detection to fix NG0100
      },
      error: (err) => {
        console.error('Error loading categories:', err);
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    // Hide top bar when scrolling down past 100px
    if (scrollTop > 100) {
      this.isScrolled = true;
    } else {
      this.isScrolled = false;
    }

    this.lastScrollTop = scrollTop;
  }

  toggleCategoryDropdown() {
    this.showCategoryDropdown = !this.showCategoryDropdown;
  }

  selectSearchCategory(name: string, slug?: string) {
    this.selectedCategory = name;
    this.selectedCategorySlug = slug || '';
    this.showCategoryDropdown = false;

    // Navigate immediately to the selected category, preserving query params
    const queryParams: any = {};
    if (this.searchTerm) queryParams.q = this.searchTerm;

    if (this.selectedCategorySlug) {
      this.router.navigate(['/category', this.selectedCategorySlug], { queryParams });
    } else {
      this.router.navigate(['/shop'], { queryParams });
    }
  }

  onSearch() {
    if (this.selectedCategorySlug) {
      this.router.navigate(['/category', this.selectedCategorySlug], { queryParams: { q: this.searchTerm } });
    } else {
      this.router.navigate(['/shop'], { queryParams: { q: this.searchTerm } });
    }
  }

  getPortalUrl(): string {
    if (!this.authService.isAuthenticated()) return '/auth/login';
    return this.authService.isSeller() ? '/seller/dashboard' : '/admin/dashboard';
  }
}
