import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
    const router = inject(Router);
    const token = localStorage.getItem('authToken');

    if (token) {
        return true;
    } else {
        router.navigate(['/auth']);
        return false;
    }
};
