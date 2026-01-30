import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface StoreApplication {
    id: number;
    sellerName: string;
    storeName: string;
    email: string;
    status: 'pending' | 'approved' | 'rejected';
    kycStatus: 'verified' | 'pending' | 'unsubmitted';
    appliedDate: Date;
}

@Component({
    selector: 'app-store-approvals',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './store-approvals.component.html',
    styleUrls: ['./store-approvals.component.scss']
})
export class StoreApprovalsComponent implements OnInit {
    applications: StoreApplication[] = [
        { id: 1, sellerName: 'John Doe', storeName: 'Tech Haven', email: 'john@example.com', status: 'pending', kycStatus: 'pending', appliedDate: new Date('2026-01-25') },
        { id: 2, sellerName: 'Sarah Smith', storeName: 'Green Life', email: 'sarah@example.com', status: 'pending', kycStatus: 'verified', appliedDate: new Date('2026-01-28') },
        { id: 3, sellerName: 'Mike Ross', storeName: 'Law Books Plus', email: 'mike@example.com', status: 'approved', kycStatus: 'verified', appliedDate: new Date('2026-01-10') }
    ];

    ngOnInit() { }

    approveStore(app: StoreApplication) {
        app.status = 'approved';
        alert(`Store "${app.storeName}" has been approved.`);
    }

    rejectStore(app: StoreApplication) {
        app.status = 'rejected';
        alert(`Store "${app.storeName}" has been rejected.`);
    }

    verifyKYC(app: StoreApplication) {
        app.kycStatus = 'verified';
        alert(`KYC for ${app.sellerName} has been verified.`);
    }
}
