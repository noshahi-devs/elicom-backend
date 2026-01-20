import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderProcessHeader } from '../../shared/components/order-process-header/order-process-header';
import { OrderProcessBreadcrumb } from '../../shared/components/order-process-breadcrumb/order-process-breadcrumb';
import { CartItem } from '../../shared/components/cart-item/cart-item';
import { ProductCard } from '../../shared/components/product-card/product-card';

@Component({
  selector: 'app-add-to-cart',
  standalone: true,
  imports: [
    CommonModule, // ✅ MUST (ngFor, ngIf)
    OrderProcessHeader,
    OrderProcessBreadcrumb,
    CartItem,
    ProductCard
  ],
  templateUrl: './add-to-cart.html',
  styleUrl: './add-to-cart.scss',
})
export class AddToCart {

  brand = 'SMART CART';
  address = 'Ship to Twnhs, 2841 E Waltann Ln Unit 1';

  products: any[] = [
    {
      id: 1,
      title: 'Womens Classic High Waist Jeans',
      price: 20.95,
      discount: 29,
      image: 'assets/images/card_1.jpg',
      hoverImage: 'assets/images/card_2.jpg',
      shop: 'SMARTC EZwear',
      trends: 'assets/images/trends.png',
      couponDiscount: 3
    },
    {
      id: 1,
      title: 'Womens Classic High Waist Jeans',
      price: 20.95,
      discount: 29,
      image: 'assets/images/card_1.jpg',
      hoverImage: 'assets/images/card_2.jpg',
      shop: 'SMARTC EZwear',
      trends: 'assets/images/trends.png',
      couponDiscount: 3
    },
    {
      id: 1,
      title: 'Womens Classic High Waist Jeans',
      price: 20.95,
      discount: 29,
      image: 'assets/images/card_1.jpg',
      hoverImage: 'assets/images/card_2.jpg',
      shop: 'SMARTC EZwear',
      trends: 'assets/images/trends.png',
      couponDiscount: 3
    },
    {
      id: 1,
      title: 'Womens Classic High Waist Jeans',
      price: 20.95,
      discount: 29,
      image: 'assets/images/card_1.jpg',
      hoverImage: 'assets/images/card_2.jpg',
      shop: 'SMARTC EZwear',
      trends: 'assets/images/trends.png',
      couponDiscount: 3
    },
    {
      id: 1,
      title: 'Womens Classic High Waist Jeans',
      price: 20.95,
      discount: 29,
      image: 'assets/images/card_1.jpg',
      hoverImage: 'assets/images/card_2.jpg',
      shop: 'SMARTC EZwear',
      trends: 'assets/images/trends.png',
      couponDiscount: 3
    },
    {
      id: 1,
      title: 'Womens Classic High Waist Jeans',
      price: 20.95,
      discount: 29,
      image: 'assets/images/card_1.jpg',
      hoverImage: 'assets/images/card_2.jpg',
      shop: 'SMARTC EZwear',
      trends: 'assets/images/trends.png',
      couponDiscount: 3
    },
    {
      id: 1,
      title: 'Womens Classic High Waist Jeans',
      price: 20.95,
      discount: 29,
      image: 'assets/images/card_1.jpg',
      hoverImage: 'assets/images/card_2.jpg',
      shop: 'SMARTC EZwear',
      trends: 'assets/images/trends.png',
      couponDiscount: 3
    },
    {
      id: 1,
      title: 'Womens Classic High Waist Jeans',
      price: 20.95,
      discount: 29,
      image: 'assets/images/card_1.jpg',
      hoverImage: 'assets/images/card_2.jpg',
      shop: 'SMARTC EZwear',
      trends: 'assets/images/trends.png',
      couponDiscount: 3
    },
    {
      id: 1,
      title: 'Womens Classic High Waist Jeans',
      price: 20.95,
      discount: 29,
      image: 'assets/images/card_1.jpg',
      hoverImage: 'assets/images/card_2.jpg',
      shop: 'SMARTC EZwear',
      trends: 'assets/images/trends.png',
      couponDiscount: 3
    },
    {
      id: 1,
      title: 'Womens Classic High Waist Jeans',
      price: 20.95,
      discount: 29,
      image: 'assets/images/card_1.jpg',
      hoverImage: 'assets/images/card_2.jpg',
      shop: 'SMARTC EZwear',
      trends: 'assets/images/trends.png',
      couponDiscount: 3
    },
    {
      id: 1,
      title: 'Womens Classic High Waist Jeans',
      price: 20.95,
      discount: 29,
      image: 'assets/images/card_1.jpg',
      hoverImage: 'assets/images/card_2.jpg',
      shop: 'SMARTC EZwear',
      trends: 'assets/images/trends.png',
      couponDiscount: 3
    },
    {
      id: 1,
      title: 'Womens Classic High Waist Jeans',
      price: 20.95,
      discount: 29,
      image: 'assets/images/card_1.jpg',
      hoverImage: 'assets/images/card_2.jpg',
      shop: 'SMARTC EZwear',
      trends: 'assets/images/trends.png',
      couponDiscount: 3
    },
    {
      id: 1,
      title: 'Womens Classic High Waist Jeans',
      price: 20.95,
      discount: 29,
      image: 'assets/images/card_1.jpg',
      hoverImage: 'assets/images/card_2.jpg',
      shop: 'SMARTC EZwear',
      trends: 'assets/images/trends.png',
      couponDiscount: 3
    },
    {
      id: 1,
      title: 'Womens Classic High Waist Jeans',
      price: 20.95,
      discount: 29,
      image: 'assets/images/card_1.jpg',
      hoverImage: 'assets/images/card_2.jpg',
      shop: 'SMARTC EZwear',
      trends: 'assets/images/trends.png',
      couponDiscount: 3
    },
    {
      id: 1,
      title: 'Womens Classic High Waist Jeans',
      price: 20.95,
      discount: 29,
      image: 'assets/images/card_1.jpg',
      hoverImage: 'assets/images/card_2.jpg',
      shop: 'SMARTC EZwear',
      trends: 'assets/images/trends.png',
      couponDiscount: 3
    },
    {
      id: 1,
      title: 'Womens Classic High Waist Jeans',
      price: 20.95,
      discount: 29,
      image: 'assets/images/card_1.jpg',
      hoverImage: 'assets/images/card_2.jpg',
      shop: 'SMARTC EZwear',
      trends: 'assets/images/trends.png',
      couponDiscount: 3
    },
    {
      id: 1,
      title: 'Womens Classic High Waist Jeans',
      price: 20.95,
      discount: 29,
      image: 'assets/images/card_1.jpg',
      hoverImage: 'assets/images/card_2.jpg',
      shop: 'SMARTC EZwear',
      trends: 'assets/images/trends.png',
      couponDiscount: 3
    },
    {
      id: 1,
      title: 'Womens Classic High Waist Jeans',
      price: 20.95,
      discount: 29,
      image: 'assets/images/card_1.jpg',
      hoverImage: 'assets/images/card_2.jpg',
      shop: 'SMARTC EZwear',
      trends: 'assets/images/trends.png',
      couponDiscount: 3
    },
    {
      id: 1,
      title: 'Womens Classic High Waist Jeans',
      price: 20.95,
      discount: 29,
      image: 'assets/images/card_1.jpg',
      hoverImage: 'assets/images/card_2.jpg',
      shop: 'SMARTC EZwear',
      trends: 'assets/images/trends.png',
      couponDiscount: 3
    },
    {
      id: 1,
      title: 'Womens Classic High Waist Jeans',
      price: 20.95,
      discount: 29,
      image: 'assets/images/card_1.jpg',
      hoverImage: 'assets/images/card_2.jpg',
      shop: 'SMARTC EZwear',
      trends: 'assets/images/trends.png',
      couponDiscount: 3
    },
    {
      id: 1,
      title: 'Womens Classic High Waist Jeans',
      price: 20.95,
      discount: 29,
      image: 'assets/images/card_1.jpg',
      hoverImage: 'assets/images/card_2.jpg',
      shop: 'SMARTC EZwear',
      trends: 'assets/images/trends.png',
      couponDiscount: 3
    },
    {
      id: 1,
      title: 'Womens Classic High Waist Jeans',
      price: 20.95,
      discount: 29,
      image: 'assets/images/card_1.jpg',
      hoverImage: 'assets/images/card_2.jpg',
      shop: 'SMARTC EZwear',
      trends: 'assets/images/trends.png',
      couponDiscount: 3
    },
    {
      id: 1,
      title: 'Womens Classic High Waist Jeans',
      price: 20.95,
      discount: 29,
      image: 'assets/images/card_1.jpg',
      hoverImage: 'assets/images/card_2.jpg',
      shop: 'SMARTC EZwear',
      trends: 'assets/images/trends.png',
      couponDiscount: 3
    },
    {
      id: 1,
      title: 'Womens Classic High Waist Jeans',
      price: 20.95,
      discount: 29,
      image: 'assets/images/card_1.jpg',
      hoverImage: 'assets/images/card_2.jpg',
      shop: 'SMARTC EZwear',
      trends: 'assets/images/trends.png',
      couponDiscount: 3
    },
    {
      id: 1,
      title: 'Womens Classic High Waist Jeans',
      price: 20.95,
      discount: 29,
      image: 'assets/images/card_1.jpg',
      hoverImage: 'assets/images/card_2.jpg',
      shop: 'SMARTC EZwear',
      trends: 'assets/images/trends.png',
      couponDiscount: 3
    },
    {
      id: 1,
      title: 'Womens Classic High Waist Jeans',
      price: 20.95,
      discount: 29,
      image: 'assets/images/card_1.jpg',
      hoverImage: 'assets/images/card_2.jpg',
      shop: 'SMARTC EZwear',
      trends: 'assets/images/trends.png',
      couponDiscount: 3
    },
    {
      id: 1,
      title: 'Womens Classic High Waist Jeans',
      price: 20.95,
      discount: 29,
      image: 'assets/images/card_1.jpg',
      hoverImage: 'assets/images/card_2.jpg',
      shop: 'SMARTC EZwear',
      trends: 'assets/images/trends.png',
      couponDiscount: 3
    },
    {
      id: 1,
      title: 'Womens Classic High Waist Jeans',
      price: 20.95,
      discount: 29,
      image: 'assets/images/card_1.jpg',
      hoverImage: 'assets/images/card_2.jpg',
      shop: 'SMARTC EZwear',
      trends: 'assets/images/trends.png',
      couponDiscount: 3
    }
  ];
  
}
