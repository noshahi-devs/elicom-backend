import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductDetailDto } from '../../../services/product';
import { environment } from '../../../../environments/environment';

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

      // Use real images from API if they exist
      if (this.productData.images && this.productData.images.length > 0) {
        // Robustly parse the images array/string
        let rawImages: string[] = [];

        // Sometimes 'images' might be a JSON string of an array
        if (typeof this.productData.images === 'string') {
          let str = this.productData.images as string;
          if (str.startsWith('[')) {
            try {
              rawImages = JSON.parse(str);
            } catch (e) {
              // Manual parsing for malformed strings like "[\"url1\", \"url2\"]"
              rawImages = str.replace(/^\[/, '').replace(/\]$/, '').split(',').map(s => s.trim().replace(/^"/, '').replace(/"$/, '').replace(/\\"/g, ''));
            }
          } else {
            rawImages = str.split(',').map(s => s.trim());
          }
        } else if (Array.isArray(this.productData.images)) {
          rawImages = this.productData.images;
        }

        const filteredImages = rawImages.filter(img => img && img !== 'string' && img.trim() !== '');
        if (filteredImages.length > 0) {
          this.images = filteredImages.map(img => this.getImage(img));
        } else {
          this.images = [this.getImage('')];
        }
      } else {
        // Ultimate fallback
        this.images = [
          `https://picsum.photos/seed/${this.productData.productId || 'p'}/600/800`,
          `https://picsum.photos/seed/${this.productData.productId || 'p'}_alt/600/800`
        ];
      }
    }
  }

  getImage(img: string): string {
    if (!img || img === 'string' || img.trim() === '') {
      return `https://picsum.photos/seed/product_${this.productData?.productId || 'default'}/600/800`;
    }

    // Clean malformed strings from API
    let val = img.trim();
    if (val.startsWith('"') || val.startsWith('\\"')) {
      val = val.replace(/^\\"/, '').replace(/\\"$/, '').replace(/^"/, '').replace(/"$/, '').replace(/\\"/g, '');
    }
    if (val.startsWith('[')) {
      val = val.replace(/^\[/, '').replace(/\]$/, '').replace(/^"/, '').replace(/"$/, '').replace(/\\"/g, '');
    }

    // Broken CDN Fix (MUST BE BEFORE http CHECK)
    if (val.includes('cdn.elicom.com')) {
      const seed = val.split('/').pop() || 'p1';
      return `https://picsum.photos/seed/${seed}/600/800`;
    }

    if (val.startsWith('http')) return val;

    // Handle local images (e.g. 'hair.png')
    return `${environment.apiUrl}/images/products/${val}`;
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
