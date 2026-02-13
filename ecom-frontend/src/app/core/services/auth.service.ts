import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { AuthResponse, Customer } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<Customer | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private apiService: ApiService) {
    const savedCustomer = localStorage.getItem('customer');
    if (savedCustomer) {
      this.currentUserSubject.next(JSON.parse(savedCustomer));
    }
  }

  register(data: any): Observable<any> {
    return this.apiService.post<any>('/auth/register', data);
  }

  login(credentials: any): Observable<any> {
    return this.apiService.post<any>('/auth/login', credentials).pipe(
      tap(response => {
        if (response.success && response.data) {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('customer', JSON.stringify(response.data.customer));
          this.currentUserSubject.next(response.data.customer);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('customer');
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getCurrentUser(): Customer | null {
    return this.currentUserSubject.value;
  }
}
