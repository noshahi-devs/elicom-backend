import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
    selector: 'app-customer-layout',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './customer-layout.component.html',
    styleUrls: ['./customer-layout.component.scss']
})
export class CustomerLayoutComponent implements OnInit {
    isSidebarCollapsed = false;

    menuGroups = [
        {
            title: 'My Account',
            expanded: true,
            items: [
                { label: 'SHEIN CLUB', path: '/customer/club', icon: 'fa-crown' },
                { label: 'My Profile', path: '/customer/profile', icon: 'fa-user' },
                { label: 'Address Book', path: '/customer/address', icon: 'fa-address-book' },
                { label: 'My Payment Options', path: '/customer/payment', icon: 'fa-credit-card' },
                { label: 'Manage My Account', path: '/customer/dashboard', icon: 'fa-user-cog' }
            ]
        },
        {
            title: 'My Assets',
            expanded: false,
            items: [
                { label: 'Coupons', path: '/customer/coupons', icon: 'fa-ticket-alt' },
                { label: 'Points', path: '/customer/points', icon: 'fa-coins' },
                { label: 'Wallet', path: '/customer/wallet', icon: 'fa-wallet' },
                { label: 'Gift Card', path: '/customer/giftcard', icon: 'fa-gift' }
            ]
        },
        {
            title: 'My Orders',
            expanded: false,
            items: [
                { label: 'All Orders', path: '/customer/orders', icon: 'fa-shopping-bag' },
                { label: 'Unpaid', path: '/customer/orders/unpaid', icon: 'fa-wallet' },
                { label: 'Processing', path: '/customer/orders/processing', icon: 'fa-box' },
                { label: 'Shipped', path: '/customer/orders/shipped', icon: 'fa-truck' },
                { label: 'Review', path: '/customer/orders/review', icon: 'fa-comment-dots' },
                { label: 'Returns', path: '/customer/orders/returns', icon: 'fa-undo' }
            ]
        },
        {
            title: 'My Favorites',
            expanded: false,
            items: [
                { label: 'Wishlist', path: '/customer/wishlist', icon: 'fa-heart' },
                { label: 'Recently Viewed', path: '/customer/history', icon: 'fa-history' }
            ]
        },
        {
            title: 'Customer Service',
            expanded: false,
            items: [
                { label: 'Support Portal', path: '/customer/support', icon: 'fa-headset' },
                { label: 'Shipping Info', path: '/customer/shipping', icon: 'fa-shipping-fast' },
                { label: 'Policies', path: '/customer/policy', icon: 'fa-clipboard-check' }
            ]
        },
        {
            title: 'Other Services',
            expanded: false,
            items: [
                { label: 'Survey', path: '/customer/survey', icon: 'fa-poll' }
            ]
        },
        {
            title: 'Policy',
            expanded: false,
            items: [
                { label: 'Return Policy', path: '/customer/policy/return', icon: 'fa-undo' },
                { label: 'Privacy Policy', path: '/customer/policy/privacy', icon: 'fa-user-shield' }
            ]
        }
    ];

    constructor(private router: Router) { }

    ngOnInit(): void {
    }

    toggleGroup(group: any) {
        group.expanded = !group.expanded;
    }

    toggleSidebar() {
        this.isSidebarCollapsed = !this.isSidebarCollapsed;
    }

    logout() {
        this.router.navigate(['/']);
    }
}
