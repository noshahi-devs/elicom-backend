import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-upgrade-plan',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './upgrade-plan.component.html',
    styleUrl: './upgrade-plan.component.scss'
})
export class UpgradePlan {
    plans = [
        {
            name: 'Basic',
            price: '8.99',
            colorClass: 'basic',
            icon: '📋',
            benefits: [
                'Enhanced Security',
                'Masked Bank Details',
                'Zero Hidden Costs'
            ]
        },
        {
            name: 'Standard',
            price: '13.99',
            colorClass: 'standard',
            icon: '🤝',
            benefits: [
                'Global Online Acceptance',
                'Works Worldwide',
                'Supplier Payments'
            ]
        },
        {
            name: 'Premium',
            price: '23.99',
            colorClass: 'premium',
            icon: '💰',
            benefits: [
                'Cost-Effective',
                'Eco-Friendly Plastic-Free',
                'Priority 24/7 Support'
            ]
        }
    ];
}
