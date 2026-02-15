import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { environment } from '../../../../environments/environment';

interface DealProduct {
  image: string;
  hoverImage?: string;
  price: string;
  tag?: string;
  priceText?: string;
  id?: string;
  storeProductId?: string;
}

interface DealCard {
  title: string;
  products: DealProduct[];
}

@Component({
  selector: 'app-deal-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './deal-card.html',
  styleUrls: ['./deal-card.scss']
})
export class DealCardComponent implements OnChanges {
  @Input() products: any[] = [];

  dealCards: DealCard[] = [
    { title: 'Super Deals', products: [] },
    { title: 'Top Trends', products: [] },
    { title: 'Brand Zone', products: [] }
  ];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['products'] && this.products && this.products.length > 0) {
      this.generateDynamicDeals();
    }
  }

  generateDynamicDeals() {
    // We need 6 products total (2 per card)
    const pool = [...this.products].sort(() => 0.5 - Math.random());

    // 1. Super Deals (lowest prices)
    const superDeals = [...this.products]
      .sort((a, b) => a.price - b.price)
      .slice(0, 2);

    // 2. Top Trends (random mix or based on category)
    const trends = pool.filter(p => !superDeals.includes(p)).slice(0, 2);

    // 3. Brand Zone (whatever is left)
    const brands = pool.filter(p => !superDeals.includes(p) && !trends.includes(p)).slice(0, 2);

    this.dealCards[0].products = superDeals.map(p => this.mapToDeal(p, 'Flash Sale'));
    this.dealCards[1].products = trends.map(p => this.mapToDeal(p, '', '#' + (p.categoryName || 'Trendy').replace(/\s/g, '')));
    this.dealCards[2].products = brands.map(p => this.mapToDeal(p, (p.resellerDiscountPercentage > 0 ? p.resellerDiscountPercentage + '% OFF' : 'Hot Sale')));
  }

  mapToDeal(p: any, priceText: string = '', tag: string = ''): DealProduct {
    return {
      image: this.getImage(p.image1 || p.productImage || p.imageUrl),
      hoverImage: this.getImage(p.image2),
      price: '$' + (p.price || 0).toFixed(2),
      priceText: priceText,
      tag: tag,
      id: p.productId,
      storeProductId: p.storeProductId || p.id
    };
  }

  getImage(img: string): string {
    if (!img || img === 'string' || img.trim() === '') {
      return `https://picsum.photos/seed/deal_${Math.random()}/150/150`;
    }

    // Robust parsing (Same as grid)
    let val = img.trim();
    if (val.startsWith('"') || val.startsWith('\\"')) {
      val = val.replace(/^\\"/, '').replace(/\\"$/, '').replace(/^"/, '').replace(/"$/, '').replace(/\\"/g, '');
    }
    if (val.startsWith('[')) {
      val = val.replace(/^\[/, '').replace(/\]$/, '').replace(/^"/, '').replace(/"$/, '').replace(/\\"/g, '');
    }

    if (val.startsWith('http')) return val;
    return `${environment.apiUrl}/${val.startsWith('/') ? val.substring(1) : val}`;
  }
}
