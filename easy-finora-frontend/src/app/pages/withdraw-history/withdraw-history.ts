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
    showModal = false;
    selectedWithdraw: any = null;

    constructor(
        private withdrawService: WithdrawService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.fetchHistory();
    }

    viewDetails(withdraw: any) {
        this.selectedWithdraw = withdraw;
        this.showModal = true;
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
            // Optional: toast feedback
        }).catch(err => {
            console.error('Copy failed', err);
        });
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
