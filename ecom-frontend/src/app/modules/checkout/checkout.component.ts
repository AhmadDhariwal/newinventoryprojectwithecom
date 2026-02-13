import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';



@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
   templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit {
  checkoutForm: FormGroup;
  step = 1;
  cartItems: any[] = [];
  submitting = false;
  orderSuccess = false;
  lastOrderId = '';
  organizationId = '';
  isGuest = false;
  error = '';
  
  // Coupon local state


  couponCode = '';
  appliedCoupon: any = null;
  couponError = '';
  couponLoading = false;
  discountAmount = 0;

  constructor(
    private fb: FormBuilder,
    public cartService: CartService,
    private orderService: OrderService,
    private authService: AuthService,
    private router: Router
  ) {
    this.checkoutForm = this.fb.group({
      street: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      zipCode: ['', Validators.required],
      country: ['', Validators.required],
      paymentMethod: ['cash_on_delivery', Validators.required],
      
      // Guest fields
      guestName: [''],
      guestEmail: [''],
      guestPhone: ['']
    });
  }


  applyCoupon() {
    if (!this.couponCode) return;
    this.couponLoading = true;
    this.couponError = '';
    
    this.orderService.validateCoupon(this.couponCode, this.organizationId).subscribe({
      next: (res) => {
        this.appliedCoupon = res.data;
        this.calculateDiscount();
        this.couponLoading = false;
      },
      error: (err) => {
        this.couponError = err.error?.message || 'Invalid coupon code';
        this.appliedCoupon = null;
        this.discountAmount = 0;
        this.couponLoading = false;
      }
    });
  }

  private calculateDiscount() {
    if (!this.appliedCoupon) return;
    const total = this.cartService.getTotalAmount();
    if (this.appliedCoupon.discountType === 'percentage') {
      this.discountAmount = (total * this.appliedCoupon.discountValue) / 100;
    } else {
      this.discountAmount = this.appliedCoupon.discountValue;
    }
  }

  getFinalTotal() {
    return Math.max(0, this.cartService.getTotalAmount() - this.discountAmount);
  }


  ngOnInit() {
    this.cartService.cartItems$.subscribe(items => {
      this.cartItems = items;
      if (items.length === 0 && !this.orderSuccess) {
        this.router.navigate(['/cart']);
      }
    });

    // Populate address if customer profile exists
    const user = this.authService.getCurrentUser();
    if (user) {
      this.organizationId = (user as any).organizationId || '';
      // Mocking pre-fill
      this.checkoutForm.patchValue({
         street: (user as any).shippingAddress?.street || '',
         city: (user as any).shippingAddress?.city || '',
         state: (user as any).shippingAddress?.state || '',
         zipCode: (user as any).shippingAddress?.zipCode || '',
         country: (user as any).shippingAddress?.country || ''
      });
    } else {
      this.isGuest = true;
      this.organizationId = environment.organizationId;
      
      // Add validators for guest fields
      this.f['guestName'].setValidators([Validators.required]);
      this.f['guestEmail'].setValidators([Validators.required, Validators.email]);
      this.f['guestPhone'].setValidators([Validators.required]);
      this.checkoutForm.updateValueAndValidity();
    }
  }


  get f() { return this.checkoutForm.controls; }

  isStep1Invalid() {
    const basicInvalid = this.f['street'].invalid || this.f['city'].invalid || this.f['state'].invalid || this.f['zipCode'].invalid || this.f['country'].invalid;
    
    if (this.isGuest) {
       const guestInvalid = !this.f['guestName'].value || !this.f['guestEmail'].value || this.f['guestEmail'].invalid;
       return basicInvalid || guestInvalid;
    }
    return basicInvalid;
  }


  nextStep() { this.step++; }
  prevStep() { this.step--; }

  onSubmit() {
    if (this.checkoutForm.invalid) return;

    this.submitting = true;
    this.couponError = '';
    this.error = '';

    const orderData = {
      items: this.cartItems.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.product.price
      })),
      shippingAddress: {
        street: this.f['street'].value,
        city: this.f['city'].value,
        state: this.f['state'].value,
        zipCode: this.f['zipCode'].value,
        country: this.f['country'].value
      },
      billingAddress: {
        street: this.f['street'].value,
        city: this.f['city'].value,
        state: this.f['state'].value,
        zipCode: this.f['zipCode'].value,
        country: this.f['country'].value
      },
      paymentMethod: this.f['paymentMethod'].value,
      couponCode: this.appliedCoupon ? this.appliedCoupon.code : null,

      
      // Include guest details if guest
      guestDetails: this.isGuest ? {
        name: this.f['guestName'].value,
        email: this.f['guestEmail'].value,
        phone: this.f['guestPhone'].value
      } : null,
      organizationId: this.organizationId
    };



    this.orderService.createOrder(orderData).subscribe({
      next: (res) => {
        this.orderSuccess = true;
        this.lastOrderId = res.data._id;
        this.cartService.clearCart();
        this.submitting = false;
      },
      error: (err) => {
        this.error = err.message || 'An error occurred while placing the order.';
        this.submitting = false;
      }
    });
  }
}

