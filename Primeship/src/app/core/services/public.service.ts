import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError, shareReplay, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { CategoryDto } from './category.service';
import { ProductDto } from './product.service';

@Injectable({
    providedIn: 'root'
})
export class PublicService {
    private apiUrl = 'https://localhost:44311/api/services/app/Public';
    private tenantId = '2'; // Prime Ship Tenant
    private cachedCategories$: Observable<CategoryDto[]> | null = null;

    constructor(private http: HttpClient) { }

    getCategories(): Observable<CategoryDto[]> {
        if (!this.cachedCategories$) {
            this.cachedCategories$ = this.http.get<any>(this.apiUrl + '/GetCategories', {
                headers: new HttpHeaders({ 'Abp-TenantId': this.tenantId })
            }).pipe(
                map(res => {
                    const data = res?.result?.items || res?.result || res;
                    return Array.isArray(data) ? data : (data?.items || []);
                }),
                shareReplay(1),
                catchError(err => {
                    this.cachedCategories$ = null;
                    console.error('PublicService: GetCategories Error', err);
                    return throwError(() => err);
                })
            );
        }
        return this.cachedCategories$;
    }

    getProducts(searchTerm?: string): Observable<ProductDto[]> {
        let url = this.apiUrl + '/GetProducts';
        if (searchTerm) {
            url += `?searchTerm=${encodeURIComponent(searchTerm)}`;
        }
        return this.http.get<any>(url, {
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

    getProductsByCategory(slug: string, searchTerm?: string, categoryId?: string): Observable<ProductDto[]> {
        let url = `${this.apiUrl}/GetProductsByCategory?`;

        if (categoryId) {
            url += `categoryId=${categoryId}`;
        } else {
            url += `categorySlug=${slug}`;
        }

        if (searchTerm) {
            url += `&searchTerm=${encodeURIComponent(searchTerm)}`;
        }
        return this.http.get<any>(url, {
            headers: new HttpHeaders({ 'Abp-TenantId': this.tenantId })
        }).pipe(
            map(res => {
                const data = res?.result?.items || res?.result || res;
                return Array.isArray(data) ? data : (data?.items || []);
            }),
            catchError(err => {
                console.error('PublicService: GetProductsByCategory Error', err);
                return throwError(() => err);
            })
        );
    }

    getProfile(): Observable<any> {
        const token = localStorage.getItem('authToken');
        return this.http.get<any>(`${this.apiUrl}/GetProfile`, {
            headers: new HttpHeaders({
                'Authorization': `Bearer ${token}`,
                'Abp-TenantId': this.tenantId
            })
        }).pipe(
            map(res => res?.result || res),
            catchError(err => {
                console.error('PublicService: GetProfile Error', err);
                return throwError(() => err);
            })
        );
    }
}
