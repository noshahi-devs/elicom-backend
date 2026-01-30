import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-customer-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './customer-dashboard.component.html',
    styleUrls: ['./customer-dashboard.component.scss']
})
export class CustomerDashboardComponent implements OnInit {
    userName = 'prismaticadeel';

    orderStatuses = [
        { label: 'Unpaid', icon: 'fa-wallet', count: 0 },
        { label: 'Processing', icon: 'fa-box', count: 0 },
        { label: 'Shipped', icon: 'fa-truck', count: 0 },
        { label: 'Review', icon: 'fa-comment-dots', count: 0 },
        { label: 'Returns', icon: 'fa-undo', count: 0 }
    ];

    assets = [
        { label: 'Coupons', value: '3', unit: '' },
        { label: 'Points', value: '150', unit: '' },
        { label: 'Wallet', value: '25.00', unit: '$' },
        { label: 'Gift Card', value: '0', unit: '' }
    ];

    constructor() { }

    ngOnInit(): void {
    }
}
