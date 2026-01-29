import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CustomerProfileService } from '../../../../../services/customer-profile.service';
import { AuthService } from '../../../../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-my-profile',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    template: `
    <div class="section-container">
      <h2>My Profile</h2>
      <div *ngIf="isLoading" class="loading-state">Loading profile...</div>
      
      <div class="profile-card" *ngIf="!isLoading">
        <div class="avatar-section">
            <div class="avatar-circle-lg">{{ getInitials() }}</div>
            <button class="btn-text">Edit Photo</button>
        </div>
        
        <form [formGroup]="profileForm" (ngSubmit)="onSubmit()" class="info-section">
            <div class="info-row">
                <label>Full Name:</label>
                <input type="text" formControlName="fullName" class="form-input" placeholder="Enter Full Name">
            </div>
            <div class="info-row">
                <label>Email:</label>
                <input type="email" formControlName="email" class="form-input" readonly style="background: #f9f9f9;">
            </div>
            <div class="info-row">
                <label>Phone:</label>
                <input type="tel" formControlName="phoneNumber" class="form-input" placeholder="Phone Number">
            </div>
             <div class="info-row">
                <label>Address:</label>
                 <input type="text" formControlName="addressLine1" class="form-input" placeholder="Street Address">
            </div>
            <div class="info-row">
                <label>City/State:</label>
                <div style="display: flex; gap: 10px; flex: 1;">
                    <input type="text" formControlName="city" class="form-input" placeholder="City">
                    <input type="text" formControlName="state" class="form-input" placeholder="State">
                </div>
            </div>
            <div class="info-row">
                <label>Country:</label>
                <input type="text" formControlName="country" class="form-input" placeholder="Country">
            </div>
            
            <button type="submit" class="btn-primary-outline" [disabled]="profileForm.invalid || isSaving">
                {{ isSaving ? 'Saving...' : 'Update Profile' }}
            </button>
        </form>
      </div>
    </div>
  `,
    styles: [`
    .section-container { padding: 30px; }
    h2 { font-weight: 700; margin-bottom: 20px; }
    .loading-state { text-align: center; padding: 40px; color: #666; }
    .profile-card {
        display: flex;
        gap: 40px;
        background: #fff;
        padding: 30px;
        border: 1px solid #eee;
        border-radius: 8px;
    }
    .avatar-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 150px;
    }
    .avatar-circle-lg {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        background: #ddd;
        color: #555;
        font-size: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 10px;
        text-transform: uppercase;
    }
    .btn-text { background: none; border: none; color: #007bff; cursor: pointer; text-decoration: underline; }
    .info-section { flex: 1; display: flex; flex-direction: column; gap: 15px; }
    .info-row { display: flex; align-items: center; }
    .info-row label { width: 120px; font-weight: 600; color: #555; }
    .form-input {
        flex: 1;
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
    }
    .btn-primary-outline {
        align-self: flex-start;
        margin-top: 10px;
        padding: 8px 20px;
        border: 1px solid #222;
        background: transparent;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.3s;
    }
    .btn-primary-outline:hover:not(:disabled) { background: #222; color: #fff; }
    .btn-primary-outline:disabled { opacity: 0.6; cursor: not-allowed; }
  `]
})
export class MyProfileComponent implements OnInit {
    profileService = inject(CustomerProfileService);
    authService = inject(AuthService);
    fb = inject(FormBuilder);

    profileForm: FormGroup;
    isLoading = true;
    isSaving = false;
    currentProfileId: string | null = null;
    currentUserId: number | null = null;

    constructor() {
        this.profileForm = this.fb.group({
            fullName: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            phoneNumber: [''],
            addressLine1: [''],
            city: [''],
            state: [''],
            country: ['']
        });
    }

    ngOnInit() {
        // Get current user ID (synchronously from storage/User object)
        // Since currentUser$ is async, we can subscribe or peek storage.
        // AuthService stores it in localStorage under 'currentUser' but as simple object.
        // Or we can assume AuthService is initialized.
        this.authService.currentUser$.subscribe((user: any) => {
            if (user && user.id) {
                this.currentUserId = user.id;
                this.loadProfile(user.id);
            }
        });
    }

    loadProfile(userId: number) {
        this.isLoading = true;
        this.profileService.getByUserId(userId).subscribe({
            next: (profile: any) => {
                this.currentProfileId = profile.id;
                this.profileForm.patchValue({
                    fullName: profile.fullName || 'Customer User',
                    email: profile.email,
                    phoneNumber: profile.phoneNumber,
                    addressLine1: profile.addressLine1,
                    city: profile.city,
                    state: profile.state,
                    country: profile.country
                });
                this.isLoading = false;
            },
            error: (err: any) => {
                console.error('Failed to load profile', err);
                this.isLoading = false;
                // If 404, we might show empty form or retry create
            }
        });
    }

    getInitials(): string {
        const name = this.profileForm.get('fullName')?.value || 'U';
        return name.charAt(0);
    }

    onSubmit() {
        if (this.profileForm.invalid || !this.currentProfileId) return;

        this.isSaving = true;
        const updateData = {
            id: this.currentProfileId,
            userId: this.currentUserId!,
            ...this.profileForm.value
        };

        this.profileService.updateProfile(updateData).subscribe({
            next: (res: any) => {
                this.isSaving = false;
                Swal.fire('Success', 'Profile updated successfully!', 'success');
            },
            error: (err: any) => {
                this.isSaving = false;
                Swal.fire('Error', 'Failed to update profile.', 'error');
            }
        });
    }
}
