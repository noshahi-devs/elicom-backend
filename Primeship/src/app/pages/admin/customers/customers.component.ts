import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
  totalOrders: number;
  totalSpent: number;
  createdAt: Date;
}

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.scss']
})
export class CustomersComponent implements OnInit {
  addCustomerModalVisible = false;
  editCustomerModalVisible = false;
  deleteConfirmationVisible = false;

  customerToDelete: Customer | null = null;
  selectedCustomer: Customer | null = null;

  customers: Customer[] = [];
  filteredCustomers: Customer[] = [];
  paginatedCustomers: Customer[] = [];

  addCustomerForm!: FormGroup;
  editCustomerForm!: FormGroup;

  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  searchTerm = '';
  selectedStatusFilter: string | null = null;

  toasts: Toast[] = [];
  private toastId = 0;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initForms();
    this.loadDummyData();
    this.filterTable();
  }

  private initForms(): void {
    this.addCustomerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      status: [true]
    });

    this.editCustomerForm = this.fb.group({
      id: [null],
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      status: [true]
    });
  }

  private loadDummyData(): void {
    this.customers = [
      {
        id: 1,
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1 (555) 010-1000',
        status: 'active',
        totalOrders: 12,
        totalSpent: 3456.78,
        createdAt: new Date('2024-01-10')
      },
      {
        id: 2,
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: '+1 (555) 010-2000',
        status: 'active',
        totalOrders: 6,
        totalSpent: 1299.0,
        createdAt: new Date('2024-01-18')
      },
      {
        id: 3,
        name: 'Bob Johnson',
        email: 'bob.johnson@example.com',
        phone: '+1 (555) 010-3000',
        status: 'inactive',
        totalOrders: 2,
        totalSpent: 249.0,
        createdAt: new Date('2024-01-05')
      },
      {
        id: 4,
        name: 'Alice Brown',
        email: 'alice.brown@example.com',
        phone: '+1 (555) 010-4000',
        status: 'active',
        totalOrders: 9,
        totalSpent: 1899.99,
        createdAt: new Date('2024-01-22')
      }
    ];
  }

  showToast(message: string, type: Toast['type'] = 'info'): void {
    const id = ++this.toastId;
    this.toasts.push({ id, message, type });
    setTimeout(() => this.removeToast(id), 5000);
  }

  removeToast(id: number): void {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }

  getToastIcon(type: string): string {
    switch (type) {
      case 'success':
        return 'pi pi-check-circle';
      case 'error':
        return 'pi pi-times-circle';
      case 'warning':
        return 'pi pi-exclamation-triangle';
      default:
        return 'pi pi-info-circle';
    }
  }

  openAddCustomerModal(): void {
    this.addCustomerForm.reset({ name: '', email: '', phone: '', status: true });
    this.addCustomerModalVisible = true;
  }

  closeAddCustomerModal(): void {
    this.addCustomerModalVisible = false;
  }

  openEditCustomerModal(customer: Customer): void {
    this.selectedCustomer = customer;
    this.editCustomerForm.patchValue({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      status: customer.status === 'active'
    });
    this.editCustomerModalVisible = true;
  }

  closeEditCustomerModal(): void {
    this.editCustomerModalVisible = false;
    this.selectedCustomer = null;
  }

  openDeleteConfirmation(customer: Customer): void {
    this.customerToDelete = customer;
    this.deleteConfirmationVisible = true;
  }

  cancelDelete(): void {
    this.deleteConfirmationVisible = false;
    this.customerToDelete = null;
  }

  confirmDelete(): void {
    if (this.customerToDelete) {
      const index = this.customers.findIndex(c => c.id === this.customerToDelete!.id);
      if (index > -1) {
        this.customers.splice(index, 1);
        this.showToast(`Customer "${this.customerToDelete.name}" deleted successfully`, 'success');
        this.filterTable();
      }
    }
    this.cancelDelete();
  }

  saveCustomer(): void {
    if (this.addCustomerForm.invalid) {
      this.showToast('Please fill all required fields correctly', 'error');
      return;
    }

    const formValue = this.addCustomerForm.value;
    const newCustomer: Customer = {
      id: Math.max(...this.customers.map(c => c.id), 0) + 1,
      name: formValue.name,
      email: formValue.email,
      phone: formValue.phone,
      status: formValue.status ? 'active' : 'inactive',
      totalOrders: 0,
      totalSpent: 0,
      createdAt: new Date()
    };

    this.customers.unshift(newCustomer);
    this.showToast('Customer added successfully', 'success');
    this.closeAddCustomerModal();
    this.filterTable();
  }

  updateCustomer(): void {
    if (this.editCustomerForm.invalid) {
      this.showToast('Please fill all required fields correctly', 'error');
      return;
    }

    const formValue = this.editCustomerForm.value;
    const index = this.customers.findIndex(c => c.id === formValue.id);

    if (index > -1) {
      this.customers[index] = {
        ...this.customers[index],
        name: formValue.name,
        email: formValue.email,
        phone: formValue.phone,
        status: formValue.status ? 'active' : 'inactive'
      };

      this.showToast('Customer updated successfully', 'success');
      this.closeEditCustomerModal();
      this.filterTable();
    }
  }

  getStatusLabel(status: Customer['status']): string {
    return status === 'active' ? 'Active' : 'Inactive';
  }

  formatCurrency(value: number): string {
    return `$${value.toFixed(2)}`;
  }

  filterTable(): void {
    let filtered = [...this.customers];

    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(searchLower) ||
        customer.email.toLowerCase().includes(searchLower) ||
        customer.phone.toLowerCase().includes(searchLower)
      );
    }

    if (this.selectedStatusFilter) {
      filtered = filtered.filter(customer => customer.status === this.selectedStatusFilter);
    }

    this.filteredCustomers = filtered;
    this.updatePagination();
  }

  private updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredCustomers.length / this.itemsPerPage);
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedCustomers = this.filteredCustomers.slice(startIndex, endIndex);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  getStartIndex(): number {
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  getEndIndex(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.filteredCustomers.length);
  }

  getPageNumbers(): number[] {
    const pageNumbers: number[] = [];
    const maxPagesToShow = 5;

    let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return pageNumbers;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatusFilter = null;
    this.filterTable();
  }
}
