import { Injectable, signal, effect, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap, of, BehaviorSubject, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export interface CartItem {
    id?: string; // Backend Guid if available
    productId: string;
    storeProductId: string;
    storeName: string;
    name: string;
    price: number;
    oldPrice: number;
    discount: number;
    quantity: number;
    image: string;
    size: string;
    color: string;
    isChecked: boolean;
    isFavorite: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class CartService {
    private http = inject(HttpClient);
    private authService = inject(AuthService);
    private baseUrl = 'https://localhost:44311/api/services/app/Cart';

    // Using signals for reactive state (Internal UI)
    private cartItems = signal<CartItem[]>(this.loadCartFromStorage());
    private showCartTrigger = signal<number>(0);

    // Public exposures
    items = this.cartItems.asReadonly();
    cartAutoOpen = this.showCartTrigger.asReadonly();

    constructor() {
        // Auto-save to localStorage whenever cart changes
        effect(() => {
            const items = this.cartItems();
            localStorage.setItem('cartItems', JSON.stringify(items));
        });

        // Initialize from backend if user is already logged in
        if (this.authService.isAuthenticated) {
            this.syncWithBackend();
        }
    }

    private loadCartFromStorage(): CartItem[] {
        const stored = localStorage.getItem('cartItems');
        return stored ? JSON.parse(stored) : [];
    }

    get totalItems() {
        return this.cartItems().reduce((acc, item) => acc + item.quantity, 0);
    }

    get totalPrice() {
        return this.cartItems().reduce((acc, item) => acc + (item.isChecked ? item.price * item.quantity : 0), 0);
    }

    // MAIN ADD TO CART FUNCTION
    addToCart(product: any, quantity: number = 1, size: string = '', color: string = '', image: string = ''): Observable<any> {
        // 1. Snapshot for Local UI (Signals)
        const current = this.cartItems();
        const existingIndex = current.findIndex(i =>
            (i.storeProductId === (product.storeProductId || product.id)) &&
            i.size === size &&
            i.color === color
        );

        if (existingIndex > -1) {
            const updated = [...current];
            updated[existingIndex].quantity += quantity;
            this.cartItems.set(updated);
        } else {
            // Resolve properties robustly
            const storeId = product.store?.storeId || product.storeProductId || product.id || '';
            const storeName = product.store?.storeName || product.storeName || 'Unknown Store';
            const price = product.store?.price ?? product.price ?? 0;
            const oldPrice = product.store?.resellerPrice ?? product.originalPrice ?? 0;
            const discount = product.store?.resellerDiscountPercentage ?? product.resellerDiscountPercentage ?? 0;
            const name = product.title || product.productName || 'Product';

            const newItem: CartItem = {
                productId: product.productId || product.id,
                storeProductId: storeId,
                storeName: storeName,
                name: name,
                price: price,
                oldPrice: oldPrice,
                discount: discount,
                quantity: quantity,
                image: image || (product.images ? product.images[0] : ''),
                size: size,
                color: color,
                isChecked: true,
                isFavorite: false
            };
            this.cartItems.set([...current, newItem]);
        }

        // 2. Trigger modal auto-open
        this.showCartTrigger.update(v => v + 1);

        // 3. Backend Persistence
        if (this.authService.isAuthenticated) {
            const userId = this.getUserId();
            const payload = {
                userId: userId,
                storeProductId: product.storeProductId || product.id,
                quantity: quantity
            };
            console.log('[CartService] 🛒 Syncing AddToCart to Backend...', payload);
            return this.http.post(`${this.baseUrl}/AddToCart`, payload).pipe(
                tap(() => console.log('[CartService] ✅ Success: Synced with backend'))
            );
        }

        return of({ success: true, message: 'Added locally (Guest mode)' });
    }

    // BACKEND SYNC
    syncWithBackend() {
        const userId = this.getUserId();
        if (!userId) return;

        this.http.get<any>(`${this.baseUrl}/GetCartItems`, { params: { userId: userId.toString() } }).subscribe({
            next: (res) => {
                if (res && res.result) {
                    // Update Signal state with backend data if needed
                    // For now we trust the merge, but let's at least update IDs
                    console.log('[CartService] 📥 Received items from backend:', res.result);
                    // You could potentially rebuild the cart signal here if desired
                }
            },
            error: (err) => console.error('[CartService] ❌ Failed to load items from backend', err)
        });
    }

    private getUserId(): number {
        const userId = localStorage.getItem('userId') || JSON.parse(localStorage.getItem('currentUser') || '{}').id;
        return Number(userId);
    }

    updateQuantity(productId: string, size: string, color: string, newQty: number) {
        const current = this.cartItems();
        const updated = current.map(item => {
            if (item.productId === productId && item.size === size && item.color === color) {
                return { ...item, quantity: newQty };
            }
            return item;
        }).filter(item => item.quantity > 0);

        this.cartItems.set(updated);
        // NOTE: In a real app, you'd also call a PATCH or AddToCart(delta) to backend here
    }

    removeItem(productId: string, size: string, color: string) {
        const item = this.cartItems().find(i => i.productId === productId && i.size === size && i.color === color);

        // Local update
        this.cartItems.set(
            this.cartItems().filter(i => !(i.productId === productId && i.size === size && i.color === color))
        );

        // Backend update
        if (this.authService.isAuthenticated && item) {
            this.http.delete(`${this.baseUrl}/RemoveFromCartByProduct`, {
                params: { userId: this.getUserId().toString(), storeProductId: item.storeProductId }
            }).subscribe();
        }
    }

    clearCart() {
        // Local
        this.cartItems.set([]);

        // Backend
        if (this.authService.isAuthenticated) {
            this.http.delete(`${this.baseUrl}/ClearCart`, {
                params: { userId: this.getUserId().toString() }
            }).subscribe();
        }
    }

    // Toggle logic for UI
    toggleItemCheckbox(productId: string, size: string, color: string) {
        const current = this.cartItems();
        const updated = current.map(item => {
            if (item.productId === productId && item.size === size && item.color === color) {
                return { ...item, isChecked: !item.isChecked };
            }
            return item;
        });
        this.cartItems.set(updated);
    }

    toggleStoreCheckbox(storeName: string, checked: boolean) {
        const current = this.cartItems();
        const updated = current.map(item => {
            if (item.storeName === storeName) {
                return { ...item, isChecked: checked };
            }
            return item;
        });
        this.cartItems.set(updated);
    }

    toggleAllCheckbox(checked: boolean) {
        const current = this.cartItems();
        const updated = current.map(item => ({ ...item, isChecked: checked }));
        this.cartItems.set(updated);
    }

    getStores(): string[] {
        const stores = new Set(this.cartItems().map(item => item.storeName));
        return Array.from(stores);
    }

    isStoreChecked(storeName: string): boolean {
        const storeItems = this.cartItems().filter(item => item.storeName === storeName);
        return storeItems.length > 0 && storeItems.every(item => item.isChecked);
    }

    isAnyStoreItemChecked(storeName: string): boolean {
        return this.cartItems().filter(item => item.storeName === storeName).some(item => item.isChecked);
    }

    isAllChecked(): boolean {
        const items = this.cartItems();
        return items.length > 0 && items.every(item => item.isChecked);
    }

    getItemsByStore(storeName: string): CartItem[] {
        return this.cartItems().filter(item => item.storeName === storeName);
    }

    toggleFavorite(productId: string, size: string, color: string) {
        const current = this.cartItems();
        const updated = current.map(item => {
            if (item.productId === productId && item.size === size && item.color === color) {
                return { ...item, isFavorite: !item.isFavorite };
            }
            return item;
        });
        this.cartItems.set(updated);
    }
}
