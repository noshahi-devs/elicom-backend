import { Component } from '@angular/core';
import { NgFor, DatePipe, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-deposit-history',
    imports: [NgFor, DatePipe, CurrencyPipe, RouterLink],
    templateUrl: './deposit-history.html',
    styleUrl: './deposit-history.scss',
})
export class DepositHistory {

    deposits = [
        { id: 'DEP-001', amount: 500, method: 'Bank Transfer', status: 'Completed', date: new Date('2026-01-20'), fee: 0 },
        { id: 'DEP-002', amount: 1000, method: 'Credit Card', status: 'Pending', date: new Date('2026-01-19'), fee: 25 },
        { id: 'DEP-003', amount: 250, method: 'Cryptocurrency', status: 'Completed', date: new Date('2026-01-18'), fee: 2.5 },
        { id: 'DEP-004', amount: 750, method: 'Bank Transfer', status: 'Rejected', date: new Date('2026-01-17'), fee: 0 }
    ];
}
