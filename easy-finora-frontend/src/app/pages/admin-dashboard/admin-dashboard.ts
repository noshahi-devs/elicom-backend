import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { TransactionService } from '../../services/transaction.service';
import { UserService } from '../../services/user.service';
import { DepositService } from '../../services/deposit.service';
import { WithdrawService } from '../../services/withdraw.service';
import { SupportService } from '../../services/support.service';

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [CommonModule, CurrencyPipe],
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

        // Fetch users count
        this.userService.getAllUsers(0, 1).subscribe(res => {
            this.stats.totalUsers = res?.result?.totalCount ?? 0;
        });

        // Fetch pending deposits
        this.depositService.getAllDepositRequests(0, 100).subscribe(res => {
            const items = res?.result?.items ?? [];
            this.stats.pendingDeposits = items.filter((i: any) => i.status === 'Pending').length;
        });

        // Fetch pending withdrawals
        this.withdrawService.getAllWithdrawRequests(0, 100).subscribe(res => {
            const items = res?.result?.items ?? [];
            this.stats.pendingWithdrawals = items.filter((i: any) => i.status === 'Pending').length;
        });

        // Fetch open tickets
        this.supportService.getAllTickets(0, 100).subscribe(res => {
            const items = res?.result?.items ?? [];
            this.stats.openTickets = items.filter((i: any) => i.status === 'Open').length;
        });

        // Fetch volume
        this.transactionService.getAllTransactions(0, 100).subscribe(res => {
            const items = res?.result?.items ?? [];
            this.stats.totalTransactionVolume = items.reduce((sum: number, tx: any) => sum + (tx.amount || 0), 0);
            this.isLoading = false;
        });
    }
}
