import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductService } from '../../shared/services/product.service';
import { Product } from '../../shared/models/inventory/product.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ForecastingService, StockForecast } from '../../shared/services/forecasting.service';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.scss'
})
export class ProductDetailsComponent implements OnInit {
  product!: Product;
  stockLevels: any[] = [];
  totalStock = 0;
  loading = true;
  updating = false;
  forecast?: StockForecast;
  protected readonly Infinity = Infinity;

  getRiskClass(days: number): string {
    if (days <= 3) return 'risk-high';
    if (days <= 7) return 'risk-medium';
    return 'risk-low';
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private forecastingService: ForecastingService
  ) {}

  ngOnInit(): void {
    const productId = this.route.snapshot.paramMap.get('id');
    if (productId) {
      this.loadProduct(productId);
      this.loadStockLevels(productId);
      this.loadForecast(productId);
    }
  }

  loadProduct(id: string): void {
    this.productService.getProductById(id).subscribe({
      next: (product) => {
        this.product = product;
      },
      error: (err) => {
        const sanitizedError = String(err.message || 'Unknown error').replace(/[\r\n\t]/g, ' ');
        console.error('Error loading product:', sanitizedError);
        this.loading = false;
      }
    });
  }

  loadStockLevels(productId: string): void {
    this.productService.getStockLevels(productId).subscribe({
      next: (stockLevels) => {
        this.stockLevels = stockLevels;
        this.totalStock = stockLevels.reduce((sum: number, s: any) => sum + (s.quantity || 0), 0);
        this.loading = false;
        // Stock levels now include reorderLevel and minStock directly
      },
      error: (err) => {
        const sanitizedError = String(err.message || 'Unknown error').replace(/[\r\n\t]/g, ' ');
        console.error('Error loading stock levels:', sanitizedError);
        this.loading = false;
      }
    });
  }

  loadForecast(id: string): void {
    this.forecastingService.getProductForecast(id).subscribe({
      next: (forecast) => {
        this.forecast = forecast;
      },
      error: (err) => {
        console.error('Error loading forecast:', err);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/products']);
  }

  getStockStatus(stock: any): string {
    const quantity = stock.quantity || 0;
    const reorderLevel = stock.reorderLevel || 0;
    const minStock = stock.minStock || 0;

    if (quantity <= minStock) return 'critical';
    if (quantity <= reorderLevel) return 'low';
    return 'ok';
  }

  getStockStatusText(stock: any): string {
    const status = this.getStockStatus(stock);
    switch (status) {
      case 'critical': return 'Critical';
      case 'low': return 'Low Stock';
      default: return 'OK';
    }
  }

  updateStockRule(stock: any): void {
    if (this.updating) return;

    this.updating = true;

    // Update stock level with reorderLevel, minStock, and reservedQuantity
    if (stock._id) {
      const updateData = {
        reservedQuantity: Number(stock.reservedQuantity) || 0,
        reorderLevel: Number(stock.reorderLevel) || 0,
        minStock: Number(stock.minStock) || 0
      };

      this.productService.updateStockLevelWithRules(stock._id, updateData).subscribe({
        next: (result) => {
          console.log('Stock level updated successfully');
          this.updating = false;
          // Reload stock levels to reflect changes
          if (this.product) {
            this.loadStockLevels(this.product._id);
          }
        },
        error: (err) => {
          const sanitizedError = String(err.error?.error || err.message || 'Unknown error').replace(/[\r\n\t]/g, ' ');
          console.error('Error updating stock:', sanitizedError);
          alert('Error updating stock: ' + sanitizedError);
          this.updating = false;
        }
      });
    } else {
      this.updating = false;
      alert('No valid stock level ID to update');
    }
  }

  updateProductSettings(): void {
    if (this.updating || !this.product) return;

    this.updating = true;

    const updateData = {
      reorderLevel: Number(this.product.reorderLevel) || 0,
      reservedQuantity: Number(this.product.reservedQuantity) || 0
    };

    this.productService.updateProductStock(this.product._id, updateData).subscribe({
      next: (result) => {
        console.log('Product settings updated successfully');
        this.updating = false;
      },
      error: (err) => {
        const sanitizedError = String(err.error?.error || err.message || 'Unknown error').replace(/[\r\n\t]/g, ' ');
        console.error('Error updating product settings:', sanitizedError);
        alert('Error updating product settings: ' + sanitizedError);
        this.updating = false;
      }
    });
  }
}

