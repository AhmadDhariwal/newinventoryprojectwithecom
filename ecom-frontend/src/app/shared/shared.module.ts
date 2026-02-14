
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedRoutingModule } from './shared-routing.module';
import { ShippingReturnsComponent } from './components/shipping-returns/shipping-returns.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    SharedRoutingModule,
    ShippingReturnsComponent
  ],
  exports: []
})
export class SharedModule { }
