import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreService, StoreDto } from '../../../services/store.service';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-store-approvals',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './store-approvals.component.html',
    styleUrls: ['./store-approvals.component.scss']
})
export class StoreApprovalsComponent implements OnInit {
    private storeService = inject(StoreService);
    private cdr = inject(ChangeDetectorRef);
    applications: StoreDto[] = [];
    isLoading = false;
    pendingStores = 0;
    pendingKyc = 0;
    verifiedSellers = 0;
    selectedStore: StoreDto | null = null;

    ngOnInit() {
        this.loadApplications();
    }

    loadApplications() {
        this.isLoading = true;
        this.storeService.getAllStores().subscribe({
            next: (res) => {
                console.log('Store API Response (Full):', res);
                if (Array.isArray(res)) {
                    this.applications = res;
                } else {
                    this.applications = res?.result?.items || res?.items || [];
                }
                console.log('Mapped Applications Count:', this.applications.length);

                if (this.applications.length === 0) {
                    console.warn('No stores found. Check DB or Permissions.');
                    // Temporary debug alert
                    // Swal.fire('Debug', 'Loaded 0 stores. Check console for details.', 'info');
                }

                this.calculateStats();
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('API Error:', err);
                this.isLoading = false;
                // Show more detailed error
                Swal.fire('Error', `Failed to load stores: ${err.status} ${err.statusText}`, 'error');
            }
        });
    }

    calculateStats() {
        this.pendingStores = this.applications.filter(a => !a.status).length;
        this.pendingKyc = this.applications.filter(a => a.kyc && !a.kyc.status).length;
        this.verifiedSellers = this.applications.filter(a => a.status && a.kyc?.status).length;
    }

    approveStore(store: StoreDto) {
        Swal.fire({
            title: 'Approve Store?',
            text: `Are you sure you want to approve "${store.name}"?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, Approve',
            confirmButtonColor: '#10b981'
        }).then((result) => {
            if (result.isConfirmed) {
                this.storeService.approveStore(store.id).subscribe({
                    next: () => {
                        Swal.fire('Approved!', 'The store has been approved.', 'success');
                        this.loadApplications();
                    },
                    error: () => Swal.fire('Error', 'Approval failed.', 'error')
                });
            }
        });
    }

    rejectStore(store: StoreDto) {
        Swal.fire({
            title: 'Reject Store?',
            text: `Are you sure you want to reject "${store.name}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, Reject',
            confirmButtonColor: '#ef4444'
        }).then((result) => {
            if (result.isConfirmed) {
                this.storeService.rejectStore(store.id).subscribe({
                    next: () => {
                        Swal.fire('Rejected', 'The application has been rejected.', 'success');
                        this.loadApplications();
                    },
                    error: () => Swal.fire('Error', 'Operation failed.', 'error')
                });
            }
        });
    }

    verifyKYC(store: StoreDto) {
        // KYC verification logic would go here, for now just a mockup 
        // as we haven't implemented a specific KYC approval endpoint yet
        Swal.fire('Info', 'KYC verification logic is tied to store approval for now.', 'info');
    }

    viewStore(store: StoreDto) {
        this.selectedStore = store;
        const modalElement = document.getElementById('viewStoreModal');
        if (modalElement) {
            // Using bootstrap directly if available or just controlling via conditional template
            // but we'll use a simpler approach in the HTML
            console.log('Viewing store:', store);
        }
    }

    closeModal() {
        this.selectedStore = null;
    }
}
