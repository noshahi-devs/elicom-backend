import { Component } from '@angular/core';
import { NgFor } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [NgFor, RouterLink],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {

  menuSections = [
    {
      title: 'Overview',
      items: [
        { label: 'Dashboard', icon: '📊', route: '/dashboard' }
      ]
    },
    {
      title: 'My Cards',
      items: [
        { label: 'All Debit Cards', icon: '💳', route: '/cards' }
      ]
    },
    {
      title: 'Account Statement',
      items: [
        { label: 'Transactions', icon: '📝', route: '/transactions' }
      ]
    },
    {
      title: 'Send & Receive',
      items: [
        { label: 'Transfer Money', icon: '💸', route: '/transfer' }
      ]
    },
    {
      title: 'Deposit Management',
      items: [
        { label: 'Deposit', icon: '⬇️', route: '/deposit' },
        { label: 'Deposit Method', icon: '🏦', route: '/deposit-methods' },
        { label: 'All Deposit History', icon: '📋', route: '/deposit-history' }
      ]
    },
    {
      title: 'Open Business',
      items: [
        { label: 'Business Plans', icon: '💼', route: '/business-plans' }
      ]
    },
    {
      title: 'Topup and Withdraw',
      items: [
        { label: 'Withdraw', icon: '⬆️', route: '/withdraw' },
        { label: 'Withdraw Method', icon: '🏧', route: '/withdraw-methods' },
        { label: 'All Withdraw', icon: '📜', route: '/withdraw-history' }
      ]
    },
    {
      title: 'Support Center',
      items: [
        { label: 'User Tickets', icon: '🎫', route: '/tickets' },
        { label: 'Contact Us', icon: '📧', route: '/contact' }
      ]
    },
    {
      title: 'Exit',
      items: [
        { label: 'Logout', icon: '🚪', route: '/logout' }
      ]
    }
  ];

}
