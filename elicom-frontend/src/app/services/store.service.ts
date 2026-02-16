import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface StoreDto {
    id: string;
    name: string;
    shortDescription: string;
    longDescription: string;
    description: string;
    slug: string;
    ownerId: number;
    status: boolean;
    isActive: boolean;
    createdAt?: string;
    supportEmail?: string;
    kyc?: StoreKycDto;
}

export interface StoreKycDto {
    fullName: string;
    cnic: string;
    expiryDate: string;
    issueCountry: string;
    dob: string;
    phone: string;
    address: string;
    zipCode: string;
    frontImage: string;
    backImage: string;
    status: boolean;
}

export interface CreateStoreDto {
    name: string;
    shortDescription: string;
    longDescription: string;
    description?: string;
    slug: string;
    supportEmail: string;
    ownerId: number;
    status: boolean;
    isActive: boolean;
    kyc: StoreKycDto;
}

@Injectable({
    providedIn: 'root'
})
export class StoreService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/api/services/app/Store`;

    getAllStores(): Observable<any> {
        return this.http.get(`${this.apiUrl}/GetAll`);
    }

    getMyStore(): Observable<any> {
        return this.http.get(`${this.apiUrl}/GetMyStore`);
    }

    createStore(input: CreateStoreDto): Observable<any> {
        return this.http.post(`${this.apiUrl}/Create`, input);
    }

    updateStore(input: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/Update`, input);
    }

    approveStore(id: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/Approve`, { id });
    }

    rejectStore(id: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/Reject`, { id });
    }

    verifyKyc(id: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/VerifyKyc`, { id });
    }
}
