import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NgFor, NgIf, CurrencyPipe, DatePipe, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastService } from '../../shared/toast/toast.service';
import { CardService } from '../../services/card.service';
import { Loader } from '../../shared/loader/loader';

@Component({
    selector: 'app-cards',
    standalone: true,
    imports: [NgFor, NgIf, CurrencyPipe, DatePipe, FormsModule, SlicePipe, Loader],
    templateUrl: './cards.html',
    styleUrl: './cards.scss',
})
export class Cards implements OnInit {

    showModal = false;
    isLoading = false;
    totalBalance = 0;

    // Modal form fields
    fullName = '';
    contact = '';
    address = '';
    cardBrand = 'Visa';
    documentFile: File | null = null;

    cardApplications: any[] = [];
    activeCards: any[] = [];

    constructor(
        private toastService: ToastService,
        private cardService: CardService,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.isLoading = true;
        this.cdr.detectChanges();

        // Fetch Balance
        this.cardService.getBalance().subscribe({
            next: (res) => {
                console.log('Cards: Balance Response:', res);
                this.totalBalance = res.result.totalBalance;
                this.cdr.detectChanges();
            },
            error: (err) => console.error('Cards: Balance Error:', err)
        });

        // Fetch Cards
        this.cardService.getUserCards().subscribe({
            next: (res) => {
                console.log('Cards: List Response:', res);
                this.activeCards = res.result.map((c: any) => ({
                    cardNumber: c.cardNumber,
                    type: c.cardType,
                    balance: c.balance,
                    expiryDate: c.expiryDate,
                    status: c.status
                }));
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Cards: List Error:', err);
                this.toastService.showError('Failed to load cards');
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    openModal() {
        this.showModal = true;
    }

    closeModal() {
        this.showModal = false;
        this.resetForm();
    }

    resetForm() {
        this.fullName = '';
        this.contact = '';
        this.address = '';
        this.cardBrand = 'Visa';
        this.documentFile = null;
        this.isLoading = false;
    }

    onFileSelected(event: any) {
        const file = event.target.files[0];
        if (file) {
            this.documentFile = file;
        }
    }

    submitApplication() {
        // Validation
        if (!this.fullName || this.fullName.trim().length < 3) {
            this.toastService.showError('Please enter a valid full name (minimum 3 characters)');
            return;
        }

        if (!this.contact || this.contact.trim().length < 10) {
            this.toastService.showError('Please enter a valid contact number (minimum 10 digits)');
            return;
        }

        if (!this.address || this.address.trim().length < 10) {
            this.toastService.showError('Please enter a valid address (minimum 10 characters)');
            return;
        }

        if (!this.documentFile) {
            this.toastService.showError('Please upload a government issued document');
            return;
        }

        this.isLoading = true;
        this.cdr.detectChanges();

        const payload = { cardType: this.cardBrand };
        console.log('Cards: Submit Payload:', payload);

        this.cardService.createVirtualCard(this.cardBrand).subscribe({
            next: (response) => {
                console.log('Cards: Submit Response:', response);
                this.toastService.showSuccess('Virtual Card generated successfully!');
                this.closeModal();
                this.loadData();
            },
            error: (err) => {
                console.error('Cards: Submit Error:', err);
                this.toastService.showError(err.error?.error?.message || 'Failed to create virtual card');
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }
}
