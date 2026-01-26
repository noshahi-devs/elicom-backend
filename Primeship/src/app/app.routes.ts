import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/admin/dashboard/dashboard.component';
import { ProductsComponent } from './pages/admin/products/products.component';
import { SellerDashboardComponent } from './pages/seller/dashboard/seller-dashboard.component';
import { SellerOrdersComponent } from './pages/seller/orders/orders.component';
import { CategoriesComponent } from './pages/admin/categories/categories.component';
import { OrdersComponent } from './pages/admin/orders/orders.component';
import { ThreeplPartnersComponent } from './pages/admin/threepl-partners/threepl-partners.component';
import { InventoryComponent } from './pages/admin/inventory/inventory.component';
import { CustomersComponent } from './pages/admin/customers/customers.component';
import { SellersComponent } from './pages/admin/sellers/sellers.component';
import { FinanceComponent } from './pages/admin/finance/finance.component';
import { UsersComponent } from './pages/admin/users/users.component';
import { HomeComponent } from './public/home/home.component';
import { AuthGuard } from './core/guards/auth.guard';

import { PublicLayoutComponent } from './public/public-layout/public-layout.component';
import { AdminLayoutComponent } from './pages/admin/admin-layout/admin-layout.component';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./public/auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      },
      {
        path: 'home',
        component: HomeComponent
      },
      {
        path: 'category/:slug',
        loadComponent: () => import('./public/product-list/product-list.component').then(m => m.ProductListComponent)
      },
      {
        path: 'categories',
        loadComponent: () => import('./public/category-list/category-list.component').then(m => m.CategoryListComponent)
      },
      {
        path: 'shop',
        loadComponent: () => import('./public/product-list/product-list.component').then(m => m.ProductListComponent)
      },
      {
        path: 'product/:slug',
        loadComponent: () => import('./public/product-detail/product-detail.component').then(m => m.ProductDetailComponent)
      },
      {
        path: 'cart',
        loadComponent: () => import('./public/cart/cart.component').then(m => m.CartComponent)
      },
      {
        path: 'checkout',
        loadComponent: () => import('./public/checkout/checkout.component').then(m => m.CheckoutComponent),
        canActivate: [AuthGuard]
      }
    ]
  },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: DashboardComponent
      },
      {
        path: 'products',
        component: ProductsComponent
      },
      {
        path: 'categories',
        component: CategoriesComponent
      },
      {
        path: 'inventory',
        component: InventoryComponent
      },
      {
        path: 'orders',
        component: OrdersComponent
      },
      {
        path: 'threepl-partners',
        component: ThreeplPartnersComponent
      },
      {
        path: 'customers',
        component: CustomersComponent
      },
      {
        path: 'sellers',
        component: SellersComponent
      },
      {
        path: 'finance',
        component: FinanceComponent
      },
      {
        path: 'reports',
        component: DashboardComponent // Placeholder
      },
      {
        path: 'users',
        component: UsersComponent
      },
      {
        path: 'settings',
        component: DashboardComponent // Placeholder
      }
    ]
  },
  {
    path: 'seller',
    component: AdminLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/seller/dashboard/seller-dashboard.component').then(m => m.SellerDashboardComponent)
      },
      {
        path: 'products',
        component: DashboardComponent // Placeholder
      },
      {
        path: 'orders',
        component: SellerOrdersComponent
      },
      {
        path: 'earnings',
        component: DashboardComponent // Placeholder
      },
      {
        path: 'profile',
        component: DashboardComponent // Placeholder
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/home'
  }
];
