import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass, NgIf, NgFor } from '@angular/common';
import { Router } from '@angular/router';
import { ToastService } from '../../shared/toast/toast.service';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-auth',
    imports: [FormsModule, NgClass, NgIf, NgFor],
    templateUrl: './auth.html',
    styleUrl: './auth.scss',
})
export class Auth {

    isSignUp = false;
    isForgotPassword = false; // Added

    // Login form
    loginEmail = '';
    loginPassword = '';
    loginPasswordType = 'password';

    // Signup form
    signupName = '';
    signupEmail = '';
    signupPhone = '';
    signupCountry = '';
    signupPassword = '';
    signupConfirmPassword = '';
    signupPasswordType = 'password';

    isLoading = false;
    rememberMe = false;
    acceptTerms = false;

    // Forgot Password
    resetEmail = '';

    isPendingVerification = false;

    constructor(
        private router: Router,
        private toastService: ToastService,
        private authService: AuthService
    ) { }

    sendSampleEmail() {
        this.isLoading = true;
        this.authService.sendSampleEmail().subscribe({
            next: () => {
                this.isLoading = false;
                this.toastService.showSuccess('Sample email triggered. Check inbox (and backend logs).');
            },
            error: (err: any) => {
                this.isLoading = false;
                this.toastService.showError(err.error?.error?.message || 'Failed to send sample email');
            }
        });
    }

    toggleMode() {
        this.isSignUp = !this.isSignUp;
        this.isForgotPassword = false; // Ensure forgot password is off when toggling mode
    }

    toggleForgot() { // Added
        this.isForgotPassword = !this.isForgotPassword;
        this.isSignUp = false; // Ensure signup is off when toggling forgot password
    }

    // New logic used in HTML template directly, but keeping it here if needed or for other toggles
    togglePasswordVisibility(field: string) {
        // Logic handled in template via [type] binding for simpler change
    }

    getPasswordStrengthClass(): string {
        const length = this.signupPassword ? this.signupPassword.length : 0;
        if (length === 0) return '';
        if (length < 6) return 'weak';
        if (length < 8) return 'fair';
        if (length < 10) return 'good';
        return 'strong';
    }

    getPasswordStrengthText(): string {
        const strength = this.getPasswordStrengthClass();
        if (!strength) return '';
        switch (strength) {
            case 'weak': return 'Weak';
            case 'fair': return 'Fair';
            case 'good': return 'Good';
            case 'strong': return 'Strong';
            default: return '';
        }
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

        this.isLoading = true;

        this.authService.login({
            userNameOrEmailAddress: this.loginEmail,
            password: this.loginPassword,
            rememberClient: this.rememberMe
        }).subscribe({
            next: (res: any) => {
                this.isLoading = false;
                localStorage.setItem('token', res.result.accessToken);
                this.toastService.showSuccess('Login successful! Welcome back.');
                this.router.navigate(['/dashboard']);
            },
            error: (err: any) => {
                this.isLoading = false;
                if (err.error?.error?.details?.includes('EmailConfirmation')) {
                    this.isPendingVerification = true;
                    this.toastService.showError('Your email is not verified yet.');
                } else {
                    this.toastService.showError(err.error?.error?.message || 'Login failed. Please check your credentials.');
                }
            }
        });
    }

    // Country Dropdown Logic
    isCountryDropdownOpen = false;
    countries = [
        { name: 'United States', code: 'us', flag: 'https://flagcdn.com/w40/us.png' },
        { name: 'United Kingdom', code: 'gb', flag: 'https://flagcdn.com/w40/gb.png' },
        { name: 'Canada', code: 'ca', flag: 'https://flagcdn.com/w40/ca.png' },
        { name: 'Australia', code: 'au', flag: 'https://flagcdn.com/w40/au.png' },
        { name: 'Germany', code: 'de', flag: 'https://flagcdn.com/w40/de.png' },
        { name: 'France', code: 'fr', flag: 'https://flagcdn.com/w40/fr.png' },
        { name: 'Japan', code: 'jp', flag: 'https://flagcdn.com/w40/jp.png' },
        { name: 'China', code: 'cn', flag: 'https://flagcdn.com/w40/cn.png' },
        { name: 'Brazil', code: 'br', flag: 'https://flagcdn.com/w40/br.png' },
        { name: 'UAE', code: 'ae', flag: 'https://flagcdn.com/w40/ae.png' },
        { name: 'Saudi Arabia', code: 'sa', flag: 'https://flagcdn.com/w40/sa.png' },
        { name: 'Pakistan', code: 'pk', flag: 'https://flagcdn.com/w40/pk.png' },
        { name: 'India', code: 'in', flag: 'https://flagcdn.com/w40/in.png' },
        { name: 'Russia', code: 'ru', flag: 'https://flagcdn.com/w40/ru.png' },
        { name: 'Turkey', code: 'tr', flag: 'https://flagcdn.com/w40/tr.png' },
        { name: 'Other', code: 'un', flag: 'https://flagcdn.com/w40/un.png' } // UN flag for other
    ];

    selectedCountryData: any = null; // Store selected object

    toggleCountryDropdown() {
        this.isCountryDropdownOpen = !this.isCountryDropdownOpen;
    }

    selectCountry(country: any) {
        this.signupCountry = country.name;
        this.selectedCountryData = country;
        this.isCountryDropdownOpen = false;
    }

    signup() {
        console.log('Signup process started');
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

        if (!this.signupPhone) {
            this.toastService.showError('Please enter your phone number');
            return;
        }

        if (!this.signupCountry) {
            this.toastService.showError('Please select your country');
            return;
        }

        if (!this.signupPassword || this.signupPassword.length < 8) {
            this.toastService.showError('Password must be at least 8 characters');
            return;
        }

        if (this.signupPassword !== this.signupConfirmPassword) {
            this.toastService.showError('Passwords do not match!');
            return;
        }

        if (!this.acceptTerms) {
            this.toastService.showError('You must accept the terms and conditions');
            return;
        }

        this.isLoading = true;

        const registerInput = {
            emailAddress: this.signupEmail,
            password: this.signupPassword,
            phoneNumber: this.signupPhone,
            country: this.signupCountry
        };

        console.log('Calling authService.register with:', registerInput);

        this.authService.register(registerInput).subscribe({
            next: (res: any) => {
                console.log('Signup success response:', res);
                this.isLoading = false;
                if (res.result.canLogin) {
                    this.toastService.showSuccess('Account created successfully!');
                    this.isSignUp = false;
                } else {
                    this.isPendingVerification = true;
                    this.toastService.showSuccess('Account created! Please check your email to verify your account.');
                }
            },
            error: (err: any) => {
                console.error('Signup error:', err);
                this.isLoading = false;
                this.toastService.showError(err.error?.error?.message || 'Registration failed. Please try again.');
            }
        });
    }
    sendResetLink() {
        if (!this.resetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.resetEmail)) {
            this.toastService.showError('Please enter a valid email address');
            return;
        }

        this.isLoading = true;
        setTimeout(() => {
            this.isLoading = false;
            this.toastService.showSuccess('Reset link sent to ' + this.resetEmail);
            this.toggleForgot(); // Go back to login
        }, 1500);
    }
}
