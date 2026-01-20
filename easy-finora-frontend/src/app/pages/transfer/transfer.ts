import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf, DecimalPipe } from '@angular/common';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
    selector: 'app-transfer',
    imports: [FormsModule, NgIf, DecimalPipe],
    templateUrl: './transfer.html',
    styleUrl: './transfer.scss',
})
export class Transfer {

    recipient = '';
    amount: number | null = null;
    description = '';
    recipientValid = false;
    recipientInfo: { name: string; walletId: string } | null = null;

    constructor(private toastService: ToastService) { }

    validateRecipient() {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const walletPattern = /^[A-Z0-9]{10,}$/;

        this.recipientValid = emailPattern.test(this.recipient) || walletPattern.test(this.recipient);

        // Mock recipient info lookup
        if (this.recipientValid) {
            this.recipientInfo = {
                name: 'John Doe',
                walletId: this.recipient
            };
        } else {
            this.recipientInfo = null;
        }
    }

    submitTransfer() {
        // Validation
        if (!this.recipient) {
            this.toastService.showError('Please enter recipient email or wallet ID');
            return;
        }

        if (!this.recipientValid) {
            this.toastService.showError('Please enter a valid email address or wallet ID');
            return;
        }

        if (!this.amount || this.amount <= 0) {
            this.toastService.showError('Please enter a valid amount greater than 0');
            return;
        }

        if (this.amount < 1) {
            this.toastService.showError('Minimum transfer amount is $1');
            return;
        }

        if (!this.description || this.description.trim().length < 3) {
            this.toastService.showError('Please enter a description (minimum 3 characters)');
            return;
        }

        console.log('Transfer:', {
            recipient: this.recipient,
            amount: this.amount,
            description: this.description
        });

        this.toastService.showSuccess(`Transfer of $${this.amount} initiated successfully!`);

        // Reset form
        this.recipient = '';
        this.amount = null;
        this.description = '';
        this.recipientValid = false;
        this.recipientInfo = null;
    }
}
