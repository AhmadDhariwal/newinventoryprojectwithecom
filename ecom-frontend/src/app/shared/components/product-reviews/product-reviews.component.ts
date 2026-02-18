import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ReviewService, Review, ReviewSummary } from '../../../core/services/review.service';
import { AuthService } from '../../../core/services/auth.service';


@Component({
  selector: 'app-product-reviews',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './product-reviews.component.html',
  styleUrls: ['./product-reviews.component.scss']
})
export class ProductReviewsComponent implements OnInit {
  @Input() productId!: string;
    Math = Math;

  reviewForm!: FormGroup;
  reviews: Review[] = [];
  summary: ReviewSummary = {
    averageRating: 0,
    totalReviews: 0,
    ratingBreakdown: { five: 0, four: 0, three: 0, two: 0, one: 0 }
  };

  loading = false;
  submitting = false;
  isLoggedIn = false;
  currentPage = 1;
  hasMore = false;
  selectedRating = 0;
  hoverRating = 0;
  showForm = false;

  constructor(
    private fb: FormBuilder,
    private reviewService: ReviewService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.isLoggedIn = this.authService.isLoggedIn();
    this.initForm();
    this.loadSummary();
    this.loadReviews();
  }

  initForm() {
    this.reviewForm = this.fb.group({
      rating: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      comment: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
      guestName: [''],
      guestEmail: ['']
    });

    if (!this.isLoggedIn) {
      this.reviewForm.get('guestName')?.setValidators([Validators.required]);
      this.reviewForm.get('guestEmail')?.setValidators([Validators.required, Validators.email]);
    }
  }

  loadSummary() {
    this.reviewService.getReviewSummary(this.productId).subscribe({
      next: (res) => {
        this.summary = res.data;
      },
      error: (err) => console.error('Error loading summary:', err)
    });
  }

  loadReviews() {
    this.loading = true;
    this.reviewService.getProductReviews(this.productId, this.currentPage).subscribe({
      next: (res) => {
        this.reviews = res.data.reviews;
        this.hasMore = res.data.pagination.hasMore;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading reviews:', err);
        this.loading = false;
      }
    });
  }

  setRating(rating: number) {
    this.selectedRating = rating;
    this.reviewForm.patchValue({ rating });
  }

  onSubmit() {
    if (this.reviewForm.invalid) {
      console.warn('Review form is invalid:', this.reviewForm.errors);
      Object.keys(this.reviewForm.controls).forEach(key => {
        const control = this.reviewForm.get(key);
        if (control?.invalid) {
          console.warn(`Control ${key} is invalid:`, control.errors);
        }
        control?.markAsTouched();
      });
      return;
    }

    this.submitting = true;
    const reviewData = {
      productId: this.productId,
      ...this.reviewForm.value
    };

    this.reviewService.submitReview(reviewData).subscribe({
      next: () => {
        alert('Review submitted successfully!');
        this.reviewForm.reset();
        this.selectedRating = 0;
        this.loadSummary();
        this.loadReviews();
        this.submitting = false;
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to submit review');
        this.submitting = false;
      }
    });
  }

  getStarArray(rating: number): boolean[] {
    return Array(5).fill(false).map((_, i) => i < rating);
  }

  getRatingPercentage(count: number): number {
    return this.summary.totalReviews > 0 ? (count / this.summary.totalReviews) * 100 : 0;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }
}
