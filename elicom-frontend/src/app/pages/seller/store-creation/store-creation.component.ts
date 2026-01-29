import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StoreService } from '../../../services/store.service';
import { AuthService } from '../../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-store-creation',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './store-creation.component.html',
    styleUrls: ['./store-creation.component.scss']
})
export class StoreCreationComponent {
    private fb = inject(FormBuilder);
    private storeService = inject(StoreService);
    private authService = inject(AuthService);
    private router = inject(Router);

    currentStep = 1;
    totalSteps = 4;
    storeForm: FormGroup;
    isLoading = false;

    categories = [
        { id: 'fashion', name: 'Fashion', icon: 'fas fa-tshirt' },
        { id: 'electronics', name: 'Electronics', icon: 'fas fa-laptop' },
        { id: 'home', name: 'Home Decor', icon: 'fas fa-home' },
        { id: 'health', name: 'Health', icon: 'fas fa-heartbeat' }
    ];

    selectedCategory = 'fashion';

    constructor() {
        this.storeForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(3)]],
            description: ['', Validators.required],
            slug: ['', Validators.required],
            supportEmail: ['', [Validators.required, Validators.email]],
            instagram: [''],
            whatsapp: ['']
        });

        // Auto-generate slug from name
        this.storeForm.get('name')?.valueChanges.subscribe(name => {
            if (name) {
                const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
                this.storeForm.get('slug')?.setValue(slug, { emitEvent: false });
            }
        });
    }

    nextStep() {
        if (this.currentStep === 1) {
            if (this.storeForm.get('name')?.invalid || this.storeForm.get('slug')?.invalid) {
                this.storeForm.get('name')?.markAsTouched();
                return;
            }
        }

        if (this.currentStep < this.totalSteps) {
            this.currentStep++;
        } else {
            this.submitStore();
        }
    }

    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
        }
    }

    selectCategory(catId: string) {
        this.selectedCategory = catId;
    }

    submitStore() {
        if (this.storeForm.invalid) return;

        this.isLoading = true;
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

        const payload = {
            name: this.storeForm.value.name,
            description: this.storeForm.value.description,
            slug: this.storeForm.value.slug,
            ownerId: currentUser.id,
            status: true
        };

        this.storeService.createStore(payload).subscribe({
            next: (res) => {
                Swal.fire({
                    icon: 'success',
                    title: 'Store Created!',
                    text: 'Your store is ready. Let\'s add some products!',
                    confirmButtonText: 'Go to Dashboard'
                }).then(() => {
                    this.router.navigate(['/user/index']);
                });
            },
            error: (err) => {
                this.isLoading = false;
                Swal.fire('Error', 'Failed to create store. Please try again.', 'error');
            }
        });
    }
}
