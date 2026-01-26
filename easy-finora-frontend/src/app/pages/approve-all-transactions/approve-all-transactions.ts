import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { TransactionService } from '../../services/transaction.service';
import { Loader } from '../../shared/loader/loader';

@Component({
    selector: 'app-approve-all-transactions',
    standalone: true,
    imports: [CommonModule, DatePipe, CurrencyPipe, Loader],
    templateUrl: './approve-all-transactions.html',
    styleUrl: './approve-all-transactions.scss',
})
export class ApproveAllTransactions implements OnInit {

    transactions: any[] = [];
    isLoading = false;

    constructor(private transactionService: TransactionService) { }

    ngOnInit() {
        this.fetchTransactions();
    }

    fetchTransactions() {
        this.isLoading = true;
        this.transactionService.getAllTransactions().subscribe({
            next: (res: any) => {
                this.transactions = res?.result?.items ?? [];
                this.isLoading = false;
            },
            error: (err: any) => {
                console.error('Failed to fetch all transactions', err);
                this.isLoading = false;
            }
        });
    }
}
