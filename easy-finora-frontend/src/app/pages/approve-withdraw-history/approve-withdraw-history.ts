import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { WithdrawService } from '../../services/withdraw.service';

@Component({
    selector: 'app-approve-withdraw-history',
    standalone: true,
    imports: [CommonModule, DatePipe, CurrencyPipe],
    templateUrl: './approve-withdraw-history.html',
    styleUrl: './approve-withdraw-history.scss',
})
export class ApproveWithdrawHistory implements OnInit {

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

        this.withdrawService.getAllWithdrawRequests().subscribe({
            next: (res: any) => {
                this.withdrawals = res?.result?.items ?? [];
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Failed to load all withdraw requests', err);
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    approve(withdraw: any) {
        const remarks = prompt('Enter admin remarks for approval (optional):', 'Processed');
        if (remarks === null) return;

        this.isLoading = true;
        this.withdrawService.approveWithdraw(withdraw.id, remarks).subscribe({
            next: () => {
                alert('Withdrawal approved successfully! Balance updated.');
                this.fetchHistory();
            },
            error: (err) => {
                console.error('Failed to approve withdrawal', err);
                alert('Error: ' + (err.error?.error?.message || 'Failed to approve'));
                this.isLoading = false;
            }
        });
    }

    reject(withdraw: any) {
        const remarks = prompt('Enter reason for rejection:', 'Insufficient info');
        if (remarks === null) return;

        this.isLoading = true;
        this.withdrawService.rejectWithdraw(withdraw.id, remarks).subscribe({
            next: () => {
                alert('Withdrawal rejected.');
                this.fetchHistory();
            },
            error: (err) => {
                console.error('Failed to reject withdrawal', err);
                alert('Error: ' + (err.error?.error?.message || 'Failed to reject'));
                this.isLoading = false;
            }
        });
    }
}
