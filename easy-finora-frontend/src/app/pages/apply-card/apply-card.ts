import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
    selector: 'app-apply-card',
    imports: [FormsModule, NgIf],
    templateUrl: './apply-card.html',
    styleUrl: './apply-card.scss',
})
export class ApplyCard {

    fullName = '';
    contact = '';
    address = '';
    cardType = 'virtual';
    documentFile: File | null = null;

    constructor(private toastService: ToastService) { }

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
            cardType: this.cardType,
            document: this.documentFile
        });

        this.toastService.showSuccess('Card application submitted successfully! We will review it shortly.');

        // Reset form
        this.fullName = '';
        this.contact = '';
        this.address = '';
        this.cardType = 'virtual';
        this.documentFile = null;
    }
}
