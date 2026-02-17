import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { Product } from '../../../core/models/models';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card.component';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductCardComponent],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss']
})
export class ProductDetailComponent implements OnInit {
  product?: Product;
  featuredProducts: Product[] = [];
  quantity = 1;
  selectedImageIndex = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadProduct(id);
      }
    });
  }

  loadProduct(id: string) {
    this.productService.getProductById(id).subscribe({
      next: (res: any) => {
        this.product = res.data;
        this.quantity = 1;
        this.selectedImageIndex = 0;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.loadFeaturedProducts();
      },
      error: (err: any) => {
        console.error('Error loading product:', err);
        this.router.navigate(['/products']);
      }
    });
  }

  loadFeaturedProducts() {
    const categoryId = this.product?.category?._id;
    this.productService.getProducts({ 
      category: categoryId,
      limit: 5 
    }).subscribe({
      next: (res: any) => {
        this.featuredProducts = res.data
          .filter((p: any) => p._id !== this.product?._id)
          .slice(0, 4);
        
        if (this.featuredProducts.length === 0) {
          this.productService.getProducts({ limit: 5 }).subscribe({
            next: (allRes: any) => {
              this.featuredProducts = allRes.data
                .filter((p: any) => p._id !== this.product?._id)
                .slice(0, 4);
            }
          });
        }
      }
    });
  }

  getMainImage(): string {
    if (this.product?.images && this.product.images.length > 0) {
      return `http://localhost:3000${this.product.images[this.selectedImageIndex]}`;
    }
    return `https://via.placeholder.com/700x875?text=${encodeURIComponent(this.product?.name || 'Product')}`;
  }

  changeQty(amount: number) {
    const newQty = this.quantity + amount;
    if (newQty > 0 && newQty <= (this.product?.stockAvailable || 1)) {
      this.quantity = newQty;
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const stickyAction = document.querySelector('.mobile-sticky-action');
    if (stickyAction) {
      if (window.scrollY > 600) {
        stickyAction.classList.add('visible');
      } else {
        stickyAction.classList.remove('visible');
      }
    }
  }

  addToCart() {
    if (this.product) {
      this.cartService.addToCart(this.product, this.quantity);
    }
  }
}
