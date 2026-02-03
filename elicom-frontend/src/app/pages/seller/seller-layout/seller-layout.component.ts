import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { StoreService } from '../../../services/store.service';

@Component({
    selector: 'app-seller-layout',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './seller-layout.component.html',
    styleUrls: ['./seller-layout.component.scss']
})
export class SellerLayoutComponent implements OnInit {
    private router = inject(Router);
    private authService = inject(AuthService);
    private storeService = inject(StoreService);

    isSidebarCollapsed = false;
    currentUser: any = null;
    currentStore: any = null;
    showProfileModal = false;

    ngOnInit() {
        this.currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        this.loadMyStore();
    }

    loadMyStore() {
        this.storeService.getMyStore().subscribe({
            next: (res: any) => {
                this.currentStore = res?.result || res;
            },
            error: (err) => {
                console.error('Failed to load store in layout:', err);
            }
        });
    }

    toggleSidebar() {
        this.isSidebarCollapsed = !this.isSidebarCollapsed;
    }

    openProfileModal() {
        this.showProfileModal = true;
    }

    closeProfileModal() {
        this.showProfileModal = false;
    }

    logout() {
        this.authService.logout();
    }
}
