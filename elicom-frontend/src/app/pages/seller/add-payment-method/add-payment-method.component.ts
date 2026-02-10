import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-add-payment-method',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './add-payment-method.component.html',
    styleUrls: ['./add-payment-method.component.scss']
})
export class AddPaymentMethodComponent {
    paymentType: string = '';
    accountTitle: string = '';
    accountNumber: string = '';
    bankName: string = '';
    routingNumber: string = '';
    swiftCode: string = '';
    walletId: string = '';

    isSaving: boolean = false;

    savePaymentMethod() {
        if (!this.paymentType) {
            Swal.fire('Error', 'Please select a payment type', 'error');
            return;
        }

        this.isSaving = true;

        // Simulate API call
        setTimeout(() => {
            this.isSaving = false;
            Swal.fire('Success', 'Payment method saved successfully!', 'success');
            // Reset form or navigate away
            this.resetForm();
        }, 1500);
    }

    resetForm() {
        this.paymentType = '';
        this.accountTitle = '';
        this.accountNumber = '';
        this.bankName = '';
        this.routingNumber = '';
        this.swiftCode = '';
        this.walletId = '';
    }
}
