import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface WithdrawalRequest {
    id: string;
    sellerName: string;
    amount: number;
    method: string;
    accountDetails: string;
    status: 'pending' | 'approved' | 'rejected';
    requestDate: Date;
}

@Component({
    selector: 'app-financial-payouts',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './financial-payouts.component.html',
    styleUrls: ['./financial-payouts.component.scss']
})
export class FinancialPayoutsComponent implements OnInit {
    requests: WithdrawalRequest[] = [
        { id: 'WTH-882', sellerName: 'Arslan Noshahi', amount: 1250.00, method: 'Bank Transfer', accountDetails: 'Chase ****5412', status: 'pending', requestDate: new Date('2026-01-29') },
        { id: 'WTH-881', sellerName: 'Tech Haven', amount: 450.00, method: 'PayPal', accountDetails: 'finance@techhaven.com', status: 'pending', requestDate: new Date('2026-01-30') },
        { id: 'WTH-880', sellerName: 'Green Life', amount: 2100.50, method: 'Bank Transfer', accountDetails: 'HSBC ****9921', status: 'approved', requestDate: new Date('2026-01-15') }
    ];

    totalPendingVolume = 0;
    showReviewModal = false;
    selectedRequest: WithdrawalRequest | null = null;
    reviewComment: string = '';

    ngOnInit() {
        this.calculateStats();
    }

    calculateStats() {
        this.totalPendingVolume = this.requests
            .filter(r => r.status === 'pending')
            .reduce((acc, curr) => acc + curr.amount, 0);
    }

    openReviewModal(req: WithdrawalRequest) {
        this.selectedRequest = req;
        this.reviewComment = '';
        this.showReviewModal = true;
    }

    closeReviewModal() {
        this.showReviewModal = false;
        this.selectedRequest = null;
    }

    approvePayout() {
        if (!this.selectedRequest) return;
        this.selectedRequest.status = 'approved';
        this.calculateStats();
        this.closeReviewModal();
        // Here you would typically send the comment to the backend too
    }

    rejectPayout() {
        if (!this.selectedRequest) return;
        this.selectedRequest.status = 'rejected';
        this.calculateStats();
        this.closeReviewModal();
    }
}
