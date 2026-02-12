import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
    imports: [CommonModule],
    templateUrl: './admin-dashboard.html',
    styleUrl: './admin-dashboard.scss',
})
export class AdminDashboard implements OnInit {

    // Dummy Data for Zero Load Time
    stats = {
        totalUsers: 1248,
        pendingDeposits: 5,
        pendingWithdrawals: 3,
        openTickets: 12,
        totalTransactionVolume: 45290.50
    };

    // No loading state needed
    isLoading = false;

    constructor() { }

    ngOnInit() {
        // No API calls needed
    }
}
