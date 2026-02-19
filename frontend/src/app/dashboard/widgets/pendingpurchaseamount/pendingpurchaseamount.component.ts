import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppCurrencyPipe } from '../../../shared/pipes/currency.pipe';

@Component({
  selector: 'app-pending-purchase-amount',
  standalone: true,
  imports: [CommonModule, AppCurrencyPipe],
  templateUrl: './pendingpurchaseamount.component.html',
  styleUrl: './pendingpurchaseamount.component.scss'
})
export class PendingpurchaseamountComponent {
  @Input() amount: number = 0;
}
