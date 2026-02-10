import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardService } from '../../services/card.service';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
    selector: 'app-approve-cards',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './approve-cards.html',
    styleUrl: './approve-cards.scss'
})
export class ApproveCards implements OnInit {
    applications: any[] = [];
    isLoading = false;
    selectedApp: any = null;
    adminRemarks = '';

    constructor(
        private cardService: CardService,
        private toastService: ToastService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.loadApplications();
    }

    loadApplications() {
        this.isLoading = true;
        this.cardService.getCardApplications().subscribe({
            next: (res) => {
                this.applications = res.result;
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.toastService.showError('Failed to load applications.');
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    approve(app: any) {
        if (!confirm(`Are you sure you want to approve card for ${app.fullName}?`)) return;

        this.isLoading = true;
        this.cardService.approveCardApplication(app.id).subscribe({
            next: () => {
                this.toastService.showSuccess('Card approved and generated!');
                this.loadApplications();
            },
            error: (err) => {
                this.toastService.showError('Approval failed.');
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    openRejectModal(app: any) {
        this.selectedApp = app;
        this.adminRemarks = '';
    }

    reject() {
        if (!this.adminRemarks) {
            this.toastService.showError('Please provide remarks for rejection.');
            return;
        }

        this.isLoading = true;
        this.cardService.rejectCardApplication({ id: this.selectedApp.id, adminRemarks: this.adminRemarks }).subscribe({
            next: () => {
                this.toastService.showSuccess('Application rejected.');
                this.selectedApp = null;
                this.loadApplications();
            },
            error: (err) => {
                this.toastService.showError('Rejection failed.');
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    viewDocument(doc: string) {
        const win = window.open();
        if (win) {
            win.document.write(`<img src="${doc}" style="max-width: 100%;" />`);
        }
    }
}
