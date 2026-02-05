import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = 'https://app-elicom-backend.azurewebsites.net/api/services/app/Account';

    constructor(private http: HttpClient) { }

    register(input: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/RegisterGlobalPayUser`, input, {
            headers: { 'Abp-TenantId': '3' }
        });
    }

    login(input: any): Observable<any> {
        return this.http.post('https://app-elicom-backend.azurewebsites.net/api/TokenAuth/Authenticate', input, {
            headers: { 'Abp-TenantId': '3' }
        });
    }

    sendSampleEmail(): Observable<any> {
        return this.http.post(`${this.apiUrl}/SendSampleEmail`, {}, {
            headers: { 'Abp-TenantId': '3' }
        });
    }

    isTenantAvailable(tenancyName: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/IsTenantAvailable`, { tenancyName });
    }

    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
    }

    isAuthenticated(): boolean {
        return !!localStorage.getItem('authToken');
    }
}
