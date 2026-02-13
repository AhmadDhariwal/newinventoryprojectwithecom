import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EcomOrderService, Order } from '../../shared/services/ecom-order.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-order-detail',
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.scss']
})
export class OrderDetailComponent implements OnInit {
  order: Order | null = null;
  loading = false;
  statusForm: FormGroup;
  error = '';
  success = '';

  constructor(
    private route: ActivatedRoute,
    private orderService: EcomOrderService,
    private fb: FormBuilder
  ) {
    this.statusForm = this.fb.group({
      status: ['', Validators.required],
      paymentStatus: ['']
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadOrder(id);
    }
  }

  loadOrder(id: string): void {
    this.loading = true;
    this.orderService.getOrderById(id).subscribe({
      next: (res) => {
        this.order = res.data;
        this.statusForm.patchValue({
          status: this.order.status,
          paymentStatus: this.order.paymentStatus
        });
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load order details';
        this.loading = false;
      }
    });
  }

  updateStatus(): void {
    if (!this.order || this.statusForm.invalid) return;

    this.loading = true;
    this.error = '';
    this.success = '';
    const { status, paymentStatus } = this.statusForm.value;

    this.orderService.updateOrderStatus(this.order._id, status, paymentStatus).subscribe({
      next: (res) => {
        this.success = 'Order updated successfully';
        if (this.order) {
            this.order.status = status;
            this.order.paymentStatus = paymentStatus;
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to update order';
        this.loading = false;
      }
    });
  }
}
