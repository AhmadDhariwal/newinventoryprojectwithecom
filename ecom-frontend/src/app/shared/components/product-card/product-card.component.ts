import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Product } from '../../../core/models/models';
import { CartService } from '../../../core/services/cart.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss']
})
export class ProductCardComponent {
  @Input() product!: Product;

  constructor(private cartService: CartService) {}

  getProductImage(): string {
    if (this.product.images && this.product.images.length > 0) {
      return `http://localhost:3000${this.product.images[0]}`;
    }
    return `https://via.placeholder.com/400x500?text=${encodeURIComponent(this.product.name)}`;
  }

  addToCart(event: Event) {
    event.stopPropagation();
    this.cartService.addToCart(this.product);
  }
}
