import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class CardService {
    private apiUrl = `${environment.apiUrl}/api/services/app/Card`;

    constructor(private http: HttpClient) { }

    private getHeaders() {
        const token = localStorage.getItem('authToken');
        return new HttpHeaders({
            'Content-Type': 'application/json',
            'Abp-TenantId': '3',
            'Authorization': `Bearer ${token}`
        });
    }

    createVirtualCard(cardType: string): Observable<any> {
        const payload = { cardType };


        return this.http.post(`${this.apiUrl}/CreateVirtualCard`, payload, { headers: this.getHeaders() });
    }

    getUserCards(): Observable<any> {


        return this.http.get(`${this.apiUrl}/GetUserCards`, { headers: this.getHeaders() });
    }

    getBalance(): Observable<any> {


        return this.http.get(`${this.apiUrl}/GetBalance`, { headers: this.getHeaders() });
    }

    getCardSensitiveDetails(cardId: number): Observable<any> {
        return this.http.get(`${this.apiUrl}/GetCardSensitiveDetails`, {
            params: { cardId },
            headers: this.getHeaders()
        });
    }

    submitCardApplication(payload: any): Observable<any> {

        return this.http.post(`${this.apiUrl}/SubmitCardApplication`, payload, { headers: this.getHeaders() });
    }

    getMyApplications(): Observable<any> {
        return this.http.get(`${this.apiUrl}/GetMyApplications`, { headers: this.getHeaders() });
    }

    getCardApplications(): Observable<any> {
        return this.http.get(`${this.apiUrl}/GetCardApplications`, { headers: this.getHeaders() });
    }

    approveCardApplication(id: string): Observable<any> {

        return this.http.post(`${this.apiUrl}/ApproveCardApplication`, { id }, { headers: this.getHeaders() });
    }

    rejectCardApplication(input: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/RejectCardApplication`, input, { headers: this.getHeaders() });
    }

    getApplicationDocument(id: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/GetApplicationDocument`, {
            params: { id },
            headers: this.getHeaders()
        });
    }
}
