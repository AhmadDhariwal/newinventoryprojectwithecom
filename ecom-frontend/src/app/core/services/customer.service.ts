import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Customer } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  constructor(private apiService: ApiService) {}

  getProfile(): Observable<{ success: boolean, data: Customer }> {
    return this.apiService.get<{ success: boolean, data: Customer }>('/profile');
  }

  updateProfile(data: Partial<Customer>): Observable<{ success: boolean, data: Customer }> {
    return this.apiService.put<{ success: boolean, data: Customer }>('/profile', data);
  }
}
