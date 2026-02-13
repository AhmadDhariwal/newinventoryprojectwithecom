import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CategoryService, Category } from '../../core/services/category.service';
import { Product } from '../../core/models/models';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductCardComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  featuredProducts: Product[] = [];
  saleProducts: Product[] = [];
  newArrivals: Product[] = [];
  categories: Category[] = [];
  loading = true;

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService
  ) {}

  ngOnInit() {
    this.loadFeaturedProducts();
    this.loadSaleProducts();
    this.loadNewArrivals();
    this.loadCategories();
  }

  loadFeaturedProducts() {
    this.loading = true;
    this.productService.getProducts({ limit: 4 }).subscribe({
      next: (res) => {
        this.featuredProducts = res.data.slice(0, 4);
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  loadSaleProducts() {
    this.productService.getProducts({ onlySale: true, limit: 4 }).subscribe({
      next: (res) => {
        this.saleProducts = res.data.slice(0, 4);
      },
      error: () => this.saleProducts = []
    });
  }

  loadNewArrivals() {
    this.productService.getProducts({ sort: 'newest', limit: 4 }).subscribe({
      next: (res) => {
        this.newArrivals = res.data.slice(0, 4);
      },
      error: () => this.newArrivals = []
    });
  }

  loadCategories() {
    this.categoryService.getCategories().subscribe({
      next: (res) => {
        this.categories = res.data.filter(c => !c.parentId).slice(0, 4);
      },
      error: () => {
        this.categories = [];
      }
    });
  }
}

