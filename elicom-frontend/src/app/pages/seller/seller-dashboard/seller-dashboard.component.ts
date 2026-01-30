import { Component, OnInit, AfterViewInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

declare var Chart: any;

@Component({
    selector: 'app-seller-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './seller-dashboard.component.html',
    styleUrls: ['./seller-dashboard.component.scss']
})
export class SellerDashboardComponent implements OnInit, AfterViewInit {
    private authService = inject(AuthService);
    private platformId = inject(PLATFORM_ID);

    isSidebarCollapsed = false;
    currentUser: any = null;

    ngOnInit() {
        this.currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    }

    ngAfterViewInit() {
        if (isPlatformBrowser(this.platformId)) {
            this.initCharts();
        }
    }

    toggleSidebar() {
        this.isSidebarCollapsed = !this.isSidebarCollapsed;
    }

    private initCharts() {
        // Initialize the mini charts in stat cards
        this.createMiniChart('chart1', [30, 45, 35, 50, 40, 60, 55], '#fff');
        this.createMiniChart('chart2', [10, 20, 15, 25, 22, 30, 28], '#fff');
        this.createMiniChart('chart3', [50, 40, 45, 30, 35, 20, 25], '#fff');
        this.createMiniChart('chart4', [20, 30, 40, 35, 50, 45, 60], '#fff');

        // Main Growth Analysis charts
        this.createMainChart('salesChart', 'Line', [1200, 1900, 1500, 2100, 2400, 2200, 2800], '#4F46E5');
        this.createMainChart('orderChart', 'Bar', [45, 60, 55, 70, 85, 80, 95], '#10B981');
    }

    private createMiniChart(id: string, data: number[], color: string) {
        const el = document.getElementById(id) as HTMLCanvasElement;
        if (!el) return;

        new Chart(el, {
            type: 'line',
            data: {
                labels: data.map((_, i) => i),
                datasets: [{
                    data: data,
                    borderColor: color,
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: false,
                    tension: 0.4
                }]
            },
            options: {
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                scales: { x: { display: false }, y: { display: false } },
                maintainAspectRatio: false
            }
        });
    }

    private createMainChart(id: string, type: 'Line' | 'Bar', data: number[], color: string) {
        const el = document.getElementById(id) as HTMLCanvasElement;
        if (!el) return;

        new Chart(el, {
            type: type.toLowerCase(),
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'This Week',
                    data: data,
                    backgroundColor: type === 'Bar' ? `${color}33` : 'transparent',
                    borderColor: color,
                    borderWidth: 2,
                    tension: 0.4,
                    fill: type === 'Bar'
                }]
            },
            options: {
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { display: false } },
                    x: { grid: { display: false } }
                },
                maintainAspectRatio: false
            }
        });
    }
}
