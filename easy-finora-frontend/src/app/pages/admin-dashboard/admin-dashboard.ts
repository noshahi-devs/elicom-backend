import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TransactionService } from '../../services/transaction.service';
import { UserService } from '../../services/user.service';
import { DepositService } from '../../services/deposit.service';
import { WithdrawService } from '../../services/withdraw.service';
import { SupportService } from '../../services/support.service';
import { Loader } from '../../shared/loader/loader';

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [CommonModule, CurrencyPipe, Loader],
    templateUrl: './admin-dashboard.html',
    styleUrl: './admin-dashboard.scss',
})
export class AdminDashboard implements OnInit {

    stats = {
        totalUsers: 0,
        pendingDeposits: 0,
        pendingWithdrawals: 0,
        openTickets: 0,
        totalTransactionVolume: 0
    };

    isLoading = true;

    constructor(
        private userService: UserService,
        private depositService: DepositService,
        private withdrawService: WithdrawService,
        private supportService: SupportService,
        private transactionService: TransactionService
    ) { }

    ngOnInit() {
        this.loadStats();
    }

    loadStats() {
        this.isLoading = true;

        forkJoin({
            users: this.userService.getAllUsers(0, 1).pipe(catchError(() => of(null))),
            deposits: this.depositService.getAllDepositRequests(0, 100).pipe(catchError(() => of(null))),
            withdrawals: this.withdrawService.getAllWithdrawRequests(0, 100).pipe(catchError(() => of(null))),
            tickets: this.supportService.getAllTickets(0, 100).pipe(catchError(() => of(null))),
            transactions: this.transactionService.getAllTransactions(0, 100).pipe(catchError(() => of(null)))
        }).subscribe({
            next: (res: any) => {
                this.stats.totalUsers = res.users?.result?.totalCount ?? 0;

                const dItems = res.deposits?.result?.items ?? [];
                this.stats.pendingDeposits = dItems.filter((i: any) => i.status === 'Pending').length;

                const wItems = res.withdrawals?.result?.items ?? [];
                this.stats.pendingWithdrawals = wItems.filter((i: any) => i.status === 'Pending').length;

                const tItems = res.tickets?.result?.items ?? [];
                this.stats.openTickets = tItems.filter((i: any) => i.status === 'Open').length;

                const txItems = res.transactions?.result?.items ?? [];
                this.stats.totalTransactionVolume = txItems.reduce((sum: number, tx: any) => sum + (tx.amount || 0), 0);

                this.isLoading = false;
            },
            error: (err: any) => {
                console.error('AdminDashboard: Load Error', err);
                this.isLoading = false;
                // Optionally show a toast error
            }
        });
    }
}
