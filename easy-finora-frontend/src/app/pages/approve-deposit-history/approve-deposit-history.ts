import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NgFor, DatePipe, CurrencyPipe, NgIf, SlicePipe, CommonModule } from '@angular/common';
import { DepositService } from '../../services/deposit.service';
import { ToastService } from '../../shared/toast/toast.service';
import { Loader } from '../../shared/loader/loader';

@Component({
    selector: 'app-approve-deposit-history',
    standalone: true,
    imports: [CommonModule, DatePipe, CurrencyPipe, SlicePipe, Loader],
    templateUrl: './approve-deposit-history.html',
    styleUrl: './approve-deposit-history.scss',
})
export class ApproveDepositHistory implements OnInit {

    deposits: any[] = [];
    isLoading = false;

    constructor(
        private depositService: DepositService,
        private toastService: ToastService,
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

    formatEmail(email: string): string {
        if (!email) return 'Unknown';
        return email.replace('GP_', '');
    }

    approve(deposit: any) {
        this.toastService.showConfirm(
            'Approve Deposit',
            `Are you sure you want to approve the deposit of ${deposit.amount} ${deposit.currency || 'USD'} for ${this.formatEmail(deposit.userName)}?`,
            (remarks) => {
                this.isLoading = true;
                this.depositService.approveDeposit(deposit.id, remarks || 'Approved').subscribe({
                    next: () => {
                        this.toastService.showModal('Deposit has been approved successfully. The funds have been credited to the user\'s card.', 'DEPOSIT APPROVED', 'success');
                        this.fetchHistory();
                    },
                    error: (err) => {
                        console.error('Failed to approve deposit', err);
                        this.toastService.showModal(err.error?.error?.message || 'Failed to approve', 'Error', 'error');
                        this.isLoading = false;
                    }
                });
            }
        );
    }

    reject(deposit: any) {
        this.toastService.showConfirm(
            'Reject Deposit',
            `Are you sure you want to reject the deposit of ${deposit.amount} ${deposit.currency || 'USD'} for ${this.formatEmail(deposit.userName)}?`,
            (remarks) => {
                if (!remarks) {
                    this.toastService.showModal('Please provide a reason for rejection.', 'REASON REQUIRED', 'warning');
                    return;
                }
                this.isLoading = true;
                this.depositService.rejectDeposit(deposit.id, remarks).subscribe({
                    next: () => {
                        this.toastService.showModal('Deposit has been rejected.', 'DEPOSIT REJECTED', 'info');
                        this.fetchHistory();
                    },
                    error: (err) => {
                        console.error('Failed to reject deposit', err);
                        this.toastService.showModal(err.error?.error?.message || 'Failed to reject deposit.', 'ERROR', 'error');
                        this.isLoading = false;
                    }
                });
            }
        );
    }

    viewProof(deposit: any) {
        if (deposit.proofImage) {
            this.openImageInNewTab(deposit.proofImage);
            return;
        }

        if (deposit.hasProof) {
            this.isLoading = true;
            this.depositService.getProofImage(deposit.id).subscribe({
                next: (res: any) => {
                    deposit.proofImage = res.result;
                    this.isLoading = false;
                    this.openImageInNewTab(deposit.proofImage);
                    this.cdr.detectChanges();
                },
                error: (err) => {
                    console.error('Failed to load proof image', err);
                    this.toastService.showError('Failed to load image');
                    this.isLoading = false;
                    this.cdr.detectChanges();
                }
            });
        }
    }

    private openImageInNewTab(proofImage: string) {
        if (!proofImage) return;

        // If it's already a base64 string, use it directly
        // Otherwise, assume it's a filename and build the asset path
        const url = proofImage.startsWith('data:') ? proofImage : `/assets/proofs/${proofImage}`;

        // Open in new tab
        const win = window.open();
        if (win) {
            win.document.write(`<img src="${url}" style="max-width: 100%; height: auto;" />`);
            win.document.close();
        }
    }
}
