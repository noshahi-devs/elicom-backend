import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor } from '@angular/common';
import { Router } from '@angular/router';
import { ToastService } from '../../shared/toast/toast.service';
import { AuthService } from '../../services/auth.service';
import { GlobalStateService } from '../../services/global-state.service'; // Import

@Component({
    selector: 'app-auth',
    imports: [FormsModule, NgIf, NgFor],
    templateUrl: './auth.html',
    styleUrl: './auth.scss',
})
export class Auth implements OnInit {

    // ... (existing properties)
    isSignUp = false;
    isForgotPassword = false;

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
        private authService: AuthService,
        private cdr: ChangeDetectorRef,
        private globalState: GlobalStateService // Inject
    ) { }

    ngOnInit() {
        // If already logged in, redirect based on role
        if (localStorage.getItem('authToken')) {
            this.redirectUser();
        }
    }

    redirectUser() {
        // Check GlobalState for admin role
        if (this.globalState.isAdmin()) {
            this.router.navigate(['/admin-dashboard'], { replaceUrl: true });
        } else {
            this.router.navigate(['/dashboard'], { replaceUrl: true });
        }
    }

    // ... (resetViewState and other methods remain unchanged)
    resetViewState() {
        // ... (lines 61-84 unchanged)
        console.log('🔄 BEFORE resetViewState:', {
            isSignUp: this.isSignUp,
            isForgotPassword: this.isForgotPassword,
            isPendingVerification: this.isPendingVerification,
            isLoading: this.isLoading
        });

        this.isSignUp = false;
        this.isForgotPassword = false;
        this.isPendingVerification = false;
        this.isLoading = false;

        console.log('✅ AFTER resetViewState:', {
            isSignUp: this.isSignUp,
            isForgotPassword: this.isForgotPassword,
            isPendingVerification: this.isPendingVerification,
            isLoading: this.isLoading
        });
        console.log('🎯 Login form should be visible:', !this.isSignUp && !this.isForgotPassword && !this.isPendingVerification);

        // Force Angular to detect changes
        this.cdr.detectChanges();
        console.log('🔄 Change detection triggered');
    }

    // ... (keep sendSampleEmail, toggleMode, toggleForgot, etc.) 
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
        console.log('🔀 toggleMode called, current isSignUp:', this.isSignUp);
        if (this.isSignUp) {
            // Switching from signup to login
            console.log('📝 Switching from SIGNUP to LOGIN');
            this.resetViewState();
        } else {
            // Switching from login to signup
            console.log('📝 Switching from LOGIN to SIGNUP');
            this.isSignUp = true;
            this.isForgotPassword = false;
            this.isPendingVerification = false;
            console.log('✅ State after switching to signup:', {
                isSignUp: this.isSignUp,
                isForgotPassword: this.isForgotPassword,
                isPendingVerification: this.isPendingVerification
            });
        }
    }

    toggleForgot() {
        if (this.isForgotPassword) {
            // Switching from forgot password to login
            this.resetViewState();
        } else {
            // Switching from login to forgot password
            this.isForgotPassword = true;
            this.isSignUp = false;
            this.isPendingVerification = false;
        }
    }

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
        console.log('🔐 LOGIN ATTEMPT');

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
                // Store token with correct key for auth guard
                localStorage.setItem('authToken', res.result.accessToken);
                localStorage.setItem('userId', res.result.userId);
                localStorage.setItem('userEmail', this.loginEmail);
                this.toastService.showSuccess('Login successful! Welcome back.');

                // IMPORTANT: For basic login, we might not have roles yet if GlobalState isn't updated.
                // But if they are logging in fresh, we might want to fetch session first OR just default to dashboard.
                // For now, using redirectUser() which checks GlobalState (which might be stale or empty).
                // If empty, it goes to dashboard. This is acceptable for now.
                // The SessionService in the main app will fetch and update roles, so next reload works.
                this.redirectUser();
            },
            error: (err: any) => {
                this.isLoading = false;
                const errorMessage = err.error?.error?.message || 'Login failed. Please check your credentials.';

                // Check for specific error types
                if (errorMessage.includes('email is not confirmed') || errorMessage.includes('not verified')) {
                    this.isPendingVerification = true;
                    this.toastService.showError('Your email is not verified. Please check your inbox for the verification link.');
                } else {
                    this.toastService.showError(errorMessage);
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
        console.log('📝 SIGNUP ATTEMPT - Current state BEFORE validation:', {
            isSignUp: this.isSignUp,
            isForgotPassword: this.isForgotPassword,
            isPendingVerification: this.isPendingVerification,
            isLoading: this.isLoading,
            signupEmail: this.signupEmail
        });
        console.log('🎯 Login form visibility check:', !this.isSignUp && !this.isForgotPassword && !this.isPendingVerification);

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
            fullName: this.signupName,
            emailAddress: this.signupEmail,
            password: this.signupPassword,
            phoneNumber: this.signupPhone,
            country: this.signupCountry
        };

        console.log('🚀 Calling API with:', registerInput);
        console.log('📊 State BEFORE API call:', {
            isSignUp: this.isSignUp,
            isForgotPassword: this.isForgotPassword,
            isPendingVerification: this.isPendingVerification,
            isLoading: this.isLoading
        });

        this.authService.register(registerInput).subscribe({
            next: (res: any) => {
                console.log('✅ Signup API SUCCESS response:', res);
                console.log('📊 State IMMEDIATELY after API success (before any changes):', {
                    isSignUp: this.isSignUp,
                    isForgotPassword: this.isForgotPassword,
                    isPendingVerification: this.isPendingVerification,
                    isLoading: this.isLoading
                });

                // Clear form
                this.clearSignupForm();

                // Show success message
                this.toastService.showSuccess('Account created successfully! Please check your email to verify your account.');

                console.log('🔄 About to call resetViewState()...');
                // Reset all view state flags to show login form
                this.resetViewState();

                console.log('📊 State AFTER resetViewState:', {
                    isSignUp: this.isSignUp,
                    isForgotPassword: this.isForgotPassword,
                    isPendingVerification: this.isPendingVerification,
                    isLoading: this.isLoading
                });
                console.log('🎯 Final login form visibility:', !this.isSignUp && !this.isForgotPassword && !this.isPendingVerification);
            },
            error: (err: any) => {
                console.error('Signup error:', err);
                this.isLoading = false;
                this.toastService.showError(err.error?.error?.message || 'Registration failed. Please try again.');
            }
        });
    }

    clearSignupForm() {
        this.signupName = '';
        this.signupEmail = '';
        this.signupPhone = '';
        this.signupCountry = '';
        this.signupPassword = '';
        this.signupConfirmPassword = '';
        this.acceptTerms = false;
        this.selectedCountryData = null;
    }

    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
        this.toastService.showSuccess('Logged out successfully');
        this.router.navigate(['/auth'], { replaceUrl: true });
    }

    sendResetLink() {
        if (!this.resetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.resetEmail)) {
            this.toastService.showError('Please enter a valid email address');
            return;
        }

        this.isLoading = true;
        this.authService.forgotPassword(this.resetEmail).subscribe({
            next: () => {
                this.isLoading = false;
                this.toastService.showSuccess('Reset link sent to ' + this.resetEmail + '. Check your inbox.');
                this.toggleForgot(); // Go back to login
            },
            error: (err: any) => {
                this.isLoading = false;
                this.toastService.showError(err.error?.error?.message || 'Failed to send reset link');
            }
        });
    }
}
