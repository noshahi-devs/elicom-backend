import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class StoreProductService {
    private http = inject(HttpClient);
    private apiUrl = 'https://localhost:44311/api/services/app/StoreProduct';

    create(input: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/Create`, input);
    }

    getByStore(storeId: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/GetByStore`, { params: { storeId } });
    }

    update(input: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/Update`, input);
    }

    delete(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/Delete`, { params: { id } });
    }
}
