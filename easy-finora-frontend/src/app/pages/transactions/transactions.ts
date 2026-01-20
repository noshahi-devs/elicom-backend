import { Component } from '@angular/core';
import { NgFor, NgIf, CurrencyPipe, DatePipe } from '@angular/common';

@Component({
    selector: 'app-transactions',
    imports: [NgFor, NgIf, CurrencyPipe, DatePipe],
    templateUrl: './transactions.html',
    styleUrl: './transactions.scss',
})
export class Transactions {

    filterType = 'all'; // all, deposit, withdrawal, transfer

    allTransactions = [
        { id: 'TXN-001', type: 'Deposit', amount: 500, status: 'Completed', date: new Date('2026-01-20'), description: 'Bank Transfer' },
        { id: 'TXN-002', type: 'Transfer', amount: -150, status: 'Completed', date: new Date('2026-01-19'), description: 'To user@example.com' },
        { id: 'TXN-003', type: 'Withdrawal', amount: -300, status: 'Pending', date: new Date('2026-01-18'), description: 'To Bank Account' },
        { id: 'TXN-004', type: 'Deposit', amount: 1000, status: 'Completed', date: new Date('2026-01-17'), description: 'Card Payment' },
        { id: 'TXN-005', type: 'Transfer', amount: -75, status: 'Completed', date: new Date('2026-01-16'), description: 'To john@example.com' },
        { id: 'TXN-006', type: 'Deposit', amount: 250, status: 'Completed', date: new Date('2026-01-15'), description: 'Bank Transfer' },
        { id: 'TXN-007', type: 'Withdrawal', amount: -500, status: 'Rejected', date: new Date('2026-01-14'), description: 'To Bank Account' },
        { id: 'TXN-008', type: 'Transfer', amount: -200, status: 'Completed', date: new Date('2026-01-13'), description: 'To alice@example.com' }
    ];

    get filteredTransactions() {
        if (this.filterType === 'all') return this.allTransactions;
        return this.allTransactions.filter(t => t.type.toLowerCase() === this.filterType);
    }

    setFilter(type: string) {
        this.filterType = type;
    }
}
