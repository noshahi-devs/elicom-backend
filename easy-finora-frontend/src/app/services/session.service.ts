import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class SessionService {
    private apiUrl = `${environment.apiUrl}/api/services/app`;

    constructor(private http: HttpClient) { }

    private getHeaders() {
        const token = localStorage.getItem('authToken');
        return new HttpHeaders({
            'Content-Type': 'application/json',
            'Abp-TenantId': '3',
            'Authorization': `Bearer ${token}`
        });
    }

    getCurrentLoginInformations(): Observable<any> {
        return this.http.get(`${this.apiUrl}/Session/GetCurrentLoginInformations`, {
            headers: this.getHeaders()
        });
    }

    getUser(id: number): Observable<any> {
        return this.http.get(`${this.apiUrl}/User/Get`, {
            headers: this.getHeaders(),
            params: { Id: id }
        });
    }
}
