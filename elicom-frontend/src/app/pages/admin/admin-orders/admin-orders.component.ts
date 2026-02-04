import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrderService } from '../../../services/order.service';

@Component({
    selector: 'app-admin-orders',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './admin-orders.component.html',
    styleUrls: ['./admin-orders.component.scss']
})
export class AdminOrdersComponent implements OnInit {
    orders: any[] = [];
    currentTab: 'PendingVerification' | 'Verified' = 'PendingVerification';
    loading = false;

    private orderService = inject(OrderService);

    ngOnInit() {
        this.loadOrders();
    }

    loadOrders() {
        this.loading = true;
        this.orderService.getAllOrders().subscribe({
            next: (res) => {
                this.orders = res;
                this.loading = false;
            },
            error: (err) => {
                console.error('Failed to load orders', err);
                this.loading = false;
            }
        });
    }

    get filteredOrders() {
        return this.orders.filter(o => o.status === this.currentTab);
    }

    verifyOrder(id: string) {
        if (!confirm('Verify tracking information for this order?')) return;

        this.orderService.verifyOrder(id).subscribe({
            next: () => {
                alert('Order verified. Transactions created.');
                this.loadOrders();
            },
            error: (err) => alert('Verification failed')
        });
    }

    deliverOrder(id: string) {
        if (!confirm('Confirm delivery and release funds to seller?')) return;

        this.orderService.deliverOrder(id).subscribe({
            next: () => {
                alert('Order marked as Delivered. Funds have been released to the seller.');
                this.loadOrders();
            },
            error: (err) => alert('Delivery confirmation failed')
        });
    }
}
