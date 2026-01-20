import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
    selector: 'app-withdraw',
    imports: [FormsModule],
    templateUrl: './withdraw.html',
    styleUrl: './withdraw.scss',
})
export class Withdraw {

    amount: number | null = null;

    // Mock bank account details
    bankDetails = {
        bankName: 'HBL',
        accountTitle: 'Adeel Noshahi',
        accountNumber: '123456'
    };

    constructor(private toastService: ToastService) { }

    submitWithdraw() {
        // Validation
        if (!this.amount || this.amount <= 0) {
            this.toastService.showError('Please enter a valid amount greater than 0');
            return;
        }

        if (this.amount < 50) {
            this.toastService.showError('Minimum withdrawal amount is $50');
            return;
        }

        console.log('Withdrawal submitted:', {
            amount: this.amount,
            bankDetails: this.bankDetails
        });

        this.toastService.showSuccess(`Withdrawal request for $${this.amount} submitted successfully! Processing time: 1-3 business days.`);

        // Reset form
        this.amount = null;
    }
}
