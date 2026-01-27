import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CartService, CartItem } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ProfileService } from '../../core/services/profile.service';
import { WholesaleService, CreateWholesaleOrderInput } from '../../core/services/wholesale.service';
import { switchMap, forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit {
  checkoutForm: FormGroup;
  cartItems: CartItem[] = [];
  subtotal = 0;
  shipping = 0;
  tax = 0;
  total = 0;

  paymentMethods = [
    { id: 'mastercard', name: 'Master Card', icon: 'pi pi-credit-card' },
    { id: 'discover', name: 'Discover', icon: 'pi pi-credit-card' },
    { id: 'amex', name: 'American Express', icon: 'pi pi-credit-card' },
    { id: 'finora', name: 'Easy Finora Card', icon: 'pi pi-id-card' },
    { id: 'bank_transfer', name: 'Bank Transfer', icon: 'pi pi-building' },
    { id: 'crypto', name: 'Crypto Via Binance', icon: 'pi pi-bitcoin' },
    { id: 'google_pay', name: 'Google Pay', icon: 'pi pi-google' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private cartService: CartService,
    private orderService: OrderService,
    private authService: AuthService,
    private toastService: ToastService,
    private profileService: ProfileService,
    private wholesaleService: WholesaleService
  ) {
    this.checkoutForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      address: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      country: ['United States', Validators.required],
      zipCode: ['', Validators.required],
      paymentMethod: ['mastercard', Validators.required],
      // Card details (for credit/debit/finora)
      cardNumber: [''],
      expiryDate: [''],
      cvv: [''],
      // Bank details
      bankAccountName: [''],
      bankAccountNumber: [''],
      // Crypto details
      cryptoWalletAddress: ['']
    });

    // Dynamic validation based on payment method
    this.checkoutForm.get('paymentMethod')?.valueChanges.subscribe(method => {
      this.updatePaymentValidations(method);
    });
  }

  private updatePaymentValidations(method: string): void {
    const cardControls = ['cardNumber', 'expiryDate', 'cvv'];
    const bankControls = ['bankAccountName', 'bankAccountNumber'];
    const cryptoControls = ['cryptoWalletAddress'];

    [...cardControls, ...bankControls, ...cryptoControls].forEach(ctrl => {
      this.checkoutForm.get(ctrl)?.clearValidators();
      this.checkoutForm.get(ctrl)?.updateValueAndValidity();
    });

    if (['mastercard', 'discover', 'amex', 'finora'].includes(method)) {
      cardControls.forEach(ctrl => this.checkoutForm.get(ctrl)?.setValidators([Validators.required]));
    } else if (method === 'bank_transfer') {
      bankControls.forEach(ctrl => this.checkoutForm.get(ctrl)?.setValidators([Validators.required]));
    } else if (method === 'crypto') {
      cryptoControls.forEach(ctrl => this.checkoutForm.get(ctrl)?.setValidators([Validators.required]));
    }

    [...cardControls, ...bankControls, ...cryptoControls].forEach(ctrl => {
      this.checkoutForm.get(ctrl)?.updateValueAndValidity();
    });
  }

  ngOnInit(): void {
    this.loadCartData();
  }

  private loadCartData(): void {
    this.cartService.cartItems$.subscribe(items => {
      this.cartItems = items;
      this.calculateTotals();
    });
  }

  private calculateTotals(): void {
    this.subtotal = this.cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    this.shipping = this.subtotal > 50 ? 0 : 10;
    this.tax = this.subtotal * 0.08;
    this.total = this.subtotal + this.shipping + this.tax;
  }

  onSubmit(): void {
    if (this.checkoutForm.valid) {
      this.toastService.showSuccess('Processing wholesale order...');
      const val = this.checkoutForm.value;

      const orderInput: CreateWholesaleOrderInput = {
        items: this.cartItems.map(item => ({
          productId: item.product.id,
          quantity: item.quantity
        })),
        shippingAddress: `${val.address}, ${val.city}, ${val.state} ${val.zipCode}, ${val.country}`,
        customerName: `${val.firstName} ${val.lastName}`
      };

      this.wholesaleService.placeWholesaleOrder(orderInput).subscribe({
        next: (res) => {
          this.toastService.showSuccess('Wholesale order placed successfully!');
          this.cartService.clearCart();
          // For sellers, redirection should go to seller orders
          this.router.navigate(['/seller/orders']);
        },
        error: (err) => {
          console.error('Wholesale checkout failed:', err);
          const errorMsg = err.error?.error?.message || 'Failed to place wholesale order. Please ensure you have sufficient balance in your GlobalPayUK wallet.';
          this.toastService.showError(errorMsg);
        }
      });
    } else {
      this.toastService.showError('Please fill in all required fields correctly');
      Object.keys(this.checkoutForm.controls).forEach(key => {
        const control = this.checkoutForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
    }
  }
}
