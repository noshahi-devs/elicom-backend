import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {
    private router = inject(Router);
    private authService = inject(AuthService);

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        const url = state.url;

        if (!this.authService.isAuthenticated) {
            this.router.navigate(['/smartstore/login'], {
                queryParams: { returnUrl: state.url }
            });
            return false;
        }

        // Role-based authorization
        if (url.startsWith('/admin')) {
            if (this.authService.isAdmin()) {
                return true;
            }
            return this.redirectToDashboard();
        }

        if (url.startsWith('/seller')) {
            if (this.authService.isSeller() || this.authService.isAdmin()) {
                return true;
            }
            return this.redirectToDashboard();
        }

        if (url.startsWith('/customer')) {
            if (this.authService.isCustomer() || this.authService.isAdmin() || this.authService.isSeller()) {
                return true;
            }
            return this.redirectToDashboard();
        }

        return true;
    }

    private redirectToDashboard(): boolean {
        this.authService.navigateToDashboard();
        return false;
    }
}
