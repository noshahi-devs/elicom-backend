import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
    selector: 'app-contact',
    imports: [FormsModule],
    templateUrl: './contact.html',
    styleUrl: './contact.scss',
})
export class Contact {

    name = '';
    email = '';
    subject = '';
    message = '';

    constructor(private toastService: ToastService) { }

    submitContact() {
        // Validation
        if (!this.name || this.name.trim().length < 3) {
            this.toastService.showError('Please enter your name (minimum 3 characters)');
            return;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!this.email || !emailPattern.test(this.email)) {
            this.toastService.showError('Please enter a valid email address');
            return;
        }

        if (!this.subject || this.subject.trim().length < 5) {
            this.toastService.showError('Please enter a subject (minimum 5 characters)');
            return;
        }

        if (!this.message || this.message.trim().length < 10) {
            this.toastService.showError('Please enter a message (minimum 10 characters)');
            return;
        }

        console.log('Contact form:', {
            name: this.name,
            email: this.email,
            subject: this.subject,
            message: this.message
        });

        this.toastService.showSuccess('Message sent successfully! We will get back to you soon.');

        // Reset form
        this.name = '';
        this.email = '';
        this.subject = '';
        this.message = '';
    }
}
