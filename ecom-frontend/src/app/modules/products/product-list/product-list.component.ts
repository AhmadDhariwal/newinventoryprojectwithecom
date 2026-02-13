import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { CategoryService, Category } from '../../../core/services/category.service';
import { Product } from '../../../core/models/models';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card.component';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductCardComponent],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  categories: Category[] = [];
  loading = true;
  // Pagination
  currentPage = 1;
  pageSize = 12;
  totalProducts = 0;
  totalPages = 0;

  // Filters
  searchQuery = '';
  selectedCategory = '';
  sortBy = 'newest';
  minPrice?: number;
  maxPrice?: number;
  onlySale = false;

  categoryTree: Category[] = [];
  expandedCategories: Set<string> = new Set();

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['search']) {
        this.searchQuery = params['search'];
      }
      if (params['category']) {
        this.selectedCategory = params['category'];
      }
    });

    this.loadProducts();
    this.loadCategories();

    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentPage = 1;
      this.loadProducts();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProducts() {
    this.loading = true;
    const filters = {
      search: this.searchQuery,
      category: this.selectedCategory,
      minPrice: this.minPrice,
      maxPrice: this.maxPrice,
      page: this.currentPage,
      limit: this.pageSize,
      sort: this.sortBy,
      onlySale: this.onlySale
    };

    this.productService.getProducts(filters).subscribe({
      next: (res) => {
        this.products = res.data;
        if (res.pagination) {
          this.totalProducts = res.pagination.total;
          this.totalPages = res.pagination.pages;
        } else {
          // If no pagination from backend (as per user's manual change)
          this.totalProducts = res.data.length;
          this.totalPages = 1;
        }
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  loadCategories() {
    this.categoryService.getCategories().subscribe({
      next: (res) => {
        this.categories = res.data;
        this.categoryTree = this.buildCategoryTree(res.data);
      },
      error: () => {
        this.categories = [];
        this.categoryTree = [];
      }
    });
  }

  private buildCategoryTree(categories: Category[]): Category[] {
    const map = new Map<string, Category>();
    const roots: Category[] = [];

    categories.forEach(cat => {
      map.set(cat._id, { ...cat, children: [] });
    });

    categories.forEach(cat => {
      const node = map.get(cat._id)!;
      if (cat.parentId && map.has(cat.parentId)) {
        map.get(cat.parentId)!.children!.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }

  toggleCategory(id: string, event: Event) {
    event.stopPropagation();
    if (this.expandedCategories.has(id)) {
      this.expandedCategories.delete(id);
    } else {
      this.expandedCategories.add(id);
    }
  }

  isExpanded(id: string): boolean {
    return this.expandedCategories.has(id);
  }

  onSearch() {
    this.searchSubject.next(this.searchQuery);
  }

  onSort() {
    this.currentPage = 1;
    this.loadProducts();
  }

  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadProducts();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  toggleSaleFilter() {
    this.onlySale = !this.onlySale;
    this.currentPage = 1;
    this.loadProducts();
  }

  selectCategory(id: string) {
    this.selectedCategory = id;
    this.currentPage = 1;
    this.loadProducts();
  }

  applyFilters() {
    this.currentPage = 1;
    this.loadProducts();
  }

  clearFilters() {
    this.searchQuery = '';
    this.selectedCategory = '';
    this.minPrice = undefined;
    this.maxPrice = undefined;
    this.onlySale = false;
    this.currentPage = 1;
    this.loadProducts();
  }
}


