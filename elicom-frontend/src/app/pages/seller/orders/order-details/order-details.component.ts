import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../../services/order.service';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-order-details',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './order-details.component.html',
    styleUrls: ['./order-details.component.scss']
})
export class OrderDetailsComponent implements OnInit {
    order: any = null;
    carriers: any[] = [];
    fulfillmentForm = {
        shipmentDate: new Date().toISOString().split('T')[0],
        carrierId: '',
        trackingCode: ''
    };
    fulfilling = false;

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
        const creationDate = data.creationTime ? new Date(data.creationTime) : new Date();

        // Mocking Ship By: +1 to +2 days
        const shipByFrom = new Date(creationDate); shipByFrom.setDate(creationDate.getDate() + 1);
        const shipByTo = new Date(creationDate); shipByTo.setDate(creationDate.getDate() + 2);

        // Mocking Deliver By: +3 to +7 days
        const deliverByFrom = new Date(creationDate); deliverByFrom.setDate(creationDate.getDate() + 3);
        const deliverByTo = new Date(creationDate); deliverByTo.setDate(creationDate.getDate() + 7);

        const taxRate = 0.04; // 4% from snippet
        const itemsTotal = data.subTotal || 0;
        const taxAmount = itemsTotal * taxRate;

        // Map backend DTO to template names
        this.order = {
            ...data,
            id: data.orderNumber || data.id,
            date: creationDate.toLocaleDateString(),
            fullDateTime: creationDate.toLocaleString(),
            shipBy: `${shipByFrom.toLocaleDateString()} to ${shipByTo.toLocaleDateString()}`,
            deliverBy: `${deliverByFrom.toLocaleDateString()} to ${deliverByTo.toLocaleDateString()}`,
            customer: data.customerName || ('User #' + data.userId),
            phone: data.phone || 'N/A',
            email: data.email || 'N/A',
            subtotal: itemsTotal,
            shippingFee: data.shippingCost || 0,
            tax: taxAmount,
            taxRatePercent: (taxRate * 100),
            grandTotal: (itemsTotal + taxAmount + (data.shippingCost || 0)),
            shippingService: 'Standard',
            fulfillment: 'Seller',
            salesChannel: 'SmartStore.com',
            orderItems: (data.orderItems || []).map((item: any) => {
                const itemSubtotal = item.priceAtPurchase * item.quantity;
                const itemTax = itemSubtotal * taxRate;
                return {
                    id: item.id,
                    name: item.productName,
                    sku: item.productId?.substring(0, 8).toUpperCase() || 'N/A',
                    productId: item.productId,
                    price: item.priceAtPurchase,
                    quantity: item.quantity,
                    subtotal: itemSubtotal.toFixed(2),
                    tax: itemTax.toFixed(2),
                    total: (itemSubtotal + itemTax).toFixed(2),
                    image: 'https://picsum.photos/50?random=' + item.id
                };
            })
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
                Swal.fire('Success', `Order status updated to ${newStatus}`, 'success');
            },
            error: (err: any) => {
                this.updatingStatus = false;
                console.error('Failed to update status', err);
                Swal.fire('Error', 'Failed to update order status', 'error');
            }
        });
    }

    fulfillOrder() {
        if (!this.order?.id) return;
        if (!this.fulfillmentForm.carrierId || !this.fulfillmentForm.trackingCode) {
            alert('Please fill all shipment details');
            return;
        }

        this.fulfilling = true;
        const id = this.order.guid || this.order.id;

        const input = {
            id: id,
            ...this.fulfillmentForm
        };

        this.orderService.fulfillOrder(input).subscribe({
            next: (res) => {
                this.fulfilling = false;
                this.order.status = 'PendingVerification';
                Swal.fire(
                    'Success!',
                    'Order fulfilled successfully! Tracking information submitted for verification.',
                    'success'
                );
            },
            error: (err) => {
                this.fulfilling = false;
                console.error('Fulfillment error', err);
                Swal.fire('Error', 'Failed to fulfill order', 'error');
            }
        });
    }

    cancelOrder() {
        const id = this.order.guid || this.order.id;
        Swal.fire({
            title: 'Are you sure?',
            text: `Are you sure you want to cancel order ${this.order.id}? This will refund the payment to the customer.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, cancel it!'
        }).then((result) => {
            if (result.isConfirmed) {
                this.orderService.cancelOrder(id).subscribe({
                    next: () => {
                        this.order.status = 'Cancelled';
                        Swal.fire(
                            'Cancelled!',
                            'Order has been cancelled successfully.',
                            'success'
                        );
                    },
                    error: (err) => {
                        console.error('Failed to cancel order', err);
                        Swal.fire(
                            'Error!',
                            'Failed to cancel order: ' + (err.error?.message || 'Unknown error'),
                            'error'
                        );
                    }
                });
            }
        });
    }

    goBack() {
        this.router.navigate(['/seller/orders']);
    }
}
