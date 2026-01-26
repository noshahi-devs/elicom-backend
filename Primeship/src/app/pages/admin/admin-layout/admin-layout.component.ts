import { Component, OnInit, AfterViewInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
    selector: 'app-admin-layout',
    standalone: true,
    imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
    templateUrl: './admin-layout.component.html',
    styleUrls: ['./admin-layout.component.scss']
})
export class AdminLayoutComponent implements OnInit, AfterViewInit {
    sidebarCollapsed = false;
    isAdminView = false;
    isSellerView = false;

    constructor(private router: Router) {
        this.updateViewMode();
        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd)
        ).subscribe(() => {
            this.updateViewMode();
        });
    }

    private updateViewMode() {
        const url = this.router.url;
        this.isAdminView = url.includes('/admin');
        this.isSellerView = url.includes('/seller');
    }

    ngOnInit() {
    }

    ngAfterViewInit() {
        this.initializeSidebarToggle();
    }

    initializeSidebarToggle() {
        const sidebarToggleBtn = document.getElementById('sidebarToggle');
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.querySelector('.main-content');
        const userMenuBtn = document.getElementById('userMenuBtn');
        const userDropdown = document.getElementById('userDropdown');

        if (sidebarToggleBtn && sidebar && mainContent) {
            sidebarToggleBtn.addEventListener('click', () => {
                this.toggleSidebar(sidebar as HTMLElement, mainContent as HTMLElement, sidebarToggleBtn as HTMLElement);
            });
        }

        if (userMenuBtn && userDropdown) {
            userMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleUserDropdown(userDropdown);
            });
        }

        document.addEventListener('click', (e) => {
            if (userDropdown && !userDropdown.contains(e.target as Node) && userMenuBtn && !userMenuBtn.contains(e.target as Node)) {
                this.closeUserDropdown(userDropdown);
            }
        });
    }

    toggleSidebar(sidebar: HTMLElement, mainContent: HTMLElement, toggleBtn: HTMLElement) {
        const toggleIcon = toggleBtn.querySelector('.toggle-icon');
        this.sidebarCollapsed = !this.sidebarCollapsed;

        if (this.sidebarCollapsed) {
            sidebar.classList.add('collapsed');
            mainContent.classList.add('sidebar-collapsed');
        } else {
            sidebar.classList.remove('collapsed');
            mainContent.classList.remove('sidebar-collapsed');
        }
    }

    toggleUserDropdown(userDropdown: HTMLElement) {
        userDropdown.classList.toggle('show');
    }

    closeUserDropdown(userDropdown: HTMLElement) {
        userDropdown.classList.remove('show');
    }
}
