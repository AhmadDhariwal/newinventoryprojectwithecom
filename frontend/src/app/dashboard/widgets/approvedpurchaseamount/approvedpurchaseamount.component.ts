import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppCurrencyPipe } from '../../../shared/pipes/currency.pipe';

@Component({
  selector: 'app-approved-purchase-amount',
  standalone: true,
  imports: [CommonModule,AppCurrencyPipe],
  templateUrl: './approvedpurchaseamount.component.html',
  styleUrl: './approvedpurchaseamount.component.scss'
})
export class ApprovedpurchaseamountComponent {
  @Input() amount: number = 0;
}
