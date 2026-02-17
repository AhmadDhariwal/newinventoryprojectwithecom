import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule,ReactiveFormsModule,FormsModule,RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {

  regForm: FormGroup;
  submitting = false;
  error = '';

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.regForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      phone: ['', Validators.required],
      street: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      zipCode: ['', Validators.required],
      country: ['', Validators.required],
      billingSameAsShipping: [true],
      billingStreet: [''],
      billingCity: [''],
      billingState: [''],
      billingZipCode: [''],
      billingCountry: ['']
    });
  }

  onRegister() {
    if (this.regForm.invalid) {
      this.regForm.markAllAsTouched();
      return;
    }
    
    this.submitting = true;
    this.error = '';

    const formValue = this.regForm.value;
    const registrationData: any = {
      name: formValue.name,
      email: formValue.email,
      password: formValue.password,
      phone: formValue.phone,
      street: formValue.street,
      city: formValue.city,
      state: formValue.state,
      zipCode: formValue.zipCode,
      country: formValue.country
    };

    if (!formValue.billingSameAsShipping) {
      registrationData.billingAddress = {
        street: formValue.billingStreet,
        city: formValue.billingCity,
        state: formValue.billingState,
        zipCode: formValue.billingZipCode,
        country: formValue.billingCountry
      };
    } else {
      registrationData.billingAddress = {
        street: formValue.street,
        city: formValue.city,
        state: formValue.state,
        zipCode: formValue.zipCode,
        country: formValue.country
      };
    }

    this.authService.register(registrationData).subscribe({
      next: () => {
        this.router.navigate(['/auth/login']);
      },
      error: (err) => {
        this.error = err.message || 'Registration failed. Please try again.';
        this.submitting = false;
      }
    });
  }

}
