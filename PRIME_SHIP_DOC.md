# Prime Ship: Logistics & Dropshipping Platform

This document describes the **Prime Ship** platform, the logistics and shipping engine for the Elicom ecosystem.

## Project Overview
**Prime Ship** connects suppliers with dropshippers, handling inventory management and order fulfillment.

### User Isolation (Tenant 2)
Prime Ship operates within **Tenant ID 2**.
- **Internal Username Prefix**: `PS_`
- **Roles**:
    - **Supplier**: Can list products and fulfill orders.
    - **Reseller**: Can source products for their stores.

---

## 1. Implementation Details
The registration flow has been standardized across the Elicom ecosystem.

### A. Extended Registration
The registration APIs (`RegisterPrimeShipSeller`, `RegisterPrimeShipCustomer`) now accept:
- **Email Address**: Primary identifier.
- **Password**: Securely hashed.
- **Country & Phone**: For shipping coordination and contact.

### B. Verification Logic
- **Cross-Tenant Verification**: Users can verify their email via the global `VerifyEmail` endpoint.
- **Unit of Work**: Methods are `virtual` to ensure proper ABP framework interception.
- **Default Redirection**: Users are redirected to the Prime Ship login page after verification.

---

## 2. SMTP Configuration
- **Host**: `primeshipuk.com`
- **Port**: `465` (SSL)
- **Sender**: `no-reply@primeshipuk.com`
- **Branding**: Uses Prime Ship blue branding (`#007bff`).

---

*Last Updated: January 21, 2026*
