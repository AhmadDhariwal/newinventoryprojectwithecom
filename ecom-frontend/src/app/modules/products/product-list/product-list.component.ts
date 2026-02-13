import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { CategoryService, Category } from '../../../core/services/category.service';
import { Product } from '../../../core/models/models';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductCardComponent],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  categories: Category[] = [];
  loading = true;

  searchQuery = '';
  selectedCategory = '';
  sortBy = 'newest';
  minPrice?: number;
  maxPrice?: number;

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService
  ) {}

  ngOnInit() {
    this.loadProducts();
    this.loadCategories();
  }

  loadProducts() {
    this.loading = true;
    const filters = {
      search: this.searchQuery,
      category: this.selectedCategory,
      minPrice: this.minPrice,
      maxPrice: this.maxPrice
    };

    this.productService.getProducts(filters).subscribe({
      next: (res) => {
        this.products = res.data;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  loadCategories() {
    this.categoryService.getCategories().subscribe({
      next: (res) => {
        this.categories = res.data;
      },
      error: () => {
        this.categories = [];
      }
    });
  }

  onSearch() { this.loadProducts(); }
  onSort() { /* Client side sort logic or re-fetch */ }
  selectCategory(id: string) {
    this.selectedCategory = id;
    this.loadProducts();
  }
  applyFilters() { this.loadProducts(); }
  clearFilters() {
    this.searchQuery = '';
    this.selectedCategory = '';
    this.minPrice = undefined;
    this.maxPrice = undefined;
    this.loadProducts();
  }
}
