import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface StoreDto {
    id: string;
    name: string;
    description: string;
    slug: string;
    ownerId: number;
    status: boolean;
}

export interface CreateStoreDto {
    name: string;
    description: string;
    slug: string;
    ownerId: number;
    status: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class StoreService {
    private http = inject(HttpClient);
    private apiUrl = 'https://localhost:44311/api/services/app/Store';

    getStoreByOwner(ownerId: number): Observable<any> {
        // We might need a specific endpoint for this in backend, 
        // for now let's assumes GetAll filtered on client or a new endpoint if needed.
        // Actually, let's look at StoreAppService again.
        return this.http.get(`${this.apiUrl}/GetAll`);
    }

    createStore(input: CreateStoreDto): Observable<any> {
        return this.http.post(`${this.apiUrl}/Create`, input);
    }

    updateStore(input: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/Update`, input);
    }
}
