import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface InventoryItem {
  id: number;
  productName: string;
  sku: string;
  warehouse: string;
  quantity: number;
  reorderLevel: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
}

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.scss']
})
export class InventoryComponent implements OnInit {
  addItemModalVisible = false;
  editItemModalVisible = false;
  deleteConfirmationVisible = false;

  itemToDelete: InventoryItem | null = null;
  selectedItem: InventoryItem | null = null;

  items: InventoryItem[] = [];
  filteredItems: InventoryItem[] = [];
  paginatedItems: InventoryItem[] = [];

  addItemForm!: FormGroup;
  editItemForm!: FormGroup;

  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  searchTerm = '';
  selectedStatusFilter: string | null = null;
  selectedWarehouseFilter: string | null = null;

  warehouses: string[] = [];

  toasts: Toast[] = [];
  private toastId = 0;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initForms();
    this.loadDummyData();
    this.loadWarehouses();
    this.filterTable();
  }

  private initForms(): void {
    this.addItemForm = this.fb.group({
      productName: ['', [Validators.required, Validators.minLength(3)]],
      sku: ['', [Validators.required]],
      warehouse: ['', [Validators.required]],
      quantity: [0, [Validators.required, Validators.min(0)]],
      reorderLevel: [0, [Validators.required, Validators.min(0)]],
      status: ['in_stock', [Validators.required]]
    });

    this.editItemForm = this.fb.group({
      id: [null],
      productName: ['', [Validators.required, Validators.minLength(3)]],
      sku: ['', [Validators.required]],
      warehouse: ['', [Validators.required]],
      quantity: [0, [Validators.required, Validators.min(0)]],
      reorderLevel: [0, [Validators.required, Validators.min(0)]],
      status: ['in_stock', [Validators.required]]
    });
  }

  private loadDummyData(): void {
    this.items = [
      {
        id: 1,
        productName: 'iPhone 15 Pro',
        sku: 'SKU-IPH15P-2024',
        warehouse: 'Main Warehouse',
        quantity: 45,
        reorderLevel: 10,
        status: 'in_stock'
      },
      {
        id: 2,
        productName: 'MacBook Pro 16"',
        sku: 'SKU-MBP16-2024',
        warehouse: 'Main Warehouse',
        quantity: 9,
        reorderLevel: 12,
        status: 'low_stock'
      },
      {
        id: 3,
        productName: 'Sony WH-1000XM5',
        sku: 'SKU-SONYWH-1000',
        warehouse: '3PL - West',
        quantity: 0,
        reorderLevel: 15,
        status: 'out_of_stock'
      },
      {
        id: 4,
        productName: 'Nike Air Max 270',
        sku: 'SKU-NIKE270-2024',
        warehouse: '3PL - East',
        quantity: 120,
        reorderLevel: 25,
        status: 'in_stock'
      }
    ];
  }

  private loadWarehouses(): void {
    this.warehouses = ['Main Warehouse', '3PL - West', '3PL - East'];
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

  openAddItemModal(): void {
    this.addItemForm.reset({
      productName: '',
      sku: '',
      warehouse: '',
      quantity: 0,
      reorderLevel: 0,
      status: 'in_stock'
    });
    this.addItemModalVisible = true;
  }

  closeAddItemModal(): void {
    this.addItemModalVisible = false;
  }

  openEditItemModal(item: InventoryItem): void {
    this.selectedItem = item;
    this.editItemForm.patchValue({
      id: item.id,
      productName: item.productName,
      sku: item.sku,
      warehouse: item.warehouse,
      quantity: item.quantity,
      reorderLevel: item.reorderLevel,
      status: item.status
    });
    this.editItemModalVisible = true;
  }

  closeEditItemModal(): void {
    this.editItemModalVisible = false;
    this.selectedItem = null;
  }

  openDeleteConfirmation(item: InventoryItem): void {
    this.itemToDelete = item;
    this.deleteConfirmationVisible = true;
  }

  cancelDelete(): void {
    this.deleteConfirmationVisible = false;
    this.itemToDelete = null;
  }

  confirmDelete(): void {
    if (this.itemToDelete) {
      const index = this.items.findIndex(i => i.id === this.itemToDelete!.id);
      if (index > -1) {
        this.items.splice(index, 1);
        this.showToast(`Inventory item "${this.itemToDelete.productName}" deleted successfully`, 'success');
        this.filterTable();
      }
    }
    this.cancelDelete();
  }

  saveItem(): void {
    if (this.addItemForm.invalid) {
      this.showToast('Please fill all required fields correctly', 'error');
      return;
    }

    const formValue = this.addItemForm.value;
    const newItem: InventoryItem = {
      id: Math.max(...this.items.map(i => i.id), 0) + 1,
      productName: formValue.productName,
      sku: formValue.sku,
      warehouse: formValue.warehouse,
      quantity: Number(formValue.quantity),
      reorderLevel: Number(formValue.reorderLevel),
      status: formValue.status
    };

    this.items.unshift(newItem);
    this.showToast('Inventory item added successfully', 'success');
    this.closeAddItemModal();
    this.filterTable();
  }

  updateItem(): void {
    if (this.editItemForm.invalid) {
      this.showToast('Please fill all required fields correctly', 'error');
      return;
    }

    const formValue = this.editItemForm.value;
    const index = this.items.findIndex(i => i.id === formValue.id);

    if (index > -1) {
      this.items[index] = {
        ...this.items[index],
        productName: formValue.productName,
        sku: formValue.sku,
        warehouse: formValue.warehouse,
        quantity: Number(formValue.quantity),
        reorderLevel: Number(formValue.reorderLevel),
        status: formValue.status
      };

      this.showToast('Inventory item updated successfully', 'success');
      this.closeEditItemModal();
      this.filterTable();
    }
  }

  getStatusLabel(status: InventoryItem['status']): string {
    switch (status) {
      case 'in_stock':
        return 'In Stock';
      case 'low_stock':
        return 'Low Stock';
      default:
        return 'Out of Stock';
    }
  }

  filterTable(): void {
    let filtered = [...this.items];

    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.productName.toLowerCase().includes(searchLower) ||
        item.sku.toLowerCase().includes(searchLower) ||
        item.warehouse.toLowerCase().includes(searchLower)
      );
    }

    if (this.selectedStatusFilter) {
      filtered = filtered.filter(item => item.status === this.selectedStatusFilter);
    }

    if (this.selectedWarehouseFilter) {
      filtered = filtered.filter(item => item.warehouse === this.selectedWarehouseFilter);
    }

    this.filteredItems = filtered;
    this.updatePagination();
  }

  private updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredItems.length / this.itemsPerPage);
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedItems = this.filteredItems.slice(startIndex, endIndex);
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
    return Math.min(this.currentPage * this.itemsPerPage, this.filteredItems.length);
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
    this.selectedWarehouseFilter = null;
    this.filterTable();
  }
}
