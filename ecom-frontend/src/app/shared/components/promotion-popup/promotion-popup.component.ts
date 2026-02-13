import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-promotion-popup',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './promotion-popup.component.html',
  styleUrls: ['./promotion-popup.component.scss'],
  animations: [
    trigger('fadeSlideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px) scale(0.95)' }),
        animate('0.5s ease-out', style({ opacity: 1, transform: 'translateY(0) scale(1)' }))
      ]),
      transition(':leave', [
        animate('0.3s ease-in', style({ opacity: 0, transform: 'scale(0.95)' }))
      ])
    ])
  ]
})
export class PromotionPopupComponent implements OnInit, OnDestroy {
  isVisible = false;
  hasSeenPopup = false;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.hasSeenPopup = localStorage.getItem('hasSeenPromoPopup') === 'true';

    // Show popup after a short delay if not logged in and hasn't seen it this session
    if (!this.hasSeenPopup) {
      this.authService.currentUser$.subscribe(user => {
        if (!user) {
          setTimeout(() => {
            this.isVisible = true;
          }, 3000);
        }
      });
    }
  }

  close() {
    this.isVisible = false;
    localStorage.setItem('hasSeenPromoPopup', 'true');
  }

  goToSignup() {
    this.close();
    this.router.navigate(['/auth/register']);
  }

  ngOnDestroy() {
    // Cleanup if needed
  }
}
