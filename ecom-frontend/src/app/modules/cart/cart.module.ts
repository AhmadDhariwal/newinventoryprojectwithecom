import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { CartComponent } from './cart.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

const routes: Routes = [
  { path: '', component: CartComponent }
];

@NgModule({
  declarations: [
  ],
  imports: [
    CommonModule,
    RouterModule.forChild([{ path: '', component: CartComponent }]),
    EmptyStateComponent // Standalone component imported here
  ]
})
export class CartModule { }
