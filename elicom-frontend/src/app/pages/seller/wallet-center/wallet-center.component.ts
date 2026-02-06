import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WalletService, WalletTransactionDto } from '../../../services/wallet.service';

@Component({
    selector: 'app-wallet-center',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './wallet-center.component.html',
    styleUrls: ['./wallet-center.component.scss']
})
export class WalletCenterComponent implements OnInit {
    private walletService = inject(WalletService);
    private cdr = inject(ChangeDetectorRef);

    transactions: WalletTransactionDto[] = [];
    balance = 0;
    pendingBalance = 0; // SmartStore persistent ledger treats all verified as immediate balance for now
    isLoading = false;

    ngOnInit() {
        this.loadWalletData();
    }

    loadWalletData() {
        this.isLoading = true;
        this.walletService.getMyWallet().subscribe({
            next: (wallet) => {
                this.balance = wallet.balance;
                this.loadTransactions();
            },
            error: (err) => {
                console.error('Failed to load wallet', err);
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    loadTransactions() {
        this.walletService.getTransactions().subscribe({
            next: (res) => {
                this.transactions = res;
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Failed to load transactions', err);
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    getStatusClass(status: string) {
        if (!status) return {};
        const s = status.toLowerCase();
        return {
            'badge-pending': s === 'pending',
            'badge-approved': s === 'completed' || s === 'approved',
            'badge-rejected': s === 'failed' || s === 'rejected'
        };
    }

    getTypeIcon(type: string) {
        if (!type) return 'fa-exchange-alt';
        const t = type.toLowerCase();
        switch (t) {
            case 'sale': return 'fa-shopping-cart text-success';
            case 'payout': return 'fa-bank text-danger';
            case 'refund': return 'fa-undo text-info';
            default: return 'fa-exchange-alt';
        }
    }
}
