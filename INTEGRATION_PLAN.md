# Backend Integration Plan

## Objective
Seamlessly integrate the Angular Frontend with the .NET Core (ABP) Backend, enabling a complete user lifecycle: Registration with Email Verification, Authentication, and Dashboard interactions.

## 1. Backend Modifications
The existing backend uses ABP Framework's user management.
- **Current State**: `AccountAppService.Register` sets `IsEmailConfirmed = true`.
- **Target State**: `Register` should require email verification.

### Tasks
- [ ] **Modify `AccountAppService.cs`**
    - [ ] Update `Register` method signature/logic.
    - [ ] Set `isEmailConfirmed` to `false`.
    - [ ] Generate Email Token: `await _userManager.GenerateEmailConfirmationTokenAsync(user)`.
    - [ ] Send Email: Implement `SendEmailWithCustomSmtp` logic within `Register` or extract to a helper service.
- [ ] **Verify `RegisterInput` Model**: Ensure it accepts `Name` and `Surname` separately.

## 2. Frontend Integration (Angular)

### Authentication Service (`src/app/core/services/auth.service.ts`)
Create a central service to handle API calls.
- [ ] `register(user: any)`: POST `/api/services/app/Account/Register`
- [ ] `login(credentials: any)`: POST `/api/TokenAuth/Authenticate`
- [ ] `forgotPassword(email: string)`: POST `/api/services/app/Account/ForgotPassword`
- [ ] `getUserProfile()`: GET `/api/services/app/User/Get` (or equivalent)

### Auth Component (`auth.ts`)
- [ ] **Signup**:
    - Split `signupName` into `Name` and `Surname` (e.g., split by space).
    - Call `AuthService.register`.
    - On success: Show message "Please verify your email". Do NOT auto-login.
- [ ] **Login**:
    - Call `AuthService.login`.
    - On success: Save `accessToken` to `localStorage`.
    - Redirect to `/dashboard`.
- [ ] **Forgot Password**:
    - Call `AuthService.forgotPassword`.
    - Show success message.

### Profile Component (`profile.ts`)
- [ ] Fetch user data on init using `AuthService.getUserProfile`.
- [ ] Populate fields (Name, Email, etc.).

## 3. Endpoints Reference
| Feature | Method | Endpoint | Note |
| :--- | :--- | :--- | :--- |
| **Register** | POST | `/api/services/app/Account/Register` | Modify backend to force email verify |
| **Login** | POST | `/api/TokenAuth/Authenticate` | Returns JWT Token |
| **Verify Email** | GET | `/api/services/app/Account/VerifyEmail` | Existing, confirm integration |
| **Forgot Pass** | POST | `/api/services/app/Account/ForgotPassword` | Sends reset link |
| **Reset Pass** | POST | `/api/services/app/Account/ResetPassword` | Actual reset action |

## 4. Execution Order
1.  **Backend**: Fix `Register` email verification logic.
2.  **Frontend Service**: Create `AuthService`.
3.  **Frontend Auth**: Wire up forms to `AuthService`.
4.  **Frontend Profile**: Wire up profile data fetch.
