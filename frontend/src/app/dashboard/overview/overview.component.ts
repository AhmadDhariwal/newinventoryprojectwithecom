import { Component, OnInit, OnDestroy } from '@angular/core';
import { DashboardService } from '../../shared/services/dashboard.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StockTrendComponent } from '../charts/stock-trend/stock-trend.component';
import { PurchaseTrendComponent } from '../charts/purchase-trend/purchase-trend.component';
import { SalesTrendComponent } from '../charts/sales-trend/sales-trend.component';
import { LowStockWidgetComponent } from '../widgets/low-stock-widget/low-stock-widget.component';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { StockDepletionWidgetComponent } from '../widgets/stock-depletion-widget/stock-depletion-widget.component';
import { OrderAnalyticsChartComponent } from '../charts/order-analytics/order-analytics-chart.component';
import { AppCurrencyPipe } from '../../shared/pipes/currency.pipe';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CommonModule, RouterModule, StockTrendComponent, PurchaseTrendComponent, SalesTrendComponent, LowStockWidgetComponent, SkeletonComponent, StockDepletionWidgetComponent, OrderAnalyticsChartComponent, AppCurrencyPipe],
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.scss'
})
export class OverviewComponent implements OnInit, OnDestroy {
  loading = true;
  error: string | null = null;
  private refreshSubscription?: Subscription;


  stats: any = {
    totalproducts: 0,
    totalsuppliers: 0,
    totalStock: 0,
    totalpurchases: 0,
    lowStockItems: 0,
    stockInToday: 0,
    stockOutToday: 0,
    pendingPurchases: 0
  };

  lowStockItems: any[] = [];
  stockTrendData: any[] = [];
  purchaseTrendData: any[] = [];
  salesTrendData: any[] = [];

  constructor(
    private dashboardService: DashboardService,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  loadDashboard(): void {
    this.dashboardService.getdashboardstats().subscribe({
      next: data => {
        console.log('Dashboard data received:', data);
        this.stats = {
          totalproducts: data.kpis?.totalProducts || 0,
          totalsuppliers: data.kpis?.totalSuppliers || 0,
          totalStock: data.kpis?.totalStockQty || 0,
          totalpurchases: data.kpis?.totalPurchaseAmount || 0,
          lowStockItems: data.alerts?.lowStockCount || 0,
          stockInToday: data.widgets?.stockInToday || 0,
          stockOutToday: data.widgets?.stockOutToday || 0,
          approvedpurchases: data.widgets?.approvedPurchases || 0,
          pendingPurchases: data.widgets?.pendingPurchases || 0
        };
        this.lowStockItems = data.alerts?.lowStockItems || [];
        this.loadStockTrend();
        this.loading = false;
        this.error = null;
      },
      error: err => {
        console.error('Dashboard error:', err);
        this.error = 'Failed to load dashboard data';
        this.loading = false;
      }
    });
  }

  loadStockTrend(): void {
    // Load stock trend with quality fallback
    this.dashboardService.getStockTrend(30).subscribe({
      next: data => {
        this.stockTrendData = (data && data.length > 0) ? data : [];
        console.log(' Stock trend loaded:', this.stockTrendData.length, 'days');
      },
      error: err => {
        console.error(' Stock trend API error:', err);
        this.stockTrendData = [];
      }
    });

    // Load purchase trend with quality fallback
    this.dashboardService.getPurchaseTrend(30).subscribe({
      next: data => {
        this.purchaseTrendData = (data && data.length > 0) ? data : [];
        console.log(' Purchase trend loaded:', this.purchaseTrendData.length, 'days');
      },
      error: err => {
        console.error(' Purchase trend API error:', err);
        this.purchaseTrendData = [];
      }
    });

    // Load sales trend with quality fallback
    this.dashboardService.getSalesTrend(30).subscribe({
      next: data => {
        this.salesTrendData = (data && data.length > 0) ? data : [];
        console.log(' Sales trend loaded:', this.salesTrendData.length, 'days');
      },
      error: err => {
        console.error(' Sales trend API error:', err);
        this.salesTrendData = [];
      }
    });
  }

  startAutoRefresh(): void {
    // Refresh every 30 seconds
    this.refreshSubscription = interval(30000)
      .pipe(switchMap(() => this.dashboardService.getdashboardstats()))
      .subscribe({
        next: data => {
          this.stats = {
            totalproducts: data.kpis?.totalProducts || 0,
            totalsuppliers: data.kpis?.totalSuppliers || 0,
            totalStock: data.kpis?.totalStockQty || 0,
            totalpurchases: data.kpis?.totalPurchaseAmount || 0,
            lowStockItems: data.alerts?.lowStockCount || 0,
            stockInToday: data.widgets?.stockInToday || 0,
            stockOutToday: data.widgets?.stockOutToday || 0,
            pendingPurchases: data.widgets?.pendingPurchases || 0
          };
          this.lowStockItems = data.alerts?.lowStockItems || [];
        },
        error: err => console.error('Auto-refresh error:', err)
      });
  }

  navigateToProduct(item: any): void {
    if (item.productId) {
      this.router.navigate(['/products', item.productId]);
    }
  }

  trackByProductId(index: number, item: any): any {
    return item.productName + item.warehouseName;
  }
}
