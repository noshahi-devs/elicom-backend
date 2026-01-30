import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
    selector: 'app-add-product-mapping',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './add-product-mapping.component.html',
    styleUrls: ['./add-product-mapping.component.scss']
})
export class AddProductMappingComponent implements OnInit {
    constructor(private router: Router) { }

    searchQuery: string = '';
    isSearching: boolean = false;
    showResults: boolean = false;
    selectedProduct: any = null;

    searchResults = [
        {
            id: 'dr81852159',
            name: 'Silicone Cooking Utensils Set – 34PCS',
            category: 'Kitchen Tools',
            brand: 'Umite Kitchen',
            wholesalePrice: 35.78,
            sku: 'KITCH-SIL-34',
            rating: 4.5,
            reviews: 89,
            images: [
                'https://picsum.photos/500/500?random=1',
                'https://picsum.photos/500/500?random=2',
                'https://picsum.photos/500/500?random=3'
            ]
        },
        {
            id: 'hp-9921',
            name: 'Premium Wireless Noise Cancelling Headphones',
            category: 'Electronics > Audio',
            brand: 'Sony',
            wholesalePrice: 85.00,
            sku: 'ELEC-HP-001',
            rating: 4.8,
            reviews: 156,
            images: [
                'https://picsum.photos/500/500?random=4',
                'https://picsum.photos/500/500?random=5',
                'https://picsum.photos/500/500?random=6'
            ]
        }
    ];

    product: any = null;
    selectedImage: string = '';
    markupValue: number = 0;
    retailPrice: number = 0;
    handlingTime: number = 2;
    maxOrderQty: number = 10;
    customerNote: string = '';
    isViewOnly: boolean = false;

    ngOnInit() {
        // Check if we are in view-only mode from listing
        const state = window.history.state;
        if (state && state.product) {
            this.isViewOnly = !!state.viewOnly;
            this.selectProduct(state.product);
            // If it's viewOnly, we might want to override some defaults
            if (this.isViewOnly) {
                this.markupValue = state.product.markup || 15;
                this.calculatePrice();
            }
        }
    }

    onSearch() {
        if (!this.searchQuery) {
            this.showResults = false;
            return;
        }
        this.isSearching = true;
        // Simulate API call
        setTimeout(() => {
            this.isSearching = false;
            this.showResults = true;
        }, 600);
    }

    selectProduct(prod: any) {
        this.product = prod;
        this.selectedProduct = prod;
        this.selectedImage = prod.images[0];
        this.markupValue = Math.round(prod.wholesalePrice * 0.25);
        this.calculatePrice();
        this.showResults = false;
        this.searchQuery = '';
    }

    calculatePrice() {
        if (this.product) {
            const price = Number(this.product.wholesalePrice) + Number(this.markupValue);
            this.retailPrice = Number(price.toFixed(2));
        }
    }

    selectImage(img: string) {
        this.selectedImage = img;
    }

    cancelSearch() {
        if (this.isViewOnly) {
            this.router.navigate(['/seller/listings']);
            return;
        }
        this.product = null;
        this.selectedProduct = null;
        this.showResults = false;
        this.searchQuery = '';
    }

    publishToStore() {
        alert('Product published to store successfully!');
        this.cancelSearch();
    }
}
