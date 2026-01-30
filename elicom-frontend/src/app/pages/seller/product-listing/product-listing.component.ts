import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
    selector: 'app-product-listing',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './product-listing.component.html',
    styleUrls: ['./product-listing.component.scss']
})
export class ProductListingComponent implements OnInit {
    constructor(private router: Router) { }

    products = [
        {
            id: "KU12345",
            title: "Premium Kitchen Utensils Set 34PCS with Stainless Steel Material",
            category: "Kitchen",
            brand: "Umite Kitchen",
            price: "$29.99",
            image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500"
        },
        {
            id: "CAM4567",
            title: "Professional Camera 24MP DSLR with 4K Video Recording",
            category: "Electronics",
            brand: "Canon",
            price: "$499.99",
            image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500"
        },
        {
            id: "SW7890",
            title: "Smart Watch Series 5 GPS with Heart Rate Monitor",
            category: "Wearables",
            brand: "Apple",
            price: "$199.99",
            image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500"
        },
        {
            id: "SG2345",
            title: "Polarized Sunglasses UV400 Protection with Anti-Glare",
            category: "Accessories",
            brand: "Ray-Ban",
            price: "$89.99",
            image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500"
        },
        {
            id: "HP5678",
            title: "Noise Cancelling Headphones Pro with 30 Hours Battery",
            category: "Audio",
            brand: "Sony",
            price: "$149.99",
            image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500"
        },
        {
            id: "RS9012",
            title: "Running Shoes Pro Max Air with Cushioned Sole",
            category: "Footwear",
            brand: "Nike",
            price: "$79.99",
            image: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=500"
        },
        {
            id: "SP3456",
            title: "Smartphone X Pro Max 256GB with Triple Camera",
            category: "Mobile",
            brand: "Apple",
            price: "$899.99",
            image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500"
        },
        {
            id: "SN7890",
            title: "Limited Edition Sneakers 2024 with Premium Leather",
            category: "Collectible",
            brand: "Adidas",
            price: "$199.99",
            image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500"
        }
    ];

    ngOnInit() { }

    smartTruncate(text: string, maxLength: number = 100): string {
        if (text.length <= maxLength) return text;
        const words = text.split(' ');
        const firstPart = words.slice(0, 8).join(' ');
        const lastPart = words.slice(-5).join(' ');
        return `${firstPart} ... ${lastPart}`;
    }

    toggleActive(event: Event, type: 'heart' | 'cart') {
        event.stopPropagation(); // Prevent card click
        const target = event.currentTarget as HTMLElement;
        target.classList.toggle('active');

        if (type === 'cart' && target.classList.contains('active')) {
            const icon = target.querySelector('i');
            if (icon) icon.className = 'fas fa-check';
            setTimeout(() => {
                target.classList.remove('active');
                if (icon) icon.className = 'fas fa-shopping-cart';
            }, 2000);
        }
    }

    viewProduct(p: any) {
        // Map listing data to details format
        const productData = {
            id: p.id,
            name: p.title,
            category: p.category,
            brand: p.brand,
            wholesalePrice: parseFloat(p.price.replace('$', '')),
            sku: p.id, // Mock SKU
            images: [p.image, p.image, p.image] // Mock gallery
        };

        this.router.navigate(['/seller/add-product'], {
            state: {
                product: productData,
                viewOnly: true
            }
        });
    }
}
