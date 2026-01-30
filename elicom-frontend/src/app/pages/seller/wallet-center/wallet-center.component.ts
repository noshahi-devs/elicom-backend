import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Transaction {
    id: number;
    amount: number;
    type: 'sale' | 'withdrawal' | 'clearance' | 'refund' | 'fees';
    includeInSum: boolean;
    reference: string;
    description: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: Date;
}

@Component({
    selector: 'app-wallet-center',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './wallet-center.component.html',
    styleUrls: ['./wallet-center.component.scss']
})
export class WalletCenterComponent implements OnInit {
    transactions: Transaction[] = [
        { id: 1, amount: 150.00, type: 'sale', includeInSum: true, reference: 'ORD-10023', description: 'Payment for Order #10023', status: 'approved', createdAt: new Date('2026-01-28 10:30') },
        { id: 2, amount: 85.50, type: 'sale', includeInSum: true, reference: 'ORD-10024', description: 'Payment for Order #10024', status: 'approved', createdAt: new Date('2026-01-29 14:15') },
        { id: 3, amount: -500.00, type: 'withdrawal', includeInSum: true, reference: 'WTH-552', description: 'Weekly withdrawal to bank', status: 'pending', createdAt: new Date('2026-01-30 09:00') },
        { id: 4, amount: -15.20, type: 'fees', includeInSum: true, reference: 'FEE-991', description: 'Platform service fee - Jan', status: 'approved', createdAt: new Date('2026-01-25 23:59') },
        { id: 5, amount: 45.00, type: 'clearance', includeInSum: true, reference: 'CLR-201', description: 'Settlement for previous period', status: 'approved', createdAt: new Date('2026-01-20 12:00') }
    ];

    balance = 0;
    pendingBalance = 0;

    ngOnInit() {
        this.calculateBalances();
    }

    calculateBalances() {
        this.balance = this.transactions
            .filter(t => t.includeInSum && (t.status === 'approved'))
            .reduce((acc, curr) => acc + curr.amount, 0);

        this.pendingBalance = this.transactions
            .filter(t => t.status === 'pending')
            .reduce((acc, curr) => acc + curr.amount, 0);
    }

    getStatusClass(status: string) {
        return {
            'badge-pending': status === 'pending',
            'badge-approved': status === 'approved',
            'badge-rejected': status === 'rejected'
        };
    }

    getTypeIcon(type: string) {
        switch (type) {
            case 'sale': return 'fa-shopping-cart text-success';
            case 'withdrawal': return 'fa-bank text-danger';
            case 'fees': return 'fa-percentage text-warning';
            case 'refund': return 'fa-undo text-info';
            default: return 'fa-exchange-alt';
        }
    }
}
