import { Component, OnInit, OnDestroy } from '@angular/core';
import { OrderService, Order, OrderStatus } from '../../../core/services/order.service';
import { Subscription } from 'rxjs';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PrimeIcons } from 'primeng/api';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [OrderService],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss'],
  animations: [
    trigger('slideInOut', [
      state('in', style({
        transform: 'translateY(0)',
        opacity: 1
      })),
      state('out', style({
        transform: 'translateY(-100%)',
        opacity: 0
      })),
      transition('out => in', [
        animate('0.3s ease-out')
      ]),
      transition('in => out', [
        animate('0.3s ease-in')
      ])
    ])
  ]
})
export class OrdersComponent implements OnInit, OnDestroy {
  orders: Order[] = [];
  filteredOrders: Order[] = [];

  searchTerm = '';
  selectedStatus: OrderStatus | 'all' = 'all';
  selectedSeller: number | 'all' = 'all'; // Admin can filter by seller

  viewModalVisible = false;
  selectedOrder: Order | null = null;

  // Status update modal properties
  statusUpdateModalVisible = false;
  orderForStatusUpdate: Order | null = null;
  selectedNewStatus: OrderStatus = 'pending';

  // Available statuses as const array
  availableStatuses: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  // Success popup properties
  showSuccessPopup = false;
  updatedOrderNumber = '';
  updatedStatusText = '';
  private successTimeout: any;

  // Delete success popup properties
  showDeleteSuccessPopup = false;
  deletedOrderNumber = '';
  private deleteSuccessTimeout: any;

  // Delete modal properties
  deleteModalVisible = false;
  orderToDelete: Order | null = null;

  // Admin-specific properties
  adminStats = {
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    deliveredOrders: 0
  };

  private ordersSubscription: Subscription = new Subscription();

  constructor(private orderService: OrderService) { }

  ngOnInit(): void {
    // Subscribe to orders from service
    this.ordersSubscription = this.orderService.getAllOrders().subscribe(orders => {
      this.orders = orders;
      this.applyFilters();
      this.calculateAdminStats();
    });
  }

  ngOnDestroy(): void {
    if (this.ordersSubscription) {
      this.ordersSubscription.unsubscribe();
    }
  }

  // Admin can delete orders
  deleteOrder(order: Order): void {
    this.orderToDelete = order;
    this.deleteModalVisible = true;
  }

  closeDeleteModal(): void {
    this.deleteModalVisible = false;
    this.orderToDelete = null;
  }

  confirmDelete(): void {
    if (this.orderToDelete) {
      const orderNumber = this.orderToDelete.orderNo;
      this.orderService.deleteOrder(this.orderToDelete.id);

      // Show delete success popup
      this.showDeleteSuccessPopup = true;
      this.deletedOrderNumber = orderNumber;

      // Auto-hide after 3 seconds
      this.deleteSuccessTimeout = setTimeout(() => {
        this.hideDeleteSuccessPopup();
      }, 3000);

      // Stats will be updated automatically through the subscription
      this.closeDeleteModal();
    }
  }

  hideDeleteSuccessPopup(): void {
    this.showDeleteSuccessPopup = false;
    if (this.deleteSuccessTimeout) {
      clearTimeout(this.deleteSuccessTimeout);
    }
  }

  // Admin can assign orders to sellers
  assignOrderToSeller(order: Order, sellerId: number, sellerName: string): void {
    order.sellerId = sellerId;
    order.sellerName = sellerName;
    this.applyFilters();
  }

  // Status update methods
  openStatusUpdate(order: Order): void {
    this.orderForStatusUpdate = order;
    this.selectedNewStatus = order.status;
    this.statusUpdateModalVisible = true;
  }

  closeStatusUpdate(): void {
    this.statusUpdateModalVisible = false;
    this.orderForStatusUpdate = null;
    this.selectedNewStatus = 'pending';
  }

  updateOrderStatus(): void {
    if (this.orderForStatusUpdate && this.selectedNewStatus !== this.orderForStatusUpdate.status) {
      if (this.selectedNewStatus === 'delivered') {
        this.orderService.markAsDelivered(this.orderForStatusUpdate.id).subscribe({
          next: () => {
            this.showSuccessPopup = true;
            this.updatedOrderNumber = this.orderForStatusUpdate!.orderNo;
            this.updatedStatusText = 'Delivered';
            setTimeout(() => this.hideSuccessPopup(), 3000);
            this.ngOnInit(); // Refresh list
          }
        });
      } else {
        // Fallback for other statuses - simplified for now
        this.orderForStatusUpdate.status = this.selectedNewStatus;
        this.showSuccessPopup = true;
        this.updatedOrderNumber = this.orderForStatusUpdate.orderNo;
        this.updatedStatusText = this.getStatusLabel(this.selectedNewStatus);
        setTimeout(() => this.hideSuccessPopup(), 3000);
      }
    }
    this.closeStatusUpdate();
  }

  hideSuccessPopup(): void {
    this.showSuccessPopup = false;
    if (this.successTimeout) {
      clearTimeout(this.successTimeout);
    }
  }

  applyFilters(): void {
    const q = this.searchTerm.trim().toLowerCase();

    this.filteredOrders = this.orders.filter(o => {
      const matchesSearch =
        !q ||
        o.orderNo.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.phone.toLowerCase().includes(q) ||
        (o.sellerName && o.sellerName.toLowerCase().includes(q));

      const matchesStatus = this.selectedStatus === 'all' || o.status === this.selectedStatus;
      const matchesSeller = this.selectedSeller === 'all' || o.sellerId === this.selectedSeller;

      return matchesSearch && matchesStatus && matchesSeller;
    });
  }

  calculateAdminStats(): void {
    this.adminStats = {
      totalOrders: this.orders.length,
      totalRevenue: this.orders.reduce((sum, order) => sum + this.getOrderTotal(order), 0),
      pendingOrders: this.orders.filter(o => o.status === 'pending').length,
      deliveredOrders: this.orders.filter(o => o.status === 'delivered').length
    };
  }

  // Admin-specific methods
  getAllSellers(): { id: number; name: string }[] {
    const sellers = new Map<number, string>();
    this.orders.forEach(order => {
      if (order.sellerId && order.sellerName) {
        sellers.set(order.sellerId, order.sellerName);
      }
    });
    return Array.from(sellers.entries()).map(([id, name]) => ({ id, name }));
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = 'all';
    this.selectedSeller = 'all';
    this.applyFilters();
  }

  openView(order: Order): void {
    this.selectedOrder = order;
    this.viewModalVisible = true;
  }

  closeView(): void {
    this.viewModalVisible = false;
    this.selectedOrder = null;
  }

  getStatusLabel(status: OrderStatus | string): string {
    const statusValue = typeof status === 'string' ? status : status;
    switch (statusValue) {
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
      default:
        return statusValue;
    }
  }

  getStatusDescription(status: OrderStatus | string): string {
    const statusValue = typeof status === 'string' ? status : status;
    switch (statusValue) {
      case 'pending':
        return 'Order received, awaiting processing';
      case 'processing':
        return 'Order is being prepared for shipment';
      case 'shipped':
        return 'Order has been shipped and is in transit';
      case 'delivered':
        return 'Order has been successfully delivered';
      case 'cancelled':
        return 'Order has been cancelled';
      default:
        return 'Status: ' + statusValue;
    }
  }

  getStatusStyle(status: OrderStatus | string): any {
    const statusValue = typeof status === 'string' ? status : status;
    switch (statusValue) {
      case 'pending':
        return { backgroundColor: '#fef3c7', color: '#92400e' };
      case 'processing':
        return { backgroundColor: '#dbeafe', color: '#1d4ed8' };
      case 'shipped':
        return { backgroundColor: '#e9d5ff', color: '#6b21a8' };
      case 'delivered':
        return { backgroundColor: '#d1fae5', color: '#065f46' };
      case 'cancelled':
        return { backgroundColor: '#fee2e2', color: '#991b1b' };
      default:
        return { backgroundColor: '#f3f4f6', color: '#374151' };
    }
  }

  getStatusIcon(status: OrderStatus | string): string {
    const statusValue = typeof status === 'string' ? status : status;
    switch (statusValue) {
      case 'pending':
        return 'pi-clock';
      case 'processing':
        return 'pi-cog';
      case 'shipped':
        return 'pi-truck';
      case 'delivered':
        return 'pi-check-circle';
      case 'cancelled':
        return 'pi-times-circle';
      default:
        return 'pi-question-circle';
    }
  }

  getOrderTotal(order: Order): number {
    return order.items.reduce((sum, it) => sum + it.qty * it.price, 0);
  }

  formatPrice(amount: number): string {
    return '$' + amount.toFixed(2);
  }
}
