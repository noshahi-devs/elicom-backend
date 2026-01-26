import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CartItem } from '../cart/cart.component';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

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

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.checkoutForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      address: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      zipCode: ['', Validators.required],
      paymentMethod: ['credit', Validators.required],
      cardNumber: [''],
      expiryDate: [''],
      cvv: ['']
    });
  }

  ngOnInit(): void {
    this.loadCartData();
  }

  private loadCartData(): void {
    // Load cart data from sessionStorage
    const cartData = sessionStorage.getItem('cartData');
    if (cartData) {
      const data = JSON.parse(cartData);
      this.cartItems = data.items || [];
      this.subtotal = data.subtotal || 0;
      this.shipping = data.shipping || 0;
      this.tax = data.tax || 0;
      this.total = data.total || 0;
    } else {
      // Fallback data if no cart data found
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
        }
      ];
      this.calculateTotals();
    }
  }

  private calculateTotals(): void {
    this.subtotal = this.cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    this.shipping = this.subtotal > 50 ? 0 : 10;
    this.tax = this.subtotal * 0.08;
    this.total = this.subtotal + this.shipping + this.tax;
  }

  onSubmit(): void {
    if (this.checkoutForm.valid) {
      // TODO: Process order
      console.log('Order submitted:', this.checkoutForm.value);
      alert('Order placed successfully!');
      this.router.navigate(['/account/orders']);
    } else {
      alert('Please fill in all required fields');
    }
  }
}
