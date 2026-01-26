import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ProductDto {
  id: string;
  name: string;
  supplierId?: number;
  categoryId: string;
  categoryName: string;
  description: string;
  images: any; // JSON string or parsed array
  sizeOptions: string; // JSON string
  colorOptions: string; // JSON string
  discountPercentage: number;
  supplierPrice: number;
  resellerMaxPrice: number;
  stockQuantity: number;
  sku: string;
  brandName: string;
  slug: string;
  status: boolean;

  // Template compatibility properties (computed/aliases) - always populated
  category: string; // Alias for categoryName
  price: number; // Computed from resellerMaxPrice
  discountPrice: number; // Computed from discount
  stock: number; // Alias for stockQuantity
  featured: boolean; // Not in backend model
  metaTitle: string; // Not in backend model
  metaDescription: string; // Not in backend model
  createdAt: Date; // Not in backend model
}


export interface CreateProductDto {
  name: string;
  categoryId: string;
  description?: string;
  images?: string;
  sizeOptions?: string;
  colorOptions?: string;
  discountPercentage?: number;
  supplierPrice: number;
  resellerMaxPrice: number;
  stockQuantity: number;
  sku: string;
  brandName?: string;
  slug?: string;
  status: boolean;
}

export interface UpdateProductDto {
  id: string;
  name: string;
  categoryId: string;
  description?: string;
  images?: string;
  sizeOptions?: string;
  colorOptions?: string;
  discountPercentage?: number;
  supplierPrice: number;
  resellerMaxPrice: number;
  stockQuantity: number;
  sku: string;
  brandName?: string;
  slug?: string;
  status: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = 'https://localhost:44311/api/services/app/Product';
  private tenantId = '2'; // Prime Ship Tenant

  constructor(private http: HttpClient) { }

  /**
   * Get all products
   */
  getAll(): Observable<ProductDto[]> {
    return this.http.get<any>(this.apiUrl + '/GetAll', {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.result.items || [])
    );
  }

  /**
   * Get products by category
   */
  getByCategory(categoryId: string): Observable<ProductDto[]> {
    return this.http.get<any>(`${this.apiUrl}/GetByCategory?categoryId=${categoryId}`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.result.items || [])
    );
  }

  /**
   * Get product by ID
   */
  get(id: string): Observable<ProductDto> {
    return this.http.get<any>(`${this.apiUrl}/Get?id=${id}`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.result)
    );
  }

  /**
   * Create new product
   */
  create(input: CreateProductDto): Observable<ProductDto> {
    // Auto-generate slug if not provided
    if (!input.slug) {
      input.slug = this.generateSlug(input.name);
    }

    return this.http.post<any>(this.apiUrl + '/Create', input, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.result)
    );
  }

  /**
   * Update existing product
   */
  update(input: UpdateProductDto): Observable<ProductDto> {
    // Auto-generate slug if not provided
    if (!input.slug) {
      input.slug = this.generateSlug(input.name);
    }

    return this.http.put<any>(this.apiUrl + '/Update', input, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.result)
    );
  }

  /**
   * Delete product
   */
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/Delete?id=${id}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Parse images JSON string to array
   */
  parseImages(imagesJson: any): string[] {
    if (!imagesJson) return [];

    // If it's already an array, return it
    if (Array.isArray(imagesJson)) return imagesJson;

    // If it's not a string, we can't parse it
    if (typeof imagesJson !== 'string') return [];

    try {
      const parsed = JSON.parse(imagesJson);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      // If parsing fails, check if it's a single image string (like base64 or URL)
      if (imagesJson.startsWith('data:image') || imagesJson.startsWith('http')) {
        return [imagesJson];
      }
      // Or maybe comma separated?
      if (imagesJson.includes(',')) {
        return imagesJson.split(',').map(img => img.trim());
      }
      return [imagesJson];
    }
  }

  /**
   * Parse size options JSON string to array
   */
  parseSizeOptions(sizeOptionsJson: string): string[] {
    try {
      return JSON.parse(sizeOptionsJson || '[]');
    } catch {
      return [];
    }
  }

  /**
   * Parse color options JSON string to array
   */
  parseColorOptions(colorOptionsJson: string): string[] {
    try {
      return JSON.parse(colorOptionsJson || '[]');
    } catch {
      return [];
    }
  }

  /**
   * Convert array to JSON string for images
   */
  stringifyImages(images: string[]): string {
    return JSON.stringify(images);
  }

  /**
   * Convert array to JSON string for size options
   */
  stringifySizeOptions(sizes: string[]): string {
    return JSON.stringify(sizes);
  }

  /**
   * Convert array to JSON string for color options
   */
  stringifyColorOptions(colors: string[]): string {
    return JSON.stringify(colors);
  }

  /**
   * Generate slug from name
   */
  public generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Get headers with tenant ID and auth token
   */
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Abp-TenantId': this.tenantId,
      'Authorization': `Bearer ${token}`
    });
  }
}
