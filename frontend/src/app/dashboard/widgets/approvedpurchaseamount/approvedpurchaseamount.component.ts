import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-approved-purchase-amount',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './approvedpurchaseamount.component.html',
  styleUrl: './approvedpurchaseamount.component.scss'
})
export class ApprovedpurchaseamountComponent {
  @Input() amount: number = 0;
}
