import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductDetailDto } from '../../../services/product';

@Component({
  selector: 'app-product-gallery',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-gallery.html',
  styleUrls: ['./product-gallery.scss']
})
export class ProductGallery implements OnInit {

  @Input() productData?: ProductDetailDto;

  images: string[] = [];

  activeIndex = 0;

  ngOnInit(): void {
    if (this.productData) {
      const name = (this.productData.title || '').toLowerCase();

      // 🚨 CRITICAL: Check if we should override based on product name (Same as Home Grid)
      if (name.includes('hair removal') || name.includes('hair removel') || name.includes('hair remover') || name.includes('epilator')) {
        this.images = [
          'https://picsum.photos/seed/beauty1/600/800',
          'https://picsum.photos/seed/beauty2/600/800'
        ];
      } else if (name.includes('laptop bag')) {
        this.images = [
          'https://picsum.photos/seed/bag1/600/800',
          'https://picsum.photos/seed/tech-bag/600/800'
        ];
      } else if (name.includes('women summer floral dress')) {
        this.images = [
          'https://picsum.photos/seed/dress1/600/800',
          'https://picsum.photos/seed/dress2/600/800'
        ];
      } else if (this.productData.images && this.productData.images.length > 0) {
        // Use real images from API if they exist and aren't broken strings
        const filteredImages = this.productData.images.filter(img => img && img !== 'string');
        if (filteredImages.length > 0) {
          this.images = filteredImages.map(img => this.getImage(img));
        } else {
          this.images = [this.getImage('')];
        }
      } else {
        // Ultimate fallback
        this.images = [
          `https://picsum.photos/seed/${this.productData.productId}/600/800`,
          `https://picsum.photos/seed/${this.productData.productId}_alt/600/800`
        ];
      }
    }
  }

  getImage(img: string): string {
    if (!img || img === 'string' || img.trim() === '') {
      return `https://picsum.photos/seed/product_${this.productData?.productId}/600/800`;
    }

    // Broken CDN Fix (MUST BE BEFORE http CHECK)
    if (img.includes('cdn.elicom.com')) {
      const seed = img.split('/').pop() || 'p1';
      return `https://picsum.photos/seed/${seed}/600/800`;
    }

    if (img.startsWith('http')) return img;

    // Handle local images (e.g. 'hair.png')
    return `https://localhost:44311/images/products/${img}`;
  }

  selectImage(index: number) {
    this.activeIndex = index;
  }

  prevImage() {
    this.activeIndex =
      (this.activeIndex - 1 + this.images.length) % this.images.length;
  }

  nextImage() {
    this.activeIndex =
      (this.activeIndex + 1) % this.images.length;
  }

  setMainImage(src: string) {
    // If the image already exists in our array, just go to it
    const index = this.images.indexOf(src);
    if (index > -1) {
      this.activeIndex = index;
    } else {
      // If it's a new image (like a specific color one), unshift it to the gallery and make it active
      this.images.unshift(src);
      this.activeIndex = 0;
    }
  }
}
