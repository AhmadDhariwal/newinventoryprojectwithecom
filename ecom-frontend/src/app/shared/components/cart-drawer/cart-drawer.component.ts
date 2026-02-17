import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cart-drawer.component.html',
  styleUrls: ['./cart-drawer.component.scss']
})
export class CartDrawerComponent {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  constructor(public cartService: CartService) {}

  closeDrawer() {
    this.close.emit();
  }

  incrementQuantity(productId: string) {
    const item = this.cartService.getItem(productId);
    if (item) {
      this.cartService.addToCart(item.product, 1);
    }
  }

  decrementQuantity(productId: string) {
    this.cartService.updateQuantity(productId, -1);
  }

  removeItem(productId: string) {
    this.cartService.removeFromCart(productId);
  }

  clearCart() {
    this.cartService.clearCart();
  }

  get getTotal() {
    return this.cartService.total$;
  }
}
