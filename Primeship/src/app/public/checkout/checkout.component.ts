import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CartService, CartItem } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ProfileService } from '../../core/services/profile.service';
import { WholesaleService, CreateWholesaleOrderInput } from '../../core/services/wholesale.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
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

  // States
  showCelebration = false;
  isProcessing = false;
  isSuccess = false;

  // Confetti
  confettiPieces = Array(100).fill(0);

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
    private wholesaleService: WholesaleService,
    private cdr: ChangeDetectorRef
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
      cardNumber: [''],
      expiryDate: [''],
      cvv: [''],
      bankAccountName: [''],
      bankAccountNumber: [''],
      cryptoWalletAddress: ['']
    });

    this.checkoutForm.get('paymentMethod')?.valueChanges.subscribe(method => {
      this.updatePaymentValidations(method);
    });

    this.setupMasking();
  }

  private setupMasking(): void {
    this.checkoutForm.get('cardNumber')?.valueChanges.subscribe(val => {
      if (!val) return;
      let numeric = val.replace(/\D/g, '');
      if (numeric.length > 16) numeric = numeric.substring(0, 16);
      const masked = numeric.match(/.{1,4}/g)?.join(' ') || numeric;
      if (val !== masked) {
        this.checkoutForm.get('cardNumber')?.setValue(masked, { emitEvent: false });
      }
    });

    this.checkoutForm.get('expiryDate')?.valueChanges.subscribe(val => {
      if (!val) return;
      let clean = val.replace(/\D/g, '');
      if (clean.length >= 1 && !['0', '1'].includes(clean[0])) clean = '';
      if (clean.length >= 2) {
        const month = parseInt(clean.substring(0, 2));
        if (month > 12) clean = clean.substring(0, 1);
      }
      if (clean.length > 4) clean = clean.substring(0, 4);
      let masked = clean;
      if (clean.length > 2) masked = clean.substring(0, 2) + '/' + clean.substring(2);
      if (val !== masked) this.checkoutForm.get('expiryDate')?.setValue(masked, { emitEvent: false });
    });

    this.checkoutForm.get('cvv')?.valueChanges.subscribe(val => {
      if (!val) return;
      let numeric = val.replace(/\D/g, '');
      if (numeric.length > 4) numeric = numeric.substring(0, 4);
      if (val !== numeric) this.checkoutForm.get('cvv')?.setValue(numeric, { emitEvent: false });
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
      this.checkoutForm.get('cardNumber')?.setValidators([Validators.required, Validators.pattern(/^\d{4} \d{4} \d{4} \d{4}$/)]);
      this.checkoutForm.get('expiryDate')?.setValidators([Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)]);
      this.checkoutForm.get('cvv')?.setValidators([Validators.required, Validators.pattern(/^\d{3,4}$/)]);
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
      this.isProcessing = true;
      this.isSuccess = false;
      this.showCelebration = true;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.cdr.detectChanges();

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
          this.isProcessing = false;
          this.isSuccess = true;
          this.cartService.clearCart();
          this.cdr.detectChanges();

          setTimeout(() => {
            if (this.isSuccess) {
              this.router.navigate(['/seller/orders']);
            }
          }, 6000);
        },
        error: (err) => {
          this.isProcessing = false;
          this.isSuccess = false;
          this.showCelebration = false;
          this.cdr.detectChanges();
          console.error('Wholesale checkout failed:', err);
          const errorMsg = err.error?.error?.message || 'Failed to place wholesale order.';
          this.toastService.showError(errorMsg);
        }
      });
    } else {
      this.toastService.showError('Please fill in all required fields correctly');
      Object.keys(this.checkoutForm.controls).forEach(key => {
        const control = this.checkoutForm.get(key);
        if (control?.invalid) control.markAsTouched();
      });
    }
  }
}
