import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { PromotionPopupComponent } from './shared/components/promotion-popup/promotion-popup.component';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent, PromotionPopupComponent],

  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'ecom-frontend';
}
