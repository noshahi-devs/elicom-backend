import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface CreateOrderDto {
    userId: number;
    paymentMethod: string;
    shippingAddress: string;
    country: string;
    state: string;
    city: string;
    postalCode: string;
    shippingCost: number;
    discount: number;
    sourcePlatform?: string;
    cardNumber?: string;
    cvv?: string;
    expiryDate?: string;
    items?: any[];
}

@Injectable({
    providedIn: 'root'
})
export class OrderService {
    private http = inject(HttpClient);
    private baseUrl = 'http://localhost:5050/api/services/app/Order';

    createOrder(input: CreateOrderDto): Observable<any> {
        return this.http.post(`${this.baseUrl}/Create`, input);
    }

    getCustomerOrders(userId: number): Observable<any[]> {
        return this.http.get<any>(`${this.baseUrl}/GetAllForCustomer`, {
            params: { userId: userId.toString() }
        }).pipe(
            map(res => res.result || [])
        );
    }

    getOrder(id: string): Observable<any> {
        return this.http.get<any>(`${this.baseUrl}/Get`, {
            params: { id }
        }).pipe(
            map(res => res.result)
        );
    }

    getOrdersByStore(storeId: string): Observable<any[]> {
        return this.http.get<any>(`${this.baseUrl}/GetByStore`, {
            params: { storeId }
        }).pipe(
            map(res => res.result || [])
        );
    }

    updateOrderStatus(id: string, status: string, trackingNumber?: string): Observable<any> {
        return this.http.post(`${this.baseUrl}/UpdateStatus`, { id, status, deliveryTrackingNumber: trackingNumber });
    }
}
