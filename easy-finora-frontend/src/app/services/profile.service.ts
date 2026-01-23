import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ProfileService {
    private apiUrl = 'https://localhost:44311/api/services/app/CustomerProfile';

    constructor(private http: HttpClient) { }

    private getHeaders() {
        const token = localStorage.getItem('authToken');
        return new HttpHeaders({
            'Content-Type': 'application/json',
            'Abp-TenantId': '3',
            'Authorization': `Bearer ${token}`
        });
    }

    getMyProfile(): Observable<any> {
        // Return GetMyProfile from backend
        return this.http.get(`${this.apiUrl}/GetMyProfile`, {
            headers: this.getHeaders()
        });
    }
}
