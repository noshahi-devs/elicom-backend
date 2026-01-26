import { Component, Input } from '@angular/core';
import { Product } from '../../../core/models';

@Component({
  selector: 'app-product-card',
  standalone: false,
  template: `
    <div class="product-card">
      <img [src]="product.image" [alt]="product.name" class="product-image">
      <h3>{{ product.name }}</h3>
      <p-rating [ngModel]="product.rating" [readonly]="true"></p-rating>
      <app-price [price]="product.price" [salePrice]="product.originalPrice"></app-price>
      <button pButton label="Add to Cart" icon="pi pi-shopping-cart"></button>
    </div>
  `,
  styles: [`
    .product-card {
      border: 1px solid #ddd;
      padding: 1rem;
      border-radius: 4px;
      text-align: center;
    }
    .product-image {
      max-width: 100%;
      height: auto;
      margin-bottom: 1rem;
    }
  `]
})
export class ProductCardComponent {
  @Input() product!: Product;
}
