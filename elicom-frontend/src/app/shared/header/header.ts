import { Component, signal, ElementRef, ViewChild, inject, effect, HostListener, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { CartService, CartItem } from '../../services/cart.service';
import { SearchService } from '../../services/search.service';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { AuthModalComponent } from '../components/auth-modal/auth-modal.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, AuthModalComponent],
  templateUrl: './header.html',
  styleUrls: ['./header.scss']
})
export class Header implements AfterViewChecked {
  userDropdown = signal(false);
  cartDropdown = signal(false);
  globeDropdown = signal(false);
  authModalOpen = signal(false); // Controls the Auth Modal visibility
  searchTerm = '';

  cartService = inject(CartService);
  searchService = inject(SearchService);
  authService = inject(AuthService); // Inject AuthService
  router = inject(Router);

  // currentUser signal derived from AuthService
  currentUser = this.authService.currentUser$;
  isAuthenticated = this.authService.isAuthenticated$;

  autoHideTimer: any;
  isHovered = false;

  constructor() {
    // Listen for new items added to cart to auto-open the modal
    effect(() => {
      const trigger = this.cartService.cartAutoOpen();
      if (trigger > 0) {
        this.openModal();
      }
    });

    // Listen to Auth Service requests to open modal
    // We subscribe manually since effect() is for signals, or we could use toSignal if we strictly wanted signals
    this.authService.showAuthModal$.subscribe(show => {
      if (show) this.authModalOpen.set(true);
    });
  }

  @ViewChild('navbar', { static: true })
  navbar!: ElementRef<HTMLElement>;

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    // Close if click is outside cart-wrapper
    if (!target.closest('.cart-wrapper')) {
      this.cartDropdown.set(false);
      if (this.autoHideTimer) clearTimeout(this.autoHideTimer);
    }

    if (!target.closest('.currency-menu-wrapper')) {
      this.globeDropdown.set(false);
    }

    if (!target.closest('.user-menu-wrapper')) {
      this.userDropdown.set(false);
    }
  }

  ngAfterViewChecked() {
    // Set indeterminate state for store checkboxes
    this.getStores().forEach(storeName => {
      const checkbox = document.getElementById('store-' + storeName) as HTMLInputElement;
      if (checkbox) {
        const isPartiallyChecked = this.isAnyStoreItemChecked(storeName) && !this.isStoreChecked(storeName);
        checkbox.indeterminate = isPartiallyChecked;
      }
    });
  }

  openModal() {
    this.cartDropdown.set(true);
    this.startTimer();
  }

  closeModal() {
    this.cartDropdown.set(false);
    if (this.autoHideTimer) clearTimeout(this.autoHideTimer);
  }

  startTimer() {
    if (this.autoHideTimer) clearTimeout(this.autoHideTimer);
    this.autoHideTimer = setTimeout(() => {
      if (!this.isHovered) {
        this.cartDropdown.set(false);
      }
    }, 3000);
  }

  onMouseEnterCart() {
    this.isHovered = true;
    if (this.autoHideTimer) clearTimeout(this.autoHideTimer);
  }

  onMouseLeaveCart() {
    this.isHovered = false;
    this.startTimer();
  }

  incrementQty(item: CartItem) {
    this.cartService.updateQuantity(item.productId, item.size, item.color, item.quantity + 1);
  }

  decrementQty(item: CartItem) {
    if (item.quantity > 1) {
      this.cartService.updateQuantity(item.productId, item.size, item.color, item.quantity - 1);
    }
  }

  removeItem(item: CartItem) {
    Swal.fire({
      title: "Are you sure?",
      text: "You will not be able to recover this item!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, delete it!"
    }).then((result) => {
      if (result.isConfirmed) {
        this.cartService.removeItem(item.productId, item.size, item.color);
        Swal.fire("Deleted!", "Your item has been deleted.", "success");
      }
    });
  }

  scrollAmount = 200;

  scrollLeft() {
    const navbar = document.querySelector('.elicom-navbar');
    if (navbar) navbar.scrollBy({ left: -200, behavior: 'smooth' });
  }

  scrollRight() {
    const navbar = document.querySelector('.elicom-navbar');
    if (navbar) navbar.scrollBy({ left: 200, behavior: 'smooth' });
  }

  // Checkbox handling methods
  onItemCheckboxChange(item: CartItem) {
    this.cartService.toggleItemCheckbox(item.productId, item.size, item.color);
  }

  onStoreCheckboxChange(storeName: string, event: Event) {
    const checkbox = event.target as HTMLInputElement;
    this.cartService.toggleStoreCheckbox(storeName, checkbox.checked);
  }

  onAllCheckboxChange(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    this.cartService.toggleAllCheckbox(checkbox.checked);
  }

  isStoreChecked(storeName: string): boolean {
    return this.cartService.isStoreChecked(storeName);
  }

  isAnyStoreItemChecked(storeName: string): boolean {
    return this.cartService.isAnyStoreItemChecked(storeName);
  }

  isAllChecked(): boolean {
    return this.cartService.isAllChecked();
  }

  getStores(): string[] {
    return this.cartService.getStores();
  }

  getItemsByStore(storeName: string): CartItem[] {
    return this.cartService.getItemsByStore(storeName);
  }

  onSearch() {
    if (this.searchTerm.trim()) {
      this.searchService.setSearchTerm(this.searchTerm);
      this.router.navigate(['/search-result'], { queryParams: { q: this.searchTerm } });
    }
  }

  userMenuTimer: any;

  onMouseEnterUser() {
    // Only show if logged in
    // We can check the signal value or the service property directly if it's synchronous enough
    // But since isAuthenticated is an Observable in the template, let's strictly check:
    if (this.authService.isAuthenticated) {
      this.userDropdown.set(true);
      if (this.userMenuTimer) clearTimeout(this.userMenuTimer);
    }
  }

  onMouseLeaveUser() {
    if (this.authService.isAuthenticated) {
      this.userMenuTimer = setTimeout(() => {
        this.userDropdown.set(false);
      }, 300); // 300ms delay
    }
  }

  toggleUserMenu() {
    if (this.authService.isAuthenticated) {
      // If logged in, clicking icon goes to User Index
      this.router.navigate(['/user/index']);
    } else {
      // If not logged in, open login modal
      this.authModalOpen.set(true);
    }
  }

  logout() {
    this.authService.logout();
    this.userDropdown.set(false);
    this.router.navigate(['/']);
  }
}
