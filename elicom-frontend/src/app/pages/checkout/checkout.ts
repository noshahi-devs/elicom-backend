import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart';
import { OrderProcessHeader } from '../../shared/components/order-process-header/order-process-header';
import { OrderProcessBreadcrumb } from '../../shared/components/order-process-breadcrumb/order-process-breadcrumb';
import { ShippingAddress } from '../../shared/components/shipping-address/shipping-address';
import { CheckoutProduct } from '../../shared/components/checkout-product/checkout-product';
import { PaymentMethod } from '../../shared/components/payment-method/payment-method';
import { CheckoutSummary } from '../../shared/components/checkout-summary/checkout-summary';

@Component({
  selector: 'app-checkout',
  imports: [
    CommonModule,
    OrderProcessHeader,
    OrderProcessBreadcrumb,
    ShippingAddress,
    CheckoutProduct,
    PaymentMethod,
    CheckoutSummary,
  ],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout {
  showTopBar: boolean = true;

  isShippingAddressSaved: boolean = false;
  selectedPaymentMethod: string | null = null; // Storing the name of the method

  ngOnInit(): void {
    this.getTopBarStatus();
  }

  getTopBarStatus() {
    // API response example
    const apiResponse = {
      showBanner: true // false => hide bar
    };
    this.showTopBar = apiResponse.showBanner;
  }

  handleAddressSaved() {
    this.isShippingAddressSaved = true;
  }

  handlePaymentConfirmed(method: string) {
    this.selectedPaymentMethod = method;
  }

  get canPlaceOrder(): boolean {
    return this.isShippingAddressSaved && !!this.selectedPaymentMethod;
  }

  handlePlaceOrder() {
    if (!this.selectedPaymentMethod) return;

    const method = this.selectedPaymentMethod.toLowerCase();

    // Easy Finora or Card
    if (method.includes('easyfinora') || method.includes('card')) {
      alert('Order placed successfully!');
    } else {
      alert('This feature is currently in progress. Please use Easy Finora or Debit/Credit Card.');
    }
  }
}
