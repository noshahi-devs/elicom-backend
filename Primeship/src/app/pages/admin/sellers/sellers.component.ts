import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Toast } from '../../../core/models/toast.interface';

interface Seller {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'pending';
  joinDate: Date;
  totalProducts: number;
  totalSales: number;
}

@Component({
  selector: 'app-sellers',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './sellers.component.html',
  styleUrls: ['./sellers.component.scss']
})
export class SellersComponent implements OnInit {
  sellers: Seller[] = [];
  filteredSellers: Seller[] = [];
  searchTerm = '';
  statusFilter = 'all';
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  toast: Toast | null = null;
  showAddModal = false;
  showEditModal = false;
  showDeleteModal = false;
  selectedSeller: Seller | null = null;
  sellerForm: FormGroup;

  // Make Math available in the template
  Math = Math;

  constructor(private fb: FormBuilder) {
    this.sellerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10,15}$/)]],
      status: ['active', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadSellers();
  }

  loadSellers(): void {
    // Mock data - replace with actual API call
    this.sellers = [
      {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890',
        status: 'active',
        joinDate: new Date('2023-01-15'),
        totalProducts: 24,
        totalSales: 12500
      },
      // Add more mock sellers as needed
    ];
  }

  getPageNumbers(): number[] {
    const totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  get paginatedSellers(): Seller[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredSellers.slice(startIndex, startIndex + this.itemsPerPage);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  filterSellers(): void {
    this.filteredSellers = this.sellers.filter(seller => {
      const matchesSearch = !this.searchTerm || 
        seller.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        seller.email.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesStatus = this.statusFilter === 'all' || 
        seller.status === this.statusFilter;
      
      return matchesSearch && matchesStatus;
    });
    
    this.totalItems = this.filteredSellers.length;
    this.currentPage = 1; // Reset to first page when filters change
  }

  openAddModal(): void {
    this.sellerForm.reset({ status: 'active' });
    this.showAddModal = true;
  }

  openEditModal(seller: Seller): void {
    this.selectedSeller = seller;
    this.sellerForm.patchValue({
      name: seller.name,
      email: seller.email,
      phone: seller.phone,
      status: seller.status
    });
    this.showEditModal = true;
  }

  openDeleteModal(seller: Seller): void {
    this.selectedSeller = seller;
    this.showDeleteModal = true;
  }

  closeModal(): void {
    this.showAddModal = false;
    this.showEditModal = false;
    this.showDeleteModal = false;
    this.selectedSeller = null;
    this.sellerForm.reset();
  }

  saveSeller(): void {
    if (this.sellerForm.invalid) {
      this.showToast('Please fill all required fields correctly', 'error');
      return;
    }

    // Simulate API call
    setTimeout(() => {
      this.showToast('Seller saved successfully', 'success');
      this.closeModal();
      this.loadSellers();
    }, 500);
  }

  deleteSeller(): void {
    if (!this.selectedSeller) return;

    // Simulate API call
    setTimeout(() => {
      this.showToast('Seller deleted successfully', 'success');
      this.closeModal();
      this.loadSellers();
    }, 500);
  }

  showToast(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    this.toast = { message, type };
    setTimeout(() => {
      this.toast = null;
    }, 3000);
  }
}
