import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'seller' | 'customer';
  status: 'active' | 'inactive';
  createdAt: Date;
  lastLogin: Date | null;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  searchTerm = '';
  selectedStatus = 'all';
  selectedRole = 'all';

  // Modal states
  statusConfirmVisible = false;
  userToToggle: User | null = null;
  newStatus: 'active' | 'inactive' | null = null;

  // Toast states
  successPopupVisible = false;
  successMessage = '';
  errorPopupVisible = false;
  errorMessage = '';

  ngOnInit(): void {
    this.loadDummyUsers();
    this.applyFilters();
  }

  loadDummyUsers(): void {
    this.users = [
      {
        id: 1,
        name: 'Ali Khan',
        email: 'ali.khan@example.com',
        role: 'seller',
        status: 'active',
        createdAt: new Date('2025-12-01'),
        lastLogin: new Date('2026-01-24')
      },
      {
        id: 2,
        name: 'Fatima Noor',
        email: 'fatima.noor@example.com',
        role: 'seller',
        status: 'inactive',
        createdAt: new Date('2025-11-15'),
        lastLogin: new Date('2026-01-10')
      },
      {
        id: 3,
        name: 'Usman Ahmad',
        email: 'usman.ahmad@example.com',
        role: 'customer',
        status: 'active',
        createdAt: new Date('2026-01-05'),
        lastLogin: new Date('2026-01-23')
      },
      {
        id: 4,
        name: 'Ayesha Malik',
        email: 'ayesha.malik@example.com',
        role: 'admin',
        status: 'active',
        createdAt: new Date('2025-10-20'),
        lastLogin: new Date('2026-01-24')
      },
      {
        id: 5,
        name: 'Hamza Sheikh',
        email: 'hamza.sheikh@example.com',
        role: 'customer',
        status: 'inactive',
        createdAt: new Date('2025-12-12'),
        lastLogin: null
      },
      {
        id: 6,
        name: 'Sara Ali',
        email: 'sara.ali@example.com',
        role: 'seller',
        status: 'active',
        createdAt: new Date('2026-01-02'),
        lastLogin: new Date('2026-01-22')
      }
    ];
  }

  applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredUsers = this.users.filter(user => {
      const matchesSearch = !term || 
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term);
      
      const matchesStatus = this.selectedStatus === 'all' || user.status === this.selectedStatus;
      const matchesRole = this.selectedRole === 'all' || user.role === this.selectedRole;
      
      return matchesSearch && matchesStatus && matchesRole;
    });
  }

  openStatusConfirm(user: User): void {
    this.userToToggle = user;
    this.newStatus = user.status === 'active' ? 'inactive' : 'active';
    this.statusConfirmVisible = true;
  }

  closeStatusConfirm(): void {
    this.statusConfirmVisible = false;
    this.userToToggle = null;
    this.newStatus = null;
  }

  confirmStatusToggle(): void {
    if (!this.userToToggle || !this.newStatus) return;
    
    const user = this.userToToggle;
    const oldStatus = user.status;
    user.status = this.newStatus;
    
    this.applyFilters();
    this.closeStatusConfirm();
    this.showSuccess(`User ${user.name} is now ${user.status}`);
  }

  getStatusColor(status: 'active' | 'inactive'): string {
    return status === 'active' ? '#10b981' : '#ef4444';
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'admin': return 'admin';
      case 'seller': return 'seller';
      case 'customer': return 'customer';
      default: return '';
    }
  }

  formatDate(date: Date | null): string {
    if (!date) return 'Never';
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  // Toast methods
  showSuccess(message: string): void {
    this.successMessage = message;
    this.successPopupVisible = true;
    setTimeout(() => {
      this.successPopupVisible = false;
    }, 2500);
  }

  showError(message: string): void {
    this.errorMessage = message;
    this.errorPopupVisible = true;
    setTimeout(() => {
      this.errorPopupVisible = false;
    }, 3200);
  }

  closeSuccessPopup(): void {
    this.successPopupVisible = false;
  }

  closeErrorPopup(): void {
    this.errorPopupVisible = false;
  }
}
