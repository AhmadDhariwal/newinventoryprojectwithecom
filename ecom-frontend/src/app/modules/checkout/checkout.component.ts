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
  step = 1; // 1: Delivery, 2: Review, 3: Payment
  cartItems: any[] = [];
  submitting = false;
  orderSuccess = false;
  lastOrderId = '';
  organizationId = '';
  isGuest = false;
  error = '';
  
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
      // Shipping
      street: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      zipCode: ['', Validators.required],
      country: ['', Validators.required],
      
      // Billing
      billingSameAsShipping: [true],
      billingStreet: [''],
      billingCity: [''],
      billingState: [''],
      billingZipCode: [''],
      billingCountry: [''],

      paymentMethod: ['cash_on_delivery', Validators.required],
      
      // Guest fields
      guestName: [''],
      guestEmail: [''],
      guestPhone: ['']
    });
  }

  ngOnInit() {
    this.cartService.cartItems$.subscribe(items => {
      this.cartItems = items;
      if (items.length === 0 && !this.orderSuccess) {
        this.router.navigate(['/cart']);
      }
    });

    const user = this.authService.getCurrentUser() as any;
    if (user) {
      this.organizationId = user.organizationId || environment.organizationId;
      this.isGuest = false;
      
      // Pre-fill from profile
      this.checkoutForm.patchValue({
        street: user.shippingAddress?.street || '',
        city: user.shippingAddress?.city || '',
        state: user.shippingAddress?.state || '',
        zipCode: user.shippingAddress?.zipCode || '',
        country: user.shippingAddress?.country || ''
      });
    } else {
      this.isGuest = true;
      this.organizationId = environment.organizationId;
      
      this.f['guestName'].setValidators([Validators.required]);
      this.f['guestEmail'].setValidators([Validators.required, Validators.email]);
      this.f['guestPhone'].setValidators([Validators.required]);
      this.checkoutForm.updateValueAndValidity();
    }
  }

  get f() { return this.checkoutForm.controls; }

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

  nextStep() {
    if (this.step === 1) {
      if (this.isStep1Invalid()) {
        this.checkoutForm.markAllAsTouched();
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.step++;
  }

  prevStep() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.step--;
  }

  isStep1Invalid() {
    // Shipping fields validation
    const shippingInvalid = this.f['street'].invalid || this.f['city'].invalid || this.f['state'].invalid || 
                            this.f['zipCode'].invalid || this.f['country'].invalid;
    
    // Billing validation if not same as shipping
    let billingInvalid = false;
    if (!this.f['billingSameAsShipping'].value) {
      billingInvalid = !this.f['billingStreet'].value || !this.f['billingCity'].value || 
                       !this.f['billingState'].value || !this.f['billingZipCode'].value || 
                       !this.f['billingCountry'].value;
    }

    if (this.isGuest) {
      const guestInvalid = this.f['guestName'].invalid || this.f['guestEmail'].invalid || this.f['guestPhone'].invalid;
      return shippingInvalid || billingInvalid || guestInvalid;
    }
    return shippingInvalid || billingInvalid;
  }

  onSubmit() {
    if (this.checkoutForm.invalid) return;

    this.submitting = true;
    this.error = '';

    const shipping = {
      street: this.f['street'].value,
      city: this.f['city'].value,
      state: this.f['state'].value,
      zipCode: this.f['zipCode'].value,
      country: this.f['country'].value
    };

    const billing = this.f['billingSameAsShipping'].value ? shipping : {
      street: this.f['billingStreet'].value,
      city: this.f['billingCity'].value,
      state: this.f['billingState'].value,
      zipCode: this.f['billingZipCode'].value,
      country: this.f['billingCountry'].value
    };

    const orderData = {
      items: this.cartItems.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.product.discountPrice || item.product.price
      })),
      shippingAddress: shipping,
      billingAddress: billing,
      paymentMethod: this.f['paymentMethod'].value,
      couponCode: this.appliedCoupon ? this.appliedCoupon.code : null,
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
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: (err) => {
        this.error = err.error?.message || 'An error occurred while placing the order.';
        this.submitting = false;
      }
    });
  }
}

