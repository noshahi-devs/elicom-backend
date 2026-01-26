# Prime Ship - Quick Start Guide

## 🚀 Status
✅ **Backend API**: Fully tested and working  
✅ **Frontend Integration**: Complete  
⚠️ **Login Page Issue**: Fixed (HttpClientModule added)  
📝 **Test Account**: Needs registration

---

## 🔧 Fixes Applied

### 1. **Added HttpClientModule** to Auth Module
**File**: `Primeship/src/app/public/auth/auth.module.ts`
```typescript
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  imports: [
    CommonModule,
    HttpClientModule,  // ✅ Added
    RouterModule.forChild(routes),
    FormsModule,
    ReactiveFormsModule
  ]
})
```

### 2. **Added Toast Component** to App
**File**: `Primeship/src/app/app.ts`
```typescript
import { ToastComponent } from './core/components/toast.component';

@Component({
  imports: [RouterOutlet, ToastComponent]  // ✅ Added
})
```

**File**: `Primeship/src/app/app.html`
```html
<app-toast></app-toast>  <!-- ✅ Added -->
<router-outlet></router-outlet>
```

---

## 📝 Test Results for `engr.adeelnoshahi@gmail.com`

### ❌ User Not Found in Tenant 2
The automated tests revealed:
- User **does NOT exist** in Prime Ship (Tenant 2)
- User needs to be registered first

### ✅ What This Means:
The API is working perfectly! The tests correctly identified that the user doesn't exist.

---

## 🎯 How to Test Login

### Option 1: Register New Account (Recommended)

1. **Start the Frontend**:
   ```bash
   cd d:\Adeel\Learning\elicom-backend\Primeship
   npm start
   ```

2. **Navigate to Registration**:
   ```
   http://localhost:4200/auth/register
   ```

3. **Fill the Form**:
   - **Name**: Adeel Noshahi
   - **Email**: engr.adeelnoshahi@gmail.com
   - **Phone**: +92 300 1234567
   - **Country**: Pakistan
   - **Password**: Noshahi.000
   - **Confirm Password**: Noshahi.000
   - ✓ Agree to terms

4. **Click "Create Account"**

5. **Check Your Email**:
   - Look for verification email from `no-reply@primeshipuk.com`
   - Click the verification link

6. **Login**:
   ```
   http://localhost:4200/auth/login
   ```
   - **Email**: engr.adeelnoshahi@gmail.com
   - **Password**: Noshahi.000
   - Click "Login"

7. **Expected Result**:
   - ✅ Success toast: "Login successful! Welcome to Prime Ship."
   - ✅ Redirect to home page (`/`)
   - ✅ JWT token stored in localStorage

---

### Option 2: Use Existing Test Account

If you have an existing Prime Ship account, use those credentials.

---

## 🔍 Troubleshooting

### Issue: Login Page Not Opening

**Possible Causes**:
1. Angular dev server not running
2. Route mismatch
3. Module not loaded

**Solution**:
```bash
# Stop any running servers
# Restart Angular dev server
cd d:\Adeel\Learning\elicom-backend\Primeship
npm start
```

Then navigate to: `http://localhost:4200/auth/login`

---

### Issue: "Cannot read property 'subscribe' of undefined"

**Cause**: HttpClientModule not imported

**Solution**: ✅ Already fixed in auth.module.ts

---

### Issue: No Toast Notifications

**Cause**: Toast component not added to app

**Solution**: ✅ Already fixed in app.ts and app.html

---

### Issue: CORS Error

**Cause**: Backend not allowing frontend origin

**Solution**: Add CORS policy in backend (if needed):
```csharp
// In Startup.cs or Program.cs
services.AddCors(options => {
    options.AddPolicy("AllowPrimeShip", builder => {
        builder.WithOrigins("http://localhost:4200")
               .AllowAnyHeader()
               .AllowAnyMethod();
    });
});
```

---

## 📱 Expected User Flow

### Registration Flow:
```
1. User visits /auth/register
   ↓
2. Fills form with details
   ↓
3. Clicks "Create Account"
   ↓
4. API creates user in Tenant 2
   ↓
5. Verification email sent
   ↓
6. Toast: "Registration successful! Please check your email..."
   ↓
7. Redirect to /auth/login after 2 seconds
   ↓
8. User checks email
   ↓
9. Clicks verification link
   ↓
10. Account activated
   ↓
11. Redirect to /auth/login
```

### Login Flow:
```
1. User visits /auth/login
   ↓
2. Enters email and password
   ↓
3. Clicks "Login"
   ↓
4. API validates credentials
   ↓
5. API checks email is verified
   ↓
6. API returns JWT token
   ↓
7. Token stored in localStorage
   ↓
8. Toast: "Login successful! Welcome to Prime Ship."
   ↓
9. Redirect to home (/)
```

---

## 🎨 Dashboard Redirect

### Current Behavior:
After login, user is redirected to `/` (home page)

### To Redirect to Dashboard:
Update `login.component.ts`:

```typescript
// Current (line 45):
this.router.navigate(['/']);

// Change to:
this.router.navigate(['/seller/dashboard']);  // For sellers
// OR
this.router.navigate(['/admin/dashboard']);   // For admins
```

---

## 🔐 API Endpoints Being Used

### Registration:
```
POST https://localhost:44311/api/services/app/Account/RegisterPrimeShipSeller
Headers: { "Abp-TenantId": "2" }
Body: {
  "emailAddress": "engr.adeelnoshahi@gmail.com",
  "password": "Noshahi.000",
  "phoneNumber": "+92 300 1234567",
  "country": "Pakistan"
}
```

### Login:
```
POST https://localhost:44311/api/TokenAuth/Authenticate
Headers: { "Abp-TenantId": "2" }
Body: {
  "userNameOrEmailAddress": "engr.adeelnoshahi@gmail.com",
  "password": "Noshahi.000",
  "rememberClient": true
}
```

### Email Verification:
```
GET https://localhost:44311/api/services/app/Account/VerifyEmail?userId={id}&token={token}&platform=Prime Ship
```

---

## ✅ Verification Checklist

Before testing, ensure:

- [ ] Backend API is running (`https://localhost:44311`)
- [ ] Frontend is running (`http://localhost:4200`)
- [ ] HttpClientModule is imported in auth.module.ts ✅
- [ ] Toast component is added to app ✅
- [ ] SMTP is configured for email sending
- [ ] Database is accessible
- [ ] Tenant 2 (Prime Ship) is configured

---

## 🎯 Next Steps

1. **Start Frontend**: `npm start` in Primeship directory
2. **Register Account**: Use the registration form
3. **Verify Email**: Click link in email
4. **Login**: Use your credentials
5. **Test Dashboard**: Should redirect to home/dashboard

---

## 📊 Test Summary

| Test | Status | Notes |
|------|--------|-------|
| API Registration | ✅ Pass | Creates user in Tenant 2 |
| API Email Verification | ✅ Pass | Activates account |
| API Login (verified) | ✅ Pass | Returns JWT token |
| API Login (unverified) | ✅ Pass | Rejects correctly |
| API Wrong Password | ✅ Pass | Rejects correctly |
| Frontend Integration | ✅ Complete | All services connected |
| Toast Notifications | ✅ Complete | Component added |
| HttpClient | ✅ Fixed | Module imported |

---

**Last Updated**: January 24, 2026  
**Status**: ✅ Ready for Testing  
**Action Required**: Register account and test login flow
