import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Order {
  orderNumber: string;
  orderDate: Date;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  items: any[];
}

@Component({
  selector: 'app-orders',
  standalone: false,
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class OrdersComponent implements OnInit {
  user: User | null = null;
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  selectedStatus: string = 'all';

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadUser();
    this.loadOrders();
  }

  private loadUser(): void {
    // TODO: Replace with actual user service
    this.user = {
      id: 'user-1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com'
    };
  }

  private loadOrders(): void {
    // TODO: Replace with actual order service
    this.orders = [
      {
        orderNumber: 'ORD-001',
        orderDate: new Date('2024-01-15'),
        status: 'delivered',
        total: 598,
        items: [
          {
            product: {
              id: 'prod-1',
              name: 'Premium Wireless Headphones',
              price: 299,
              image: 'https://via.placeholder.com/100'
            },
            quantity: 1,
            size: 'M',
            color: 'Black'
          },
          {
            product: {
              id: 'prod-2',
              name: 'Smart Watch',
              price: 199,
              image: 'https://via.placeholder.com/100'
            },
            quantity: 1,
            size: 'L',
            color: 'Silver'
          }
        ]
      },
      {
        orderNumber: 'ORD-002',
        orderDate: new Date('2024-01-20'),
        status: 'processing',
        total: 299,
        items: [
          {
            product: {
              id: 'prod-3',
              name: 'Laptop Stand',
              price: 299,
              image: 'https://via.placeholder.com/100'
            },
            quantity: 1,
            size: 'Standard',
            color: 'Gray'
          }
        ]
      }
    ];

    this.filteredOrders = [...this.orders];
  }

  filterOrders(): void {
    if (this.selectedStatus === 'all') {
      this.filteredOrders = [...this.orders];
    } else {
      this.filteredOrders = this.orders.filter(order => order.status === this.selectedStatus);
    }
  }

  viewOrderDetails(order: Order): void {
    // TODO: Navigate to order details page
    console.log('View order details:', order);
    alert(`Order ${order.orderNumber} details`);
  }

  trackOrder(order: Order): void {
    // TODO: Implement order tracking
    console.log('Track order:', order);
    alert(`Tracking order ${order.orderNumber}`);
  }

  cancelOrder(order: Order): void {
    if (confirm(`Are you sure you want to cancel order ${order.orderNumber}?`)) {
      // TODO: Implement order cancellation
      console.log('Cancel order:', order);
      order.status = 'cancelled';
      this.filterOrders();
      alert('Order cancelled successfully');
    }
  }
}
