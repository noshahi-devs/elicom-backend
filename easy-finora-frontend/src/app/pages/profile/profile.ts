import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // Import CommonModule for ngIf
import { FormsModule } from '@angular/forms'; // Import FormsModule for ngModel
import { ToastService } from '../../shared/toast/toast.service';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, FormsModule], // Add to imports
    templateUrl: './profile.html',
    styleUrl: './profile.scss'
})
export class Profile {

    isEditing = false;
    isLoading = false;

    user = {
        name: 'John Doe',
        email: 'admin@nim.com',
        phone: '+1 234 567 890',
        address: '123 Wall Street, New York, NY'
    };

    // Backup for cancel
    originalUser: any = {};

    constructor(private toastService: ToastService) { }

    toggleEdit() {
        if (!this.isEditing) {
            // Start Editing: Backup data
            this.originalUser = { ...this.user };
            this.isEditing = true;
        } else {
            // Cancel Editing: Restore data
            this.user = { ...this.originalUser };
            this.isEditing = false;
        }
    }

    saveProfile() {
        this.isLoading = true;

        // Mock API call
        setTimeout(() => {
            this.isLoading = false;
            this.isEditing = false;
            this.toastService.showSuccess('Profile updated successfully!');
        }, 1500);
    }

    changePassword() {
        this.toastService.showInfo('Change password feature coming soon via Backend API.');
    }
}
