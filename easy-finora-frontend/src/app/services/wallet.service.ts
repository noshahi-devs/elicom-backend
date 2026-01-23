import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class WalletService {
    private apiUrl = 'https://localhost:44311/api/services/app/Wallet';

    constructor(private http: HttpClient) { }

    private getHeaders() {
        const token = localStorage.getItem('authToken');
        return new HttpHeaders({
            'Content-Type': 'application/json',
            'Abp-TenantId': '3',
            'Authorization': `Bearer ${token}`
        });
    }

    getMyWallet(): Observable<any> {
        return this.http.get(`${this.apiUrl}/GetMyWallet`, { headers: this.getHeaders() });
    }

    transfer(input: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/Transfer`, input, { headers: this.getHeaders() });
    }
}
