import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ProfileComponent } from './profile/profile.component';
import { OrdersComponent } from './orders/orders.component';
import { RefundRequestComponent } from './refund-request/refund-request.component';

const routes: Routes = [
  { path: 'profile', component: ProfileComponent },
  { path: 'orders', component: OrdersComponent },
  { path: 'refund/:id', component: RefundRequestComponent }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    ProfileComponent,
    OrdersComponent,
    RefundRequestComponent
  ]
})
export class UserModule { }
