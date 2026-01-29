import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, of, throwError, BehaviorSubject } from 'rxjs';
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

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    // Using a simplified base URL, adjust if needed (e.g. from environment)
    private baseUrl = 'https://localhost:44311';

    // State
    private _currentUser = new BehaviorSubject<User | null>(this.getUserFromStorage());
    currentUser$ = this._currentUser.asObservable();

    private _isAuthenticated = new BehaviorSubject<boolean>(!!this.getUserFromStorage());
    isAuthenticated$ = this._isAuthenticated.asObservable();

    private _showAuthModal = new BehaviorSubject<boolean>(false);
    showAuthModal$ = this._showAuthModal.asObservable();

    constructor(
        private http: HttpClient,
        private router: Router
    ) { }

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
            tap((response: any) => {
                console.log('Login response:', response);

                // ABP wraps responses in {result: {...}, success: true, error: null}
                if (response && response.result && response.result.accessToken) {
                    console.log('Login successful, setting session');
                    this.setSession(response.result.accessToken, response.result.userId);

                    // Fetch or Create Customer Profile after login using the UserId from response
                    this.ensureCustomerProfile(response.result.userId, credentials.userNameOrEmailAddress);

                    this.updateCurrentUser({
                        id: response.result.userId,
                        userName: credentials.userNameOrEmailAddress,
                        emailAddress: credentials.userNameOrEmailAddress
                    });
                } else {
                    console.error('Unexpected response format:', response);
                }
            })
        );
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
