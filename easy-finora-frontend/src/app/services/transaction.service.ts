import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class TransactionService {
    private apiUrl = 'https://localhost:44311/api/services/app/Transaction';

    constructor(private http: HttpClient) { }

    private getHeaders() {
        const token = localStorage.getItem('authToken');
        return new HttpHeaders({
            'Content-Type': 'application/json',
            'Abp-TenantId': '3',
            'Authorization': `Bearer ${token}`
        });
    }

    getHistory(skipCount: number = 0, maxResultCount: number = 10): Observable<any> {
        console.log('TransactionService.getHistory called');

        return this.http.get(`${this.apiUrl}/GetHistory`, {
            headers: this.getHeaders(),
            params: { skipCount, maxResultCount }
        }).pipe(
            tap(response => console.log('TransactionService.getHistory response is:', response))
        );
    }
}
