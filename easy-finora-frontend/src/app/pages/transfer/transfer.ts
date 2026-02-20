import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf, DecimalPipe, CommonModule } from '@angular/common';
import { ToastService } from '../../shared/toast/toast.service';
import { WalletService } from '../../services/wallet.service';
import { CardService } from '../../services/card.service';
import { Router } from '@angular/router';
import { OnInit, ChangeDetectorRef } from '@angular/core';

@Component({
    selector: 'app-transfer',
    standalone: true,
    imports: [CommonModule, FormsModule, NgIf, DecimalPipe],
    templateUrl: './transfer.html',
    styleUrl: './transfer.scss',
})
export class Transfer implements OnInit {

    sender = '';
    recipient = '';
    amount: number | null = null;
    description = '';
    senderValid = false;
    recipientValid = false;
    isLoading = false;
    isLoadingCards = false;
    userCards: any[] = [];

    constructor(
        private toastService: ToastService,
        private walletService: WalletService,
        private cardService: CardService,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.loadUserCards();
    }

    loadUserCards() {
        this.isLoadingCards = true;
        this.cardService.getUserCards().subscribe({
            next: (res) => {
                if (Array.isArray(res?.result)) {
                    this.userCards = res.result;
                } else {
                    this.userCards = res?.result?.items ?? [];
                }
                console.log('Transfer: Cards loaded', this.userCards.length);
                this.isLoadingCards = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Transfer: Load cards error:', err);
                this.isLoadingCards = false;
                this.cdr.detectChanges();
            }
        });
    }

    private cleanDigits(val: any): string {
        return String(val || '').replace(/[^0-9]/g, '');
    }

    private matchesMasked(enteredDigits: string, storedWithMasks: string): boolean {
        const storedClean = storedWithMasks.replace(/[^0-9*X]/gi, '');
        if (!enteredDigits || !storedClean || enteredDigits.length !== storedClean.length) {
            return false;
        }

        for (let i = 0; i < storedClean.length; i++) {
            const sChar = storedClean[i].toUpperCase();
            if (sChar !== '*' && sChar !== 'X' && sChar !== enteredDigits[i]) {
                return false;
            }
        }
        return true;
    }

    validateSender() {
        const input = (this.sender || '').trim();
        const enteredDigits = this.cleanDigits(input);

        console.log('Validating Sender Input:', input);
        console.log('Cleaned Digits:', enteredDigits);

        if (!input) {
            this.senderValid = false;
            return;
        }

        // Check if sender is a valid card number or wallet ID from user's cards
        this.senderValid = this.userCards.some(c => {
            const cardNum = String(c.cardNumber || '');
            const cardDigits = this.cleanDigits(cardNum);
            const walletId = String(c.walletId || '').trim();
            const status = String(c.status || '').toLowerCase();

            // Match Logic
            const isCardMatch = cardDigits.length > 0 && (enteredDigits === cardDigits || this.matchesMasked(enteredDigits, cardNum));
            const isWalletMatch = walletId.length > 0 && walletId.toLowerCase() === input.toLowerCase();

            // Approved Status Logic (string or integer)
            const isApproved = status === 'approved' || status === 'active' || status === '1' || status === '2';

            const matchResult = (isCardMatch || isWalletMatch) && isApproved;
            if (isCardMatch || isWalletMatch) {
                console.log(`Checking Card: ${cardNum}, Status: ${status}, Final match: ${matchResult}`);
            }

            return matchResult;
        });

        this.cdr.detectChanges();
    }

    validateRecipient() {
        const val = (this.recipient || '').trim();
        if (!val) {
            this.recipientValid = false;
            return;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        // Allows Card Numbers (16 digits) or Wallet IDs (WLT-...)
        const genericPattern = /^[A-Z0-9\-\s]{8,20}$/i;

        this.recipientValid = emailPattern.test(val) || genericPattern.test(val);
        this.cdr.detectChanges();
    }

    submitTransfer() {
        // Validation
        if (!this.sender) {
            this.toastService.showError('Please enter sender card/wallet information');
            return;
        }

        if (!this.senderValid) {
            this.toastService.showError('Sender must be one of your approved card numbers');
            return;
        }

        if (!this.recipient) {
            this.toastService.showError('Please enter recipient email or card/wallet ID');
            return;
        }

        if (!this.recipientValid) {
            this.toastService.showError('Please enter a valid recipient');
            return;
        }

        if (!this.amount || this.amount <= 0) {
            this.toastService.showError('Please enter a valid amount greater than 0');
            return;
        }

        // Balance Check
        const enteredSenderDigits = this.cleanDigits(this.sender);
        const senderCard = this.userCards.find(c => {
            const cardDigits = this.cleanDigits(c.cardNumber);
            const walletId = String(c.walletId || '').toLowerCase();
            return (cardDigits.length > 0 && (enteredSenderDigits === cardDigits || this.matchesMasked(enteredSenderDigits, String(c.cardNumber || '')))) ||
                (walletId.length > 0 && walletId === this.sender.trim().toLowerCase());
        });

        if (senderCard && senderCard.balance < this.amount) {
            this.toastService.showError('Insufficient balance in the selected sender card');
            return;
        }

        if (!this.description) {
            this.toastService.showError('Please enter a description');
            return;
        }

        this.isLoading = true;

        // Determine recipient type and construct payload
        const rawRecipient = this.recipient.trim();
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const recipientDigits = this.cleanDigits(rawRecipient);

        const isEmail = emailPattern.test(rawRecipient);
        const isNumeric = recipientDigits.length >= 13 && /^\d+$/.test(recipientDigits);

        const input: any = {
            amount: this.amount,
            description: this.description,
            // Use cleaned digits for sender if it's a card number
            senderCardNumber: enteredSenderDigits || this.sender.trim()
        };

        if (isEmail) {
            input.recipientEmail = rawRecipient;
        } else if (isNumeric) {
            // Polymorphic approach: send as card number
            // Experimental: backend might expect 'recipientCardNumber' or 'targetCardNumber'
            input.recipientCardNumber = recipientDigits;
            console.log('Transfer: Using recipientCardNumber for numeric input');
        } else {
            // Treat as Wallet ID
            input.recipientEmail = rawRecipient; // Fallback to email field as it often acts as a general identifier
            input.recipientWalletId = rawRecipient;
            console.log('Transfer: Using recipientWalletId for non-email/non-numeric input');
        }

        console.log('Transfer: Final Payload:', input);

        this.walletService.transfer(input).subscribe({
            next: (res) => {
                console.log('Transfer: Success response:', res);
                this.toastService.showModal(`Transfer of $${this.amount} to ${this.recipient} was successful!`, 'TRANSFER SUCCESSFUL', 'success');
                this.isLoading = false;
                this.router.navigate(['/transactions']);
            },
            error: (err) => {
                console.error('Transfer error:', err);
                const backendMsg = err.error?.error?.message;

                // If it fails with "recipientCardNumber" not found (backend rejected the field), 
                // we might need to fallback or inform the user.
                this.toastService.showError(backendMsg || 'Transfer failed. Check your balance or recipient details.');
                this.isLoading = false;
            }
        });
    }
}
