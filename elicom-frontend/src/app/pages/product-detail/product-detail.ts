import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Breadcrumb } from '../../shared/breadcrumb/breadcrumb';
import { ProductGallery } from '../../shared/components/product-gallery/product-gallery';
import { ProductInfo } from '../../shared/components/product-info/product-info';
import { ProductService, ProductDetailDto } from '../../services/product';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    Breadcrumb,
    ProductGallery,
    ProductInfo
  ],
  templateUrl: './product-detail.html',
  styleUrls: ['./product-detail.scss']
})
export class ProductDetail implements OnInit {

  productData?: ProductDetailDto | null;
  breadcrumbItems: string[] = ['Home'];
  isLoading = true;
  errorHappened = false;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    console.log('ProductDetail: Component Initialized');
    this.route.params.subscribe(params => {
      const productId = params['productId'];
      const storeProductId = params['storeProductId'];
      console.log('ProductDetail Route Params:', params);
      if (productId && storeProductId) {
        this.loadProductDetail(productId, storeProductId);
      } else {
        this.isLoading = false;
        this.errorHappened = true;
      }
    });
  }

  loadProductDetail(productId: string, storeProductId: string) {
    Swal.fire({
      title: 'Fetching Product Details...',
      didOpen: () => {
        Swal.showLoading();
      },
      allowOutsideClick: false,
      showConfirmButton: false,
      timer: 3000, // Safety timer
    });

    this.isLoading = true;
    this.errorHappened = false;
    this.productService.getProductDetail(productId, storeProductId).subscribe({
      next: (res) => {
        Swal.close();
        console.log('ProductDetail Receive Result:', res);
        this.productData = res;
        if (this.productData) {
          this.productData.storeProductId = storeProductId;
        }
        this.isLoading = false;
        if (res) {
          this.breadcrumbItems = ['Home', res.category?.name || 'Category', res.title];
        } else {
          this.errorHappened = true;
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching product details', err);
        this.isLoading = false;
        this.errorHappened = true;
        this.cdr.detectChanges();
      }
    });
  }

}
