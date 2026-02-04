import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface WithdrawRequestDto {
    id: string;
    amount: number;
    status: string;
    creationTime: string;
}

@Injectable({
    providedIn: 'root'
})
export class WithdrawalService {
    private http = inject(HttpClient);
    private baseUrl = 'http://localhost:5050/api/services/app/Withdraw';

    submitWithdrawRequest(amount: number): Observable<any> {
        return this.http.post(`${this.baseUrl}/SubmitWithdrawRequest`, { amount });
    }

    getMyWithdrawRequests(): Observable<WithdrawRequestDto[]> {
        return this.http.get<any>(`${this.baseUrl}/GetMyWithdrawRequests`)
            .pipe(map(res => res.result?.items || []));
    }
}
