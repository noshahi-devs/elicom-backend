import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NgFor, DatePipe, CurrencyPipe, NgIf, SlicePipe, CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DepositService } from '../../services/deposit.service';
import { Loader } from '../../shared/loader/loader';

@Component({
    selector: 'app-deposit-history',
    standalone: true,
    imports: [CommonModule, RouterLink, Loader], // CommonModule includes DatePipe, CurrencyPipe, NgIf, NgFor, SlicePipe
    templateUrl: './deposit-history.html',
    styleUrl: './deposit-history.scss',
})
export class DepositHistory implements OnInit {

    deposits: any[] = [];
    isLoading = false;

    constructor(
        private depositService: DepositService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.fetchHistory();
    }

    // fetchHistory() {
    //     this.isLoading = true;
    //     this.depositService.getMyDepositRequests()
    //         .subscribe({
    //             next: (result) => {
    //                 this.deposits = result?.result?.items ?? [];
    //                 this.isLoading = false;
    //             },
    //             error: (err) => {
    //                 console.error('Failed to load deposit history', err);
    //                 this.isLoading = false;
    //             }
    //         });
    // }
    fetchHistory() {
        this.isLoading = true;

        this.depositService.getMyDepositRequests().subscribe({
            next: (res: any) => {
                console.log('RAW API RESPONSE', res);

                // ✅ ONLY ARRAY ASSIGNED
                this.deposits = res?.result?.items ?? [];

                console.log('DEPOSITS ARRAY', this.deposits);
                this.isLoading = false;
                this.cdr.detectChanges(); // Force UI update
            },
            error: (err) => {
                console.error('Failed to load deposit history', err);
                this.isLoading = false;
                this.cdr.detectChanges(); // Force UI update
            }
        });
    }

}
