import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe, SlicePipe } from '@angular/common';
import { SupportService } from '../../services/support.service';

@Component({
    selector: 'app-approve-support',
    standalone: true,
    imports: [CommonModule, DatePipe, SlicePipe],
    templateUrl: './approve-support.html',
    styleUrl: './approve-support.scss',
})
export class ApproveSupport implements OnInit {

    tickets: any[] = [];
    isLoading = false;

    constructor(
        private supportService: SupportService,
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
                alert('Ticket replied/updated successfully.');
                this.fetchTickets();
            },
            error: (err) => {
                console.error('Failed to update ticket', err);
                alert('Error: ' + (err.error?.error?.message || 'Failed to update'));
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
                alert('Ticket closed.');
                this.fetchTickets();
            },
            error: (err) => {
                console.error('Failed to close ticket', err);
                alert('Error: ' + (err.error?.error?.message || 'Failed to close'));
                this.isLoading = false;
            }
        });
    }
}
