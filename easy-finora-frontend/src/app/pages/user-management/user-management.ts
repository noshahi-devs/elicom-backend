import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { ToastService } from '../../shared/toast/toast.service';
import { Loader } from '../../shared/loader/loader';

@Component({
    selector: 'app-user-management',
    standalone: true,
    imports: [CommonModule, DatePipe, FormsModule, Loader],
    templateUrl: './user-management.html',
    styleUrl: './user-management.scss',
})
export class UserManagement implements OnInit {

    users: any[] = [];
    isLoading = false;
    searchKeyword = '';

    constructor(
        private userService: UserService,
        private cdr: ChangeDetectorRef,
        private toastService: ToastService
    ) { }

    ngOnInit() {
        this.fetchUsers();
    }

    fetchUsers() {
        this.isLoading = true;
        this.cdr.detectChanges();

        this.userService.getAllUsers(0, 50, this.searchKeyword).subscribe({
            next: (res: any) => {
                this.users = res?.result?.items ?? [];
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Failed to load users', err);
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    toggleStatus(user: any) {
        const action = user.isActive ? 'deactivate' : 'activate';
        if (!confirm(`Are you sure you want to ${action} ${user.userName}?`)) return;

        this.isLoading = true;
        const obs = user.isActive
            ? this.userService.deactivateUser(user.id)
            : this.userService.activateUser(user.id);

        obs.subscribe({
            next: () => {
                this.toastService.showModal(`User ${user.userName} has been ${action}d successfully.`, 'USER UPDATED', 'success');
                this.fetchUsers();
            },
            error: (err) => {
                this.toastService.showError(`Failed to ${action} user`);
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    onSearch() {
        this.fetchUsers();
    }
}
