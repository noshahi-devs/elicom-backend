import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../../../../services/order.service';
import { CustomerProfileService } from '../../../../../services/customer-profile.service';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="section-container">
      <h2>My Orders</h2>
      
      <div class="tabs">
        <div class="tab" [class.active]="activeTab === 'all'" (click)="setTab('all')">All</div>
        <div class="tab" [class.active]="activeTab === 'pending'" (click)="setTab('pending')">Pending</div>
        <div class="tab" [class.active]="activeTab === 'processing'" (click)="setTab('processing')">Processing</div>
        <div class="tab" [class.active]="activeTab === 'delivered'" (click)="setTab('delivered')">Delivered</div>
      </div>

      <div class="orders-list">
        <div class="loading" *ngIf="isLoading">Loading orders...</div>

        <!-- Orders Table -->
        <table class="order-table" *ngIf="!isLoading && filteredOrders.length > 0">
          <thead>
            <tr>
              <th>Order Number</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let order of filteredOrders">
              <td><strong>#{{order.orderNumber}}</strong></td>
              <td>{{order.creationTime | date:'shortDate'}}</td>
              <td>\${{order.totalAmount}}</td>
              <td><span class="status-badge" [attr.data-status]="order.status">{{order.status}}</span></td>
              <td><button class="btn-view" (click)="viewDetails(order)">View</button></td>
            </tr>
          </tbody>
        </table>

        <!-- Empty State -->
        <div class="empty-state" *ngIf="!isLoading && filteredOrders.length === 0">
            <i class="fas fa-box-open"></i>
            <p>You have no {{activeTab === 'all' ? '' : activeTab}} orders yet.</p>
            <button class="btn-shop" (click)="goToShop()">Start Shopping</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .section-container { padding: 30px; }
    h2 { font-weight: 700; margin-bottom: 20px; }
    .tabs { display: flex; gap: 30px; border-bottom: 1px solid #eee; margin-bottom: 20px; }
    .tab { padding-bottom: 10px; cursor: pointer; color: #666; font-weight: 500; }
    .tab.active { border-bottom: 2px solid #222; color: #222; }
    
    .order-table { width: 100%; border-collapse: collapse; }
    .order-table th { text-align: left; padding: 12px; border-bottom: 2px solid #eee; color: #666; font-size: 14px; }
    .order-table td { padding: 15px 12px; border-bottom: 1px solid #f5f5f5; font-size: 14px; }
    
    .status-badge { 
      padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: capitalize;
    }
    .status-badge[data-status="Pending"] { background: #fff8e1; color: #f57f17; }
    .status-badge[data-status="Processing"] { background: #e3f2fd; color: #1976d2; }
    .status-badge[data-status="Delivered"] { background: #e8f5e9; color: #2e7d32; }
    .status-badge[data-status="Cancelled"] { background: #ffebee; color: #c62828; }

    .btn-view { border: 1px solid #ddd; background: #fff; padding: 5px 15px; border-radius: 4px; cursor: pointer; font-size: 13px; }
    .btn-view:hover { background: #f5f5f5; }

    .empty-state { text-align: center; padding: 50px; color: #999; }
    .empty-state i { font-size: 48px; margin-bottom: 15px; color: #ddd; }
    .btn-shop { padding: 10px 25px; background: #222; color: #fff; border: none; border-radius: 4px; margin-top: 15px; cursor: pointer; }
    .loading { text-align: center; padding: 40px; color: #666; }
  `]
})
export class MyOrdersComponent implements OnInit {
  private orderService = inject(OrderService);
  private profileService = inject(CustomerProfileService);

  orders: any[] = [];
  filteredOrders: any[] = [];
  isLoading = true;
  activeTab = 'all';

  ngOnInit(): void {
    this.loadOrders();
  }

  async loadOrders() {
    this.isLoading = true;
    try {
      const userIdStr = localStorage.getItem('userId');
      if (userIdStr) {
        const userId = parseInt(userIdStr);
        this.orderService.getCustomerOrders(userId).subscribe(res => {
          this.orders = res;
          this.filterOrders();
          this.isLoading = false;
        });
      } else {
        this.isLoading = false;
      }
    } catch (error) {
      console.error('Failed to load orders', error);
      this.isLoading = false;
    }
  }

  setTab(tab: string) {
    this.activeTab = tab;
    this.filterOrders();
  }

  filterOrders() {
    if (this.activeTab === 'all') {
      this.filteredOrders = this.orders;
    } else {
      this.filteredOrders = this.orders.filter(o => o.status?.toLowerCase() === this.activeTab);
    }
  }

  viewDetails(order: any) {
    // Navigate to order details if implemented
    console.log('View order details:', order);
  }

  goToShop() {
    window.location.href = '/';
  }
}
