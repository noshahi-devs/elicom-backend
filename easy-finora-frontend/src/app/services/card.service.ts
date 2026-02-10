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
        console.log('CardService.createVirtualCard payload is:', payload);

        return this.http.post(`${this.apiUrl}/CreateVirtualCard`, payload, { headers: this.getHeaders() }).pipe(
            tap(response => console.log('CardService.createVirtualCard response is:', response))
        );
    }

    getUserCards(): Observable<any> {
        console.log('CardService.getUserCards called');

        return this.http.get(`${this.apiUrl}/GetUserCards`, { headers: this.getHeaders() }).pipe(
            tap(response => console.log('CardService.getUserCards response is:', response))
        );
    }

    getBalance(): Observable<any> {
        console.log('CardService.getBalance called');

        return this.http.get(`${this.apiUrl}/GetBalance`, { headers: this.getHeaders() }).pipe(
            tap(response => console.log('CardService.getBalance response is:', response))
        );
    }

    submitCardApplication(payload: any): Observable<any> {
        console.log('CardService.submitCardApplication payload is:', payload);

        return this.http.post(`${this.apiUrl}/SubmitCardApplication`, payload, { headers: this.getHeaders() }).pipe(
            tap(response => console.log('CardService.submitCardApplication response is:', response))
        );
    }
}
