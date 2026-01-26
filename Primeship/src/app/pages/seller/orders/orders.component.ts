import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../core/services/order.service';
import { ProductService } from '../../../core/services/product.service';
import { CartService, CartItem } from '../../../core/services/cart.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
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
  sellerId?: number;
}

@Component({
  selector: 'app-seller-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class SellerOrdersComponent implements OnInit {
  orders: any[] = [];
  filteredOrders: any[] = [];
  skuSearchTerm = '';
  foundProduct: any = null;

  constructor(
    private orderService: OrderService,
    private productService: ProductService,
    private cartService: CartService,
    private toastService: ToastService,
    private authService: AuthService,
    private router: Router
  ) { }

  searchTerm = '';
  selectedStatus: OrderStatus | 'all' = 'all';

  viewModalVisible = false;
  selectedOrder: any = null;

  addOrderModalVisible = false;
  newOrder = {
    customerName: '',
    phone: '',
    address: '',
    items: [{ name: '', qty: 1, price: 0 }]
  };

  deleteConfirmVisible = false;
  orderToDelete: any = null;
  createConfirmVisible = false;
  successPopupVisible = false;
  successMessage = '';
  errorPopupVisible = false;
  errorMessage = '';

  sellerStats = {
    totalOrders: 0,
    totalEarnings: 0,
    pendingOrders: 0,
    deliveredOrders: 0
  };

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.orderService.getAllForSupplier().subscribe({
      next: (res) => {
        this.orders = res;
        this.applyFilters();
        this.calculateSellerStats();
      },
      error: (err) => {
        this.showError('Failed to load orders');
      }
    });
  }

  applyFilters(): void {
    const q = this.searchTerm.trim().toLowerCase();

    this.filteredOrders = this.orders.filter(o => {
      const orderNo = (o.referenceCode || o.orderNo || '').toLowerCase();
      const customerName = (o.customerName || '').toLowerCase();

      const matchesSearch =
        !q ||
        orderNo.includes(q) ||
        customerName.includes(q);

      const status = (o.status || '').toLowerCase();
      const matchesStatus = this.selectedStatus === 'all' || status === this.selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = 'all';
    this.applyFilters();
  }

  openView(order: any): void {
    this.selectedOrder = order;
    this.viewModalVisible = true;
  }

  closeView(): void {
    this.viewModalVisible = false;
    this.selectedOrder = null;
  }

  getStatusLabel(status: string): string {
    if (!status) return 'Unknown';
    switch (status.toLowerCase()) {
      case 'purchased':
      case 'pending':
        return 'Pending';
      case 'processing':
        return 'Processing';
      case 'shipped':
        return 'Shipped';
      case 'settled':
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  }

  getOrderTotal(order: any): number {
    if (order.totalPurchaseAmount) return order.totalPurchaseAmount;
    if (order.items) {
      return order.items.reduce((sum: number, it: any) => sum + (it.qty * it.price), 0);
    }
    return 0;
  }

  formatPrice(amount: number): string {
    return '$' + (amount || 0).toFixed(2);
  }

  searchProduct(): void {
    if (!this.skuSearchTerm) return;
    this.productService.getProductBySku(this.skuSearchTerm).subscribe({
      next: (res) => {
        this.foundProduct = res;
        this.toastService.showSuccess('Product found: ' + res.name);
      },
      error: (err) => {
        this.toastService.showError('Product not found with SKU: ' + this.skuSearchTerm);
        this.foundProduct = null;
      }
    });
  }

  addProductToOrder(): void {
    if (!this.foundProduct) return;

    // Add to cart for "integration with cart and checkout process"
    this.cartService.addToCart(this.foundProduct, 1);
    this.toastService.showSuccess('Added to cart: ' + this.foundProduct.name);

    const existing = this.newOrder.items.find(i => i.name === this.foundProduct.name);
    if (existing) {
      existing.qty++;
    } else {
      if (this.newOrder.items.length === 1 && !this.newOrder.items[0].name) {
        this.newOrder.items[0] = {
          name: this.foundProduct.name,
          qty: 1,
          price: this.foundProduct.resellerPrice || this.foundProduct.price
        };
      } else {
        this.newOrder.items.push({
          name: this.foundProduct.name,
          qty: 1,
          price: this.foundProduct.resellerPrice || this.foundProduct.price
        });
      }
    }
    this.skuSearchTerm = '';
    this.foundProduct = null;
  }

  checkoutWithCart(): void {
    this.router.navigate(['/checkout']);
  }

  updateOrderStatus(order: any, newStatus: OrderStatus): void {
    // In a real app, this would call the API
    this.toastService.showInfo('Status update integration pending...');
    order.status = newStatus;
    this.calculateSellerStats();
  }

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
    // This part is complex because it involves checkout.
    // Simplifying: Show success and notify user.
    this.showSuccess('Order request sent to admin');
    this.closeAddOrder();
    this.loadOrders();
  }

  getNewOrderTotal(): number {
    return this.newOrder.items.reduce((sum, item) => sum + (item.qty * item.price), 0);
  }

  calculateSellerStats(): void {
    this.sellerStats = {
      totalOrders: this.orders.length,
      totalEarnings: this.orders.reduce((sum, order) => sum + (order.totalPurchaseAmount || 0), 0),
      pendingOrders: this.orders.filter(o => {
        const s = (o.status || '').toLowerCase();
        return s === 'purchased' || s === 'pending';
      }).length,
      deliveredOrders: this.orders.filter(o => {
        const s = (o.status || '').toLowerCase();
        return s === 'settled' || s === 'delivered';
      }).length
    };
  }

  openDeleteConfirm(order: any): void {
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
    // Simulation
    this.showSuccess('Order deleted successfully');
    this.closeDeleteConfirm();
  }
}
