import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NgFor, DatePipe, CurrencyPipe, CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WithdrawService } from '../../services/withdraw.service';
import { Loader } from '../../shared/loader/loader';

@Component({
    selector: 'app-withdraw-history',
    standalone: true,
    imports: [CommonModule, RouterLink, Loader],
    templateUrl: './withdraw-history.html',
    styleUrl: './withdraw-history.scss',
})
export class WithdrawHistory implements OnInit {

    withdrawals: any[] = [];
    isLoading = false;

    constructor(
        private withdrawService: WithdrawService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.fetchHistory();
    }

    fetchHistory() {
        this.isLoading = true;
        this.cdr.detectChanges();

        this.withdrawService.getMyWithdrawRequests().subscribe({
            next: (res: any) => {
                console.log('WithdrawHistory: API Response:', res);
                this.withdrawals = res?.result?.items ?? [];
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Failed to load withdraw history', err);
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }
}
