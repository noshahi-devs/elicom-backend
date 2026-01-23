import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NgFor, DatePipe, CurrencyPipe, NgIf, SlicePipe, CommonModule } from '@angular/common';
import { DepositService } from '../../services/deposit.service';

@Component({
    selector: 'app-approve-deposit-history',
    standalone: true,
    imports: [CommonModule, DatePipe, CurrencyPipe, SlicePipe],
    templateUrl: './approve-deposit-history.html',
    styleUrl: './approve-deposit-history.scss',
})
export class ApproveDepositHistory implements OnInit {

    deposits: any[] = [];
    isLoading = false;

    constructor(
        private depositService: DepositService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.fetchHistory();
    }

    fetchHistory() {
        this.isLoading = true;
        this.cdr.detectChanges(); // Update UI to show loading state

        console.log('ApproveDepositHistory: Fetching all requests...');

        this.depositService.getAllDepositRequests().subscribe({
            next: (res: any) => {
                console.log('ApproveDepositHistory: API Response:', res);
                this.deposits = res?.result?.items ?? [];

                if (this.deposits.length === 0) {
                    console.log('ApproveDepositHistory: No items found in response.');
                }

                this.isLoading = false;
                this.cdr.detectChanges(); // Force UI update
            },
            error: (err) => {
                console.error('ApproveDepositHistory: Failed to load requests', err);
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    approve(deposit: any) {
        const remarks = prompt('Enter admin remarks for approval (optional):', 'Approved');
        if (remarks === null) return; // Cancelled

        this.isLoading = true;
        this.depositService.approveDeposit(deposit.id, remarks).subscribe({
            next: () => {
                alert('Deposit approved successfully!');
                this.fetchHistory();
            },
            error: (err) => {
                console.error('Failed to approve deposit', err);
                alert('Error: ' + (err.error?.error?.message || 'Failed to approve'));
                this.isLoading = false;
            }
        });
    }

    reject(deposit: any) {
        const remarks = prompt('Enter reason for rejection:', 'Rejected by admin');
        if (remarks === null) return; // Cancelled

        this.isLoading = true;
        this.depositService.rejectDeposit(deposit.id, remarks).subscribe({
            next: () => {
                alert('Deposit rejected.');
                this.fetchHistory();
            },
            error: (err) => {
                console.error('Failed to reject deposit', err);
                alert('Error: ' + (err.error?.error?.message || 'Failed to reject'));
                this.isLoading = false;
            }
        });
    }
}
