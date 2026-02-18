import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Review {
  _id: string;
  rating: number;
  comment: string;
  reviewerName: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
  helpfulCount: number;
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  ratingBreakdown: {
    five: number;
    four: number;
    three: number;
    two: number;
    one: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private apiUrl = 'http://localhost:3000/api/reviews';

  constructor(private http: HttpClient) {}

  submitReview(reviewData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}`, {
      ...reviewData,
      organizationId: environment.organizationId
    });
  }

  getProductReviews(productId: string, page = 1, limit = 10, rating?: number, sort = 'newest'): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('sort', sort);

    if (rating) {
      params = params.set('rating', rating.toString());
    }

    return this.http.get(`${this.apiUrl}/product/${productId}`, { params });
  }

  getReviewSummary(productId: string): Observable<{ success: boolean; data: ReviewSummary }> {
    return this.http.get<{ success: boolean; data: ReviewSummary }>(`${this.apiUrl}/product/${productId}/summary`);
  }
}
