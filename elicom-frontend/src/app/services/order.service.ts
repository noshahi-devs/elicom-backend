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
}

@Injectable({
    providedIn: 'root'
})
export class OrderService {
    private http = inject(HttpClient);
    private baseUrl = 'https://localhost:44311/api/services/app/Order';

    createOrder(input: CreateOrderDto): Observable<any> {
        return this.http.post(`${this.baseUrl}/Create`, input);
    }

    getCustomerOrders(customerProfileId: string): Observable<any[]> {
        return this.http.get<any>(`${this.baseUrl}/GetAllForCustomer`, {
            params: { customerProfileId }
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
}
