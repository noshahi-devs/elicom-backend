import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AuthService } from './auth.service';

export interface WholesaleOrderItemInput {
    productId: string;
    quantity: number;
}

export interface CreateWholesaleOrderInput {
    items: WholesaleOrderItemInput[];
    shippingAddress: string;
    customerName: string;
    paymentMethod: string;
    cardNumber?: string;
    expiryDate?: string;
    cvv?: string;
}

@Injectable({
    providedIn: 'root'
})
export class WholesaleService {
    private apiUrl = 'https://localhost:44311/api/services/app/Wholesale';

    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) { }

    placeWholesaleOrder(input: CreateWholesaleOrderInput): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/PlaceWholesaleOrder`, input, {
            headers: this.authService.getAuthHeaders()
        }).pipe(
            map(response => response.result)
        );
    }
}
