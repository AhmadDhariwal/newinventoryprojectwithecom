import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Order, RefundRequest } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  constructor(private apiService: ApiService) {}

  createOrder(orderData: any): Observable<{ success: boolean, data: Order }> {
    return this.apiService.post<{ success: boolean, data: Order }>('/orders', orderData);
  }

  getOrders(): Observable<{ success: boolean, data: Order[] }> {
    return this.apiService.get<{ success: boolean, data: Order[] }>('/orders');
  }

  getOrderById(id: string): Observable<{ success: boolean, data: Order }> {
    return this.apiService.get<{ success: boolean, data: Order }>(`/orders/${id}`);
  }

  requestRefund(refundData: RefundRequest): Observable<{ success: boolean, data: any }> {
    return this.apiService.post<{ success: boolean, data: any }>('/refunds', refundData);
  }
}
