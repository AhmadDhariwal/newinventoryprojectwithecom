import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="navbar">
      <div class="container navbar-content">
        <a routerLink="/" class="logo">
          <span class="logo-text">STOCK</span><span class="logo-accent">ECOM</span>
        </a>

        <div class="nav-links">
          <a routerLink="/products" routerLinkActive="active">Products</a>
          <a routerLink="/cart" class="cart-link">
            Cart
            <span class="cart-badge" *ngIf="(cartService.cartItems$ | async)?.length">
              {{ (cartService.cartItems$ | async)?.length }}
            </span>
          </a>
          <ng-container *ngIf="authService.currentUser$ | async as user; else guestLinks">
            <a routerLink="/user/profile" class="user-link">{{ user.name }}</a>
            <button (click)="logout()" class="btn-logout">Logout</button>
          </ng-container>
          <ng-template #guestLinks>
            <a routerLink="/auth/login" class="btn-login">Login</a>
          </ng-template>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      background: var(--primary-color);
      color: var(--white);
      padding: 1rem 0;
      box-shadow: var(--shadow-sm);
      position: sticky;
      top: 0;
      z-index: 1000;
    }
    .navbar-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .logo {
      font-size: 1.5rem;
      font-weight: 800;
      letter-spacing: 1px;
    }
    .logo-accent { color: var(--secondary-color); }
    .nav-links {
      display: flex;
      gap: 2rem;
      align-items: center;
    }
    .active { color: var(--secondary-color); }
    .cart-link { position: relative; }
    .cart-badge {
      position: absolute;
      top: -8px;
      right: -15px;
      background: var(--secondary-color);
      color: var(--primary-color);
      font-size: 0.7rem;
      font-weight: bold;
      padding: 2px 6px;
      border-radius: 10px;
    }
    .btn-login {
      background: var(--secondary-color);
      color: var(--primary-color);
      padding: 0.5rem 1.5rem;
      border-radius: 4px;
      font-weight: 600;
    }
    .btn-logout {
      color: var(--white);
      font-size: 1rem;
      opacity: 0.8;
    }
    .btn-logout:hover { opacity: 1; color: var(--secondary-color); }
  `]
})
export class NavbarComponent {
  constructor(
    public authService: AuthService,
    public cartService: CartService
  ) {}

  logout() {
    this.authService.logout();
  }
}
