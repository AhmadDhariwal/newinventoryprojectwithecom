import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Category {
  _id: string;
  name: string;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  constructor(private apiService: ApiService) {}

  getCategories(): Observable<{ success: boolean, data: Category[] }> {
    return this.apiService.get<{ success: boolean, data: Category[] }>('/categories');
  }
}
