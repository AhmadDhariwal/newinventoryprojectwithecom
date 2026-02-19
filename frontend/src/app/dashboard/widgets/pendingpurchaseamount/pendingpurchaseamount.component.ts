import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pending-purchase-amount',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pendingpurchaseamount.component.html',
  styleUrl: './pendingpurchaseamount.component.scss'
})
export class PendingpurchaseamountComponent {
  @Input() amount: number = 0;
}
