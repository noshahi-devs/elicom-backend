import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor, CurrencyPipe, CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ToastService } from '../../shared/toast/toast.service';
import { WithdrawService } from '../../services/withdraw.service';
import { CardService } from '../../services/card.service';

@Component({
    selector: 'app-withdraw',
    imports: [FormsModule, CommonModule],
    templateUrl: './withdraw.html',
    styleUrl: './withdraw.scss',
})
export class Withdraw implements OnInit {

    amount: number | null = null;
    userCards: any[] = [];
    selectedSourceCardId: number | null = null;
    isLoading = false;
    exchangeRates: any = {};

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
        this.fetchExchangeRates();
    }

    fetchExchangeRates() {
        fetch('https://open.er-api.com/v6/latest/USD')
            .then(res => res.json())
            .then(data => {
                this.exchangeRates = data.rates;
                this.cdr.detectChanges();
            })
            .catch(err => console.error('Withdraw: Fetch Rates Error:', err));
    }

    loadCards() {
        this.isLoading = true;
        this.cdr.detectChanges();

        this.cardService.getUserCards().subscribe({
            next: (res) => {
                // Handle both direct array and paged response structures
                if (Array.isArray(res?.result)) {
                    this.userCards = res.result;
                } else {
                    this.userCards = res?.result?.items ?? [];
                }

                if (this.userCards.length > 0) {
                    this.selectedSourceCardId = this.userCards[0].cardId;
                }

                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Withdraw: Cards Error:', err);
                this.isLoading = false;
                this.cdr.detectChanges();
            }
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
            paymentDetails: paymentDetails,
            localAmount: this.calculateLocalAmount(),
            localCurrency: 'PKR' // Defaulting to PKR for user's request context
        };

        console.log('Withdraw: Submit Payload:', input);

        this.withdrawService.submitWithdrawRequest(input).subscribe({
            next: (res) => {
                console.log('Withdraw: Submit Response:', res);
                this.toastService.showModal(`Your withdrawal request for $${this.amount} has been submitted successfully. Our team will process it shortly.`, 'WITHDRAWAL SUBMITTED', 'success');
                this.resetForm();
                this.router.navigate(['/withdraw-history']);
            },
            error: (err) => {
                console.error('Withdraw: Submit Error:', err);
                this.toastService.showError(err.error?.error?.message || 'Failed to submit withdrawal request');
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    calculateLocalAmount(): number {
        const rate = this.exchangeRates['PKR'] || 280; // Fallback to 280 if fetch fails
        return Math.round((this.amount || 0) * rate);
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
