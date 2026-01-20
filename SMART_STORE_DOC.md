# Smart Store: Public Marketplace & Reseller Platform

This document describes the Smart Store platform within the unified ecosystem, focusing on user roles, user isolation, registration workflows, and store management.

### User Isolation (Tenant 1)
Smart Store operates within **Tenant ID 1**. To ensure Smart Store users are treated as entirely new entities even if they have an account on Prime Ship or Global Pay:
- **Internal Username**: Automatically prefixed with `SS_` (e.g., `SS_user@example.com`).
- **User Branding**: In all emails and UI, the user only sees their email as the "Username". The `SS_` prefix is strictly a backend isolation helper.
- **Email**: The actual email remains unchanged for communication.
- **Isolation**: This approach allows the same email to have separate wallets, passwords, and roles specifically for the Smart Store platform.

---

## 1. Multi-User Ecosystem
Smart Store is designed as a triangular marketplace with three distinct roles:

### A. Customer (Buyer)
- **Role**: Standard consumer who browses the marketplace and purchases products.
- **Permissions**: `Pages.SmartStore` (Public/Cart/Checkout).
- **Core Entity**: Linked to the `Buyer` role.

### B. Seller (Reseller)
- **Role**: Entrepreneur who lists products from Prime Ship UK and manages their own virtual storefront.
- **Permissions**: `Pages.SmartStore.Seller`.
- **Core Entity**: Linked to the `Reseller` role.
- **Key Action**: Creating and managing a personal `Store`.

### C. Admin (Platform Owner)
- **Role**: Oversees all stores, products, and settlements.
- **Permissions**: `Pages.GlobalPay.Admin` / `Pages.SmartStore.Admin`.

---

## 2. Smart Store Registration & Onboarding
Onboarding for Smart Store users is separate from Prime Ship and uses platform-specific communication.

### A. SMTP Identity
- **Host**: `smartsellerusa.com`
- **Identity**: All emails are sent from `no-reply@smartsellerusa.com` with the display name **"Smart Store"**.
- **Security**: Mandatory SSL (Port 465) for all communications.

### B. Registration Flow (Seller & Customer)
1. **Endpoint**: `POST /api/services/app/Account/RegisterSmartStoreSeller` or `RegisterSmartStoreCustomer`.
2. **Initial State**:
   - `IsActive = false`
   - `IsEmailConfirmed = false`
   - Default Password: `Noshahi.000`
3. **Verification**: A professional "Smart Store" branded email is sent with a unique activation token.
4. **Verification Redirect**: Upon successful email confirmation, the user is automatically redirected to the **Smart Store Login Page** (`/smartstore/login`).

---

## 3. Store Creation (Post-Login)
Once a Seller (Reseller) is verified and logged in, they can initialize their storefront.

### A. Store Parameters
- **Name**: The display name of the store.
- **Slug**: used for the public URL (e.g., `smartstore.com/s/my-store`).
- **OwnerId**: Automatically linked to the authenticated Seller's `UserId`.

### B. Store Management
- Sellers can add products from the **Prime Ship Warehouse** to their store.
- Sellers set their own **Retail Price** (within the boundaries defined by the Prime Ship Admin).

---

## 4. Operational Isolation
Smart Store operates as a distinct brand. 
- All communication (Verification, Password Reset) uses the `smartsellerusa.com` domain.
- The UI/UX is tailored for a retail experience, separate from the wholesale nature of Prime Ship.

---

## 5. Maintenance & Logs
- **SMTP Logs**: Failures in sending Smart Store emails are logged in the backend with specific "Smart Store" identifiers.
- **Role Management**: The system automatically assigns `Buyer` or `Reseller` roles during registration to ensure immediate access to appropriate endpoints.
