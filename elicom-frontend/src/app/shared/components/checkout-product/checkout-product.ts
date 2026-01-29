import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService, CartItem } from '../../../services/cart';

@Component({
  selector: 'app-checkout-product',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './checkout-product.html',
  styleUrls: ['./checkout-product.scss']
})
export class CheckoutProduct {
  cartService = inject(CartService);

  get products(): CartItem[] {
    return this.cartService.items().filter(item => item.isChecked);
  }

  // Qty increase/decrease
  incrementQty(product: CartItem) {
    this.cartService.updateQuantity(product.productId, product.size, product.color, product.quantity + 1);
  }

  decrementQty(product: CartItem) {
    if (product.quantity > 1) {
      this.cartService.updateQuantity(product.productId, product.size, product.color, product.quantity - 1);
    }
  }

  // Shipping info (single div)
  standardShipping: string = "$3.99 (Arrives between Jan 26 - Jan 29, 66.9% are ≤ 6 business days, Est. arrival: before Valentine's)";
  onTimeDelivery: string = "On-Time Delivery Service: FREE";
}
