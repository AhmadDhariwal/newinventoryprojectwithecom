import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule} from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  constructor(public authService: AuthService , private router : Router) {}

  closeSidebar() {
    this.close.emit();
  }

  logout() {
    this.authService.logout();
      this.router.navigate (['/login']);
    this.closeSidebar();
  }
}
