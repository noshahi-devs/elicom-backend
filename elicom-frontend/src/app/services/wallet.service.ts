import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface WalletDto {
    id: string;
    userId: number;
    balance: number;
    currency: string;
}

@Injectable({
    providedIn: 'root'
})
export class WalletService {
    private http = inject(HttpClient);
    private baseUrl = 'http://localhost:5050/api/services/app/Wallet';

    getMyWallet(): Observable<WalletDto> {
        return this.http.get<any>(`${this.baseUrl}/GetMyWallet`)
            .pipe(map(res => res.result));
    }

    getTransactions(): Observable<any> {
        return this.http.get<any>(`${this.baseUrl}/GetTransactions`);
    }
}
