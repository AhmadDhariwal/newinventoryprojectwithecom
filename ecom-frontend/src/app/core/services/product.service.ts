import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Product } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  constructor(private apiService: ApiService) {}

  getProducts(filters: any = {}): Observable<{ success: boolean, data: Product[], pagination: any }> {
    return this.apiService.get<{ success: boolean, data: Product[], pagination: any }>('/products', filters);
  }
  


  getProductById(id: string): Observable<{ success: boolean, data: Product }> {
    return this.apiService.get<{ success: boolean, data: Product }>(`/products/${id}`);
  }
}
