import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf, DecimalPipe, CommonModule } from '@angular/common';
import { ToastService } from '../../shared/toast/toast.service';
import { WalletService } from '../../services/wallet.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-transfer',
    standalone: true,
    imports: [CommonModule, FormsModule, NgIf, DecimalPipe],
    templateUrl: './transfer.html',
    styleUrl: './transfer.scss',
})
export class Transfer {

    recipient = '';
    amount: number | null = null;
    description = '';
    recipientValid = false;
    isLoading = false;

    constructor(
        private toastService: ToastService,
        private walletService: WalletService,
        private router: Router
    ) { }

    validateRecipient() {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        this.recipientValid = emailPattern.test(this.recipient);
    }

    submitTransfer() {
        // Validation
        if (!this.recipient) {
            this.toastService.showError('Please enter recipient email');
            return;
        }

        if (!this.recipientValid) {
            this.toastService.showError('Please enter a valid email address');
            return;
        }

        if (!this.amount || this.amount <= 0) {
            this.toastService.showError('Please enter a valid amount greater than 0');
            return;
        }

        if (!this.description) {
            this.toastService.showError('Please enter a description');
            return;
        }

        this.isLoading = true;
        const input = {
            recipientEmail: this.recipient,
            amount: this.amount,
            description: this.description
        };

        this.walletService.transfer(input).subscribe({
            next: () => {
                this.toastService.showSuccess(`Transfer of $${this.amount} to ${this.recipient} successful!`);
                this.isLoading = false;
                this.router.navigate(['/transactions']);
            },
            error: (err) => {
                console.error('Transfer error:', err);
                this.toastService.showError(err.error?.error?.message || 'Transfer failed. Check your balance or recipient email.');
                this.isLoading = false;
            }
        });
    }
}
