import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { OrderService } from '../../../services/order.service';
import { StoreService } from '../../../services/store.service';

@Component({
    selector: 'app-seller-orders',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './orders.component.html',
    styleUrls: ['./orders.component.scss']
})
export class SellerOrdersComponent implements OnInit {
    private router = inject(Router);
    private orderService = inject(OrderService);
    private storeService = inject(StoreService);
    private cdr = inject(ChangeDetectorRef);

    orderStatus: string = 'All';
    isLoading = false;
    orders: any[] = [];
    filteredOrders: any[] = [];

    ngOnInit() {
        this.loadOrders();
    }

    loadOrders() {
        this.isLoading = true;
        this.storeService.getMyStore().subscribe({
            next: (storeRes) => {
                const storeId = storeRes?.result?.id;
                if (storeId) {
                    this.orderService.getOrdersByStore(storeId).subscribe({
                        next: (res) => {
                            console.log('[SellerOrders] 📥 Orders received:', res);
                            this.orders = (res || []).map((o: any) => {
                                // Map backend status to frontend display labels
                                let displayStatus = o.status;
                                if (o.status === 'Pending') displayStatus = 'Unshipped';

                                return {
                                    id: o.orderNumber,
                                    guid: o.id,
                                    date: o.creationTime ? new Date(o.creationTime).toLocaleDateString() : 'N/A',
                                    customer: 'Retail Customer',
                                    avatar: 'RC',
                                    items: o.orderItems?.length || 0,
                                    total: o.totalAmount,
                                    status: displayStatus,
                                    payment: o.paymentStatus || 'Paid',
                                    original: o
                                };
                            });
                            this.filterOrders(this.orderStatus);
                            this.isLoading = false;
                            this.cdr.detectChanges();
                        },
                        error: (err: any) => {
                            console.error('Failed to load store orders', err);
                            this.isLoading = false;
                            this.cdr.detectChanges();
                        }
                    });
                } else {
                    this.isLoading = false;
                    this.cdr.detectChanges();
                }
            },
            error: (err: any) => {
                console.error('Failed to load store information', err);
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
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
        this.router.navigate(['/seller/orders/details', order.guid], {
            state: { order: order.original || order }
        });
    }
}
