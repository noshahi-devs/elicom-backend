import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { UserSidebarComponent } from './components/sidebar/sidebar.component';

@Component({
    selector: 'app-user-index',
    standalone: true,
    imports: [CommonModule, RouterModule, UserSidebarComponent],
    templateUrl: './user-index.component.html',
    styleUrls: ['./user-index.component.scss']
})
export class UserIndexComponent {
    private router = inject(Router);

    constructor() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const isSeller = currentUser.userName?.startsWith('SS_') && currentUser.userName?.includes('Seller');
        if (isSeller) {
            this.router.navigate(['/seller/dashboard']);
        }
    }
}
