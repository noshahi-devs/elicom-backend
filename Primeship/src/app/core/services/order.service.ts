import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
    name: string;
    qty: number;
    price: number;
}

export interface Order {
    id: any;
    orderNo: string;
    customerName: string;
    phone: string;
    address: string;
    status: OrderStatus;
    createdAt: Date;
    items: OrderItem[];
    sellerId?: number;
    sellerName?: string;
    sellerEarnings?: number;
    referenceCode?: string;
}

export interface CreateOrderInput {
    paymentMethod: string;
    shippingAddress: string;
    country: string;
    state: string;
    city: string;
    postalCode: string;
    shippingCost: number;
    discount: number;
    customerProfileId: string;
    sourcePlatform: string;
}

@Injectable({
    providedIn: 'root'
})
export class OrderService {
    private apiUrl = 'https://localhost:44311/api/services/app/Order';

    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) { }

    createOrder(input: CreateOrderInput): Observable<any> {
        return this.http.post(`${this.apiUrl}/Create`, input, {
            headers: this.authService.getAuthHeaders()
        });
    }

    getOrders(): Observable<Order[]> {
        return this.http.get<Order[]>(`${this.apiUrl}/GetAllForCustomer`, {
            headers: this.authService.getAuthHeaders()
        });
    }

    getAllOrders(): Observable<Order[]> {
        return this.http.get<Order[]>(`${this.apiUrl}/GetAll`, {
            headers: this.authService.getAuthHeaders()
        });
    }

    getAllForSupplier(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/GetAllForSupplier`, {
            headers: this.authService.getAuthHeaders()
        });
    }

    deleteOrder(id: any): Observable<any> {
        return this.http.delete(`${this.apiUrl}/Delete`, {
            params: { id },
            headers: this.authService.getAuthHeaders()
        });
    }

    markAsVerified(id: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/MarkAsVerified`, { id }, {
            headers: this.authService.getAuthHeaders()
        });
    }

    markAsDelivered(id: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/MarkAsDelivered`, { id }, {
            headers: this.authService.getAuthHeaders()
        });
    }
}
