import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
    selector: 'app-seller-orders',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './orders.component.html',
    styleUrls: ['./orders.component.scss']
})
export class SellerOrdersComponent implements OnInit {
    constructor(private router: Router) { }

    orderStatus: string = 'All';

    orders = [
        { id: '#ORD-78452', date: 'Jan 28, 2026', customer: 'Ali Ahmed', avatar: 'AA', items: 3, total: 450, status: 'Unshipped', payment: 'Paid' },
        { id: '#ORD-78453', date: 'Jan 27, 2026', customer: 'Sara Khan', avatar: 'SK', items: 1, total: 120, status: 'Shipped', payment: 'Paid' },
        { id: '#ORD-78454', date: 'Jan 26, 2026', customer: 'John Doe', avatar: 'JD', items: 5, total: 890, status: 'Cancelled', payment: 'Refunded' },
        { id: '#ORD-78455', date: 'Jan 25, 2026', customer: 'Fatima Zahra', avatar: 'FZ', items: 2, total: 340, status: 'Returned', payment: 'Refunded' },
        { id: '#ORD-78456', date: 'Jan 24, 2026', customer: 'Usman Ali', avatar: 'UA', items: 1, total: 210, status: 'Unshipped', payment: 'Pending' },
    ];

    filteredOrders = this.orders;

    ngOnInit() {
        this.filterOrders('All');
    }

    getCount(status: string) {
        if (status === 'All') return this.orders.length;
        return this.orders.filter(o => o.status === status).length;
    }

    filterOrders(status: string) {
        this.orderStatus = status;
        if (status === 'All') {
            this.filteredOrders = this.orders;
        } else {
            this.filteredOrders = this.orders.filter(o => o.status === status);
        }
    }

    viewOrderDetails(order: any) {
        this.router.navigate(['/seller/orders/details', order.id], {
            state: { order: order }
        });
    }
}
