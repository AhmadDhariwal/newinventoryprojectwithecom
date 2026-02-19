import { Component,Input } from '@angular/core';
import { TotalProductsComponent } from './total-products/total-products.component';
import { TotalStockComponent } from './total-stock/total-stock.component';
import { LowStockComponent } from './low-stock/low-stock.component';
import { PendingPurchasesComponent } from './pending-purchases/pending-purchases.component';
import { StockTodayComponent } from './stock-today/stock-today.component';
import { PendingpurchaseamountComponent } from './pendingpurchaseamount/pendingpurchaseamount.component';
import { ApprovedpurchaseamountComponent } from './approvedpurchaseamount/approvedpurchaseamount.component';

@Component({
  selector: 'app-widgets',
  standalone: true,
  imports: [
    TotalProductsComponent,
    TotalStockComponent,
    LowStockComponent,
    PendingPurchasesComponent,
    StockTodayComponent,
    PendingpurchaseamountComponent,
    ApprovedpurchaseamountComponent
  ],
  templateUrl: './widgets.component.html',
  styleUrl: './widgets.component.scss'
})
export class WidgetsComponent {
  @Input() data: any;
}


