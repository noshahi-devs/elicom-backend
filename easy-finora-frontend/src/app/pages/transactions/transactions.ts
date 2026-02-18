import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransactionService } from '../../services/transaction.service';
import { Loader } from '../../shared/loader/loader';

@Component({
    selector: 'app-transactions',
    standalone: true,
    imports: [CommonModule, Loader],
    templateUrl: './transactions.html',
    styleUrl: './transactions.scss',
})
export class Transactions implements OnInit {

    filterType = 'all'; // all, deposit, withdrawal, credit, debit
    allTransactions: any[] = [];
    isLoading = false;

    // Pagination properties
    currentPage = 1;
    maxResultCount = 10;
    totalCount = 0;

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

        const skipCount = (this.currentPage - 1) * this.maxResultCount;

        this.transactionService.getHistory(skipCount, this.maxResultCount).subscribe({
            next: (res) => {
                console.log('Transactions: List Response:', res);
                this.totalCount = res?.result?.totalCount ?? 0;
                this.allTransactions = (res?.result?.items ?? []).map((t: any) => ({
                    id: t.id,
                    type: t.category || 'Unknown',  // Fallback
                    amount: t.movementType === 'Debit' ? -t.amount : t.amount,
                    status: 'Completed',
                    date: t.creationTime,
                    description: t.description,
                    cardId: t.cardId
                }));
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

    changePage(page: number) {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.loadTransactions();
        }
    }

    get totalPages(): number {
        return Math.ceil(this.totalCount / this.maxResultCount) || 1;
    }

    getPageNumbers(): number[] {
        const pageNumbers: number[] = [];
        const maxPagesToShow = 5;
        let startPage = Math.max(1, this.currentPage - 2);
        let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);

        if (endPage - startPage + 1 < maxPagesToShow) {
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }
        return pageNumbers;
    }

    getStartIndex(): number {
        return this.totalCount === 0 ? 0 : (this.currentPage - 1) * this.maxResultCount + 1;
    }

    getEndIndex(): number {
        return Math.min(this.currentPage * this.maxResultCount, this.totalCount);
    }

    get filteredTransactions() {
        if (this.filterType === 'all') return this.allTransactions;
        return this.allTransactions.filter(t => (t.type || '').toLowerCase() === this.filterType.toLowerCase());
    }

    setFilter(type: string) {
        this.filterType = type;
    }
}
