import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { CustomerService } from '../../../core/services/customer.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [RouterModule, CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {

  profileForm!: FormGroup;
  loading = true;
  saving = false;
  successMsg = '';
  errorMsg = '';

  constructor(
    private authService: AuthService,
    private customerService: CustomerService,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.initForm();
    this.loadProfile();
  }

  initForm() {
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      street: [''],
      city: [''],
      state: [''],
      zipCode: [''],
      country: ['']
    });
  }

  loadProfile() {
    this.customerService.getProfile().subscribe({
      next: (res) => {
        const user = res.data;
        this.profileForm.patchValue({
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          street: user.shippingAddress?.street || '',
          city: user.shippingAddress?.city || '',
          state: user.shippingAddress?.state || '',
          zipCode: user.shippingAddress?.zipCode || '',
          country: user.shippingAddress?.country || ''
        });
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  onUpdate() {
    if (this.profileForm.invalid) return;
    this.saving = true;
    this.successMsg = '';
    this.errorMsg = '';

    const formValue = this.profileForm.value;
    const updateData = {
      name: formValue.name,
      email: formValue.email,
      phone: formValue.phone,
      shippingAddress: {
        street: formValue.street,
        city: formValue.city,
        state: formValue.state,
        zipCode: formValue.zipCode,
        country: formValue.country
      }
    };

    this.customerService.updateProfile(updateData).subscribe({
      next: (res) => {
        this.saving = false;
        this.successMsg = 'Profile updated successfully.';
        this.authService.login({}).subscribe(); // Refresh current user in auth service if needed, though getProfile is better
        // Update local storage if needed
        const saved = JSON.parse(localStorage.getItem('customer') || '{}');
        localStorage.setItem('customer', JSON.stringify({ ...saved, ...res.data }));
      },
      error: (err) => {
        this.saving = false;
        this.errorMsg = err.message || 'Failed to update profile.';
      }
    });
  }
}
