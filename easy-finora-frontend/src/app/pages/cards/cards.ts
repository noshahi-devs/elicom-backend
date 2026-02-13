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

                this.totalBalance = res.result.totalBalance;
                this.cdr.detectChanges();
            },
            error: (err) => console.error('Cards: Balance Error:', err)
        });

        // Fetch Applications
        this.cardService.getMyApplications().subscribe({
            next: (res) => {

                this.cardApplications = res.result;
                this.cdr.detectChanges();
            },
            error: (err) => console.error('Cards: Applications Error:', err)
        });

        // Fetch Cards
        this.cardService.getUserCards().subscribe({
            next: (res) => {

                this.activeCards = res.result.map((c: any) => ({
                    id: c.cardId,
                    cardNumber: c.cardNumber,
                    type: c.cardType,
                    balance: c.balance,
                    expiryDate: c.expiryDate,
                    status: c.status,
                    holderName: c.holderName || 'Card Holder',
                    showDetails: false,
                    cvv: '***',
                    isRevealing: false
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

    revealDetails(card: any) {
        if (card.showDetails) {
            card.showDetails = false;
            // Optionally revert to masked, but let's keep it simple for now
            return;
        }

        card.isRevealing = true;
        this.cardService.getCardSensitiveDetails(card.id).subscribe({
            next: (res) => {
                card.cardNumber = res.result.cardNumber;
                card.cvv = res.result.cvv;
                card.showDetails = true;
                card.isRevealing = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.toastService.showError('Authentication required to reveal details');
                card.isRevealing = false;
                this.cdr.detectChanges();
            }
        });
    }

    copyToClipboard(text: string, label: string) {
        navigator.clipboard.writeText(text).then(() => {
            this.toastService.showInfo(`${label} copied to clipboard`);
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
            // Validate file type
            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
            if (!allowedTypes.includes(file.type)) {
                this.toastService.showError('Only PDF, JPG, JPEG, and PNG files are allowed');
                event.target.value = '';
                return;
            }

            // Validate file size (5MB max)
            if (file.size > 5 * 1024 * 1024) {
                this.toastService.showError('File size must be less than 5MB');
                event.target.value = '';
                return;
            }

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

        // Convert file to Base64
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1]; // Remove data:image/png;base64, prefix
            const fileExtension = this.documentFile!.name.split('.').pop()?.toLowerCase() || 'pdf';

            const payload = {
                fullName: this.fullName.trim(),
                contactNumber: this.contact.trim(),
                address: this.address.trim(),
                cardType: this.cardBrand,
                documentBase64: base64,
                documentType: fileExtension
            };



            this.cardService.submitCardApplication(payload).subscribe({
                next: (response) => {
                    this.toastService.showModal('Your card application has been submitted successfully! Approval typically takes 5-8 hours.', 'APPLICATION SUBMITTED', 'success');
                    this.closeModal();
                    this.loadData();
                    this.cdr.detectChanges(); // Force detection for global toast trigger
                },
                error: (err) => {
                    console.error('Cards: Submit Error:', err);
                    this.toastService.showError(err.error?.error?.message || 'Failed to submit application');
                    this.isLoading = false;
                    this.cdr.detectChanges();
                }
            });
        };

        reader.onerror = () => {
            this.toastService.showError('Failed to read file');
            this.isLoading = false;
            this.cdr.detectChanges();
        };

        reader.readAsDataURL(this.documentFile);
    }
}
