import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NgFor, NgIf, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../shared/toast/toast.service';
import { CardService } from '../../services/card.service';
import { TransactionService } from '../../services/transaction.service';
import { WalletService } from '../../services/wallet.service';
import { forkJoin } from 'rxjs';
import { Loader } from '../../shared/loader/loader';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgFor, NgIf, CurrencyPipe, DatePipe, RouterLink, Loader],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {

  walletData = {
    balance: 0,
    walletId: '---',
    currency: 'USD'
  };

  stats = [
    { label: 'Total Credits', value: 0, icon: '⬇️', color: '#1de016' },
    { label: 'Total Debits', value: 0, icon: '⬆️', color: '#ff6b6b' },
    { label: 'Recent Transactions', value: 0, icon: '📊', color: '#ffa500' },
    { label: 'Active Cards', value: 0, icon: '💳', color: '#4a90e2' }
  ];

  recentTransactions: any[] = [];
  isLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService,
    private cardService: CardService,
    private transactionService: TransactionService,
    private walletService: WalletService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    this.cdr.detectChanges();

    forkJoin({
      balance: this.cardService.getBalance(),
      cards: this.cardService.getUserCards(),
      history: this.transactionService.getHistory(0, 5),
      wallet: this.walletService.getMyWallet()
    }).subscribe({
      next: (res: any) => {
        console.log('Dashboard: Loaded Data:', res);

        // Update Wallet
        this.walletData.balance = res.balance.result.totalBalance;
        this.walletData.walletId = res.wallet.result.id || '---';

        // Update Transactions
        this.recentTransactions = res.history.result.items.map((t: any) => ({
          id: t.id,
          type: t.category,
          amount: t.movementType === 'Debit' ? -t.amount : t.amount,
          status: 'Completed',
          date: t.creationTime
        }));

        // Update Stats
        const credits = this.recentTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
        const debits = Math.abs(this.recentTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0));

        this.stats[0].value = credits;
        this.stats[1].value = debits;
        this.stats[2].value = res.history.result.totalCount;
        this.stats[3].value = res.cards.result.length;

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Dashboard: Load Error:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  copyWalletId() {
    if (!this.walletData.walletId || this.walletData.walletId === '---') return;

    navigator.clipboard.writeText(this.walletData.walletId).then(() => {
      this.toastService.showSuccess('Wallet ID copied to clipboard!');
    }).catch(err => {
      console.error('Could not copy text: ', err);
      this.toastService.showError('Failed to copy Wallet ID');
    });
  }

  logout() {
    this.authService.logout();
    this.toastService.showSuccess('Logged out successfully');
    this.router.navigate(['/auth'], { replaceUrl: true });
  }
}
