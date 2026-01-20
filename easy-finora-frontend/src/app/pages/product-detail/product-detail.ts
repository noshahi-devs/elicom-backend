import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Breadcrumb } from '../../shared/breadcrumb/breadcrumb';
import { ProductGallery } from '../../shared/components/product-gallery/product-gallery';
import { ProductInfo } from '../../shared/components/product-info/product-info';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule,
    Breadcrumb,
    ProductGallery,
    ProductInfo
  ],
  templateUrl: './product-detail.html',
  styleUrls: ['./product-detail.scss']
})
export class ProductDetail {

  breadcrumbItems = [
    'Home',
    'Women Apparel',
    'Black Skinny Women Jeans '
  ];

}
