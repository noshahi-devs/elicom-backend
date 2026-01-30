import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
    selector: 'app-admin-layout',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './admin-layout.component.html',
    styleUrls: ['./admin-layout.component.scss']
})
export class AdminLayoutComponent implements OnInit {
    private router = inject(Router);
    isSidebarCollapsed = false;
    currentUser: any = null;

    ngOnInit() {
        this.currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        // Role check logic would go here
    }

    toggleSidebar() {
        this.isSidebarCollapsed = !this.isSidebarCollapsed;
    }

    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        this.router.navigate(['/smartstore/login']);
    }
}
