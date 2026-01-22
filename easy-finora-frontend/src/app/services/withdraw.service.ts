import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class WithdrawService {
    private apiUrl = 'https://localhost:44311/api/services/app/Withdraw';

    constructor(private http: HttpClient) { }

    private getHeaders() {
        const token = localStorage.getItem('authToken');
        return new HttpHeaders({
            'Content-Type': 'application/json',
            'Abp-TenantId': '3',
            'Authorization': `Bearer ${token}`
        });
    }

    submitWithdrawRequest(input: any): Observable<any> {
        console.log('WithdrawService.submitWithdrawRequest payload is:', input);

        return this.http.post(`${this.apiUrl}/SubmitWithdrawRequest`, input, { headers: this.getHeaders() }).pipe(
            tap(response => console.log('WithdrawService.submitWithdrawRequest response is:', response))
        );
    }

    getMyWithdrawRequests(skipCount: number = 0, maxResultCount: number = 10): Observable<any> {
        console.log('WithdrawService.getMyWithdrawRequests called');

        return this.http.get(`${this.apiUrl}/GetMyWithdrawRequests`, {
            headers: this.getHeaders(),
            params: { skipCount, maxResultCount }
        }).pipe(
            tap(response => console.log('WithdrawService.getMyWithdrawRequests response is:', response))
        );
    }
}
