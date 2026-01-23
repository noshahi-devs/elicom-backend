import { Component } from '@angular/core';
import { NgFor } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [NgFor, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {

  menuSections = [
    {
      title: 'Overview',
      expanded: true,
      items: [
        { label: 'Dashboard', icon: '📊', route: '/dashboard' }
      ]
    },
    {
      title: 'My Cards',
      expanded: false,
      items: [
        { label: 'All Debit Cards', icon: '💳', route: '/cards' }
      ]
    },
    {
      title: 'Account Statement',
      expanded: false,
      items: [
        { label: 'Transactions', icon: '📝', route: '/transactions' }
      ]
    },
    {
      title: 'Send & Receive',
      expanded: false,
      items: [
        { label: 'Transfer Money', icon: '💸', route: '/transfer' }
      ]
    },
    {
      title: 'Deposit Management',
      expanded: false,
      items: [
        { label: 'Deposit', icon: '⬇️', route: '/deposit' },
        { label: 'Deposit Method', icon: '🏦', route: '/deposit-methods' },
        { label: 'All Deposit History', icon: '📋', route: '/deposit-history' }
      ]
    },
    {
      title: 'Open Business',
      expanded: false,
      items: [
        { label: 'Business Plans', icon: '💼', route: '/business-plans' }
      ]
    },
    {
      title: 'Topup and Withdraw',
      expanded: false,
      items: [
        { label: 'Withdraw', icon: '⬆️', route: '/withdraw' },
        { label: 'Withdraw Method', icon: '🏧', route: '/withdraw-methods' },
        { label: 'All Withdraw', icon: '📜', route: '/withdraw-history' }
      ]
    },
    {
      title: 'Support Center',
      expanded: false,
      items: [
        { label: 'User Tickets', icon: '🎫', route: '/tickets' },
        { label: 'Contact Us', icon: '📧', route: '/contact' }
      ]
    },
    {
      title: 'Admin Management',
      expanded: true,
      items: [
        { label: 'Approve Deposit Request', icon: '✅', route: '/approve-deposits' },
        { label: 'Approve Withdraw Request', icon: '🏧', route: '/approve-withdrawals' },
        { label: 'Support Management', icon: '🛠️', route: '/approve-support' },
        { label: 'Global Transactions', icon: '📈', route: '/approve-transactions' }
      ],
      isAdminOnly: true
    },
    {
      title: 'Exit',
      expanded: false,
      items: [
        { label: 'Logout', icon: '🚪', route: '/auth' }
      ]
    }
  ];

  get isAdmin(): boolean {
    const email = localStorage.getItem('userEmail');
    return email === 'noshahi@easyfinora.com';
  }

  get filteredMenuSections() {
    return this.menuSections.filter(section => !section['isAdminOnly'] || this.isAdmin);
  }

  toggleSection(index: number) {
    this.menuSections.forEach((section, i) => {
      if (i === index) {
        section.expanded = !section.expanded;
      } else {
        section.expanded = false;
      }
    });
  }

}
