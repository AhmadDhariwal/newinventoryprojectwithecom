import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomerService } from '../../core/services/customer.service';
import { environment } from '../../../environments/environment';


@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent implements OnInit {
  contactForm!: FormGroup;
  loading = false;
  submitted = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private customerService: CustomerService
  ) {}

  ngOnInit() {
    this.initForm();
  }

  initForm() {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      subject: ['', [Validators.required, Validators.minLength(5)]],
      message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
      organizationId: [environment.organizationId]
    });
  }

  get f() { return this.contactForm.controls; }

  onSubmit() {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.contactForm.invalid) {
      return;
    }

    this.loading = true;
    this.customerService.submitContact(this.contactForm.value).subscribe({
      next: (res) => {
        this.successMessage = 'Thank you for contacting us! Your message has been sent.';
        this.contactForm.reset({
          organizationId: environment.organizationId
        });
        this.submitted = false;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Something went wrong. Please try again later.';
        this.loading = false;
      }
    });
  }
}

