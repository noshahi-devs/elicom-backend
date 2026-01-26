import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

export interface CartItem {
  product: any;
  quantity: number;
  size: string;
  color: string;
}

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss', 'cart-complete.scss']
})
export class CartComponent implements OnInit {
  cartItems: CartItem[] = [];
  subtotal = 0;
  shipping = 0;
  tax = 0;
  discount = 0;
  total = 0;
  promoCode = '';

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCartItems();
    this.calculateTotals();
  }

  private loadCartItems(): void {
    // TODO: Replace with actual cart service
    this.cartItems = [
      {
        product: {
          id: 'prod-1',
          name: 'Premium Wireless Headphones',
          price: 299,
          originalPrice: 399,
          image: 'https://picsum.photos/seed/headphones/300/300.jpg'
        },
        quantity: 1,
        size: 'M',
        color: 'Black'
      },
      {
        product: {
          id: 'prod-2',
          name: 'Smart Watch',
          price: 199,
          originalPrice: 249,
          image: 'https://picsum.photos/seed/smartwatch/300/300.jpg'
        },
        quantity: 2,
        size: 'L',
        color: 'Silver'
      },
      {
        product: {
          id: 'prod-3',
          name: 'Laptop Backpack',
          price: 79,
          originalPrice: 99,
          image: 'https://picsum.photos/seed/backpack/300/300.jpg'
        },
        quantity: 1,
        size: 'One Size',
        color: 'Navy Blue'
      },
      {
        product: {
          id: 'prod-4',
          name: 'Wireless Mouse',
          price: 49,
          originalPrice: 69,
          image: 'https://picsum.photos/seed/mouse/300/300.jpg'
        },
        quantity: 1,
        size: 'Standard',
        color: 'Black'
      }
    ];
  }

  updateQuantity(item: CartItem, newQuantity: number): void {
    if (newQuantity > 0 && newQuantity <= 10) {
      item.quantity = newQuantity;
      this.calculateTotals();
    }
  }

  removeFromCart(item: CartItem): void {
    const index = this.cartItems.indexOf(item);
    if (index > -1) {
      this.cartItems.splice(index, 1);
      this.calculateTotals();
    }
  }

  clearCart(): void {
    this.cartItems = [];
    this.calculateTotals();
  }

  applyPromoCode(): void {
    if (this.promoCode === 'SAVE10') {
      this.discount = this.subtotal * 0.1;
      this.calculateTotals();
      alert('Promo code applied! 10% discount');
    } else {
      alert('Invalid promo code');
    }
  }

  proceedToCheckout(): void {
    // Store cart data in sessionStorage for checkout page
    sessionStorage.setItem('cartData', JSON.stringify({
      items: this.cartItems,
      subtotal: this.subtotal,
      shipping: this.shipping,
      tax: this.tax,
      discount: this.discount,
      total: this.total
    }));
    
    // Navigate to checkout page
    this.router.navigate(['/checkout']);
  }

  private calculateTotals(): void {
    this.subtotal = this.cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    this.shipping = this.subtotal > 50 ? 0 : 10;
    this.tax = this.subtotal * 0.08;
    this.total = this.subtotal + this.shipping + this.tax - this.discount;
  }
}
