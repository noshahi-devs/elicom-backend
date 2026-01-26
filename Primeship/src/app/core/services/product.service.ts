import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface ProductDto {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  categoryName?: string;
  description: string;
  images: string | string[];
  supplierPrice: number;
  resellerMaxPrice: number;
  discountPercentage: number;
  stockQuantity: number;
  status: boolean;
  slug: string;
  brandName?: string;
  sizeOptions?: string;
  colorOptions?: string;
  // Template compatibility properties
  category?: string;
  price?: number;
  discountPrice?: number;
  stock?: number;
  featured?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  createdAt?: Date;
}

export interface CreateProductDto {
  name: string;
  sku: string;
  categoryId: string;
  description: string;
  images: string;
  supplierPrice: number;
  resellerMaxPrice: number;
  discountPercentage: number;
  stockQuantity: number;
  status: boolean;
  slug: string;
  brandName?: string;
}

export interface UpdateProductDto extends CreateProductDto {
  id: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private publicApiUrl = 'https://localhost:44311/api/services/app/Public';
  private productApiUrl = 'https://localhost:44311/api/services/app/Product';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  getAll(): Observable<ProductDto[]> {
    return this.http.get<ProductDto[]>(`${this.productApiUrl}/GetAll`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  get(id: string): Observable<ProductDto> {
    return this.http.get<ProductDto>(`${this.productApiUrl}/Get`, {
      params: { id },
      headers: this.authService.getAuthHeaders()
    });
  }

  create(input: CreateProductDto): Observable<ProductDto> {
    return this.http.post<ProductDto>(`${this.productApiUrl}/Create`, input, {
      headers: this.authService.getAuthHeaders()
    });
  }

  update(input: UpdateProductDto): Observable<ProductDto> {
    return this.http.put<ProductDto>(`${this.productApiUrl}/Update`, input, {
      headers: this.authService.getAuthHeaders()
    });
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.productApiUrl}/Delete`, {
      params: { id },
      headers: this.authService.getAuthHeaders()
    });
  }

  getProductBySku(sku: string): Observable<any> {
    return this.http.get(`${this.publicApiUrl}/GetProductBySku`, {
      params: { sku },
      headers: this.authService.getAuthHeaders()
    });
  }

  searchProducts(term: string): Observable<ProductDto[]> {
    return this.http.get<ProductDto[]>(`${this.publicApiUrl}/GetProductsBySearch`, {
      params: { term },
      headers: this.authService.getAuthHeaders()
    });
  }

  // Helper Utilities used by components
  parseImages(images: any): string[] {
    if (!images) return [];
    if (Array.isArray(images)) return images;
    try {
      return JSON.parse(images);
    } catch (e) {
      if (typeof images === 'string' && images.startsWith('http')) return [images];
      return [];
    }
  }

  stringifyImages(images: string[]): string {
    return JSON.stringify(images || []);
  }

  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  parseSizeOptions(options: any): string[] {
    if (!options) return [];
    if (Array.isArray(options)) return options;
    try {
      return JSON.parse(options);
    } catch (e) {
      return [];
    }
  }

  parseColorOptions(options: any): string[] {
    if (!options) return [];
    if (Array.isArray(options)) return options;
    try {
      return JSON.parse(options);
    } catch (e) {
      return [];
    }
  }
}
