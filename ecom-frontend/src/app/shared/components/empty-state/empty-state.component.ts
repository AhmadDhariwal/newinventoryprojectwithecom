import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.scss']
})
export class EmptyStateComponent {
  @Input() title: string = 'Nothing here yet';
  @Input() message: string = 'Looks like you haven\'t added anything here.';
  @Input() icon: string = 'bi-bag';
  @Input() buttonText: string = 'Start Shopping';
  @Input() buttonLink: string = '/products';
}
