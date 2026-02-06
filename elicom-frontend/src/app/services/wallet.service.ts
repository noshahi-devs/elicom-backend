import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface WalletDto {
    id: string;
    userId: number;
    balance: number;
    currency: string;
}

export interface WalletTransactionDto {
    id: string;
    walletId: string;
    amount: number;
    transactionType: 'Sale' | 'Payout' | 'Refund';
    referenceId: string;
    description: string;
    status: string;
    creationTime: string;
}

@Injectable({
    providedIn: 'root'
})
export class WalletService {
    private http = inject(HttpClient);
    private baseUrl = 'https://localhost:44311/api/services/app/SmartStoreWallet';

    getMyWallet(): Observable<WalletDto> {
        return this.http.get<any>(`${this.baseUrl}/GetMyWallet`)
            .pipe(map(res => res.result));
    }

    getTransactions(): Observable<WalletTransactionDto[]> {
        return this.http.get<any>(`${this.baseUrl}/GetTransactions`)
            .pipe(map(res => res.result?.items || []));
    }
}
