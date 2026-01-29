import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';
import { ProductDetail } from './pages/product-detail/product-detail';
import { AddToCart } from './pages/add-to-cart/add-to-cart';
import { Checkout } from './pages/checkout/checkout';
import { SearchResult } from './pages/search-result/search-result';
import { UserIndexComponent } from './pages/user-index/user-index.component';
import { PersonalCenterComponent } from './pages/user-index/components/sections/personal-center/personal-center.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'product-detail/:productId/:storeProductId', component: ProductDetail },
  { path: 'add-to-cart', component: AddToCart },
  { path: 'checkout', component: Checkout },
  { path: 'search-result', component: SearchResult },
  { path: 'smartstore/login', loadComponent: () => import('./pages/auth/login-page.component').then(m => m.LoginPageComponent) },
  { path: 'smartstore/signup', loadComponent: () => import('./pages/auth/login-page.component').then(m => m.LoginPageComponent) },
  {
    path: 'user/index',
    component: UserIndexComponent,
    children: [
      { path: '', component: PersonalCenterComponent },
      { path: 'profile', loadComponent: () => import('./pages/user-index/components/sections/my-profile/my-profile.component').then(m => m.MyProfileComponent) },
      { path: 'orders', loadComponent: () => import('./pages/user-index/components/sections/my-orders/my-orders.component').then(m => m.MyOrdersComponent) }
    ]
  }
];
