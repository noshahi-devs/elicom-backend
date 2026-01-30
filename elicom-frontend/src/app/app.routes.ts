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
  },
  { path: 'seller/store-creation', loadComponent: () => import('./pages/seller/store-creation/store-creation.component').then(m => m.StoreCreationComponent) },
  {
    path: 'seller',
    loadComponent: () => import('./pages/seller/seller-layout/seller-layout.component').then(m => m.SellerLayoutComponent),
    children: [
      { path: 'dashboard', loadComponent: () => import('./pages/seller/seller-dashboard/seller-dashboard.component').then(m => m.SellerDashboardComponent) },
      { path: 'add-product', loadComponent: () => import('./pages/seller/add-product-mapping/add-product-mapping.component').then(m => m.AddProductMappingComponent) },
      { path: 'listings', loadComponent: () => import('./pages/seller/product-listing/product-listing.component').then(m => m.ProductListingComponent) },
      { path: 'favorites', loadComponent: () => import('./pages/seller/coming-soon/coming-soon.component').then(m => m.SellerComingSoonComponent) },
      { path: 'orders', loadComponent: () => import('./pages/seller/orders/orders.component').then(m => m.SellerOrdersComponent) },
      { path: 'orders/details/:id', loadComponent: () => import('./pages/seller/orders/order-details/order-details.component').then(m => m.OrderDetailsComponent) },
      { path: 'logistics', loadComponent: () => import('./pages/seller/shipping-partners/shipping-partners.component').then(m => m.ShippingPartnersComponent) },
      { path: 'warehouse', loadComponent: () => import('./pages/seller/warehouse/warehouse.component').then(m => m.WarehouseComponent) },
      { path: 'finances/wallet', loadComponent: () => import('./pages/seller/wallet-center/wallet-center.component').then(m => m.WalletCenterComponent) },
      { path: 'finances/payouts', loadComponent: () => import('./pages/seller/payouts/payouts.component').then(m => m.PayoutsComponent) },
      { path: 'settings', loadComponent: () => import('./pages/seller/coming-soon/coming-soon.component').then(m => m.SellerComingSoonComponent) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      { path: 'stores', loadComponent: () => import('./pages/admin/store-approvals/store-approvals.component').then(m => m.StoreApprovalsComponent) },
      { path: 'kyc', loadComponent: () => import('./pages/admin/store-approvals/store-approvals.component').then(m => m.StoreApprovalsComponent) },
      { path: 'settings', loadComponent: () => import('./pages/admin/global-settings/global-settings.component').then(m => m.GlobalSettingsComponent) },
      { path: 'payouts', loadComponent: () => import('./pages/admin/financial-payouts/financial-payouts.component').then(m => m.FinancialPayoutsComponent) },
      { path: 'users', loadComponent: () => import('./pages/admin/user-management/user-management.component').then(m => m.UserManagementComponent) },
      { path: 'dashboard', loadComponent: () => import('./pages/admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  {
    path: 'customer',
    loadComponent: () => import('./pages/customer/customer-layout/customer-layout.component').then(m => m.CustomerLayoutComponent),
    children: [
      { path: 'dashboard', loadComponent: () => import('./pages/customer/customer-dashboard/customer-dashboard.component').then(m => m.CustomerDashboardComponent) },
      { path: 'orders', loadComponent: () => import('./pages/customer/customer-orders/customer-orders.component').then(m => m.CustomerOrdersComponent) },
      { path: 'orders/:status', loadComponent: () => import('./pages/customer/customer-orders/customer-orders.component').then(m => m.CustomerOrdersComponent) },
      { path: 'payment', loadComponent: () => import('./pages/customer/customer-payment/customer-payment.component').then(m => m.CustomerPaymentComponent) },
      { path: 'wishlist', loadComponent: () => import('./pages/customer/customer-wishlist/customer-wishlist.component').then(m => m.CustomerWishlistComponent) },
      { path: 'support', loadComponent: () => import('./pages/customer/customer-support/customer-support.component').then(m => m.CustomerSupportComponent) },
      { path: 'shipping', loadComponent: () => import('./pages/customer/customer-shipping/customer-shipping.component').then(m => m.CustomerShippingComponent) },
      { path: 'history', loadComponent: () => import('./pages/customer/customer-history/customer-history.component').then(m => m.CustomerHistoryComponent) },
      { path: 'profile', loadComponent: () => import('./pages/customer/customer-profile/customer-profile.component').then(m => m.CustomerProfileComponent) },
      { path: 'address', loadComponent: () => import('./pages/customer/customer-address/customer-address.component').then(m => m.CustomerAddressComponent) },
      { path: 'policy', loadComponent: () => import('./pages/customer/customer-policy/customer-policy.component').then(m => m.CustomerPolicyComponent) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];
