import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-customer-profile',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './customer-profile.component.html',
    styleUrls: ['./customer-profile.component.scss']
})
export class CustomerProfileComponent implements OnInit {
    user = {
        firstName: 'Sharjeel',
        lastName: 'Noshahi',
        email: 'sharjeel@noshahi.com',
        phone: '+92 300 1234567',
        gender: 'Male',
        birthday: '1995-01-01'
    };

    constructor() { }

    ngOnInit(): void {
    }

    saveProfile() {
        console.log('Profile saved:', this.user);
        alert('Profile updated successfully!');
    }
}
