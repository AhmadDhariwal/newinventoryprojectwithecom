import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { Product } from '../models/models';

export interface CartItem {
  product: Product;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItemsSubject = new BehaviorSubject<CartItem[]>([]);
  public cartItems$ = this.cartItemsSubject.asObservable();
  
  public total$: Observable<number>;

  constructor() {
    this.total$ = this.cartItems$.pipe(
      map(items => items.reduce((acc, item) => acc + (item.product.discountPrice || item.product.price) * item.quantity, 0))
    );
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      this.cartItemsSubject.next(JSON.parse(savedCart));
    }
  }

  getItem(productId: string): CartItem | undefined {
    return this.cartItemsSubject.value.find(item => item.product._id === productId);
  }

  addToCart(product: Product, quantity: number = 1): void {
    const currentItems = this.cartItemsSubject.value;
    const existingItemIndex = currentItems.findIndex(item => item.product._id === product._id);

    if (existingItemIndex > -1) {
      currentItems[existingItemIndex].quantity += quantity;
    } else {
      currentItems.push({ product, quantity });
    }

    this.updateCart(currentItems);
  }

  removeFromCart(productId: string): void {
    const currentItems = this.cartItemsSubject.value.filter(item => item.product._id !== productId);
    this.updateCart(currentItems);
  }

  updateQuantity(productId: string, delta: number): void {
    const currentItems = this.cartItemsSubject.value;
    const item = currentItems.find(i => i.product._id === productId);
    if (item) {
      item.quantity += delta;
      if (item.quantity <= 0) {
        this.removeFromCart(productId);
      } else {
        this.updateCart(currentItems);
      }
    }
  }

  clearCart(): void {
    this.updateCart([]);
  }

  getTotalAmount(): number {
    return this.cartItemsSubject.value.reduce((total, item) => total + ((item.product.discountPrice || item.product.price) * item.quantity), 0);
  }

  getItemCount(): number {
    return this.cartItemsSubject.value.reduce((count, item) => count + item.quantity, 0);
  }

  private updateCart(items: CartItem[]): void {
    this.cartItemsSubject.next([...items]);
    localStorage.setItem('cart', JSON.stringify(items));
  }
}
