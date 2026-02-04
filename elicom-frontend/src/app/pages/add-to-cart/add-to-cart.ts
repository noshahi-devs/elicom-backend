import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderProcessHeader } from '../../shared/components/order-process-header/order-process-header';
import { OrderProcessBreadcrumb } from '../../shared/components/order-process-breadcrumb/order-process-breadcrumb';
import { CartItem } from '../../shared/components/cart-item/cart-item';
import { ProductCard } from '../../shared/components/product-card/product-card';
import { ProductService, GlobalMarketplaceProduct } from '../../services/product';

@Component({
  selector: 'app-add-to-cart',
  standalone: true,
  imports: [
    CommonModule,
    OrderProcessHeader,
    OrderProcessBreadcrumb,
    CartItem,
    ProductCard
  ],
  templateUrl: './add-to-cart.html',
  styleUrl: './add-to-cart.scss',
})
export class AddToCart implements OnInit {
  private productService = inject(ProductService);
  private cdr = inject(ChangeDetectorRef);

  brand = 'SMART CART';
  address = 'Ship to Twnhs, 2841 E Waltann Ln Unit 1';
  products: any[] = [];

  ngOnInit(): void {
    this.productService.getGlobalMarketplaceProducts().subscribe({
      next: (res) => {
        this.products = res.map(p => ({
          ...p,
          id: p.id,
          productId: p.productId,
          title: p.productName,
          price: p.price,
          image: this.getFirstImage(p),
          hoverImage: this.getSecondImage(p),
          shop: p.storeName,
          discount: 25,
          reviewCount: 45,
          trends: 'assets/images/trends.png'
        }));
        this.cdr.detectChanges();
      }
    });
  }

  getFirstImage(product: any): string {
    const imageStr = product.productImage;
    const name = (product.productName || '').toLowerCase();

    // Specific Overrides for broken data
    if (name.includes('hair removel') || name.includes('hair removal') || name.includes('hair remover') || name.includes('epilator')) {
      return 'https://picsum.photos/seed/beauty1/300/400';
    }
    if (name.includes('laptop bag')) {
      return 'https://picsum.photos/seed/bag1/300/400';
    }

    if (!imageStr || imageStr === 'string' || imageStr.trim() === '') {
      return `https://picsum.photos/seed/${product.id}/300/400`;
    }

    const img = imageStr.split(',')[0].trim();
    if (img === 'string' || img === '') return `https://picsum.photos/seed/${product.id}/300/400`;

    if (img.includes('cdn.elicom.com')) {
      const seed = img.split('/').pop() || 'p1';
      return `https://picsum.photos/seed/${seed}/300/400`;
    }

    if (!img.startsWith('http')) {
      return `https://localhost:44311/images/products/${img}`;
    }
    return img;
  }

  getSecondImage(product: any): string {
    const imageStr = product.productImage;
    const name = (product.productName || '').toLowerCase();

    // Specific Overrides for hover
    if (name.includes('hair removel') || name.includes('hair removal') || name.includes('hair remover') || name.includes('epilator')) {
      return 'https://picsum.photos/seed/beauty2/300/400';
    }
    if (name.includes('laptop bag')) {
      return 'https://picsum.photos/seed/tech-bag/300/400';
    }

    if (!imageStr || imageStr === 'string' || imageStr.trim() === '') {
      return `https://picsum.photos/seed/${product.id}_hover/300/400`;
    }

    const parts = imageStr.split(',').map((p: any) => p.trim()).filter((p: any) => p !== '' && p !== 'string');

    if (parts.length > 1) {
      const img = parts[1];
      if (img.includes('cdn.elicom.com')) {
        const seed = img.split('/').pop() || 'p2';
        return `https://picsum.photos/seed/${seed}/300/400`;
      }
      if (!img.startsWith('http')) {
        return `https://localhost:44311/images/products/${img}`;
      }
      return img;
    }

    // Fallback hover for single-image products
    const firstImg = parts[0] || '';
    const seed = (firstImg.includes('http') ? (firstImg.split('/').pop() || 'px') : firstImg) + '_hover';
    return `https://picsum.photos/seed/${seed}/300/400`;
  }
}
