import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';

@Component({
  selector: 'app-seller-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seller-dashboard.component.html',
  styleUrls: ['./seller-dashboard.component.scss']
})
export class SellerDashboardComponent implements OnInit {
  statsCards = [
    {
      title: 'Total Spending',
      value: '$0',
      change: '+0%',
      trend: 'up',
      icon: '💰',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      title: 'Sourced Items',
      value: '0',
      change: '0',
      trend: 'up',
      icon: '📦',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
      title: 'Total Orders',
      value: '0',
      change: '+0%',
      trend: 'up',
      icon: '🛒',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    },
    {
      title: 'Pending Deliveries',
      value: '0',
      change: '0',
      trend: 'up',
      icon: '🚚',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    }
  ];

  recentOrders: any[] = [];

  constructor(
    public router: Router,
    private orderService: OrderService
  ) { }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.orderService.getAllForSupplier().subscribe({
      next: (res) => {
        this.processStats(res);
        this.recentOrders = res.slice(0, 5);
      },
      error: (err) => {
        console.error('Failed to load dashboard data', err);
      }
    });
  }

  private processStats(orders: any[]): void {
    const totalSpending = orders.reduce((sum, o) => sum + (o.totalPurchaseAmount || 0), 0);
    const orderCount = orders.length;
    const pendingCount = orders.filter(o => {
      const s = (o.status || '').toLowerCase();
      return s === 'pending' || s === 'purchased' || s === 'processing' || s === 'shipped';
    }).length;

    // Count unique products
    const uniqueProducts = new Set();
    orders.forEach(o => {
      if (o.items) {
        o.items.forEach((it: any) => uniqueProducts.add(it.name));
      }
    });

    this.statsCards[0].value = '$' + totalSpending.toLocaleString();
    this.statsCards[1].value = uniqueProducts.size.toString();
    this.statsCards[2].value = orderCount.toString();
    this.statsCards[3].value = pendingCount.toString();
  }

  navigateToOrders() {
    this.router.navigate(['/seller/orders']);
  }

  getStatusColor(status: string): string {
    if (!status) return 'info';
    const s = status.toLowerCase();
    if (s === 'delivered' || s === 'settled') return 'success';
    if (s === 'pending' || s === 'purchased') return 'warning';
    if (s === 'processing' || s === 'shipped') return 'info';
    if (s === 'cancelled') return 'danger';
    return 'info';
  }

  getStatusLabel(status: string): string {
    if (!status) return 'Unknown';
    switch (status.toLowerCase()) {
      case 'purchased':
      case 'pending': return 'Pending';
      case 'settled':
      case 'delivered': return 'Delivered';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  }
}
