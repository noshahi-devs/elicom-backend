import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-my-orders',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="section-container">
      <h2>My Orders</h2>
      
      <div class="tabs">
        <div class="tab active">All</div>
        <div class="tab">Unpaid</div>
        <div class="tab">Processing</div>
        <div class="tab">Shipped</div>
        <div class="tab">Returns</div>
      </div>

      <div class="orders-list">
        <!-- Empty State -->
        <div class="empty-state">
            <i class="fas fa-box-open"></i>
            <p>You have no orders yet.</p>
            <button class="btn-shop">Start Shopping</button>
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
    .empty-state {
        text-align: center;
        padding: 50px;
        color: #999;
    }
    .empty-state i { font-size: 48px; margin-bottom: 15px; color: #ddd; }
    .btn-shop {
        padding: 10px 25px;
        background: #222;
        color: #fff;
        border: none;
        border-radius: 4px;
        margin-top: 15px;
        cursor: pointer;
    }
  `]
})
export class MyOrdersComponent { }
