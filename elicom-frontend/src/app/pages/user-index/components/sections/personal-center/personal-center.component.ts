import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-personal-center',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="dashboard-pad">
      <h2>My Dashboard</h2>
      <p>Welcome to your personal center.</p>
      
      <!-- Placeholder grids -->
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top:30px;">
        <div style="border:1px solid #eee; padding:20px; border-radius:8px;">
            <h3>Recent Orders</h3>
            <p>No recent orders found.</p>
        </div>
        <div style="border:1px solid #eee; padding:20px; border-radius:8px;">
            <h3>Address Book</h3>
            <p>Default Shipping Address...</p>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .dashboard-pad { padding: 30px; }
    h2 { font-weight: 700; margin-bottom: 10px; }
  `]
})
export class PersonalCenterComponent { }
