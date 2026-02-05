import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, of, throwError, BehaviorSubject, switchMap, map } from 'rxjs';
import { Router } from '@angular/router';

export interface User {
    id?: number;
    userName?: string;
    name?: string;
    surname?: string;
    emailAddress?: string;
    isActive?: boolean;
    fullName?: string;
    lastLoginTime?: string;
    creationTime?: string;
    roleNames?: string[];
}

export interface RegisterDto {
    name: string;
    surname: string;
    userName: string;
    emailAddress: string;
    password: string;
    captchaResponse?: string;
}

export interface LoginDto {
    userNameOrEmailAddress: string;
    password: string;
    rememberClient?: boolean;
}

export interface RegisterSmartStoreInput {
    emailAddress: string;
    password: string;
    country: string;
    phoneNumber: string;
}

import { StoreService } from './store.service';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    // Using a simplified base URL, adjust if needed (e.g. from environment)
    private baseUrl = 'https://app-elicom-backend.azurewebsites.net';

    // State
    private _currentUser = new BehaviorSubject<User | null>(this.getUserFromStorage());
    currentUser$ = this._currentUser.asObservable();

    private _isAuthenticated = new BehaviorSubject<boolean>(this.checkAuthStatus());
    isAuthenticated$ = this._isAuthenticated.asObservable();

    private _showAuthModal = new BehaviorSubject<boolean>(false);
    showAuthModal$ = this._showAuthModal.asObservable();

    constructor(
        private http: HttpClient,
        private router: Router,
        private storeService: StoreService
    ) { }

    private checkAuthStatus(): boolean {
        return !!localStorage.getItem('authToken');
    }

    private _customerProfileService: any; // Direct injection might cause cycle if not careful, but typically fine.
    // Ideally we inject it in constructor, but let's stick to HttpClient to avoid circular dep if AuthService is used in CustomerProfileService (unlikely but safe)
    // Actually, let's just use the URL pattern as before for simplicity and robustness in this file.

    openAuthModal() {
        this._showAuthModal.next(true);
    }

    // --- Auth Actions ---

    login(credentials: LoginDto): Observable<any> {
        const url = `${this.baseUrl}/api/TokenAuth/Authenticate`;
        const headers = { 'Abp-TenantId': '1' }; // Smart Store Tenant
        return this.http.post(url, credentials, { headers }).pipe(
            switchMap((response: any) => {
                console.log('Login response:', response);

                if (response && response.result && response.result.accessToken) {
                    console.log('Login successful, setting session');
                    this.setSession(response.result.accessToken, response.result.userId);

                    // Fetch profile (asynchronous but we don't block for it as it's for customer details)
                    this.ensureCustomerProfile(response.result.userId, credentials.userNameOrEmailAddress);

                    // Fetch full user info including roles - BLOCK until this is done
                    return this.getCurrentLoginInformations().pipe(
                        tap((info: any) => {
                            if (info && info.result && info.result.user) {
                                const user = info.result.user;
                                console.log('Fetched login info:', info.result);
                                this.updateCurrentUser({
                                    id: user.id,
                                    userName: user.userName,
                                    emailAddress: user.emailAddress,
                                    name: user.name,
                                    surname: user.surname,
                                    roleNames: user.roleNames || []
                                });
                            }
                        }),
                        map(() => response) // Return the original auth response so subscriber gets what it expects
                    );
                }
                return of(response);
            })
        );
    }

    getCurrentLoginInformations(): Observable<any> {
        const url = `${this.baseUrl}/api/services/app/Session/GetCurrentLoginInformations`;
        return this.http.get(url);
    }

    isAdmin(): boolean {
        const user = this._currentUser.value;
        return !!user?.roleNames?.some(r => r.toLowerCase() === 'admin');
    }

    isSeller(): boolean {
        const user = this._currentUser.value;
        if (!user) return false;
        const roleNames = user.roleNames || [];
        return roleNames.some(r => r.toLowerCase() === 'reseller' || r.toLowerCase() === 'seller');
    }

    isCustomer(): boolean {
        const user = this._currentUser.value;
        return !!user?.roleNames?.some(r => r.toLowerCase() === 'buyer' || r.toLowerCase() === 'customer');
    }

    isSupplier(): boolean {
        const user = this._currentUser.value;
        return !!user?.roleNames?.some(r => r.toLowerCase() === 'supplier');
    }

    navigateToDashboard() {
        console.log('Navigating to dashboard...');
        if (!this.isAuthenticated) {
            console.log('Not authenticated, going to login');
            this.router.navigate(['/smartstore/login']);
            return;
        }

        // Check for returnUrl in the current URL
        const urlTree = this.router.parseUrl(this.router.url);
        const returnUrl = urlTree.queryParams['returnUrl'];

        if (returnUrl) {
            console.log('Redirecting to returnUrl:', returnUrl);
            this.router.navigateByUrl(returnUrl);
            return;
        }

        if (this.isAdmin()) {
            console.log('Role: Admin');
            this.router.navigate(['/admin/dashboard']);
        } else if (this.isSeller()) {
            console.log('Role: Seller, checking store...');
            this.storeService.getMyStore().subscribe({
                next: (res: any) => {
                    if (res && res.result) {
                        console.log('Store exists, dashboard bound');
                        this.router.navigate(['/seller/dashboard']);
                    } else {
                        console.log('No store, creation bound');
                        this.router.navigate(['/seller/store-creation']);
                    }
                },
                error: () => {
                    console.log('Store check failed, creation bound');
                    this.router.navigate(['/seller/store-creation']);
                }
            });
        } else if (this.isCustomer()) {
            console.log('Role: Customer/Buyer');
            this.router.navigate(['/customer/dashboard']);
        } else {
            console.log('Role: Default/Other');
            this.router.navigate(['/user/index']);
        }
    }

    private ensureCustomerProfile(userId: number, email: string) {
        const getUrl = `${this.baseUrl}/api/services/app/CustomerProfile/GetByUserId?userId=${userId}`;

        this.http.get(getUrl).subscribe({
            next: (response: any) => {
                // If the profile doesn't exist, response.result will be null (or response itself depending on wrapper)
                // ABP default wrapper: { result: ..., success: true, ... }
                const profile = response?.result || response;

                if (profile && profile.id) {
                    console.log('Customer Profile confirmed:', profile);
                    localStorage.setItem('customerProfileId', profile.id);
                } else {
                    console.log('Profile missing, creating now...');
                    this.createInitialProfile(userId, email);
                }
            },
            error: (err) => {
                console.warn('Profile check failed, attempting creation just in case.', err);
                this.createInitialProfile(userId, email);
            }
        });
    }

    private createInitialProfile(userId: number, email: string) {
        const createUrl = `${this.baseUrl}/api/services/app/CustomerProfile/Create`;
        const newProfile = {
            userId: userId,
            fullName: 'Customer User',
            email: email,
        };

        this.http.post(createUrl, newProfile).subscribe({
            next: (res: any) => {
                const created = res?.result || res;
                console.log('Customer Profile created successfully!', created);
                if (created && created.id) {
                    localStorage.setItem('customerProfileId', created.id);
                }
            },
            error: (createErr) => {
                console.error('Failed to create customer profile.', createErr);
            }
        });
    }

    getToken(): string | null {
        return localStorage.getItem('authToken');
    }


    registerSmartStoreCustomer(data: RegisterSmartStoreInput): Observable<any> {
        const url = `${this.baseUrl}/api/services/app/Account/RegisterSmartStoreCustomer`;
        const headers = { 'Abp-TenantId': '1' }; // Smart Store Tenant
        return this.http.post(url, data, { headers });
    }

    registerSmartStoreSeller(data: RegisterSmartStoreInput): Observable<any> {
        const url = `${this.baseUrl}/api/services/app/Account/RegisterSmartStoreSeller`;
        const headers = { 'Abp-TenantId': '1' }; // Smart Store Tenant
        return this.http.post(url, data, { headers });
    }

    forgotPassword(email: string): Observable<any> {
        const url = `${this.baseUrl}/api/services/app/Account/ForgotPassword`;
        return this.http.post(url, null, { params: { email } });
    }

    resetPassword(input: any): Observable<any> {
        const url = `${this.baseUrl}/api/services/app/Account/ResetPassword`;
        return this.http.post(url, input);
    }

    sendSampleEmail(): Observable<any> {
        const url = `${this.baseUrl}/api/services/app/Account/SendSampleEmail`;
        return this.http.post(url, {});
    }

    // Keep legacy register if needed, but we'll use the new one primarily
    register(data: RegisterDto): Observable<any> {
        const url = `${this.baseUrl}/api/services/app/Account/Register`;
        return this.http.post(url, data);
    }

    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        this._currentUser.next(null);
        this._isAuthenticated.next(false);
        this.router.navigate(['/']);
    }

    // --- State Management ---

    private setSession(token: string, userId: number) {
        localStorage.setItem('authToken', token);
        localStorage.setItem('userId', userId.toString());
    }

    private updateCurrentUser(user: User) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        this._currentUser.next(user);
        this._isAuthenticated.next(true);
    }

    private getUserFromStorage(): User | null {
        const userStr = localStorage.getItem('currentUser');
        return userStr ? JSON.parse(userStr) : null;
    }

    get isAuthenticated(): boolean {
        return this._isAuthenticated.value;
    }
}
