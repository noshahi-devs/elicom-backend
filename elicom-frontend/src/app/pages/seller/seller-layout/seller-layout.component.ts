import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

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

    isSidebarCollapsed = false;
    currentUser: any = null;

    ngOnInit() {
        this.currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    }

    toggleSidebar() {
        this.isSidebarCollapsed = !this.isSidebarCollapsed;
    }

    logout() {
        this.authService.logout();
    }
}
