import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-order-details',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './order-details.component.html',
    styleUrls: ['./order-details.component.scss']
})
export class OrderDetailsComponent implements OnInit {
    order: any = null;
    statusOptions = ['Unshipped', 'Shipped', 'Delivered', 'Cancelled', 'Returned'];
    updatingStatus = false;

    constructor(private router: Router) { }

    ngOnInit() {
        const state = window.history.state;
        if (state && state.order) {
            this.order = state.order;
            // Add some mock details if not present
            if (!this.order.shippingAddress) {
                this.order.shippingAddress = '123 Street, City, Country';
                this.order.phone = '+1 234 567 890';
                this.order.email = 'customer@example.com';
                this.order.orderItems = [
                    { name: 'Product 1', sku: 'SKU-001', price: 150, quantity: 2, subtotal: 300, image: 'https://picsum.photos/50?random=1' },
                    { name: 'Product 2', sku: 'SKU-002', price: 150, quantity: 1, subtotal: 150, image: 'https://picsum.photos/50?random=2' }
                ];
                this.order.subtotal = 450;
                this.order.shippingFee = 20;
                this.order.tax = 30;
                this.order.grandTotal = 500;
            }
        } else {
            // Fallback for demo
            this.order = {
                id: '#ORD-78452',
                date: 'Jan 28, 2026',
                customer: 'Ali Ahmed',
                status: 'Unshipped',
                payment: 'Paid',
                shippingAddress: 'House 45, Blue Area, Islamabad, Pakistan',
                phone: '+92 300 1234567',
                email: 'ali.ahmed@example.com',
                orderItems: [
                    { name: 'Wireless Headphones', sku: 'ELEC-HP-001', price: 150, quantity: 2, subtotal: 300, image: 'https://picsum.photos/50?random=1' },
                    { name: 'Smart Watch', sku: 'WATCH-S5-002', price: 150, quantity: 1, subtotal: 150, image: 'https://picsum.photos/50?random=2' }
                ],
                subtotal: 450,
                shippingFee: 20,
                tax: 30,
                grandTotal: 500
            };
        }
    }

    updateStatus(newStatus: string) {
        this.updatingStatus = true;
        setTimeout(() => {
            this.order.status = newStatus;
            this.updatingStatus = false;
            alert(`Order status updated to ${newStatus}`);
        }, 1000);
    }

    goBack() {
        this.router.navigate(['/seller/orders']);
    }
}
