import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="footer">
      <div class="container footer-grid">
        <div class="footer-info">
          <h3>STOCK ECOM</h3>
          <p>The enterprise multi-tenant inventory & e-commerce solution.</p>
        </div>
        <div class="footer-links">
          <h4>Customer Service</h4>
          <ul>
            <li><a href="#">Contact Us</a></li>
            <li><a href="#">Shipping Policy</a></li>
            <li><a href="#">Refund Policy</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2024 StockEcom. All rights reserved.</p>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      background: #1a1a1a;
      color: #ccc;
      padding: 4rem 0 2rem;
      margin-top: 4rem;
    }
    .footer-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 2rem;
      border-bottom: 1px solid #333;
      padding-bottom: 2rem;
    }
    .footer-info h3 { color: var(--white); margin-bottom: 1rem; }
    .footer-links h4 { color: var(--white); margin-bottom: 1rem; }
    .footer-links ul { list-style: none; padding: 0; }
    .footer-links li { margin-bottom: 0.5rem; }
    .footer-bottom {
      text-align: center;
      margin-top: 2rem;
      font-size: 0.9rem;
    }
  `]
})
export class FooterComponent {}
