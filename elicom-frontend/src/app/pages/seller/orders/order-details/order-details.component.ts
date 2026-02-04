import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../../services/order.service';

@Component({
    selector: 'app-order-details',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './order-details.component.html',
    styleUrls: ['./order-details.component.scss']
})
export class OrderDetailsComponent implements OnInit {
    order: any = null;

    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private orderService = inject(OrderService);
    private cdr = inject(ChangeDetectorRef);

    ngOnInit() {
        const orderId = this.route.snapshot.paramMap.get('id');
        const state = window.history.state;

        if (state && state.order && state.order.orderItems) {
            this.mapOrderData(state.order);
        } else if (orderId) {
            this.loadOrderDetails(orderId);
        }
    }

    loadOrderDetails(id: string) {
        this.orderService.getOrder(id).subscribe({
            next: (res: any) => {
                this.mapOrderData(res);
            },
            error: (err: any) => {
                console.error('Failed to load order details', err);
            }
        });
    }

    mapOrderData(data: any) {
        // Map backend DTO to template names
        this.order = {
            ...data,
            id: data.orderNumber || data.id,
            date: data.creationTime ? new Date(data.creationTime).toLocaleDateString() : 'N/A',
            customer: data.customerName || ('User #' + data.userId),
            phone: data.phone || 'N/A',
            email: data.email || 'N/A',
            subtotal: data.subTotal || 0,
            shippingFee: data.shippingCost || 0,
            tax: 0,
            grandTotal: data.totalAmount || 0,
            orderItems: (data.orderItems || []).map((item: any) => ({
                name: item.productName,
                sku: item.productId?.substring(0, 8).toUpperCase() || 'N/A',
                price: item.priceAtPurchase,
                quantity: item.quantity,
                subtotal: (item.priceAtPurchase * item.quantity).toFixed(2),
                image: 'https://picsum.photos/50?random=' + item.id
            }))
        };
        this.cdr.detectChanges();
    }

    statusOptions = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    updatingStatus = false;

    updateStatus(newStatus: string) {
        if (!this.order?.guid && !this.order?.id) return;

        this.updatingStatus = true;
        const id = this.order.guid || this.order.id;

        this.orderService.updateOrderStatus(id, newStatus).subscribe({
            next: (res) => {
                this.updatingStatus = false;
                this.order.status = newStatus;
                alert(`Order status updated to ${newStatus}`);
            },
            error: (err: any) => {
                this.updatingStatus = false;
                console.error('Failed to update status', err);
                alert('Failed to update order status');
            }
        });
    }

    goBack() {
        this.router.navigate(['/seller/orders']);
    }
}
