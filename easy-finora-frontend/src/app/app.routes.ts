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
import { Profile } from './pages/profile/profile';
import { ApproveDepositHistory } from './pages/approve-deposit-history/approve-deposit-history';
import { ApproveWithdrawHistory } from './pages/approve-withdraw-history/approve-withdraw-history';
import { ApproveSupportHistory } from './pages/approve-support-history/approve-support-history';
import { ApproveAllTransactions } from './pages/approve-all-transactions/approve-all-transactions';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/auth', pathMatch: 'full' },
  { path: 'auth', component: Auth },
  { path: 'profile', component: Profile, canActivate: [authGuard] },
  { path: 'home', component: HomeComponent },
  { path: 'product-detail', component: ProductDetail },
  { path: 'add-to-cart', component: AddToCart },
  { path: 'checkout', component: Checkout },
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: 'cards', component: Cards, canActivate: [authGuard] },
  { path: 'apply-card', component: ApplyCard, canActivate: [authGuard] },
  { path: 'transactions', component: Transactions, canActivate: [authGuard] },
  { path: 'transfer', component: Transfer, canActivate: [authGuard] },
  { path: 'business-plans', component: BusinessPlans, canActivate: [authGuard] },
  { path: 'tickets', component: Tickets, canActivate: [authGuard] },
  { path: 'contact', component: Contact },
  // Deposit routes
  { path: 'deposit', component: Deposit, canActivate: [authGuard] },
  { path: 'deposit-methods', component: DepositMethods, canActivate: [authGuard] },
  { path: 'deposit-history', component: DepositHistory, canActivate: [authGuard] },
  { path: 'approve-deposits', component: ApproveDepositHistory, canActivate: [authGuard] },
  { path: 'approve-withdrawals', component: ApproveWithdrawHistory, canActivate: [authGuard] },
  { path: 'approve-support', component: ApproveSupportHistory, canActivate: [authGuard] },
  { path: 'approve-transactions', component: ApproveAllTransactions, canActivate: [authGuard] },
  // Withdraw routes
  { path: 'withdraw', component: Withdraw, canActivate: [authGuard] },
  { path: 'withdraw-methods', component: WithdrawMethods, canActivate: [authGuard] },
  { path: 'withdraw-history', component: WithdrawHistory, canActivate: [authGuard] }
];
