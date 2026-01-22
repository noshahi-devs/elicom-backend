import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor, CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { ToastService } from '../../shared/toast/toast.service';
import { WithdrawService } from '../../services/withdraw.service';
import { CardService } from '../../services/card.service';

@Component({
    selector: 'app-withdraw',
    imports: [FormsModule, NgIf, NgFor, CurrencyPipe],
    templateUrl: './withdraw.html',
    styleUrl: './withdraw.scss',
})
export class Withdraw implements OnInit {

    amount: number | null = null;
    userCards: any[] = [];
    selectedSourceCardId: number | null = null;
    isLoading = false;

    // Editable bank account details
    bankDetails = {
        bankName: '',
        accountTitle: '',
        accountNumber: '',
        iban: ''
    };

    constructor(
        private toastService: ToastService,
        private withdrawService: WithdrawService,
        private cardService: CardService,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.loadCards();
    }

    loadCards() {
        this.cardService.getUserCards().subscribe({
            next: (res) => {
                console.log('Withdraw: Cards Response:', res);
                this.userCards = res.result;
                if (this.userCards.length > 0) {
                    this.selectedSourceCardId = this.userCards[0].cardId;
                }
                this.cdr.detectChanges();
            },
            error: (err) => console.error('Withdraw: Cards Error:', err)
        });
    }

    submitWithdraw() {
        // Validation
        if (!this.amount || this.amount <= 0) {
            this.toastService.showError('Please enter a valid amount greater than 0');
            return;
        }

        if (this.amount < 10) {
            this.toastService.showError('Minimum withdrawal amount is $10');
            return;
        }

        if (!this.selectedSourceCardId) {
            this.toastService.showError('Please select a card to withdraw from');
            return;
        }

        if (!this.bankDetails.bankName || !this.bankDetails.accountNumber) {
            this.toastService.showError('Please provide bank name and account number');
            return;
        }

        this.isLoading = true;
        this.cdr.detectChanges();

        const paymentDetails = `Bank: ${this.bankDetails.bankName}, Title: ${this.bankDetails.accountTitle}, Acc: ${this.bankDetails.accountNumber}, IBAN: ${this.bankDetails.iban}`;

        const input = {
            cardId: this.selectedSourceCardId,
            amount: this.amount,
            method: 'Bank Transfer',
            paymentDetails: paymentDetails
        };

        console.log('Withdraw: Submit Payload:', input);

        this.withdrawService.submitWithdrawRequest(input).subscribe({
            next: (res) => {
                console.log('Withdraw: Submit Response:', res);
                this.toastService.showSuccess(`Withdrawal request for $${this.amount} submitted successfully!`);
                this.resetForm();
                this.router.navigate(['/transactions']);
            },
            error: (err) => {
                console.error('Withdraw: Submit Error:', err);
                this.toastService.showError(err.error?.error?.message || 'Failed to submit withdrawal request');
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    resetForm() {
        this.amount = null;
        this.bankDetails = {
            bankName: '',
            accountTitle: '',
            accountNumber: '',
            iban: ''
        };
        this.isLoading = false;
    }
}
