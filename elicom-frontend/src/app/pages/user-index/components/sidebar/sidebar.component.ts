import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-user-sidebar',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.scss']
})
export class UserSidebarComponent {

    menuGroups: any[] = [];

    constructor() {
        this.initializeMenu();
    }

    initializeMenu() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const isSeller = currentUser.userName?.startsWith('SS_') && currentUser.userName?.includes('Seller');
        // Note: For now we check if userName has Seller type or prefix. 
        // In a real app we'd check roles from AuthService.

        const baseGroups = [
            {
                title: 'My Account',
                items: [
                    { label: 'Personal Center', route: '/user/index', exact: true },
                    { label: 'My Profile', route: '/user/index/profile', exact: false },
                ]
            }
        ];

        const customerGroups = [
            {
                title: 'My Orders',
                items: [
                    { label: 'All Orders', route: '/user/index/orders', exact: false },
                    { label: 'Returns', route: '/user/index/returns', exact: false },
                ]
            },
            {
                title: 'My Assets',
                items: [
                    { label: 'My Wallet', route: '/user/index/wallet', exact: false },
                ]
            }
        ];

        const sellerGroups = [
            {
                title: 'Seller Dashboard',
                items: [
                    { label: 'Store Overview', route: '/user/index', exact: true },
                    { label: 'My Orders', route: '/user/index/orders', exact: false },
                ]
            },
            {
                title: 'Store Management',
                items: [
                    { label: 'Create New Store', route: '/seller/store-creation', exact: false },
                    { label: 'Manage Products', route: '/seller/products', exact: false },
                    { label: 'Store Settings', route: '/seller/settings', exact: false },
                ]
            },
            {
                title: 'Wholesale Market',
                items: [
                    { label: 'Browse Warehouse', route: '/seller/marketplace', exact: false },
                    { label: 'Wholesale Orders', route: '/seller/wholesale-orders', exact: false },
                ]
            }
        ];

        // For demo purposes, if it's a seller we show seller groups + account
        // Otherwise customer groups + account
        // We'll trust the currentUser object for now.

        this.menuGroups = [...baseGroups, ...sellerGroups]; // Default to showing seller for now as per task
    }

}
