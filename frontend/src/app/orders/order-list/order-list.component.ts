import { Component, OnInit } from '@angular/core';
import { EcomOrderService, Order } from '../../shared/services/ecom-order.service';

@Component({
  selector: 'app-order-list',
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.scss']
})
export class OrderListComponent implements OnInit {
  orders: Order[] = [];
  loading = false;
  total = 0;
  page = 1;
  limit = 10;
  statusFilter = '';
  searchQuery = '';

  constructor(private orderService: EcomOrderService) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading = true;
    this.orderService.getAllOrders(this.page, this.limit, this.statusFilter, this.searchQuery)
      .subscribe({
        next: (res) => {
          this.orders = res.data;
          this.total = res.pagination.total;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading orders', err);
          this.loading = false;
        }
      });
  }

  onFilterChange(): void {
    this.page = 1;
    this.loadOrders();
  }

  onPageChange(page: number): void {
    this.page = page;
    this.loadOrders();
  }
}
