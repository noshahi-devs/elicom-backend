import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { Router } from '@angular/router';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
    selector: 'app-auth',
    imports: [FormsModule, NgClass],
    templateUrl: './auth.html',
    styleUrl: './auth.scss',
})
export class Auth {

    isSignUp = false;

    // Login form
    loginEmail = '';
    loginPassword = '';

    // Signup form
    signupName = '';
    signupEmail = '';
    signupPassword = '';
    signupConfirmPassword = '';

    constructor(
        private router: Router,
        private toastService: ToastService
    ) { }

    toggleMode() {
        this.isSignUp = !this.isSignUp;
    }

    login() {
        // Validation
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!this.loginEmail || !emailPattern.test(this.loginEmail)) {
            this.toastService.showError('Please enter a valid email address');
            return;
        }

        if (!this.loginPassword || this.loginPassword.length < 6) {
            this.toastService.showError('Password must be at least 6 characters');
            return;
        }

        console.log('Login:', { email: this.loginEmail, password: this.loginPassword });

        this.toastService.showSuccess('Login successful! Welcome back.');

        // Mock login - redirect to dashboard
        setTimeout(() => {
            this.router.navigate(['/dashboard']);
        }, 1000);
    }

    signup() {
        // Validation
        if (!this.signupName || this.signupName.trim().length < 3) {
            this.toastService.showError('Please enter your full name (minimum 3 characters)');
            return;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!this.signupEmail || !emailPattern.test(this.signupEmail)) {
            this.toastService.showError('Please enter a valid email address');
            return;
        }

        if (!this.signupPassword || this.signupPassword.length < 6) {
            this.toastService.showError('Password must be at least 6 characters');
            return;
        }

        if (this.signupPassword !== this.signupConfirmPassword) {
            this.toastService.showError('Passwords do not match!');
            return;
        }

        console.log('Signup:', { name: this.signupName, email: this.signupEmail, password: this.signupPassword });

        this.toastService.showSuccess('Account created successfully! Welcome to Easy Finora.');

        // Mock signup - redirect to dashboard
        setTimeout(() => {
            this.router.navigate(['/dashboard']);
        }, 1000);
    }
}
