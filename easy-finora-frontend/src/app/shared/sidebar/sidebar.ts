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
        { label: 'Admin Dashboard', icon: '🏛️', route: '/admin-dashboard' },
        { label: 'Approve Deposit', icon: '✅', route: '/approve-deposits' },
        { label: 'Approve Withdraw', icon: '🏧', route: '/approve-withdrawals' },
        { label: 'Global Transaction', icon: '📈', route: '/approve-transactions' },
        { label: 'User Management', icon: '👥', route: '/user-management' },
        { label: 'Support Management', icon: '🛠️', route: '/approve-support' },
        { label: 'Approve Cards', icon: '💳', route: '/approve-cards' },
        { label: 'Logout', icon: '🚪', route: '/auth' }
      ],
      isAdminOnly: true
    },
    {
      title: 'Exit',
      expanded: false,
      items: [
        { label: 'Logout', icon: '🚪', route: '/auth' }
      ],
      isAdminOnly: false // keep it for normal users too
    }
  ];

  get isAdmin(): boolean {
    const email = localStorage.getItem('userEmail')?.toLowerCase().trim();
    const adminEmails = ['noshahi@easyfinora.com', 'noshahi@finora.com', 'admin@defaulttenant.com', 'gp_noshahi@easyfinora.com', 'admin'];

    // Check for Admin role in stored roles
    const rolesJson = localStorage.getItem('userRoles');
    let hasAdminRole = false;
    if (rolesJson) {
      try {
        const roles = JSON.parse(rolesJson);
        hasAdminRole = Array.isArray(roles) && roles.some(r => r.toLowerCase() === 'admin');
      } catch (e) { }
    }

    const isAdm = adminEmails.includes(email || '') || hasAdminRole;
    console.log('Sidebar Admin Check:', { email, hasAdminRole, isAdm });
    return isAdm;
  }

  get filteredMenuSections() {
    console.log('Filtering Menu Sections, isAdmin:', this.isAdmin);
    if (this.isAdmin) {
      // Admins see everything
      return this.menuSections;
    }
    // Users see everything except Admin sections
    return this.menuSections.filter(section => !section['isAdminOnly']);
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
