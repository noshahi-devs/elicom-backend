import { Component } from '@angular/core';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-tickets',
    imports: [NgFor, NgIf, DatePipe, FormsModule],
    templateUrl: './tickets.html',
    styleUrl: './tickets.scss',
})
export class Tickets {

    isCreating = false;
    newTicket = {
        title: '',
        priority: 'Medium',
        message: ''
    };

    tickets = [
        { id: 'TKT-001', title: 'Withdrawal not processed', priority: 'High', status: 'Open', created: new Date('2026-01-20'), replies: 2 },
        { id: 'TKT-002', title: 'Question about business plan', priority: 'Medium', status: 'Replied', created: new Date('2026-01-18'), replies: 1 },
        { id: 'TKT-003', title: 'Card application status', priority: 'Low', status: 'Closed', created: new Date('2026-01-15'), replies: 3 }
    ];

    toggleCreate() {
        this.isCreating = !this.isCreating;
    }

    submitTicket() {
        // Mock submission
        const newId = 'TKT-' + (this.tickets.length + 1).toString().padStart(3, '0');
        this.tickets.unshift({
            id: newId,
            title: this.newTicket.title,
            priority: this.newTicket.priority,
            status: 'Open',
            created: new Date(),
            replies: 0
        });
        this.isCreating = false;
        this.newTicket = { title: '', priority: 'Medium', message: '' };
    }
}
