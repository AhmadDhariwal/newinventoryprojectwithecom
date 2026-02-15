
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedRoutingModule } from './shared-routing.module';
import { ShippingReturnsComponent } from './components/shipping-returns/shipping-returns.component';
import { ChatbotWidgetComponent } from './components/chatbot-widget/chatbot-widget.component';
import { FormsModule } from '@angular/forms';

@NgModule({
  imports: [
    CommonModule,
    SharedRoutingModule,
    ShippingReturnsComponent,
    FormsModule
  ],
  declarations: [
    ChatbotWidgetComponent
  ],
  exports: [
    ChatbotWidgetComponent
  ]
})
export class SharedModule { }
