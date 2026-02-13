import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrdersRoutingModule } from './orders-routing.module';
import { OrderListComponent } from './order-list/order-list.component';
import { OrderDetailComponent } from './order-detail/order-detail.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [
    OrderListComponent,
    OrderDetailComponent
  ],
  imports: [
    CommonModule,
    OrdersRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule
  ]
})
export class OrdersModule { }
