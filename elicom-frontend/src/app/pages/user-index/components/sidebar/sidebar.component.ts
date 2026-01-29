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

    menuGroups = [
        {
            title: 'My Account',
            items: [
                { label: 'Personal Center', route: '/user/index', exact: true },
                { label: 'My Profile', route: '/user/index/profile', exact: false },
                { label: 'Address Book', route: '/user/index/address', exact: false },
                { label: 'Payment Options', route: '/user/index/payment', exact: false }
            ]
        },
        {
            title: 'My Orders',
            items: [
                { label: 'All Orders', route: '/user/index/orders', exact: false },
                { label: 'Returns', route: '/user/index/returns', exact: false },
                { label: 'Reviews', route: '/user/index/reviews', exact: false }
            ]
        },
        {
            title: 'My Assets',
            items: [
                { label: 'My Coupons', route: '/user/index/coupons', exact: false },
                { label: 'My Wallet', route: '/user/index/wallet', exact: false },
                { label: 'Points', route: '/user/index/points', exact: false }
            ]
        },
        {
            title: 'History',
            items: [
                { label: 'Recently Viewed', route: '/user/index/viewed', exact: false },
                { label: 'Wishlist', route: '/user/index/wishlist', exact: false }
            ]
        }
    ];

}
