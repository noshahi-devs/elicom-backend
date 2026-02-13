import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class StorageService {
    private apiUrl = `${environment.apiUrl}/api/services/app/StorageTest`;

    constructor(private http: HttpClient) { }

    uploadTestImage(base64Image: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/UploadTestImage`, { base64Image });
    }
}
