import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransactionService } from '../../services/transaction.service';

@Component({
    selector: 'app-transactions',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './transactions.html',
    styleUrl: './transactions.scss',
})
export class Transactions implements OnInit {

    filterType = 'all'; // all, deposit, withdrawal, credit, debit
    allTransactions: any[] = [];
    isLoading = false;

    constructor(
        private transactionService: TransactionService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.loadTransactions();
    }

    loadTransactions() {
        this.isLoading = true;
        this.cdr.detectChanges();

        this.transactionService.getHistory().subscribe({
            next: (res) => {
                console.log('Transactions: List Response:', res);
                this.allTransactions = (res?.result?.items ?? []).map((t: any) => ({
                    id: t.id,
                    type: t.category || 'Unknown',  // Fallback
                    amount: t.transactionType === 'Debit' ? -t.amount : t.amount,
                    status: 'Completed',
                    date: t.creationTime,
                    description: t.description,
                    cardId: t.cardId
                }));
                this.isLoading = false;
                this.cdr.detectChanges(); // Ensure UI update
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Transactions: List Error:', err);
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    get filteredTransactions() {
        if (this.filterType === 'all') return this.allTransactions;
        return this.allTransactions.filter(t => (t.type || '').toLowerCase() === this.filterType.toLowerCase());
    }

    setFilter(type: string) {
        this.filterType = type;
    }
}
