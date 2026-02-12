import { Component, OnInit } from '@angular/core';
import { OrderService } from '../../../core/services/order.service';
import { Order } from '../../../core/models/models';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule,RouterModule],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss'
})
export class OrdersComponent implements OnInit{
 orders: Order[] = [];
  loading = true;
  constructor(private orderService: OrderService) {}
  ngOnInit() {
    this.orderService.getOrders().subscribe({
      next: (res) => {
        this.orders = res.data;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }
}
