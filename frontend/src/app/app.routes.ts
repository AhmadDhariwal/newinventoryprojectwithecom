import { DashboardModule } from './dashboard/dashboard.module';
import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';

export const routes: Routes = [

   {
    path:'',
    loadComponent :() => import('./components/homepage/homepage.component').then((m) => m.HomepageComponent)
  },
  // Auth routes (no layout)
  {
    path: 'auth',
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent },
      { path: '', redirectTo: 'register', pathMatch: 'full' }
    ]
  },

  // Legacy auth routes (redirect to new structure)
  { path: 'login', redirectTo: 'auth/login', pathMatch: 'full' },
  { path: 'register', redirectTo: 'auth/register', pathMatch: 'full' },

  // Main application routes (with layout and auth guard)
  // {
  //   path:'',
  //   loadComponent :() => import('./components/homepage/homepage.component').then((m) => m.HomepageComponent)
  // },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./dashboard/dashboard.module').then(
            (m) => m.DashboardModule
          ),
        canActivate: [AuthGuard]
      },
      {
        path: 'stock',
        loadChildren: () =>
          import('./stock/stock.module').then(m => m.StockModule),
        canActivate: [AuthGuard]
      },
      {
        path: 'products',
        loadChildren: () =>
          import('./products/products.module').then(m => m.ProductsModule),
        canActivate: [AuthGuard]
      },
      {
        path: 'purchases',
        loadChildren: () =>
          import('./purchases/purchases.module').then(m => m.PurchasesModule),
        canActivate: [AuthGuard]
      },
      {
        path: 'suppliers',
        loadChildren: () =>
          import('./suppliers/suppliers.module').then(m => m.SuppliersModule),
        canActivate: [AuthGuard]
      },
      {
        path: 'reports',
        loadChildren: () =>
          import('./reports/reports.module').then(m => m.ReportsModule),
        canActivate: [AuthGuard]
      },
      {
        path: 'settings',
        loadChildren: () =>
          import('./settings/settings.module').then(m => m.SettingsModule),
        canActivate: [AuthGuard]
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./notifications/notification-activity/notification-activity.component').then(m => m.NotificationActivityComponent),
        canActivate: [AuthGuard]
      },
      {
        path: 'orders',
        loadChildren: () =>
          import('./orders/orders.module').then(m => m.OrdersModule),
        canActivate: [AuthGuard]
      }
    ]

  },

  // Fallback
  { path: '**', redirectTo: 'auth/login' }
];


//   {

//     path:'',
//     loadComponent :() => {
//       return import('./components/singup/singup.component').then
//       ((m) => m.SingupComponent,
//     )
//     }
//   },

//   {
//      path: 'login',
//      loadComponent :() => {
//       return import('./components/login/login.component').then(
//         (m) => m.LoginComponent,
//       )
//      }
//   },
// {
//   path:'homepage', canActivate :[AuthGuard],
//   loadComponent:() => {
//     return import('./components/homepage/homepage.component').then(
//       (m) => m.HomepageComponent,
//     )
//   }
// },
//   {
//      path : 'inventory/all',canActivate: [AuthGuard],
//     loadComponent : () => {
//       return import('./components/items-list/items-list.component').then(
//         (m) => m.ItemsListComponent,
//       )
//     }
//   },

//   {
//      path : 'users/all',canActivate: [AuthGuard],
//     loadComponent : () => {
//       return import('./components/users/users.component').then(
//         (m) => m.UsersComponent,
//       )
//     }
//   },


//   {
//     path : 'create',canActivate: [AuthGuard],
//     loadComponent : () => {
//       return import('./components/itemcreate/itemcreate.component').then(
//         (m) => m.ItemcreateComponent,
//       )
//     }
//   },

//   {
//     path:'edit/:id',canActivate: [AuthGuard],
//     loadComponent : () =>{
//       return import('./components/itemcreate/itemcreate.component').then(
//         (m) => m.ItemcreateComponent,
//       )
//     }
//   },

// ];

