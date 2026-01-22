import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor, CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { ToastService } from '../../shared/toast/toast.service';
import { DepositService } from '../../services/deposit.service';
import { CardService } from '../../services/card.service';

interface BankAccount {
    id: number;
    country: string;
    currency: string;
    accountNumber: string;
    flag: string;
    region: string;
    accountHolder: string;
    bankName: string;
    branchName: string;
    iban: string;
    routingNumber?: string;
    sortCode?: string;
    ifscCode?: string;
    bankAddress: string;
    receiverNumber: string;
    lastPaymentDate?: string;
}

@Component({
    selector: 'app-deposit',
    imports: [FormsModule, NgIf, NgFor, CurrencyPipe],
    templateUrl: './deposit.html',
    styleUrl: './deposit.scss',
})
export class Deposit implements OnInit {

    // Main flow state
    depositMethod: 'p2p' | 'cards' | null = null;
    amount: number | null = null;
    userCards: any[] = [];
    selectedTargetCardId: number | null = null;
    isLoading = false;

    // P2P flow (existing)
    currentStep = 1;

    constructor(
        private toastService: ToastService,
        private depositService: DepositService,
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
                console.log('Deposit: Cards Response:', res);
                this.userCards = res.result;
                if (this.userCards.length > 0) {
                    this.selectedTargetCardId = this.userCards[0].cardId;
                }
                this.cdr.detectChanges();
            },
            error: (err) => console.error('Deposit: Cards Error:', err)
        });
    }
    selectedAccount: BankAccount | null = null;
    paymentConfirmed = false;
    proofFile: File | null = null;

    // Cards & Other Methods
    showPaymentCards = false;
    selectedCard: string | null = null;
    showCardModal = false;

    // Card form data
    cardDetails = {
        holderName: '',
        cardNumber: '',
        expiryMonth: '',
        expiryYear: '',
        cvv: ''
    };

    // Crypto form data
    cryptoProofFile: File | null = null;

    paymentMethods = [
        { value: 'p2p', label: 'P2P Payments', icon: '🏦' },
        { value: 'cards', label: 'Cards & Other Methods', icon: '💳' }
    ];

    paymentCards = [
        { id: 'mastercard', name: 'MasterCard', gradient: 'linear-gradient(135deg, #f79e1b, #eb001b)', functional: false },
        { id: 'discover', name: 'Discover', gradient: 'linear-gradient(135deg, #ff6000, #ff9900)', functional: false },
        { id: 'bank', name: 'Bank Transfer', gradient: 'linear-gradient(135deg, #667eea, #764ba2)', functional: false },
        { id: 'crypto', name: 'Crypto via Binance', gradient: 'linear-gradient(135deg, #f7931a, #f2a900)', functional: true },
        { id: 'gpay', name: 'Google Pay', gradient: 'linear-gradient(135deg, #4285f4, #34a853)', functional: false },
        { id: 'amex', name: 'American Express', gradient: 'linear-gradient(135deg, #006fcf, #00a3e0)', functional: false }
    ];

    cryptoWalletAddress = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';

    bankAccounts: BankAccount[] = [
        // North American
        {
            id: 1,
            country: 'United States',
            currency: 'USD',
            accountNumber: 'XX-7750',
            flag: 'https://easyfinora.com/flags/usa.png',
            region: 'North American',
            accountHolder: 'Henry Thomas',
            bankName: 'JPMorgan Chase Bank',
            branchName: 'New York Branch',
            iban: 'US11650926969232757750',
            routingNumber: '021000021',
            bankAddress: 'JPMorgan Chase Bank, 270 Park Avenue, New York, NY 10017, USA',
            receiverNumber: '212 571 1298'
        },
        {
            id: 2,
            country: 'Canada',
            currency: 'CAD',
            accountNumber: 'XX-0072',
            flag: 'https://easyfinora.com/flags/ca.png',
            region: 'North American',
            accountHolder: 'Leo Andrew',
            bankName: 'Royal Bank of Canada (RBC)',
            branchName: 'Cal-Dealer Loans-c/o Village Sq',
            iban: 'CA71000673034017030072',
            routingNumber: '000304390',
            bankAddress: '2640 52nd St NE-Unit 100, 1499 West Broadway St, Calgary, Canada',
            receiverNumber: '403 962 3015'
        },
        // European
        {
            id: 3,
            country: 'United Kingdom',
            currency: 'GBP',
            accountNumber: 'XX-9243',
            flag: 'https://easyfinora.com/flags/uk.png',
            region: 'European',
            accountHolder: 'Jack Robert',
            bankName: 'Barclays Bank',
            branchName: 'Manchester Branch',
            iban: 'GB29BARC09911172169243',
            sortCode: '231782',
            bankAddress: 'Barclays Bank, 1 Churchill Place, London, E14 5HP, United Kingdom',
            receiverNumber: '7868 740942'
        },
        {
            id: 4,
            country: 'France',
            currency: 'EUR',
            accountNumber: 'XX-3787',
            flag: 'https://easyfinora.com/flags/fr.png',
            region: 'European',
            accountHolder: 'Jean Dupont',
            bankName: 'BNP Paribas',
            branchName: 'Paris Branch',
            iban: 'FR1425381180755384571493787',
            sortCode: '231782',
            bankAddress: 'BNP Paribas, 16 Boulevard des Italiens, 75009 Paris, France',
            receiverNumber: '0635 342887'
        },
        {
            id: 5,
            country: 'Germany',
            currency: 'EUR',
            accountNumber: 'XX-3900',
            flag: 'https://easyfinora.com/flags/gr.png',
            region: 'European',
            accountHolder: 'Hans Müller',
            bankName: 'Deutsche Bank',
            branchName: 'Frankfurt Branch',
            iban: 'DE89370490660532013900',
            sortCode: '405081',
            bankAddress: 'Deutsche Bank, Frankfurt Branch, Frankfurt am Main, Germany',
            receiverNumber: '0170 3097225'
        },
        // UAE
        {
            id: 6,
            country: 'Dubai',
            currency: 'AED',
            accountNumber: 'XX-9829',
            flag: 'https://easyfinora.com/flags/uae.png',
            region: 'UAE',
            accountHolder: 'Ahmed Al-Mansoori',
            bankName: 'Emirates NBD',
            branchName: 'Downtown Branch',
            iban: 'AE0740078100749737735349',
            bankAddress: 'Emirates NBD, Downtown Branch, Dubai, UAE',
            receiverNumber: '050 475 9256'
        },
        // Asian
        {
            id: 7,
            country: 'Saudi Arabia',
            currency: 'SAR',
            accountNumber: 'XX-5263',
            flag: 'https://easyfinora.com/flags/sd.png',
            region: 'Asian',
            accountHolder: 'Khalid Al-Farsi',
            bankName: 'National Commercial Bank (NCB)',
            branchName: 'Riyadh Branch',
            iban: 'SA1228366922701637327415263',
            sortCode: '231782',
            bankAddress: 'National Commercial Bank, Riyadh Branch, Riyadh, Saudi Arabia',
            receiverNumber: '055 293 3491'
        },
        {
            id: 8,
            country: 'Turkey',
            currency: 'TRY',
            accountNumber: 'XX-2045',
            flag: 'https://easyfinora.com/flags/tr.png',
            region: 'Asian',
            accountHolder: 'Ahmet Yılmaz',
            bankName: 'Garanti BBVA',
            branchName: 'Kadıköy Branch',
            iban: 'TR125828978225023362142045',
            sortCode: '231782',
            bankAddress: 'Garanti BBVA, Kadıköy Branch, Istanbul, Turkey',
            receiverNumber: '0532 295 42802'
        },
        {
            id: 9,
            country: 'Pakistan',
            currency: 'PKR',
            accountNumber: 'XX-0011',
            flag: 'https://easyfinora.com/flags/pk.png',
            region: 'Asian',
            accountHolder: 'SHAN ALI',
            bankName: 'Allied Bank Limited',
            branchName: 'Allama Iqbal Town Branch, Lahore',
            iban: 'PK72ABPA0010140687020011',
            bankAddress: 'G78V+RC6, Gulshan Block Allama Iqbal Town, Lahore, Punjab, Pakistan',
            receiverNumber: '212 571 1298'
        },
        {
            id: 10,
            country: 'India',
            currency: 'INR',
            accountNumber: 'XX-0239',
            flag: 'https://easyfinora.com/flags/in.png',
            region: 'Asian',
            accountHolder: 'Ramesh Gupta',
            bankName: 'State Bank of India (SBI)',
            branchName: 'Connaught Place Branch',
            iban: 'GB29BARC09911172169243',
            ifscCode: 'SBIN0083102',
            bankAddress: 'State Bank of India, Connaught Place Branch, New Delhi - 110001, India',
            receiverNumber: '9820 972 006'
        },
        {
            id: 11,
            country: 'Bangladesh',
            currency: 'BDT',
            accountNumber: 'XX-4090',
            flag: 'https://easyfinora.com/flags/bd.png',
            region: 'Asian',
            accountHolder: 'Nasiruddin Ahmed',
            bankName: 'Dutch-Bangla Bank Limited',
            branchName: 'Gulshan Branch, Code 1101',
            iban: 'BD12DBBL33809218174090',
            bankAddress: 'Dutch-Bangla Bank Limited, Gulshan Branch, Dhaka 1212, Bangladesh',
            receiverNumber: '018 589 04367'
        },
        {
            id: 12,
            country: 'Sri Lanka',
            currency: 'LKR',
            accountNumber: 'XX-2104',
            flag: 'https://easyfinora.com/flags/sri.webp',
            region: 'Asian',
            accountHolder: 'Mahesh De Silva',
            bankName: 'Commercial Bank of Ceylon',
            branchName: 'Colombo 11 Branch',
            iban: 'LK12934828199576034267352104',
            bankAddress: 'COLOMBO GOLD CENTRE COMPLEX, NO 180/27, N H M ABDUL CADER ROAD, COLOMBO 11, Sri Lanka',
            receiverNumber: '041 228 3145'
        }
    ];


    get regions() {
        return [...new Set(this.bankAccounts.map(acc => acc.region))];
    }

    getAccountsByRegion(region: string) {
        return this.bankAccounts.filter(acc => acc.region === region);
    }

    selectAccount(account: BankAccount) {
        this.selectedAccount = account;
        this.currentStep = 2;
    }

    onFileSelected(event: any) {
        const file = event.target.files[0];
        if (file) {
            this.proofFile = file;
        }
    }

    goToStep(step: number) {
        if (step < this.currentStep) {
            this.currentStep = step;
        }
    }

    proceedToProof() {
        // Validation for step 2
        if (!this.paymentConfirmed) {
            this.toastService.showError('Please confirm that you have sent the payment');
            return;
        }

        if (!this.amount || this.amount <= 0) {
            this.toastService.showError('Please enter a valid amount greater than 0');
            return;
        }

        if (this.amount < 10) {
            this.toastService.showError('Minimum deposit amount is $10');
            return;
        }

        this.currentStep = 3;
    }

    submitDeposit() {
        // Validation for step 3
        if (!this.proofFile) {
            this.toastService.showError('Please upload proof of payment');
            return;
        }

        if (!this.selectedTargetCardId) {
            this.toastService.showError('Please select a target card for the deposit');
            return;
        }

        this.isLoading = true;
        this.cdr.detectChanges();

        const input = {
            cardId: this.selectedTargetCardId,
            amount: this.amount,
            country: this.selectedAccount?.country || 'Unknown',
            method: 'P2P',
            proofImage: this.proofFile.name // In a real app we'd upload this and get a URL/ID
        };

        console.log('Deposit: Submit Payload (P2P):', input);

        this.depositService.submitDepositRequest(input).subscribe({
            next: (res) => {
                console.log('Deposit: Submit Response (P2P):', res);
                this.toastService.showSuccess(`P2P Deposit request for $${this.amount} submitted successfully!`);
                this.resetForm();
                this.router.navigate(['/transactions']);
            },
            error: (err) => {
                console.error('Deposit: Submit Error (P2P):', err);
                this.toastService.showError(err.error?.error?.message || 'Failed to submit deposit request');
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    resetForm() {
        this.currentStep = 1;
        this.selectedAccount = null;
        this.paymentConfirmed = false;
        this.amount = null;
        this.proofFile = null;
        this.isLoading = false;
        this.depositMethod = null;
        this.showPaymentCards = false;
        this.selectedCard = null;
        this.cryptoProofFile = null;
    }

    // New methods for enhanced flow
    onMethodChange() {
        if (this.depositMethod === 'cards') {
            this.showPaymentCards = true;
        } else {
            this.showPaymentCards = false;
            this.selectedCard = null;
        }
    }

    validateAmount(): boolean {
        if (!this.amount || this.amount <= 0) {
            this.toastService.showError('Please enter a valid amount');
            return false;
        }
        if (this.amount < 10) {
            this.toastService.showError('Minimum deposit amount is $10');
            return false;
        }
        return true;
    }

    proceedWithP2P() {
        if (!this.validateAmount()) return;
        // Show existing P2P flow (bank selection)
        this.currentStep = 1;
    }

    selectPaymentCard(cardId: string) {
        if (!this.validateAmount()) return;

        this.selectedCard = cardId;
        this.showCardModal = true;
    }

    closeModal() {
        this.showCardModal = false;
        this.selectedCard = null;
        // Clear form data
        this.cardDetails = {
            holderName: '',
            cardNumber: '',
            expiryMonth: '',
            expiryYear: '',
            cvv: ''
        };
    }

    submitCardPayment() {
        const card = this.paymentCards.find(c => c.id === this.selectedCard);

        if (card?.functional) {
            // Handle Crypto
            if (this.selectedCard === 'crypto') {
                this.submitCryptoDeposit();
            }
        } else {
            // Show unavailable message
            this.toastService.showError('This payment method is currently unavailable. Please use P2P Payments or Crypto via Binance.');
            this.closeModal();
        }
    }

    submitCryptoDeposit() {
        if (!this.cryptoProofFile) {
            this.toastService.showError('Please upload transaction proof');
            return;
        }

        if (!this.selectedTargetCardId) {
            this.toastService.showError('Please select a target card for the deposit');
            return;
        }

        this.isLoading = true;
        this.cdr.detectChanges();

        const input = {
            cardId: this.selectedTargetCardId,
            amount: this.amount,
            country: 'Crypto',
            method: 'Crypto',
            proofImage: this.cryptoProofFile.name
        };

        console.log('Deposit: Submit Payload (Crypto):', input);

        this.depositService.submitDepositRequest(input).subscribe({
            next: (res) => {
                console.log('Deposit: Submit Response (Crypto):', res);
                this.toastService.showSuccess(`Crypto deposit request for $${this.amount} submitted successfully!`);
                this.closeModal();
                this.resetForm();
                this.router.navigate(['/transactions']);
            },
            error: (err) => {
                console.error('Deposit: Submit Error (Crypto):', err);
                this.toastService.showError(err.error?.error?.message || 'Failed to submit crypto deposit request');
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    onCryptoFileSelected(event: any) {
        const file = event.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                this.toastService.showError('File size must be less than 5MB');
                return;
            }
            this.cryptoProofFile = file;
        }
    }

    copyWalletAddress() {
        navigator.clipboard.writeText(this.cryptoWalletAddress);
        this.toastService.showSuccess('Wallet address copied to clipboard!');
    }

    formatCardNumber() {
        // Format card number with spaces
        let value = this.cardDetails.cardNumber.replace(/\s/g, '');
        let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
        this.cardDetails.cardNumber = formattedValue.substring(0, 19); // Max 16 digits + 3 spaces
    }

    get selectedCardName(): string {
        const card = this.paymentCards.find(c => c.id === this.selectedCard);
        return card?.name || '';
    }
}
