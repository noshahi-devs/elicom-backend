import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-payment-method',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payment-method.html',
  styleUrl: './payment-method.scss',
})
export class PaymentMethod {

  @Output() paymentConfirmed = new EventEmitter<string>();

  // kis payment method par click hua (index)
  activeIndex: number | null = null;
  showCardModal = false;
  selectedLabel = '';

  /* CARD FIELDS */
  card = {
    number: '', // stored with spaces
    expiry: '',
    cvv: '',
    holder: ''
  };

  cardErrors = {
    number: false,
    expiry: false,
    cvv: false
  };

  setActive(index: number, label: string) {
    this.activeIndex = index;
    this.selectedLabel = label;

    // Direct open card modal for ALL methods
    this.showCardModal = true;
    this.resetCardForm();
  }

  /* ================= CARD INPUT HANDLERS ================= */

  formatCardNumber(e: Event) {
    const input = e.target as HTMLInputElement;
    // Remove all non-digits
    let value = input.value.replace(/\D/g, '');

    // Limit to 16 digits
    if (value.length > 16) value = value.substring(0, 16);

    // Add spaces every 4 digits
    const parts = value.match(/.{1,4}/g);
    this.card.number = parts ? parts.join(' ') : value;

    // Reset error while typing
    this.cardErrors.number = false;
  }

  formatExpiry(e: Event) {
    const input = e.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, ''); // Remove non-digits

    // Limit to 4 digits (MMYY)
    if (value.length > 4) value = value.substring(0, 4);

    if (value.length >= 2) {
      // Validate Month (01-12)
      const month = parseInt(value.substring(0, 2));
      if (month > 12) value = '12' + value.substring(2);
      if (month === 0) value = '01' + value.substring(2);

      // Add slash
      value = value.substring(0, 2) + '/' + value.substring(2);
    }

    this.card.expiry = value;
    this.cardErrors.expiry = false;
  }

  formatCVV(e: Event) {
    const input = e.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');

    // Limit to 3 digits
    if (value.length > 3) value = value.substring(0, 3);

    this.card.cvv = value;
    this.cardErrors.cvv = false;
  }

  /* ================= SAVE LOGIC ================= */

  saveCard() {
    let isValid = true;

    // 1. Validate Card Number: Must be 16 digits (plus 3 spaces = 19 chars)
    const rawNum = this.card.number.replace(/\s/g, '');
    if (rawNum.length !== 16) {
      this.cardErrors.number = true;
      isValid = false;
    }

    // 2. Validate Expiry: Must be 5 chars (MM/YY) => 4 digits
    if (this.card.expiry.length !== 5) {
      this.cardErrors.expiry = true;
      isValid = false;
    }

    // 3. Validate CVV: Must be 3 digits
    if (this.card.cvv.length !== 3) {
      this.cardErrors.cvv = true;
      isValid = false;
    }

    if (!isValid) return;

    // Passed
    this.confirmPayment();
  }

  resetCardForm() {
    this.card = { number: '', expiry: '', cvv: '', holder: '' };
    this.cardErrors = { number: false, expiry: false, cvv: false };
  }

  // Removed onLoginSuccess()

  confirmPayment() {
    this.paymentConfirmed.emit(this.selectedLabel);
    this.closeModals();
  }

  closeModals() {
    // this.showLoginModal = false;
    this.showCardModal = false;
  }
}
