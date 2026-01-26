import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-seller-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seller-dashboard.component.html',
  styleUrls: ['./seller-dashboard.component.scss']
})
export class SellerDashboardComponent {
  // Seller Stats
  sellerStats = [
    {
      title: 'Total Revenue',
      value: '$45,230',
      change: '+18.2%',
      trend: 'up',
      icon: '💰',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      title: 'My Products',
      value: '23',
      change: '+2',
      trend: 'up',
      icon: '📦',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
      title: 'Total Orders',
      value: '156',
      change: '+12.5%',
      trend: 'up',
      icon: '🛒',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    },
    {
      title: 'Avg. Rating',
      value: '4.8',
      change: '+0.2',
      trend: 'up',
      icon: '⭐',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    }
  ];

  // Recent Orders
  recentOrders = [
    {
      id: '#S12345',
      customer: 'Alice Johnson',
      product: 'iPhone 15 Pro Case',
      image: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=96&h=96&fit=crop',
      amount: '$29.99',
      status: 'completed',
      date: '2024-01-20',
      rating: 5
    },
    {
      id: '#S12346',
      customer: 'Bob Smith',
      product: 'MacBook Air Sleeve',
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=96&h=96&fit=crop',
      amount: '$39.99',
      status: 'processing',
      date: '2024-01-20',
      rating: null
    },
    {
      id: '#S12347',
      customer: 'Carol Davis',
      product: 'AirPods Pro Accessories',
      image: 'https://images.unsplash.com/photo-1585386959984-a41552231693?w=96&h=96&fit=crop',
      amount: '$19.99',
      status: 'pending',
      date: '2024-01-19',
      rating: null
    }
  ];

  // My Products
  myProducts = [
    {
      name: 'iPhone 15 Pro Case',
      sales: 45,
      revenue: '$1,349.55',
      rating: 4.8,
      stock: 120,
      image: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=96&h=96&fit=crop'
    },
    {
      name: 'MacBook Air Sleeve',
      sales: 23,
      revenue: '$919.77',
      rating: 4.9,
      stock: 45,
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=96&h=96&fit=crop'
    },
    {
      name: 'AirPods Pro Accessories',
      sales: 67,
      revenue: '$1,339.33',
      rating: 4.7,
      stock: 89,
      image: 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=96&h=96&fit=crop'
    }
  ];

  // Earnings Chart Data
  earningsData = [
    { month: 'Jan', earnings: 3200 },
    { month: 'Feb', earnings: 3800 },
    { month: 'Mar', earnings: 3500 },
    { month: 'Apr', earnings: 4200 },
    { month: 'May', earnings: 4100 },
    { month: 'Jun', earnings: 4800 }
  ];

  // Quick Actions
  quickActions = [
    {
      title: 'Add New Product',
      icon: '➕',
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=96&h=96&fit=crop',
      route: '/seller/products/add'
    },
    {
      title: 'View Orders',
      icon: '📋',
      image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=96&h=96&fit=crop',
      route: '/seller/orders'
    },
    {
      title: 'Earnings Report',
      icon: '💰',
      image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=96&h=96&fit=crop',
      route: '/seller/earnings'
    },
    {
      title: 'Edit Profile',
      icon: '👤',
      image: 'https://images.unsplash.com/photo-1520975916090-3105956dac38?w=96&h=96&fit=crop',
      route: '/seller/profile'
    }
  ];

  // Inventory Alerts (New Section)
  inventoryAlerts = [
    {
      name: 'MacBook Air Sleeve',
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=96&h=96&fit=crop',
      stock: 45,
      threshold: 50,
      severity: 'warning'
    },
    {
      name: 'AirPods Pro Accessories',
      image: 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=96&h=96&fit=crop',
      stock: 12,
      threshold: 25,
      severity: 'critical'
    }
  ];

  // Customer Reviews Data
  customerReviews = [
    {
      customer: 'Sarah Johnson',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=50&h=50&fit=crop&crop=face',
      rating: 5,
      date: '2 days ago',
      comment: 'Excellent product quality and fast shipping! Very satisfied with my purchase.',
      product: 'Wireless Headphones'
    },
    {
      customer: 'Michael Chen',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face',
      rating: 4,
      date: '1 week ago',
      comment: 'Great value for money. Product works as described and customer service was helpful.',
      product: 'Smart Watch'
    },
    {
      customer: 'Emily Rodriguez',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face',
      rating: 5,
      date: '2 weeks ago',
      comment: 'Amazing quality! Will definitely order again. Highly recommended seller.',
      product: 'Laptop Stand'
    }
  ];

  constructor(private router: Router) { }

  // Navigation Methods
  navigateToOrders() {
    this.router.navigate(['/seller/orders']);
  }

  navigateToProducts() {
    this.router.navigate(['/seller/products']);
  }

  navigateToEarnings() {
    this.router.navigate(['/seller/earnings']);
  }

  navigateToProfile() {
    this.router.navigate(['/seller/profile']);
  }

  navigateToRoute(route: string) {
    this.router.navigate([route]);
  }

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

  getRatingStars(rating: number): string {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;
    
    return '⭐'.repeat(fullStars) + 
           (halfStar ? '⭐' : '') + 
           '☆'.repeat(emptyStars);
  }

  onQuickAction(action: any) {
    if (action.route) {
      this.navigateToRoute(action.route);
    }
  }

  viewOrderDetails(orderId: string) {
    this.navigateToRoute(`/seller/orders`);
  }

  viewProductDetails(productName: string) {
    this.navigateToRoute(`/seller/products`);
  }
}
