import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WithdrawService } from '../../services/withdraw.service';
import { ToastService } from '../../shared/toast/toast.service';
import { Loader } from '../../shared/loader/loader';

@Component({
    selector: 'app-approve-withdraw-history',
    standalone: true,
    imports: [CommonModule, DatePipe, CurrencyPipe, DecimalPipe, FormsModule, Loader],
    templateUrl: './approve-withdraw-history.html',
    styleUrl: './approve-withdraw-history.scss',
})
export class ApproveWithdrawHistory implements OnInit {

    withdrawals: any[] = [];
    isLoading = false;
    showModal = false;
    selectedWithdraw: any = null;
    proofFile: File | null = null;
    adminRemarks: string = ''; // Changed from 'Processed'
    exchangeRates: any = {};

    constructor(
        private withdrawService: WithdrawService,
        private toastService: ToastService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.fetchHistory();
        this.fetchExchangeRates();
    }

    fetchExchangeRates() {
        fetch('https://open.er-api.com/v6/latest/USD')
            .then(res => res.json())
            .then(data => {
                this.exchangeRates = data.rates;
                this.cdr.detectChanges();
            })
            .catch(() => { });
    }

    calculateCurrentPkr(usdAmount: number): number {
        const rate = this.exchangeRates['PKR'] || 280;
        return Math.round(usdAmount * rate);
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
            error: () => {
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    viewDetails(withdraw: any) {
        this.selectedWithdraw = withdraw;
        this.showModal = true;
        this.adminRemarks = 'Processed';
        this.proofFile = null;
    }

    viewProof(withdraw: any) {
        if (withdraw.paymentProof) {
            this.viewDetails(withdraw);
            return;
        }

        if (!withdraw.hasProof) return;

        this.isLoading = true;
        this.withdrawService.getPaymentProof(withdraw.id).subscribe({
            next: (res: any) => {
                withdraw.paymentProof = res.result;
                this.isLoading = false;
                this.viewDetails(withdraw);
                this.cdr.detectChanges();
            },
            error: () => {
                this.isLoading = false;
                this.toastService.showError('Failed to load payment proof', 'Error');
                this.cdr.detectChanges();
            }
        });
    }

    onFileSelected(event: any) {
        const file = event.target.files[0];
        if (file) {
            this.proofFile = file;
        }
    }

    getBankDetails(details: string) {
        if (!details) return { bank: '', title: '', account: '', iban: '' };

        const getField = (label: string) => {
            const regex = new RegExp(`${label}:\\s*([^,]*)`, 'i');
            const match = details.match(regex);
            return match ? match[1].trim() : '';
        };

        return {
            bank: getField('Bank'),
            title: getField('Title'),
            account: getField('Acc'),
            iban: getField('IBAN')
        };
    }

    copyToClipboard(text: string) {
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
        }).catch(() => {
        });
    }

    async approve(withdraw: any) {
        let base64Proof = '';
        if (this.proofFile) {
            base64Proof = await this.toBase64(this.proofFile);
        }

        this.isLoading = true;
        this.withdrawService.approveWithdraw(withdraw.id, this.adminRemarks, base64Proof).subscribe({
            next: () => {
                this.toastService.showModal('Withdrawal request has been approved successfully. The user\'s card balance has been updated.', 'WITHDRAWAL APPROVED', 'success');
                this.showModal = false;
                this.fetchHistory();
            },
            error: (err) => {
                this.toastService.showModal(err.error?.error?.message || 'Failed to approve withdrawal.', 'ERROR', 'error');
                this.isLoading = false;
            }
        });
    }

    private toBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    }

    reject(withdraw: any) {
        const remarks = prompt('Enter reason for rejection:', 'Insufficient info');
        if (remarks === null) return;

        this.isLoading = true;
        this.withdrawService.rejectWithdraw(withdraw.id, remarks).subscribe({
            next: () => {
                this.toastService.showModal('Withdrawal request has been rejected.', 'WITHDRAWAL REJECTED', 'info');
                this.fetchHistory();
            },
            error: (err) => {
                console.error('Failed to reject withdrawal', err);
                this.toastService.showModal(err.error?.error?.message || 'Failed to reject withdrawal.', 'ERROR', 'error');
                this.isLoading = false;
            }
        });
    }
}
