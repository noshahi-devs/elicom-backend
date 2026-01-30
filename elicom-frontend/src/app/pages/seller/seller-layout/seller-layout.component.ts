import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
    selector: 'app-seller-layout',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './seller-layout.component.html',
    styleUrls: ['./seller-layout.component.scss']
})
export class SellerLayoutComponent implements OnInit {
    private router = inject(Router);
    isSidebarCollapsed = false;
    currentUser: any = null;

    ngOnInit() {
        this.currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        // Basic role check
        const isSeller = this.currentUser.userName?.startsWith('SS_') && this.currentUser.userName?.includes('Seller');
        if (!isSeller) {
            // this.router.navigate(['/']); // Uncomment for strict enforcement
        }
    }

    toggleSidebar() {
        this.isSidebarCollapsed = !this.isSidebarCollapsed;
    }

    logout() {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('accessToken');
        this.router.navigate(['/']);
    }
}
