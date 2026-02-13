import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { Product } from '../../../core/models/models';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss']
})
export class ProductDetailComponent implements OnInit {
  product?: Product;
  quantity = 1;
  selectedImageIndex = 0;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private cartService: CartService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.productService.getProductById(id).subscribe(res => {
        this.product = res.data;
      });
    }
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

  addToCart() {
    if (this.product) {
      this.cartService.addToCart(this.product, this.quantity);
    }
  }
}
