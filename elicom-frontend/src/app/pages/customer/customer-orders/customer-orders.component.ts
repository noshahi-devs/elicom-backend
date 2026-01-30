import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-customer-orders',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './customer-orders.component.html',
    styleUrls: ['./customer-orders.component.scss']
})
export class CustomerOrdersComponent implements OnInit {
    activeTab = 'All orders';
    tabs = ['All orders', 'Unpaid', 'Processing', 'Shipped', 'Review', 'Refund/Return', 'Deleted Orders History'];

    constructor() { }

    ngOnInit(): void {
    }

    setTab(tab: string) {
        this.activeTab = tab;
    }
}
