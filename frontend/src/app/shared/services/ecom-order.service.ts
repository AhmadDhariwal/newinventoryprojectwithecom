import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';


export interface Order {
  _id: string;
  customerId: any;
  items: any[];
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  organizationId: string;
  shippingAddress: any;
  billingAddress: any;
  // Add other fields as needed
}

@Injectable({
  providedIn: 'root'
})
export class EcomOrderService {
  private apiUrl = 'http://localhost:3000/api/admin/orders';

  constructor(private http: HttpClient) {}

  getAllOrders(page: number = 1, limit: number = 10, status: string = '', search: string = ''): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (status) params = params.set('status', status);
    if (search) params = params.set('search', search);

    return this.http.get(this.apiUrl, { params });
  }

  getOrderById(id: string): Observable<{ success: boolean, data: Order }> {
    return this.http.get<{ success: boolean, data: Order }>(`${this.apiUrl}/${id}`);
  }

  updateOrderStatus(id: string, status: string, paymentStatus?: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, { status, paymentStatus });
  }
}
