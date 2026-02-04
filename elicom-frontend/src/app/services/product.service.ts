import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ProductDto {
    id: string;
    name: string;
    categoryName: string;
    description: string;
    images: string;
    supplierPrice: number;
    resellerMaxPrice: number;
    sku: string;
    brandName: string;
}

@Injectable({
    providedIn: 'root'
})
export class ProductService {
    private http = inject(HttpClient);
    private apiUrl = 'https://localhost:44311/api/services/app/Product';

    search(query: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/Search`, { params: { query } });
    }

    getAll(): Observable<any> {
        return this.http.get(`${this.apiUrl}/GetAll`);
    }
}
