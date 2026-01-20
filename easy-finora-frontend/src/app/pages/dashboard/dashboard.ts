import { Component } from '@angular/core';
import { NgFor, NgIf, CurrencyPipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  imports: [NgFor, NgIf, CurrencyPipe, DatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {

  walletData = {
    balance: 12450.75,
    walletId: 'WLT-8472-9301',
    currency: 'USD'
  };

  stats = [
    { label: 'Total Deposits', value: 25340.50, icon: '⬇️', color: '#1de016' },
    { label: 'Total Withdrawals', value: 12889.75, icon: '⬆️', color: '#ff6b6b' },
    { label: 'Pending Requests', value: 3, icon: '⏳', color: '#ffa500' },
    { label: 'Active Cards', value: 2, icon: '💳', color: '#4a90e2' }
  ];

  recentTransactions = [
    { id: 'TXN-001', type: 'Deposit', amount: 500, status: 'Completed', date: new Date('2026-01-20') },
    { id: 'TXN-002', type: 'Transfer', amount: -150, status: 'Completed', date: new Date('2026-01-19') },
    { id: 'TXN-003', type: 'Withdrawal', amount: -300, status: 'Pending', date: new Date('2026-01-18') },
    { id: 'TXN-004', type: 'Deposit', amount: 1000, status: 'Completed', date: new Date('2026-01-17') },
    { id: 'TXN-005', type: 'Transfer', amount: -75, status: 'Completed', date: new Date('2026-01-16') }
  ];
}
