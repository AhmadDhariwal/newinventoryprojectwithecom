import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { ProfileComponent } from './profile/profile.component';
import { OrdersComponent } from './orders/orders.component';
import { RefundRequestComponent } from './refund-request/refund-request.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@NgModule({
  declarations: [
    
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild([
      { path: 'profile', component: ProfileComponent },
      { path: 'orders', component: OrdersComponent },
      { path: 'refund/:orderId', component: RefundRequestComponent }
    ])
  ]
})
export class UserModule { }
