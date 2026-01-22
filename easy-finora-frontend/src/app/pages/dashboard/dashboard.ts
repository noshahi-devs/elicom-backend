import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NgFor, NgIf, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../shared/toast/toast.service';
import { CardService } from '../../services/card.service';
import { TransactionService } from '../../services/transaction.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  imports: [NgFor, NgIf, CurrencyPipe, DatePipe, RouterLink],
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
      history: this.transactionService.getHistory(0, 5)
    }).subscribe({
      next: (res: any) => {
        console.log('Dashboard: Loaded Data:', res);

        // Update Wallet
        this.walletData.balance = res.balance.result.totalBalance;
        this.walletData.walletId = res.balance.result.userId ? `WLT-${res.balance.result.userId}-GP` : '---';

        // Update Transactions
        this.recentTransactions = res.history.result.items.map((t: any) => ({
          id: t.id,
          type: t.category,
          amount: t.transactionType === 'Debit' ? -t.amount : t.amount,
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

  logout() {
    this.authService.logout();
    this.toastService.showSuccess('Logged out successfully');
    this.router.navigate(['/auth'], { replaceUrl: true });
  }
}
