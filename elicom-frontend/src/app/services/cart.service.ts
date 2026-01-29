import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { AuthService } from './auth.service';


@Injectable({
    providedIn: 'root'
})
export class CartService {
    private baseUrl = 'https://localhost:44311/api/services/app/Cart';

    // Cart State (simplified)
    private _cartCount = new BehaviorSubject<number>(0);
    cartCount$ = this._cartCount.asObservable();

    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) { }

    addToCart(product: any, quantity: number = 1): Observable<any> {
        if (!this.authService.isAuthenticated) {
            this.authService.openAuthModal();
            return throwError(() => new Error('User not authenticated'));
        }

        const userId = Number(localStorage.getItem('userId') || JSON.parse(localStorage.getItem('currentUser') || '{}').id);

        const payload = {
            userId: Number(userId),
            storeProductId: product.storeProductId || product.id,
            quantity: quantity
        };
        console.log('[CartService] 🛒 Calling AddToCart API...', payload);

        return this.http.post(`${this.baseUrl}/AddToCart`, payload);
    }

    removeFromCart(cartItemId: string): Observable<any> {
        return this.http.delete(`${this.baseUrl}/RemoveFromCart`, { params: { cartItemId } });
    }

    clearCart(customerProfileId: string): Observable<any> {
        return this.http.delete(`${this.baseUrl}/ClearCart`, { params: { customerProfileId } });
    }
}
