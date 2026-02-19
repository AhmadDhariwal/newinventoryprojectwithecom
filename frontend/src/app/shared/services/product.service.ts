import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { Product } from '../models/inventory/product.model';
import { ActivityLogsService } from './activity-logs.service';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private baseUrl = 'http://localhost:3000/api/products';
  private categoryUrl = 'http://localhost:3000/api/categories';
  private inventoryUrl = 'http://localhost:3000/api/inventory';

  constructor(
    private http: HttpClient,
    private activityService: ActivityLogsService
  ) {}

  getProducts(params?: any): Observable<any> {
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }

    return this.http.get<any>(this.baseUrl, { params: httpParams }).pipe(
      map(response => {
        // Handle new API response format
        if (response.success && response.data) {
          return response.data;
        }
        // Handle old API response format
        if (response.items) {
          return response.items;
        }
        // Fallback to direct response
        return response;
      })
    );
  }

  getProductById(id: string): Observable<Product> {
    return this.http.get<any>(`${this.baseUrl}/${id}`).pipe(
      map(response => {
        // Handle both old and new API response formats
        if (response.success && response.data) {
          return response.data;
        }
        return response;
      })
    );
  }

  createProduct(product: Partial<Product> | FormData): Observable<Product> {
    return this.http.post<Product>(this.baseUrl, product).pipe(
      tap((result: any) => {
        if (result && result.name) {
          this.activityService.logCreate('Products', result.name, result._id).subscribe();
        }
      })
    );
  }

  updateProduct(id: string, product: Partial<Product> | FormData): Observable<Product> {
    return this.http.put<Product>(`${this.baseUrl}/${id}`, product).pipe(
      tap((result: any) => {
        if (result && result.name) {
          this.activityService.logUpdate('Products', result.name, result._id).subscribe();
        }
      })
    );
  }

  deleteProduct(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`).pipe(
      tap(() => {
        this.activityService.logDelete('Products', 'Product', id).subscribe();
      })
    );
  }

  getCategories(): Observable<any[]> {
    return this.http.get<any[]>(this.categoryUrl);
  }

  createCategory(category: any): Observable<any> {
    return this.http.post<any>(this.categoryUrl, category);
  }

  updateCategory(id: string, category: any): Observable<any> {
    return this.http.put<any>(`${this.categoryUrl}/${id}`, category);
  }

  deleteCategory(id: string): Observable<any> {
    return this.http.delete<any>(`${this.categoryUrl}/${id}`);
  }

  getStockLevels(productId?: string): Observable<any[]> {
    let params = new HttpParams();
    if (productId) {
      params = params.set('productId', productId);
    }
    return this.http.get<any[]>(`${this.inventoryUrl}/stocklevels`, { params });
  }

  updateStockLevel(stockLevelId: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.inventoryUrl}/stocklevels/${stockLevelId}`, data);
  }

  updateStockLevelWithRules(stockLevelId: string, data: { quantity?: number, reservedQuantity?: number, reorderLevel?: number, minStock?: number }): Observable<any> {
    return this.http.put<any>(`${this.inventoryUrl}/stocklevels/${stockLevelId}`, data);
  }

  updateProductStock(productId: string, data: { reorderLevel?: number, reservedQuantity?: number }): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${productId}/stock`, data).pipe(
      tap((result: any) => {
        if (result && result.data && result.data.name) {
          this.activityService.logUpdate('Products', `Stock settings for ${result.data.name}`, result.data._id).subscribe();
        }
      })
    );
  }

}
