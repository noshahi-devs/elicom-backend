import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  // Stats Cards Data
  statsCards = [
    {
      title: 'Total Revenue',
      value: '$124,563',
      change: '+12.5%',
      trend: 'up',
      icon: '💰',
      color: 'success',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      title: 'Total Orders',
      value: '1,234',
      change: '+8.2%',
      trend: 'up',
      icon: '🛒',
      color: 'info',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
      title: 'Active Customers',
      value: '8,456',
      change: '+15.3%',
      trend: 'up',
      icon: '👥',
      color: 'warning',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    },
    {
      title: 'Total Products',
      value: '456',
      change: '-2.1%',
      trend: 'down',
      icon: '📦',
      color: 'danger',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    }
  ];

  // Recent Orders
  recentOrders = [
    {
      id: '#12345',
      customer: 'John Doe',
      product: 'iPhone 15 Pro',
      amount: '$1,199',
      status: 'completed',
      date: '2024-01-20',
      avatar: '/assets/images/71fhEWlRnBL._AC_SX679_.jpg'
    },
    {
      id: '#12346',
      customer: 'Jane Smith',
      product: 'MacBook Air M2',
      amount: '$1,299',
      status: 'processing',
      date: '2024-01-20',
      avatar: '/assets/images/81Ec4jJZ-dL._AC_SX679_.jpg'
    },
    {
      id: '#12347',
      customer: 'Bob Johnson',
      product: 'AirPods Pro',
      amount: '$249',
      status: 'pending',
      date: '2024-01-19',
      avatar: '/assets/images/61BKAbqOL5L._AC_SX679_.jpg'
    },
    {
      id: '#12348',
      customer: 'Alice Brown',
      product: 'iPad Air',
      amount: '$599',
      status: 'completed',
      date: '2024-01-19',
      avatar: '/assets/images/81WVHwqiT7L._AC_SX679_.jpg'
    }
  ];

  // Top Products
  topProducts = [
    {
      name: 'iPhone 15 Pro',
      sales: 234,
      revenue: '$280,266',
      stock: 45,
      trend: 'up',
      image: '/assets/images/81WVHwqiT7L._AC_SX679_.jpg'
    },
    {
      name: 'MacBook Air M2',
      sales: 156,
      revenue: '$202,644',
      stock: 23,
      trend: 'up',
      image: '/assets/images/61ZY6ZP0V6L._AC_SL1024_.jpg'
    },
    {
      name: 'AirPods Pro',
      sales: 445,
      revenue: '$110,805',
      stock: 89,
      trend: 'down',
      image: '/assets/images/71iF4G8NVfL._AC_SX679_.jpg'
    },
    {
      name: 'iPad Air',
      sales: 123,
      revenue: '$73,677',
      stock: 34,
      trend: 'stable',
      image: '/assets/images/81j8RchuiLL._AC_SX679_.jpg'
    }
  ];

  // Sales Chart Data (Mock)
  salesChartData = [
    { month: 'Jan', sales: 45000 },
    { month: 'Feb', sales: 52000 },
    { month: 'Mar', sales: 48000 },
    { month: 'Apr', sales: 61000 },
    { month: 'May', sales: 58000 },
    { month: 'Jun', sales: 67000 }
  ];

  // Quick Actions
  quickActions = [
    { title: 'Add Product', icon: '➕', route: '/admin/products/add', color: 'primary' },
    { title: 'View Orders', icon: '📋', route: '/admin/orders', color: 'info' },
    { title: 'Manage Customers', icon: '👥', route: '/admin/customers', color: 'success' },
    { title: 'Generate Report', icon: '📊', route: '/admin/reports', color: 'warning' }
  ];

  constructor() { }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      completed: 'success',
      processing: 'warning',
      pending: 'info',
      cancelled: 'danger'
    };
    return colors[status] || 'info';
  }

  getTrendIcon(trend: string): string {
    const icons: { [key: string]: string } = {
      up: '📈',
      down: '📉',
      stable: '➡️'
    };
    return icons[trend] || '➡️';
  }

  onQuickAction(action: any) {
    console.log('Quick action clicked:', action);
    // Navigate to the route
  }

  viewOrderDetails(orderId: string) {
    console.log('View order details:', orderId);
    // Navigate to order details
  }

  viewProductDetails(productName: string) {
    console.log('View product details:', productName);
    // Navigate to product details
  }
}
