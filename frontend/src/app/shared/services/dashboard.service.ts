import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private api = 'http://localhost:3000/api/dashboard';
  constructor(private http: HttpClient) { }

  getdashboardstats(): Observable<any> {
    return this.http.get(this.api);
  }

  getStockTrend(days: number = 30): Observable<any> {
    return this.http.get(`${this.api}/stock-trend?days=${days}`);
  }

  getPurchaseTrend(days: number = 30): Observable<any> {
    return this.http.get(`${this.api}/purchase-trend?days=${days}`);
  }

  getSalesTrend(days: number = 30): Observable<any> {
    return this.http.get(`${this.api}/sales-trend?days=${days}`);
  }
  
  getOrderStatusAnalytics(range: number = 30): Observable<any> {
    return this.http.get(`${this.api}/analytics/order-status?range=${range}`);
  }
}
