import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from '../../../services/product.service';
import { StoreProductService } from '../../../services/store-product.service';
import { StoreService } from '../../../services/store.service';
import { AlertService } from '../../../services/alert.service';

@Component({
    selector: 'app-add-product-mapping',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './add-product-mapping.component.html',
    styleUrls: ['./add-product-mapping.component.scss']
})
export class AddProductMappingComponent implements OnInit {
    private productService = inject(ProductService);
    private storeProductService = inject(StoreProductService);
    private storeService = inject(StoreService);
    private router = inject(Router);
    private cdr = inject(ChangeDetectorRef);
    private alert = inject(AlertService);

    searchQuery: string = '';
    isSearching: boolean = false;
    showResults: boolean = false;
    selectedProduct: any = null;
    searchResults: any[] = [];
    currentStore: any = null;

    product: any = null;
    selectedImage: string = '';
    maxAllowedPrice: number = 0;
    retailPrice: number = 0;
    handlingTime: number = 2;
    maxOrderQty: number = 10;
    isViewOnly: boolean = false;
    currentMappingId: string | null = null;

    ngOnInit() {
        this.loadStore();

        // Check if we are in view-only mode from listing
        const state = window.history.state;
        if (state && state.product) {
            this.isViewOnly = !!state.viewOnly;
            this.currentMappingId = state.product.mappingId || null;
            this.selectProduct(state.product);

            // If editing/viewing existing mapping
            if (state.product.resellerPrice) {
                this.retailPrice = state.product.resellerPrice;
            }
            if (state.product.stockQuantity) {
                this.maxOrderQty = state.product.stockQuantity;
            }
        }
    }

    loadStore() {
        this.storeService.getMyStore().subscribe({
            next: (res) => {
                this.currentStore = res.result;
            }
        });
    }

    onSearch() {
        if (!this.searchQuery) {
            this.showResults = false;
            return;
        }
        this.isSearching = true;
        this.productService.search(this.searchQuery).subscribe({
            next: (res) => {
                this.isSearching = false;
                console.log('Search Results:', res.result.items);
                this.searchResults = res.result.items.map((p: any) => ({
                    ...p,
                    images: this.parseImages(p.images)
                }));
                this.showResults = true;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Search Error:', err);
                this.isSearching = false;
                this.cdr.detectChanges();
            }
        });
    }

    parseImages(imageJson: any): string[] {
        if (Array.isArray(imageJson)) return imageJson;
        try {
            return JSON.parse(imageJson || '[]');
        } catch {
            return ['https://picsum.photos/500/500?text=No+Image'];
        }
    }

    selectProduct(prod: any) {
        this.product = prod;
        this.selectedProduct = prod;
        this.selectedImage = (prod.images && prod.images.length > 0) ? prod.images[0] : '';

        // Calculate Max Allowed Price: ResellerMaxPrice OR 167% of SupplierPrice
        const maxAllowedPrice = Number((prod.supplierPrice * 1.67).toFixed(2));

        // Default retail price is supplier price if not already set (e.g. not from existing mapping)
        if (!this.currentMappingId) {
            this.retailPrice = prod.supplierPrice;
        }

        this.showResults = false;
        this.maxAllowedPrice = maxAllowedPrice;
        this.searchQuery = '';
        this.cdr.detectChanges();
    }

    calculatePrice() {
        // No longer used for markup calculation
    }

    selectImage(img: string) {
        this.selectedImage = img;
    }

    cancelSearch() {
        if (this.currentMappingId || this.isViewOnly) {
            this.router.navigate(['/seller/listings']);
            return;
        }
        this.product = null;
        this.selectedProduct = null;
        this.showResults = false;
        this.searchQuery = '';
    }

    publishToStore() {
        if (!this.currentStore) {
            this.alert.error('Store details not loaded. Please try again.');
            return;
        }

        if (this.retailPrice > this.maxAllowedPrice) {
            this.alert.error(`Price exceeds the maximum allowed limit of $${this.maxAllowedPrice}`);
            return;
        }

        if (this.retailPrice < this.product.supplierPrice) {
            this.alert.error(`Price cannot be lower than the supplier price of $${this.product.supplierPrice}`);
            return;
        }

        const mapping: any = {
            storeId: this.currentStore.id,
            productId: this.product.id,
            resellerPrice: this.retailPrice,
            stockQuantity: this.maxOrderQty,
            status: true
        };

        if (this.currentMappingId) {
            mapping.id = this.currentMappingId;
            this.alert.loading('UPDATING LISTING...');
            this.storeProductService.update(mapping).subscribe({
                next: () => {
                    this.alert.success('Listing updated successfully!');
                    this.router.navigate(['/seller/listings']);
                },
                error: (err) => {
                    this.alert.error(err?.error?.error?.message || 'Failed to update listing.');
                }
            });
        } else {
            this.alert.loading('PUBLISHING TO STORE...');
            this.storeProductService.mapProductToStore(mapping).subscribe({
                next: () => {
                    this.alert.success('Product mapped to your store successfully!');
                    this.router.navigate(['/seller/listings']);
                },
                error: (err) => {
                    this.alert.error(err?.error?.error?.message || 'Failed to map product.');
                }
            });
        }
    }
}
