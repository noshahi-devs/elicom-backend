import { Component, OnInit, Output, EventEmitter, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SearchService } from '../../../services/search.service';

@Component({
    selector: 'app-search-sidebar',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './search-sidebar.html',
    styleUrl: './search-sidebar.scss'
})
export class SearchSidebar implements OnInit, OnChanges {
    // Collapse State
    collapsedSections: Record<string, boolean> = {};

    // View More State (Simplified for dynamic)
    showMore: Record<string, boolean> = {};

    // Filters
    selectedFilters: string[] = [];
    searchTerm: string = '';

    // Price Slider
    minPrice = 0;
    maxPrice = 10000;
    priceGap = 10;

    // Inputs for Dynamic Filters
    @Input() isOpen: boolean = false;
    @Input() categories: string[] = [];
    @Input() colors: string[] = [];
    @Input() sizes: string[] = [];
    @Input() types: string[] = [];
    @Input() fits: string[] = [];
    @Input() lengths: string[] = [];
    @Input() priceLimit: { min: number, max: number } = { min: 0, max: 10000 };

    // Outputs
    @Output() filterChange = new EventEmitter<any>();

    constructor(private searchService: SearchService) { }

    ngOnInit() {
        this.searchService.searchTerm$.subscribe(term => {
            this.searchTerm = term;
        });
    }

    ngOnChanges() {
        if (this.priceLimit) {
            // Set slider to full range of current results if not already filtered
            if (this.minPrice === 0 || this.minPrice < this.priceLimit.min) {
                this.minPrice = this.priceLimit.min;
            }
            if (this.maxPrice === 10000 || this.maxPrice > this.priceLimit.max) {
                this.maxPrice = this.priceLimit.max;
            }
        }
    }

    toggleSection(section: string) {
        this.collapsedSections[section] = !this.collapsedSections[section];
    }

    toggleViewMore(section: keyof typeof this.showMore) {
        this.showMore[section] = true;
    }

    // ... (existing code)

    /* ================= FILTERS ================= */

    onDropdownChange() {
        this.emitFilterChange();
    }

    // Handle Checkbox/Radio Changes
    onFilterChange(e: Event, type: 'checkbox' | 'radio') {
        const input = e.target as HTMLInputElement;
        const value = input.value;

        if (type === 'checkbox') {
            if (input.checked) {
                this.addChip(value);
            } else {
                this.removeChip(value);
            }
        } else {
            // For radio (category), we might want to clear other category chips if needed, 
            // but for now, just adding it is consistent with "one active selection" 
            // if the user manages unchecking manually or via new selection.
            // Actually, for radio, we should probably ensure only one category chip exists or just add it.
            // Let's just add it. The user logic seemed to imply category switching.
            this.addChip(value);
        }
        this.emitFilterChange();
    }

    addChip(text: string) {
        if (!this.selectedFilters.includes(text)) {
            this.selectedFilters.push(text);
        }
    }

    removeChip(text: string) {
        if (text.startsWith('Price:')) {
            this.resetPrice();
            // remove explicitly from chips (resetPrice deals with internal vars)
            this.selectedFilters = this.selectedFilters.filter(f => f !== text);
            this.emitFilterChange();
            return;
        }

        this.selectedFilters = this.selectedFilters.filter(f => f !== text);

        // Uncheck input if it exists
        setTimeout(() => {
            const inputs = document.querySelectorAll(`input[value="${text}"]`);
            inputs.forEach((inp: any) => {
                inp.checked = false;
            });
            this.emitFilterChange();
        });
    }

    clearAll() {
        this.selectedFilters = [];
        this.resetPrice();

        // Reset inputs
        setTimeout(() => {
            const inputs = document.querySelectorAll('input[type="checkbox"], input[type="radio"]');
            inputs.forEach((inp: any) => inp.checked = false);
            this.emitFilterChange();
        });
    }

    /* ================= PRICE ================= */

    onPriceChange() {
        if (this.minPrice > this.maxPrice - this.priceGap) {
            this.minPrice = this.maxPrice - this.priceGap;
        }
        if (this.maxPrice < this.minPrice + this.priceGap) {
            this.maxPrice = this.minPrice + this.priceGap;
        }
        this.updatePriceChip();
        this.emitFilterChange();
    }

    updatePriceChip() {
        // Remove existing price chip
        this.selectedFilters = this.selectedFilters.filter(f => !f.startsWith('Price:'));
        // Add new one
        this.selectedFilters.push(`Price: $${this.minPrice} - $${this.maxPrice}`);
    }

    resetPrice() {
        this.minPrice = this.priceLimit.min;
        this.maxPrice = this.priceLimit.max;
        // logic to remove chip handled in updatePriceChip or caller
        this.selectedFilters = this.selectedFilters.filter(f => !f.startsWith('Price:'));
    }

    private emitFilterChange() {
        this.filterChange.emit({
            filters: this.selectedFilters,
            price: { min: this.minPrice, max: this.maxPrice },
            search: this.searchTerm
        });
    }
}
