import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { NgIf } from '@angular/common';
import { Header } from './shared/header/header';
import { Footer } from './shared/footer/footer';
import { Sidebar } from './shared/sidebar/sidebar';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NgIf, Header, Sidebar, Footer],
  templateUrl: './app.html',
})
export class App {

  private router = inject(Router);

  get showHeaderFooter(): boolean {
    const url = this.router.url;

    return !(
      url.startsWith('/add-to-cart') ||
      url.startsWith('/checkout')
    );
  }
}
