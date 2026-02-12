import { Component, OnInit, inject } from '@angular/core';
import { OrderService } from '../../../core/services/order.service';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule} from '@angular/common';

@Component({
  selector: 'app-refund-request',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './refund-request.component.html',
  styleUrl: './refund-request.component.scss'
})
export class RefundRequestComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private orderService = inject(OrderService);
  private router = inject(Router);

  orderId = '';
  submitting = false;
  success = false;
  error = '';

  constructor() {}

  ngOnInit() {
    this.orderId = this.route.snapshot.paramMap.get('id')!;
  }

  submitRefund() {
    this.submitting = true;
    this.error = '';
    
    // In a real app, we'd select items. Here we refund the whole order for simplicity.
    const refundData = {
      orderId: this.orderId,
      items: [], // Service should handle full order if empty or we populate
      reason: 'Customer requested refund via web portal'
    };

    this.orderService.requestRefund(refundData).subscribe({
      next: () => {
        this.success = true;
        this.submitting = false;
        setTimeout(() => this.router.navigate(['/user/orders']), 3000);
      },
      error: (err) => {
        this.error = err.message;
        this.submitting = false;
      }
    });
  }
}
