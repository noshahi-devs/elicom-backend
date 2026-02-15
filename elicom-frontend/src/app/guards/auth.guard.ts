import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { StoreService } from '../services/store.service';
import { Observable, of, map, catchError } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {
    private router = inject(Router);
    private authService = inject(AuthService);
    private storeService = inject(StoreService);

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
        const url = state.url;

        if (!this.authService.isAuthenticated) {
            this.router.navigate(['/smartstore/login'], {
                queryParams: { returnUrl: state.url }
            });
            return false;
        }

        // --- Role-based authorization ---

        // ADMIN
        if (url.startsWith('/admin')) {
            if (this.authService.isAdmin()) return true;
            return this.redirectToDashboard();
        }

        // SELLER
        if (url.startsWith('/seller')) {
            // Admin can access everything
            if (this.authService.isAdmin()) return true;

            if (this.authService.isSeller()) {
                // If they are on the store creation page, let them through
                if (url.includes('store-creation')) return true;

                // For all other /seller routes, check if store exists
                return this.storeService.getMyStore().pipe(
                    map(res => {
                        if (res && res.result) {
                            return true; // Store exists, allow access
                        } else {
                            console.log('No store found, redirecting to store creation');
                            this.router.navigate(['/seller/store-creation']);
                            return false;
                        }
                    }),
                    catchError(() => {
                        console.log('Error checking store, redirecting to store creation');
                        this.router.navigate(['/seller/store-creation']);
                        return of(false);
                    })
                );
            }
            return this.redirectToDashboard();
        }

        // CUSTOMER
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
