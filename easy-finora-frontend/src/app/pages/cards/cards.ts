import { Component } from '@angular/core';
import { NgFor, NgIf, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
    selector: 'app-cards',
    imports: [NgFor, NgIf, CurrencyPipe, DatePipe, FormsModule],
    templateUrl: './cards.html',
    styleUrl: './cards.scss',
})
export class Cards {

    showModal = false;

    // Modal form fields
    fullName = '';
    contact = '';
    address = '';
    documentFile: File | null = null;

    cardApplications = [
        { id: 'CARD-001', status: 'Approved', type: 'Virtual', cardNumber: '**** **** **** 1234', appliedDate: new Date('2026-01-15'), approvedDate: new Date('2026-01-16') },
        { id: 'CARD-002', status: 'Pending', type: 'Physical', cardNumber: 'Pending', appliedDate: new Date('2026-01-18'), approvedDate: null }
    ];

    activeCards = [
        { cardNumber: '**** **** **** 1234', type: 'Virtual', balance: 5000, expiryDate: '12/28', status: 'Active' },
    ];

    constructor(private toastService: ToastService) { }

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
        this.documentFile = null;
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

        // Check file size (max 5MB)
        if (this.documentFile.size > 5 * 1024 * 1024) {
            this.toastService.showError('File size must be less than 5MB');
            return;
        }

        console.log('Card Application:', {
            fullName: this.fullName,
            contact: this.contact,
            address: this.address,
            document: this.documentFile
        });

        this.toastService.showSuccess('Card application submitted successfully! We will review it shortly.');
        this.closeModal();
    }
}
