import { Component } from '@angular/core';
import { NgFor, DatePipe, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-withdraw-history',
    imports: [NgFor, DatePipe, CurrencyPipe, RouterLink],
    templateUrl: './withdraw-history.html',
    styleUrl: './withdraw-history.scss',
})
export class WithdrawHistory {

    withdrawals = [
        { id: 'WTH-001', amount: 300, method: 'Bank Transfer', status: 'Completed', date: new Date('2026-01-19'), fee: 0 },
        { id: 'WTH-002', amount: 500, method: 'PayPal', status: 'Pending', date: new Date('2026-01-18'), fee: 10 },
        { id: 'WTH-003', amount: 200, method: 'Cryptocurrency', status: 'Completed', date: new Date('2026-01-16'), fee: 2 },
        { id: 'WTH-004', amount: 1000, method: 'Bank Transfer', status: 'Rejected', date: new Date('2026-01-15'), fee: 0 }
    ];
}
