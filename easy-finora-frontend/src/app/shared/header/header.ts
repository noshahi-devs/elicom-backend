import { CommonModule } from '@angular/common';
import { Component, signal, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: true, // <-- this makes it standalone
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrls: ['./header.scss']
})
export class Header {
  userDropdown = signal(false);
  cartDropdown = signal(false);
  globeDropdown = signal(false);

  @ViewChild('navbar', { static: true })
  navbar!: ElementRef<HTMLElement>;

  scrollAmount = 200;

  scrollLeft() {
    const navbar = document.querySelector('.elicom-navbar');
    if (navbar) navbar.scrollBy({ left: -200, behavior: 'smooth' });
  }

  scrollRight() {
    const navbar = document.querySelector('.elicom-navbar');
    if (navbar) navbar.scrollBy({ left: 200, behavior: 'smooth' });
  }

}
