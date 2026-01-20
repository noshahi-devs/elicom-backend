import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';
import { ProductDetail } from './pages/product-detail/product-detail';
import { AddToCart } from './pages/add-to-cart/add-to-cart';
import { Checkout } from './pages/checkout/checkout';
import { Dashboard } from './pages/dashboard/dashboard';
import { Cards } from './pages/cards/cards';
import { Transactions } from './pages/transactions/transactions';
import { Transfer } from './pages/transfer/transfer';
import { BusinessPlans } from './pages/business-plans/business-plans';
import { Tickets } from './pages/tickets/tickets';
import { Contact } from './pages/contact/contact';
import { Auth } from './pages/auth/auth';
import { ApplyCard } from './pages/apply-card/apply-card';
import { Deposit } from './pages/deposit/deposit';
import { DepositMethods } from './pages/deposit-methods/deposit-methods';
import { DepositHistory } from './pages/deposit-history/deposit-history';
import { Withdraw } from './pages/withdraw/withdraw';
import { WithdrawHistory } from './pages/withdraw-history/withdraw-history';
import { WithdrawMethods } from './pages/withdraw-methods/withdraw-methods';

export const routes: Routes = [
  { path: '', redirectTo: '/auth', pathMatch: 'full' },
  { path: 'auth', component: Auth },
  { path: 'home', component: HomeComponent },
  { path: 'product-detail', component: ProductDetail },
  { path: 'add-to-cart', component: AddToCart },
  { path: 'checkout', component: Checkout },
  { path: 'dashboard', component: Dashboard },
  { path: 'cards', component: Cards },
  { path: 'apply-card', component: ApplyCard },
  { path: 'transactions', component: Transactions },
  { path: 'transfer', component: Transfer },
  { path: 'business-plans', component: BusinessPlans },
  { path: 'tickets', component: Tickets },
  { path: 'contact', component: Contact },
  // Deposit routes
  { path: 'deposit', component: Deposit },
  { path: 'deposit-methods', component: DepositMethods },
  { path: 'deposit-history', component: DepositHistory },
  // Withdraw routes
  { path: 'withdraw', component: Withdraw },
  { path: 'withdraw-methods', component: WithdrawMethods },
  { path: 'withdraw-history', component: WithdrawHistory }
];