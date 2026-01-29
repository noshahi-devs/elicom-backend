import { Injectable, signal, effect } from '@angular/core';

export interface CartItem {
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
    // Using signals for reactive state
    private cartItems = signal<CartItem[]>(this.loadCartFromStorage());
    private showCartTrigger = signal<number>(0);

    items = this.cartItems.asReadonly();
    cartAutoOpen = this.showCartTrigger.asReadonly();

    constructor() {
        // Auto-save to localStorage whenever cart changes
        effect(() => {
            const items = this.cartItems();
            localStorage.setItem('cartItems', JSON.stringify(items));
        });
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

    addToCart(product: any, quantity: number, size: string, color: string, image: string) {
        const current = this.cartItems();
        const existingIndex = current.findIndex(i =>
            i.productId === product.productId &&
            i.size === size &&
            i.color === color
        );

        if (existingIndex > -1) {
            const updated = [...current];
            updated[existingIndex].quantity += quantity;
            this.cartItems.set(updated);
        } else {
            // Resolve properties robustly for both Detail (nested store) and Grid (flat) formats
            const storeId = product.store?.storeId || product.storeProductId || '';
            const storeName = product.store?.storeName || product.storeName || 'Unknown Store';
            const price = product.store?.price ?? product.price ?? 0;
            const oldPrice = product.store?.resellerPrice ?? product.originalPrice ?? 0;
            const discount = product.store?.resellerDiscountPercentage ?? product.resellerDiscountPercentage ?? 0;
            const name = product.title || product.productName || 'Product';

            const newItem: CartItem = {
                productId: product.productId,
                storeProductId: storeId,
                storeName: storeName,
                name: name,
                price: price,
                oldPrice: oldPrice,
                discount: discount,
                quantity: quantity,
                image: image,
                size: size,
                color: color,
                isChecked: true,
                isFavorite: false
            };
            this.cartItems.set([...current, newItem]);
        }

        // Trigger modal auto-open
        this.showCartTrigger.update(v => v + 1);
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
    }

    removeItem(productId: string, size: string, color: string) {
        this.cartItems.set(
            this.cartItems().filter(i => !(i.productId === productId && i.size === size && i.color === color))
        );
    }

    clearCart() {
        this.cartItems.set([]);
    }

    // Toggle individual item checkbox
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

    // Toggle all items from a specific store
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

    // Toggle all items
    toggleAllCheckbox(checked: boolean) {
        const current = this.cartItems();
        const updated = current.map(item => ({ ...item, isChecked: checked }));
        this.cartItems.set(updated);
    }

    // Get unique stores
    getStores(): string[] {
        const stores = new Set(this.cartItems().map(item => item.storeName));
        return Array.from(stores);
    }

    // Check if all items from a store are checked
    isStoreChecked(storeName: string): boolean {
        const storeItems = this.cartItems().filter(item => item.storeName === storeName);
        return storeItems.length > 0 && storeItems.every(item => item.isChecked);
    }

    // Check if any item from a store is checked
    isAnyStoreItemChecked(storeName: string): boolean {
        return this.cartItems().filter(item => item.storeName === storeName).some(item => item.isChecked);
    }

    // Check if all items are checked
    isAllChecked(): boolean {
        const items = this.cartItems();
        return items.length > 0 && items.every(item => item.isChecked);
    }

    // Get items grouped by store
    getItemsByStore(storeName: string): CartItem[] {
        return this.cartItems().filter(item => item.storeName === storeName);
    }

    // Toggle favorite status
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
