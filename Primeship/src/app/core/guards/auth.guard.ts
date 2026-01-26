import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    console.log('🛡️ AuthGuard.canActivate called');
    console.log('📍 Requested URL:', state.url);
    console.log('📍 Route config:', route);

    // Check if user has JWT token in localStorage
    const token = localStorage.getItem('authToken');
    console.log('🔑 Token from localStorage:', token ? token.substring(0, 20) + '...' : 'NULL');

    if (token) {
      // User is authenticated
      console.log('✅ AuthGuard: User is authenticated, allowing access');
      return true;
    }

    // User is not authenticated, redirect to login
    console.log('❌ AuthGuard: User is NOT authenticated, redirecting to login');
    console.log('💾 Saving returnUrl:', state.url);

    // Save the attempted URL for redirecting after login
    this.router.navigate(['/auth/login'], {
      queryParams: { returnUrl: state.url }
    });

    console.log('🔄 Redirected to login page');
    return false;
  }
}
