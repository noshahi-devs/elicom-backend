import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LoginComponent } from './login.component';
import { RegisterComponent } from './register.component';
import { ForgotPasswordComponent } from './forgot-password.component';

@Component({
    selector: 'app-auth-layout',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="auth-layout">
      <router-outlet></router-outlet>
    </div>
  `,
    styles: [`
    .auth-layout {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `]
})
export class AuthLayoutComponent { }
