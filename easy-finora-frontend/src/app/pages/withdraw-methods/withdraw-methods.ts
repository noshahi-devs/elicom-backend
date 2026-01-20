import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
    selector: 'app-withdraw-methods',
    imports: [FormsModule],
    templateUrl: './withdraw-methods.html',
    styleUrl: './withdraw-methods.scss',
})
export class WithdrawMethods {

    paymentMethod = '';
    provider = '';
    cardNumber = '';
    expiryDate = '';
    cvv = '';
    cardHolderName = '';

    constructor(private toastService: ToastService) { }

    submitMethod() {
        // Validation
        if (!this.paymentMethod) {
            this.toastService.showError('Please select card type');
            return;
        }

        if (!this.provider) {
            this.toastService.showError('Please select card provider');
            return;
        }

        if (!this.cardNumber || this.cardNumber.replace(/\s/g, '').length < 13) {
            this.toastService.showError('Please enter a valid card number (minimum 13 digits)');
            return;
        }

        if (!this.expiryDate || !/^\d{2}\/\d{2}$/.test(this.expiryDate)) {
            this.toastService.showError('Please enter expiry date in MM/YY format');
            return;
        }

        if (!this.cvv || this.cvv.length !== 3) {
            this.toastService.showError('Please enter a valid 3-digit CVV');
            return;
        }

        if (!this.cardHolderName || this.cardHolderName.trim().length < 3) {
            this.toastService.showError('Please enter card holder name (minimum 3 characters)');
            return;
        }

        console.log('Withdraw method submitted:', {
            paymentMethod: this.paymentMethod,
            provider: this.provider,
            cardNumber: this.cardNumber,
            expiryDate: this.expiryDate,
            cvv: this.cvv,
            cardHolderName: this.cardHolderName
        });

        this.toastService.showSuccess('Withdraw method added successfully!');

        // Reset form
        this.paymentMethod = '';
        this.provider = '';
        this.cardNumber = '';
        this.expiryDate = '';
        this.cvv = '';
        this.cardHolderName = '';
    }
}
