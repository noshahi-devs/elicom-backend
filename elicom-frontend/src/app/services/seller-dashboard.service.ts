import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SellerDashboardStats {
    totalSales: number;
    totalOrders: number;
    pendingOrders: number;
    shippedOrders: number;
    deliveredOrders: number;
    walletBalance: number;
}

@Injectable({
    providedIn: 'root'
})
export class SellerDashboardService {
    private http = inject(HttpClient);
    private apiUrl = 'https://localhost:44311/api/services/app/SellerDashboard';

    getStats(storeId: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/GetStats`, { params: { storeId } });
    }
}
