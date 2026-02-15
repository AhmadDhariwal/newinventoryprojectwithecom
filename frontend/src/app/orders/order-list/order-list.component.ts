import { Component, OnInit, OnDestroy } from '@angular/core';
import { EcomOrderService, Order } from '../../shared/services/ecom-order.service';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-order-list',
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.scss']
})
export class OrderListComponent implements OnInit, OnDestroy {
  orders: Order[] = [];
  loading = false;
  total = 0;
  page = 1;
  limit = 10;
  statusFilter = '';
  searchQuery = '';
  Math = Math;

  private searchSubject = new Subject<string>();
  private searchSubscription!: Subscription;

  constructor(private orderService: EcomOrderService) {}

  ngOnInit(): void {
    // Debounce search input
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(500), // 500ms delay
      distinctUntilChanged()
    ).subscribe(query => {
      this.searchQuery = query;
      this.page = 1;
      this.loadOrders();
    });

    this.loadOrders();
  }

  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  loadOrders(): void {
    this.loading = true;
    this.orderService.getAllOrders(this.page, this.limit, this.statusFilter, this.searchQuery)
      .subscribe({
        next: (res) => {
          this.orders = res.data || [];
          this.total = res.pagination?.total || 0;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading orders', err);
          this.orders = [];
          this.total = 0;
          this.loading = false;
        }
      });
  }

  onSearch(query: string): void {
    this.searchSubject.next(query);
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
