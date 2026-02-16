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
    totalSteps = 7;
    storeForm: FormGroup;
    isLoading = false;

    countries = [
        { code: 'USA', name: 'United States' },
        { code: 'PAK', name: 'Pakistan' },
        { code: 'IND', name: 'India' },
        { code: 'GBR', name: 'United Kingdom' },
        { code: 'CAN', name: 'Canada' },
        { code: 'AUS', name: 'Australia' },
        { code: 'UAE', name: 'United Arab Emirates' },
        { code: 'SAU', name: 'Saudi Arabia' },
        { code: 'TUR', name: 'Turkey' },
        { code: 'CHN', name: 'China' },
        { code: 'DEU', name: 'Germany' },
        { code: 'FRA', name: 'France' },
        { code: 'ITA', name: 'Italy' },
        { code: 'ESP', name: 'Spain' },
        { code: 'BRA', name: 'Brazil' },
        { code: 'MEX', name: 'Mexico' },
        { code: 'JPN', name: 'Japan' },
        { code: 'BGD', name: 'Bangladesh' },
        { code: 'SGP', name: 'Singapore' },
        { code: 'MYS', name: 'Malaysia' },
        { code: 'QAT', name: 'Qatar' },
        { code: 'KWT', name: 'Kuwait' },
        { code: 'OMN', name: 'Oman' },
        { code: 'IDN', name: 'Indonesia' },
        { code: 'ZAF', name: 'South Africa' },
        { code: 'NGA', name: 'Nigeria' }
    ];

    constructor() {
        this.storeForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(3)]],
            shortDescription: ['', [Validators.required, Validators.maxLength(200)]],
            longDescription: ['', Validators.required],
            description: [''], // Legacy
            supportEmail: ['', [Validators.required, Validators.email]],
            instagram: [''],
            whatsapp: [''],
            kyc: this.fb.group({
                fullName: ['', Validators.required],
                cnic: ['', Validators.required],
                expiryDate: ['', Validators.required],
                issueCountry: ['USA', Validators.required],
                dob: ['', Validators.required],
                phone: ['', Validators.required],
                address: ['', Validators.required],
                zipCode: ['', Validators.required],
                frontImage: [''],
                backImage: ['']
            })
        });

        // Sync old description with longDescription
        this.storeForm.get('longDescription')?.valueChanges.subscribe(val => {
            this.storeForm.get('description')?.setValue(val, { emitEvent: false });
        });
    }

    nextStep() {
        // Validation per step
        if (this.currentStep === 1) {
            if (this.storeForm.get('name')?.invalid) {
                this.storeForm.get('name')?.markAsTouched();
                return;
            }
        }
        if (this.currentStep === 2) {
            if (this.storeForm.get('shortDescription')?.invalid ||
                this.storeForm.get('longDescription')?.invalid ||
                this.storeForm.get('supportEmail')?.invalid) {
                this.storeForm.markAllAsTouched();
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

    triggerFileSelect(inputId: string) {
        document.getElementById(inputId)?.click();
    }

    onFileSelected(event: any, fieldName: 'frontImage' | 'backImage') {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                this.storeForm.get(`kyc.${fieldName}`)?.setValue(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    }

    submitStore() {
        if (this.storeForm.invalid) {
            Swal.fire('Error', 'Please fill all required fields correctly.', 'warning');
            return;
        }

        this.isLoading = true;
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const storeName = this.storeForm.value.name;
        const generatedSlug = storeName.toLowerCase().trim().replace(/ /g, '-').replace(/[^\w-]+/g, '');

        const payload = {
            name: storeName,
            shortDescription: this.storeForm.value.shortDescription,
            longDescription: this.storeForm.value.longDescription,
            description: this.storeForm.value.description,
            slug: generatedSlug,
            ownerId: currentUser.id,
            supportEmail: this.storeForm.value.supportEmail,
            status: false,
            isActive: true,
            kyc: this.storeForm.value.kyc
        };

        this.storeService.createStore(payload).subscribe({
            next: (res) => {
                Swal.fire({
                    icon: 'success',
                    title: 'Store Created!',
                    text: 'Your application has been submitted for review.',
                    confirmButtonText: 'Go to Dashboard'
                }).then(() => {
                    this.router.navigate(['/seller/dashboard']);
                });
            },
            error: (err) => {
                this.isLoading = false;
                Swal.fire('Error', 'Failed to create store. Please check your information.', 'error');
            }
        });
    }
}
