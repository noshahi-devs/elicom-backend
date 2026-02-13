import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe, SlicePipe } from '@angular/common';
import { SupportService } from '../../services/support.service';
import { Loader } from '../../shared/loader/loader';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
    selector: 'app-approve-support',
    standalone: true,
    imports: [CommonModule, DatePipe, SlicePipe, Loader],
    templateUrl: './approve-support.html',
    styleUrl: './approve-support.scss',
})
export class ApproveSupport implements OnInit {

    tickets: any[] = [];
    isLoading = false;

    constructor(
        private supportService: SupportService,
        private toastService: ToastService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.fetchTickets();
    }

    fetchTickets() {
        this.isLoading = true;
        this.cdr.detectChanges();

        this.supportService.getAllTickets().subscribe({
            next: (res: any) => {
                this.tickets = res?.result?.items ?? [];
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Failed to load tickets', err);
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    reply(ticket: any) {
        const remarks = prompt('Enter reply / admin remarks:', ticket.adminRemarks || '');
        if (remarks === null) return;

        this.isLoading = true;
        this.supportService.updateStatus(ticket.id, 'Replied', remarks).subscribe({
            next: () => {
                this.toastService.showModal('Ticket replied/updated successfully.', 'TICKET REPLIED', 'success');
                this.fetchTickets();
            },
            error: (err) => {
                console.error('Failed to update ticket', err);
                this.toastService.showModal(err.error?.error?.message || 'Failed to update ticket.', 'ERROR', 'error');
                this.isLoading = false;
            }
        });
    }

    closeTicket(ticket: any) {
        if (!confirm('Are you sure you want to close this ticket?')) return;

        const remarks = prompt('Enter closing remarks (optional):', ticket.adminRemarks || 'Closed by admin');
        if (remarks === null) return;

        this.isLoading = true;
        this.supportService.updateStatus(ticket.id, 'Closed', remarks).subscribe({
            next: () => {
                this.toastService.showModal('The ticket has been closed.', 'TICKET CLOSED', 'info');
                this.fetchTickets();
            },
            error: (err) => {
                console.error('Failed to close ticket', err);
                this.toastService.showModal(err.error?.error?.message || 'Failed to close ticket.', 'ERROR', 'error');
                this.isLoading = false;
            }
        });
    }
}
