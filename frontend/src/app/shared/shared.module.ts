import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KpiCardComponent } from './components/kpi-card/kpi-card.component';
import { ChatbotWidgetComponent } from './components/chatbot-widget/chatbot-widget.component';
import { FormsModule } from '@angular/forms';



@NgModule({
  imports: [
    CommonModule,
    KpiCardComponent,
    FormsModule
  ],
  declarations: [
    ChatbotWidgetComponent
  ],
  exports: [
    KpiCardComponent,
    ChatbotWidgetComponent
  ]
})
export class SharedModule { }
