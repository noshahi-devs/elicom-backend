# Easy Finora: Financial Core & Wallet Management
*(Formerly Global Pay)*

This document describes the **Easy Finora** platform, which serves as the financial engine and wallet management system for the Elicom ecosystem.

## Project Overview
**Easy Finora** is a modern, high-performance financial dashboard built with **Angular (Frontend)** and **.NET Core ABP (Backend)**. It provides users with a complete suite of banking-like features including deposits, withdrawals, transfers, and card management.

### User Isolation (Tenant 3)
Easy Finora operates within **Tenant ID 3**. This ensures that financial data, card balances, and deposit requests are completely isolated from other platforms (Smart Store, Prime Ship).

- **Internal Username**: Automatically prefixed with `GP_` (legacy prefix) or user-specific identifier.
- **User Branding**: Users see their standard email as their "Username" in all communications.
- **Identity Integrity**: Allows a user to have a dedicated financial wallet even if they are already registered on other platforms.

---

## 1. UI & Design System
The platform features a **"Pro 3D" Green Theme** designed for a premium, trustworthy financial experience.
- **Framework**: Angular 19+ (Standalone Components).
- **Styling**: SCSS with "Claymorphism" (soft 3D shadows), Glassmorphism, and Pill-shaped interactive elements.
- **Key Visuals**:
  - **Sidebar**: Floating 3D menu items with green glow on active state.
  - **Dashboard**: 3D cards for Balance and Statistics.
  - **Auth**: Split-screen design with country flags and animated backgrounds.

---

## 2. Core Functional Flows (Frontend Completed)

### A. Authentication
- **Login**: Secure login with "Remember Me" and "Forgot Password".
- **Signup**: Detailed registration including:
    - Full Name (First + Last)
    - Email & Phone Validation
    - **Country Selection** (with real Flag indicators)
    - Password Strength Meters
- **Profile**: Editable user profile to update personal details.

### B. Dashboard
- **Overview**: Real-time view of "Available Balance", "Total Deposits", and "Active Cards".
- **Recent Activity**: Quick view of latest 5 transactions.
- **Quick Actions**: One-click access to Transfer, Deposit, Withdraw, and Apply for Card.

### C. Manual Funding (Deposit)
1. **Selection**: User selects Country and Bank (P2P method).
2. **Payment**: User transfers funds to the displayed Admin Bank Account.
3. **Proof**: User uploads a payment screenshot (Proof of Payment).
4. **Approval**: Admin reviews transaction in Backend; `WalletManager` credits the balance.

### D. Transaction Management
- **Transactions Page**: Full history of Deposits, Withdrawals, Transfers, and **Card Payments**.
- **Filtering**: Filter by type (Deposit, Withdrawal, Transfer, Card).
- **Status Tracking**: Visual badges for Completed, Pending, and Rejected status.

### E. Card Management
- **My Cards**: View active virtual/physical cards.
- **Apply Card**: UI to request new cards (Standard/Premium/Gold).

### F. Transfer & Withdraw
- **P2P Transfer**: Send money to other Easy Finora users via email.
- **Withdrawal**: Request payouts to external bank accounts.

---

## 3. Backend Integration (Completed)
The frontend is fully connected to the **.NET Core (ABP)** backend for core flows.
- **API Base**: `/api/services/app/`
- **Key Services**:
    - `AccountAppService`: Registration (with Email Verify), Login, Password Reset.
    - `WalletAppService`: Balance, Transactions.
    - `CardAppService`: Card issuance and management.

---

## 5. Implementation Technical Details
The following backend infrastructure was implemented to ensure security and cross-platform consistency.

### A. Extended Registration
The `RegisterGlobalPayUser` API was extended to accept:
- **Email Address**: Used as the primary login.
- **Password**: Hashed and stored securely.
- **Country & Phone**: Stored as part of the user profile for financial compliance.

### B. Scalable Email Verification
Resolved a critical "User Not Found" issue by implementing **Cross-Tenant Verification**:
- **Problem**: Verification links are clicked without a tenant context (Host context), making it impossible to find users in Tenant 3.
- **Solution**: The `VerifyEmail` method now uses `DisableFilter(AbpDataFilters.MayHaveTenant)` to find the user across all tenants, then switches to the user's specific tenant context for secure token activation.

### C. Unit of Work (UOW) Management
Resolved Recurring 500 errors by ensuring:
- **Virtual Methods**: All logic-heavy Application Service methods (Registration/Verification) are marked as `public virtual`. This allows the ABP framework to intercept calls and correctly inject the `UnitOfWork` and `Session` metadata.

### D. Static Tenant Infrastructure
To prevent runtime configuration errors and "Null Tenant" bugs:
- **Explicit Seeding**: Tenants are seeded into the database with fixed IDs:
    - **Tenant 1**: Smart Store
    - **Tenant 2**: Prime Ship
    - **Tenant 3**: Easy Finora (Global Pay)
- **Default Fallback**: `UserRegistrationManager` defaults to **Tenant 1** if no context is provided, ensuring the application never crashes due to a "Host User" attempt.

---

*Last Updated: January 21, 2026*
