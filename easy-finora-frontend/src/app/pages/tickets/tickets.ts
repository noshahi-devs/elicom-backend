import { Component } from '@angular/core';
import { NgFor, DatePipe } from '@angular/common';

@Component({
    selector: 'app-tickets',
    imports: [NgFor, DatePipe],
    templateUrl: './tickets.html',
    styleUrl: './tickets.scss',
})
export class Tickets {

    tickets = [
        { id: 'TKT-001', title: 'Withdrawal not processed', priority: 'High', status: 'Open', created: new Date('2026-01-20'), replies: 2 },
        { id: 'TKT-002', title: 'Question about business plan', priority: 'Medium', status: 'Replied', created: new Date('2026-01-18'), replies: 1 },
        { id: 'TKT-003', title: 'Card application status', priority: 'Low', status: 'Closed', created: new Date('2026-01-15'), replies: 3 }
    ];
}
