import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { CategoryDto } from './category.service';
import { ProductDto } from './product.service';

@Injectable({
    providedIn: 'root'
})
export class PublicService {
    private apiUrl = 'https://localhost:44311/api/services/app/Public';
    private tenantId = '2'; // Prime Ship Tenant

    constructor(private http: HttpClient) { }

    getCategories(): Observable<CategoryDto[]> {
        return this.http.get<any>(this.apiUrl + '/GetCategories', {
            headers: new HttpHeaders({ 'Abp-TenantId': this.tenantId })
        }).pipe(
            map(res => {
                const data = res?.result?.items || res?.result || res;
                return Array.isArray(data) ? data : (data?.items || []);
            }),
            catchError(err => {
                console.error('PublicService: GetCategories Error', err);
                return throwError(() => err);
            })
        );
    }

    getProducts(): Observable<ProductDto[]> {
        return this.http.get<any>(this.apiUrl + '/GetProducts', {
            headers: new HttpHeaders({ 'Abp-TenantId': this.tenantId })
        }).pipe(
            map(res => {
                const data = res?.result?.items || res?.result || res;
                return Array.isArray(data) ? data : (data?.items || []);
            }),
            catchError(err => {
                console.error('PublicService: GetProducts Error', err);
                return throwError(() => err);
            })
        );
    }

    getProductBySlug(slug: string): Observable<ProductDto> {
        return this.http.get<any>(`${this.apiUrl}/GetProductBySlug?slug=${slug}`, {
            headers: new HttpHeaders({ 'Abp-TenantId': this.tenantId })
        }).pipe(
            map(res => res?.result || res),
            catchError(err => {
                console.error('PublicService: GetProductBySlug Error', err);
                return throwError(() => err);
            })
        );
    }
}
