import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart.service';
import { OrderService, CreateOrderDto } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { CustomerProfileService } from '../../services/customer-profile.service';
import { Router } from '@angular/router';
import { OrderProcessHeader } from '../../shared/components/order-process-header/order-process-header';
import { OrderProcessBreadcrumb } from '../../shared/components/order-process-breadcrumb/order-process-breadcrumb';
import { ShippingAddress } from '../../shared/components/shipping-address/shipping-address';
import { CheckoutProduct } from '../../shared/components/checkout-product/checkout-product';
import { PaymentMethod } from '../../shared/components/payment-method/payment-method';
import { CheckoutSummary } from '../../shared/components/checkout-summary/checkout-summary';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule,
    OrderProcessHeader,
    OrderProcessBreadcrumb,
    ShippingAddress,
    CheckoutProduct,
    PaymentMethod,
    CheckoutSummary
  ],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout {
  public cartService = inject(CartService);
  private orderService = inject(OrderService);
  private authService = inject(AuthService);
  private profileService = inject(CustomerProfileService);
  private router = inject(Router);

  @ViewChild(ShippingAddress) shippingAddressComponent!: ShippingAddress;

  showTopBar: boolean = true;
  isShippingAddressSaved: boolean = false;
  selectedPaymentMethod: string | null = null;
  selectedPaymentDetails: any = null;
  isLoading: boolean = false;

  // Steps: 0: Cart, 1: Shipping, 2: Payment, 3: Success
  checkoutStep: number = 1;
  savedAddressData: any = null;

  ngOnInit(): void {
    this.getTopBarStatus();
  }

  getTopBarStatus() {
    this.showTopBar = true;
  }

  handleAddressSaved() {
    this.savedAddressData = this.shippingAddressComponent.getAddressData();
    this.isShippingAddressSaved = true;
    this.checkoutStep = 2;
  }

  handlePaymentConfirmed(payment: { method: string, details?: any }) {
    this.selectedPaymentMethod = payment.method;
    this.selectedPaymentDetails = payment.details;
    this.handlePlaceOrder();
  }

  handleStepClick(index: number) {
    if (index === 0) {
      this.router.navigate(['/add-to-cart']);
      return;
    }
    // Only allow going to completed steps or current step
    if (index <= this.checkoutStep) {
      this.checkoutStep = index;
    }
  }

  nextStep() {
    if (this.checkoutStep === 1) {
      if (this.isShippingAddressSaved) {
        console.log('[Checkout] 🚚 Address Step Saved. Moving to Step 2.');
        this.checkoutStep = 2;
      } else {
        this.shippingAddressComponent.saveAddress();
      }
    }
  }

  get canPlaceOrder(): boolean {
    return this.isShippingAddressSaved && !!this.selectedPaymentMethod && !this.isLoading;
  }

  async handlePlaceOrder() {
    if (!this.isShippingAddressSaved || !this.selectedPaymentMethod) return;

    if (!this.authService.isAuthenticated) {
      this.authService.openAuthModal();
      return;
    }

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    this.isLoading = true;

    try {
      const userId = currentUser.id || localStorage.getItem('userId');
      if (!userId) throw new Error("User ID not found.");

      let profileId = localStorage.getItem('customerProfileId');
      if (!profileId) {
        const profileRes = await this.profileService.getByUserId(userId).toPromise();
        profileId = profileRes?.result?.id;
      }

      const address = this.savedAddressData || this.shippingAddressComponent?.getAddressData();
      if (!address) throw new Error("Please complete the shipping address step first.");

      const orderInput: CreateOrderDto = {
        userId: Number(userId),
        paymentMethod: this.selectedPaymentMethod!,
        shippingAddress: address.address1,
        country: address.location || 'UK',
        state: address.state,
        city: address.city,
        postalCode: address.zip,
        shippingCost: 0,
        discount: 0,
        sourcePlatform: 'SmartStore',
        cardNumber: this.selectedPaymentDetails?.number?.replace(/\s/g, ''),
        cvv: this.selectedPaymentDetails?.cvv,
        expiryDate: this.selectedPaymentDetails?.expiry,
        items: this.cartService.items().map(item => ({
          storeProductId: item.storeProductId,
          quantity: item.quantity,
          priceAtPurchase: item.price,
          productName: item.name,
          storeName: item.storeName
        }))
      };

      console.log('[Checkout] 💳 Placing Order with Payload:', orderInput);

      this.orderService.createOrder(orderInput).subscribe({
        next: (res) => {
          console.log('[Checkout] ✅ Order Placed Successfully!', res);
          this.isLoading = false;
          Swal.fire({
            icon: 'success',
            title: 'Order Placed!',
            text: 'Your order has been successfully placed.',
            showConfirmButton: true
          }).then(() => {
            this.cartService.clearCart();
            this.router.navigate(['/user/index/orders']);
          });
        },
        error: (err) => {
          this.isLoading = false;
          Swal.fire({
            icon: 'error',
            title: 'Order Failed',
            text: err.error?.error?.message || 'Something went wrong.'
          });
        }
      });

    } catch (error: any) {
      this.isLoading = false;
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message
      });
    }
  }
}
