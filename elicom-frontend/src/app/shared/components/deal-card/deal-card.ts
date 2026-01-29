import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface DealProduct {
  image: string;
  hoverImage?: string;
  price: string;
  tag?: string;
  priceText?: string;
}

interface DealCard {
  title: string;
  products: DealProduct[];
}

@Component({
  selector: 'app-deal-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './deal-card.html',
  styleUrls: ['./deal-card.scss']
})
export class DealCardComponent {
  // Static data for now, later replace with API
  dealCards: DealCard[] = [
    {
      title: 'Super Deals',
      products: [
        { image: 'https://picsum.photos/seed/deal1/150/150', price: '$3.88', priceText: 'Flash Sale' },
        { image: 'https://picsum.photos/seed/deal2/150/150', price: '$4.99', priceText: '80% OFF' }
      ]
    },
    {
      title: 'Top Trends',
      products: [
        { image: 'https://picsum.photos/seed/trend1/150/150', price: '$8.09', tag: '#ElegantCasual' },
        { image: 'https://picsum.photos/seed/trend2/150/150', price: '$8.09', tag: '#PartyLooks' }
      ]
    },
    {
      title: 'Brand Zone',
      products: [
        { image: 'https://picsum.photos/seed/brand1/150/150', price: '$3.88', priceText: 'Hot Sale' },
        { image: 'https://picsum.photos/seed/brand2/150/150', price: '$49.58', priceText: '67% OFF' }
      ]
    }
  ];
}
