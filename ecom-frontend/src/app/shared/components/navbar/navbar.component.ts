import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  showSearch = false;
  searchQuery = '';

  constructor(
    public authService: AuthService,
    public cartService: CartService,
    private router: Router
  ) {}

  toggleSearch() {
    this.showSearch = !this.showSearch;
    if (!this.showSearch) {
      this.searchQuery = '';
    }
  }

  performSearch() {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/products'], { queryParams: { search: this.searchQuery } });
      this.toggleSearch();
    }
  }

  logout() {
    this.authService.logout();
  }
}
