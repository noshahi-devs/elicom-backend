# Global Pay: Financial Core & Wallet Management

This document describes the Global Pay platform, which serves as the financial engine for the Elicom ecosystem.

### User Isolation (Tenant 3)
Global Pay operates within **Tenant ID 3**. This ensures that financial data, card balances, and deposit requests are completely isolated from other platforms.

- **Internal Username**: Automatically prefixed with `GP_` (e.g., `GP_user@example.com`).
- **User Branding**: Users see their standard email as their "Username" in all communications.
- **Identity Integrity**: Allows a user to have a dedicated Global Pay wallet even if they are already registered as a Seller on Smart Store.

---

## 1. SMTP & Communication
Global Pay uses a dedicated financial-grade SMTP configuration to ensure trust and brand consistency.

- **Host**: `easyfinora.com`
- **Port**: `465` (SSL)
- **Sender**: `no-reply@easyfinora.com`
- **Branding**: All emails are sent with "Global Pay" branding and green color accents (`#28a745`).

---

## 2. Core Functional Flows

### A. Manual Funding (Card Loading)
1. **Request**: User requests a deposit by selecting a country and entering an amount.
2. **Proof**: User uploads a payment screenshot.
3. **Approval**: Admin reviews and approves the request in the Tenant 3 dashboard.
4. **Credit**: The `WalletManager` credits the specified amount to the user's Global Pay balance.

### B. Withdrawal & Payouts
- Future implementation for resellers to withdraw their Smart Store profits settled into their Global Pay wallet.

---

## 3. Account Management
- **Verification**: New users must verify their email via a link that redirects to `/globalpay/login`.
- **Password Recovery**: Secure token-based reset flow dedicated to Tenant 3 users.
