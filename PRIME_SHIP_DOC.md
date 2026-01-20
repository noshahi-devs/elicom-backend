# Prime Ship: Wholesale Warehouse & Fulfillment

This document describes the Prime Ship platform, the wholesale heart of the Elicom ecosystem.

### User Isolation (Tenant 2)
Prime Ship operates within **Tenant ID 2**. It isolates wholesale orders, inventory management, and supplier relationships.

- **Internal Username**: Automatically prefixed with `PS_` (e.g., `PS_user@example.com`).
- **User Branding**: Users see their standard email as their "Username".
- **Cross-Platform Access**: A user can be a Reseller on Prime Ship (Tenant 2) and a Seller on Smart Store (Tenant 1) simultaneously with the same email.

---

## 1. SMTP & Communication
Prime Ship uses the default system SMTP configuration.

- **Host**: `primeshipuk.com`
- **Sender**: `no-reply@primeshipuk.com`
- **Branding**: Primary corporate blue/red branding used for order updates and verification.

---

## 2. Core Operational Flows

### A. Wholesale Purchasing
1. **Catalog**: Resellers browse products uploaded by the Warehouse Admin.
2. **Checkout**: Payment is deducted from the user's Global Pay (Tenant 3) wallet.
3. **Fulfillment**: Warehouse Admin updates status from `Purchased` -> `Processing` -> `Shipped` -> `Delivered`.

### B. Smart Store Integration
- **Reference Codes**: Every wholesale order generates a code (e.g., `WHOLE-XXXX`).
- **Linking**: This code is pasted into Smart Store orders to bridge the retail and wholesale workflows.

---

## 3. Account Management
- **Verification**: New users receive a verification email that redirects to `/primeship/login`.
- **Roles**: Distinct roles for `Admin` (Warehouse Manager) and `Reseller` (Inventory Buyer).
