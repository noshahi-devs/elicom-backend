# Smart Store: E-Commerce & Marketplace Platform

This document describes the **Smart Store** platform, the primary e-commerce engine for the Elicom ecosystem.

## Project Overview
**Smart Store** is a multi-vendor marketplace where resellers can set up their storefronts and buyers can purchase products.

### User Isolation (Tenant 1)
Smart Store operates within **Tenant ID 1**.
- **Internal Username Prefix**: `SS_`
- **Roles**:
    - **Reseller**: Can manage products and storefronts.
    - **Buyer**: Can purchase products and track orders.

---

## 1. Implementation Details
The registration flow has been standardized across the Elicom ecosystem.

### A. Extended Registration
The registration APIs (`RegisterSmartStoreSeller`, `RegisterSmartStoreCustomer`) now accept:
- **Email Address**: Primary identifier.
- **Password**: Securely hashed.
- **Country & Phone**: For regional processing and shipping.

### B. Verification Logic
- **Cross-Tenant Verification**: Users can verify their email via the global `VerifyEmail` endpoint.
- **Unit of Work**: Methods are `virtual` to ensure proper ABP framework interception.
- **Default Redirection**: Users are redirected to the Smart Store login page after verification.

---

## 2. SMTP Configuration
- **Host**: `primeshipuk.com`
- **Port**: `465` (SSL)
- **Sender**: `worldcart@primeshipuk.com`
- **Branding**: Uses Smart Store gold/orange branding (`#ff9900`).

---

*Last Updated: January 21, 2026*
