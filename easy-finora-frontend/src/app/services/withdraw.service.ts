import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class WithdrawService {
    private apiUrl = `${environment.apiUrl}/api/services/app/Withdraw`;

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

    getAllWithdrawRequests(skipCount: number = 0, maxResultCount: number = 50): Observable<any> {
        return this.http.get(`${this.apiUrl}/GetAllWithdrawRequests`, {
            headers: this.getHeaders(),
            params: { skipCount, maxResultCount }
        });
    }

    approveWithdraw(id: number, adminRemarks: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/ApproveWithdraw`, { id, adminRemarks }, {
            headers: this.getHeaders()
        });
    }

    rejectWithdraw(id: number, adminRemarks: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/RejectWithdraw`, { id, adminRemarks }, {
            headers: this.getHeaders()
        });
    }
}
