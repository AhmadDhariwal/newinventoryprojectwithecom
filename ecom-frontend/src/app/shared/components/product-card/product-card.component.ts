import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Product } from '../../../core/models/models';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="product-card fade-in">
      <div class="product-image" [routerLink]="['/products', product._id]">
        <img src="https://via.placeholder.com/300x300?text={{ product.name }}" [alt]="product.name">
        <div class="badge" *ngIf="!product.inStock">Out of Stock</div>
      </div>
      <div class="product-info">
        <span class="category">{{ product.category.name }}</span>
        <h3 [routerLink]="['/products', product._id]">{{ product.name }}</h3>
        <div class="price-action">
          <span class="price">{{ product.price | currency }}</span>
          <button 
            *ngIf="product.inStock" 
            (click)="addToCart($event)" 
            class="btn-add"
            aria-label="Add to cart"
          >
            Add +
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .product-card {
      background: var(--white);
      border-radius: 8px;
      overflow: hidden;
      box-shadow: var(--shadow-sm);
      transition: var(--transition-smooth);
      display: flex;
      flex-direction: column;
    }
    .product-card:hover {
      transform: translateY(-5px);
      box-shadow: var(--shadow-md);
    }
    .product-image {
      position: relative;
      cursor: pointer;
      aspect-ratio: 1/1;
      overflow: hidden;
    }
    .product-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.5s ease;
    }
    .product-card:hover .product-image img {
      transform: scale(1.05);
    }
    .badge {
      position: absolute;
      top: 10px;
      right: 10px;
      background: rgba(0,0,0,0.7);
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
    }
    .product-info {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      flex-grow: 1;
    }
    .category {
      font-size: 0.75rem;
      text-transform: uppercase;
      color: var(--text-muted);
      letter-spacing: 1px;
      margin-bottom: 0.5rem;
    }
    h3 {
      font-size: 1.1rem;
      margin: 0 0 1rem 0;
      color: var(--primary-color);
      cursor: pointer;
    }
    .price-action {
      margin-top: auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .price {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--primary-color);
    }
    .btn-add {
      background: var(--primary-color);
      color: var(--white);
      padding: 0.4rem 1rem;
      border-radius: 4px;
      font-weight: 600;
      transition: var(--transition-smooth);
    }
    .btn-add:hover {
      background: #1a3a5a;
      transform: scale(1.05);
    }
  `]
})
export class ProductCardComponent {
  @Input() product!: Product;

  constructor(private cartService: CartService) {}

  addToCart(event: Event) {
    event.stopPropagation();
    this.cartService.addToCart(this.product);
  }
}
