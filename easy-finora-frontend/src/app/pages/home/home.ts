import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductGridComponent } from '../../shared/components/product-grid/product-grid';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    ProductGridComponent
  ],
  templateUrl: './home.html',
  styleUrls: ['./home.scss']
})
export class HomeComponent {

  products: any[] = [
    {
      id: 1,
      title: 'EMERY ROSE 2pcs Plus Size Casual Outfit',
      price: 19.17,
      discount: 24,
      image: 'assets/images/card_1.jpg',
      hoverImage: 'assets/images/card_2.jpg'
    },
    {
      id: 2,
      title: 'Summer Casual Shirt',
      price: 12.99,
      discount: 13,
      image: 'assets/images/card_3.jpg',
      hoverImage: 'assets/images/card_4.jpg'
    },
    {
      id: 2,
      title: 'Summer Casual Shirt',
      price: 12.99,
      discount: 13,
      image: 'assets/images/card_3.jpg',
      hoverImage: 'assets/images/card_4.jpg'
    }
  ];

}
