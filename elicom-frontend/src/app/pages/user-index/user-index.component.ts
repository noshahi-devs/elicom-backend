import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserSidebarComponent } from './components/sidebar/sidebar.component';

@Component({
    selector: 'app-user-index',
    standalone: true,
    imports: [CommonModule, RouterModule, UserSidebarComponent],
    templateUrl: './user-index.component.html',
    styleUrls: ['./user-index.component.scss']
})
export class UserIndexComponent { }
