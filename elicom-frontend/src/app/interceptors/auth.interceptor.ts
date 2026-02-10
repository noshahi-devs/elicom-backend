import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const token = localStorage.getItem('authToken');

    // List of public endpoints that should NOT have the auth token attached
    const publicEndpoints = [
        '/api/TokenAuth/Authenticate',
        '/api/services/app/Account/Register',
        '/api/services/app/Account/RegisterSmartStoreCustomer',
        '/api/services/app/Account/ForgotPassword',
        '/api/services/app/Account/ResetPassword'
    ];

    // Check if the request URL matches any public endpoint
    const isPublic = publicEndpoints.some(url => req.url.includes(url));

    if (token && !isPublic) {
        const isPrimeShip = window.location.pathname.includes('primeship');
        const tenantId = isPrimeShip ? '2' : '1';

        const cloned = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`,
                'Abp-TenantId': tenantId
            }
        });
        return next(cloned);
    }

    return next(req);
};
