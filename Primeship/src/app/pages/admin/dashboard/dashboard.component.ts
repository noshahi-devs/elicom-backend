import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../../core/services/order.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  statsCards = [
    {
      title: 'Total Revenue',
      value: '$0',
      change: '+0%',
      trend: 'up',
      icon: '💰',
      color: 'success',
      gradient: 'linear-gradient(135deg, #f85606 0%, #ff8c42 100%)'
    },
    {
      title: 'Total Orders',
      value: '0',
      change: '+0%',
      trend: 'up',
      icon: '🛒',
      color: 'info',
      gradient: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
    },
    {
      title: 'Active Sellers',
      value: '0',
      change: '+0%',
      trend: 'up',
      icon: '🏪',
      color: 'warning',
      gradient: 'linear-gradient(135deg, #f85606 0%, #b43d04 100%)'
    },
  ];

  recentOrders: any[] = [];

  constructor(
    private orderService: OrderService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadAdminStats();
  }

  loadAdminStats(): void {
    this.orderService.getAllOrders().subscribe({
      next: (res) => {
        this.processAdminStats(res);
        this.recentOrders = res.slice(0, 5);
      },
      error: (err) => {
        console.error('Failed to load admin stats', err);
      }
    });
  }

  private processAdminStats(orders: any[]): void {
    const totalRevenue = orders.reduce((sum, o) => sum + (o.totalPurchaseAmount || 0), 0);
    const orderCount = orders.length;

    // Count unique sellers and unique products
    const uniqueSellers = new Set();
    const uniqueProducts = new Set();

    orders.forEach(o => {
      if (o.sellerId) uniqueSellers.add(o.sellerId);
      if (o.items) {
        o.items.forEach((it: any) => uniqueProducts.add(it.name));
      }
    });

    this.statsCards[0].value = '$' + totalRevenue.toLocaleString();
    this.statsCards[1].value = orderCount.toString();
    this.statsCards[2].value = uniqueSellers.size.toString();
    this.statsCards[3].value = uniqueProducts.size.toString();
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

  onQuickAction(route: string) {
    this.router.navigate([route]);
  }
}
