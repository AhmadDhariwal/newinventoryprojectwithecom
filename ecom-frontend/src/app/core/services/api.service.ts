import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private getCommonParams(): HttpParams {
    return new HttpParams();
  }

  get<T>(path: string, params: any = {}): Observable<T> {
    let httpParams = this.getCommonParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        httpParams = httpParams.set(key, params[key]);
      }
    });

    return this.http.get<T>(`${this.apiUrl}${path}`, { params: httpParams })
      .pipe(catchError(this.handleError));
  }

  post<T>(path: string, body: any): Observable<T> {
    const params = this.getCommonParams();
    // For auth endpoints, add organizationId to body
    if (path.includes('/auth/')) {
      body = { ...body, organizationId: environment.organizationId };
    }
    return this.http.post<T>(`${this.apiUrl}${path}`, body, { params })
      .pipe(catchError(this.handleError));
  }

  put<T>(path: string, body: any): Observable<T> {
    const params = this.getCommonParams();
    return this.http.put<T>(`${this.apiUrl}${path}`, body, { params })
      .pipe(catchError(this.handleError));
  }

  delete<T>(path: string): Observable<T> {
    const params = this.getCommonParams();
    return this.http.delete<T>(`${this.apiUrl}${path}`, { params })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = error.error?.message || `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    return throwError(() => new Error(errorMessage));
  }
}
