import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrimeIcons } from 'primeng/api';

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

interface OrderItem {
  name: string;
  qty: number;
  price: number;
}

interface Order {
  id: number;
  orderNo: string;
  customerName: string;
  phone: string;
  address: string;
  status: OrderStatus;
  createdAt: Date;
  items: OrderItem[];
  sellerEarnings?: number;
  sellerId?: number; // Add seller ID to identify which seller owns this order
}

@Component({
  selector: 'app-seller-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class SellerOrdersComponent implements OnInit {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  
  // Current seller ID (in real app, this would come from authentication service)
  // This ensures sellers can only see their own orders
  currentSellerId = 1; // Simulating logged-in seller with ID 1
  
  searchTerm = '';
  selectedStatus: OrderStatus | 'all' = 'all';
  
  viewModalVisible = false;
  selectedOrder: Order | null = null;
  
  // Add Order Modal
  addOrderModalVisible = false;
  newOrder = {
    customerName: '',
    phone: '',
    address: '',
    items: [{ name: '', qty: 1, price: 0 }]
  };

  deleteConfirmVisible = false;
  orderToDelete: Order | null = null;

  createConfirmVisible = false;

  successPopupVisible = false;
  successMessage = '';

  errorPopupVisible = false;
  errorMessage = '';
  
  // Seller Stats
  sellerStats = {
    totalOrders: 0,
    totalEarnings: 0,
    pendingOrders: 0,
    deliveredOrders: 0
  };

  ngOnInit(): void {
    this.loadDummy();
    this.applyFilters();
    this.calculateSellerStats();
  }

  private isCurrentSellerOrder(order: Order): boolean {
    return order.sellerId === this.currentSellerId;
  }

  private ensureCurrentSellerOrder(order: Order): boolean {
    if (!this.isCurrentSellerOrder(order)) {
      this.showError('Access denied: You can only manage your own orders.');
      return false;
    }
    return true;
  }

  loadDummy(): void {
    this.orders = [
      {
        id: 1,
        orderNo: 'ORD-1001',
        customerName: 'Ali Khan',
        phone: '0300-1111111',
        address: 'Lahore, Punjab',
        status: 'pending',
        createdAt: new Date('2026-01-10'),
        items: [
          { name: 'iPhone 15 Pro', qty: 1, price: 899 },
          { name: 'AirPods Pro', qty: 1, price: 199 }
        ],
        sellerEarnings: 899,
        sellerId: 1 // This seller's order
      },
      {
        id: 2,
        orderNo: 'ORD-1002',
        customerName: 'Fatima Noor',
        phone: '0301-2222222',
        address: 'Karachi, Sindh',
        status: 'processing',
        createdAt: new Date('2026-01-12'),
        items: [{ name: 'Sony WH-1000XM5', qty: 1, price: 349 }],
        sellerEarnings: 349,
        sellerId: 1 // This seller's order
      },
      {
        id: 3,
        orderNo: 'ORD-1003',
        customerName: 'Usman Ahmad',
        phone: '0302-3333333',
        address: 'Islamabad, ICT',
        status: 'shipped',
        createdAt: new Date('2026-01-14'),
        items: [{ name: 'MacBook Pro 16"', qty: 1, price: 2299 }],
        sellerEarnings: 2299,
        sellerId: 2 // Different seller's order (won't show for current seller)
      },
      {
        id: 4,
        orderNo: 'ORD-1004',
        customerName: 'Ayesha Malik',
        phone: '0303-4444444',
        address: 'Faisalabad, Punjab',
        status: 'delivered',
        createdAt: new Date('2026-01-05'),
        items: [
          { name: 'Nike Air Max 270', qty: 2, price: 120 },
          { name: 'T-Shirt', qty: 3, price: 15 }
        ],
        sellerEarnings: 285,
        sellerId: 1 // This seller's order
      },
      {
        id: 5,
        orderNo: 'ORD-1005',
        customerName: 'Hamza Sheikh',
        phone: '0304-5555555',
        address: 'Multan, Punjab',
        status: 'cancelled',
        createdAt: new Date('2026-01-08'),
        items: [{ name: 'Samsung 4K Smart TV', qty: 1, price: 699 }],
        sellerEarnings: 0,
        sellerId: 2 // Different seller's order (won't show for current seller)
      }
    ];
    
    // Filter orders to show only current seller's orders
    this.orders = this.orders.filter(order => order.sellerId === this.currentSellerId);
  }

  applyFilters(): void {
    const q = this.searchTerm.trim().toLowerCase();

    // Double security: Filter by current seller ID AND search criteria
    this.filteredOrders = this.orders.filter(o => {
      // First ensure order belongs to current seller
      if (o.sellerId !== this.currentSellerId) {
        return false;
      }

      const matchesSearch =
        !q ||
        o.orderNo.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.phone.toLowerCase().includes(q);

      const matchesStatus = this.selectedStatus === 'all' || o.status === this.selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = 'all';
    this.applyFilters();
  }

  openView(order: Order): void {
    if (!this.ensureCurrentSellerOrder(order)) {
      return;
    }

    this.selectedOrder = order;
    this.viewModalVisible = true;
  }

  closeView(): void {
    this.viewModalVisible = false;
    this.selectedOrder = null;
  }

  getStatusLabel(status: OrderStatus): string {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'processing':
        return 'Processing';
      case 'shipped':
        return 'Shipped';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
    }
  }

  getOrderTotal(order: Order): number {
    return order.items.reduce((sum, it) => sum + it.qty * it.price, 0);
  }

  formatPrice(amount: number): string {
    return '$' + amount.toFixed(2);
  }

  updateOrderStatus(order: Order, newStatus: OrderStatus): void {
    if (!this.ensureCurrentSellerOrder(order)) {
      return;
    }

    order.status = newStatus;
    if (newStatus === 'delivered') {
      order.sellerEarnings = this.getOrderTotal(order);
    } else if (newStatus === 'cancelled') {
      order.sellerEarnings = 0;
    }
    this.calculateSellerStats(); // Recalculate stats after status update
  }

  // Add order methods
  openAddOrder(): void {
    this.addOrderModalVisible = true;
    this.newOrder = {
      customerName: '',
      phone: '',
      address: '',
      items: [{ name: '', qty: 1, price: 0 }]
    };
  }

  closeAddOrder(): void {
    this.addOrderModalVisible = false;
    this.createConfirmVisible = false;
    this.newOrder = {
      customerName: '',
      phone: '',
      address: '',
      items: [{ name: '', qty: 1, price: 0 }]
    };
  }

  showSuccess(message: string): void {
    this.successMessage = message;
    this.successPopupVisible = true;
    window.setTimeout(() => {
      this.successPopupVisible = false;
    }, 2500);
  }

  showError(message: string): void {
    this.errorMessage = message;
    this.errorPopupVisible = true;
    window.setTimeout(() => {
      this.errorPopupVisible = false;
    }, 3200);
  }

  closeSuccessPopup(): void {
    this.successPopupVisible = false;
  }

  closeErrorPopup(): void {
    this.errorPopupVisible = false;
  }

  addOrderItem(): void {
    this.newOrder.items.push({ name: '', qty: 1, price: 0 });
  }

  removeOrderItem(index: number): void {
    if (this.newOrder.items.length > 1) {
      this.newOrder.items.splice(index, 1);
    }
  }

  openCreateConfirm(): void {
    if (!this.newOrder.customerName || !this.newOrder.phone || !this.newOrder.address) {
      this.showError('Please fill in all customer details');
      return;
    }

    const validItems = this.newOrder.items.filter(item => item.name && item.price > 0);
    if (validItems.length === 0) {
      this.showError('Please add at least one valid item');
      return;
    }

    this.createConfirmVisible = true;
  }

  closeCreateConfirm(): void {
    this.createConfirmVisible = false;
  }

  confirmCreate(): void {
    if (!this.createConfirmVisible) {
      return;
    }
    this.createConfirmVisible = false;
    this.saveOrderInternal();
  }

  private saveOrderInternal(): void {
    const validItems = this.newOrder.items.filter(item => item.name && item.price > 0);

    const newOrder: Order = {
      id: Math.max(...this.orders.map(o => o.id)) + 1,
      orderNo: 'ORD-' + (1000 + this.orders.length + 1),
      customerName: this.newOrder.customerName,
      phone: this.newOrder.phone,
      address: this.newOrder.address,
      status: 'pending',
      createdAt: new Date(),
      items: validItems,
      sellerEarnings: 0,
      sellerId: this.currentSellerId // Security: Always assign to current seller
    };

    this.orders.unshift(newOrder);
    this.applyFilters();
    this.calculateSellerStats(); // Recalculate stats after adding new order
    this.closeAddOrder();
    this.showSuccess('Order placed successfully');
  }

  getNewOrderTotal(): number {
    return this.newOrder.items.reduce((sum, item) => sum + (item.qty * item.price), 0);
  }

  calculateSellerStats(): void {
    this.sellerStats = {
      totalOrders: this.orders.length,
      totalEarnings: this.orders.reduce((sum, order) => sum + (order.sellerEarnings || 0), 0),
      pendingOrders: this.orders.filter(o => o.status === 'pending').length,
      deliveredOrders: this.orders.filter(o => o.status === 'delivered').length
    };
  }

  openDeleteConfirm(order: Order): void {
    if (!this.ensureCurrentSellerOrder(order)) {
      return;
    }
    this.orderToDelete = order;
    this.deleteConfirmVisible = true;
  }

  closeDeleteConfirm(): void {
    this.deleteConfirmVisible = false;
    this.orderToDelete = null;
  }

  confirmDelete(): void {
    if (!this.orderToDelete) {
      return;
    }

    const order = this.orderToDelete;
    const index = this.orders.findIndex(o => o.id === order.id);
    if (index > -1) {
      this.orders.splice(index, 1);
      this.applyFilters();
      this.calculateSellerStats();
      this.showSuccess('Order deleted successfully');
    }

    this.closeDeleteConfirm();
  }
}
