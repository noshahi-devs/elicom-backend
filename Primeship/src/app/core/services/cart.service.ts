import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface CartItem {
    product: any;
    quantity: number;
    size?: string;
    color?: string;
}

@Injectable({
    providedIn: 'root'
})
export class CartService {
    private cartItemsSubject = new BehaviorSubject<CartItem[]>([]);
    public cartItems$ = this.cartItemsSubject.asObservable();

    constructor() {
        this.loadCart();
    }

    private loadCart(): void {
        const savedCart = localStorage.getItem('primeship_cart');
        if (savedCart) {
            this.cartItemsSubject.next(JSON.parse(savedCart));
        }
    }

    private saveCart(items: CartItem[]): void {
        localStorage.setItem('primeship_cart', JSON.stringify(items));
        this.cartItemsSubject.next(items);
    }

    addToCart(product: any, quantity: number, size?: string, color?: string): void {
        const currentItems = this.cartItemsSubject.value;
        const existingItemIndex = currentItems.findIndex(item =>
            item.product.id === product.id &&
            item.size === size &&
            item.color === color
        );

        if (existingItemIndex > -1) {
            currentItems[existingItemIndex].quantity += quantity;
        } else {
            currentItems.push({ product, quantity, size, color });
        }

        this.saveCart([...currentItems]);
    }

    removeFromCart(index: number): void {
        const currentItems = this.cartItemsSubject.value;
        currentItems.splice(index, 1);
        this.saveCart([...currentItems]);
    }

    updateQuantity(index: number, quantity: number): void {
        const currentItems = this.cartItemsSubject.value;
        if (quantity > 0) {
            currentItems[index].quantity = quantity;
            this.saveCart([...currentItems]);
        }
    }

    clearCart(): void {
        this.saveCart([]);
    }

    getCartTotal(): number {
        return this.cartItemsSubject.value.reduce((total, item) =>
            total + (item.product.price * item.quantity), 0
        );
    }

    getCartCount(): number {
        return this.cartItemsSubject.value.reduce((count, item) =>
            count + item.quantity, 0
        );
    }
}
