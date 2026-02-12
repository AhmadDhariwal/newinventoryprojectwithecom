import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CartService, CartItem } from '../../core/services/cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent {
  constructor(public cartService: CartService) {}

  updateQty(item: CartItem, amount: number) {
    this.cartService.updateQuantity(item.product._id, item.quantity + amount);
  }

  removeItem(productId: string) {
    this.cartService.removeFromCart(productId);
  }
}
