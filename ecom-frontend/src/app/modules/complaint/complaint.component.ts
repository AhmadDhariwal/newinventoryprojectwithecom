import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomerService } from '../../core/services/customer.service';
import { OrderService } from '../../core/services/order.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-complaint',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './complaint.component.html',
  styleUrls: ['./complaint.component.scss']
})
export class ComplaintComponent implements OnInit {
  complaintForm!: FormGroup;
  loading = false;
  submitted = false;
  errorMessage = '';
  successMessage = '';
  orderId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private customerService: CustomerService,
    private orderService: OrderService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.orderId = this.route.snapshot.queryParamMap.get('orderId');
    this.initForm();
  }

  initForm() {
    this.complaintForm = this.fb.group({
      orderId: [this.orderId || '', [Validators.required]],
      category: ['product_quality', [Validators.required]],
      description: ['', [Validators.required, Validators.minLength(20)]],
      organizationId: [environment.organizationId]
    });
  }

  get f() { return this.complaintForm.controls; }

  onSubmit() {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.complaintForm.invalid) {
      return;
    }

    this.loading = true;
    this.customerService.submitComplaint(this.complaintForm.value).subscribe({
      next: (res) => {
        this.successMessage = 'Your complaint has been submitted. We will review it and get back to you.';
        this.complaintForm.reset({
          organizationId: environment.organizationId,
          category: 'product_quality'
        });
        this.submitted = false;
        this.loading = false;
        setTimeout(() => this.router.navigate(['/user/orders']), 3000);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to submit complaint. Please check the Order ID and try again.';
        this.loading = false;
      }
    });
  }
}
