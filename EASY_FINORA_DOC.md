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
    - `SupportTicketAppService`: User support & ticket management.
    - `WithdrawAppService`: Payout request processing.

---

## 4. Admin Management (Newly Implemented)
A dedicated Admin Panel is now fully functional for platform governance.

### A. Deposit & Withdrawal Approval
- **Deposit Review**: Admins can view all pending and processed deposit requests at `/approve-deposits`. They can review proof-of-payment receipts and approve to trigger the `WalletManager` (crediting the user's balance).
- **Withdrawal Processing**: Accessible at `/approve-withdrawals`. Admins review user bank details and approve payouts with custom processing remarks.

### B. Support System Management
- **Centralized Helpdesk**: Admins see a comprehensive list of all support tickets at `/approve-support`.
- **Engagement**: Admins can reply directly to user queries using "Admin Remarks".
- **Ticket Lifecycle**: Ability to change status (Open -> Replied -> Closed).

### C. Global Transaction Monitoring
- **Platform Oversight**: View all financial activity across the platform at `/approve-transactions` for audit and security purposes.

### D. Admin Command Center (Dashboard)
- **Real-Time Analytics**: A specialized dashboard for admins (`/admin-dashboard`) displaying platform-wide statistics.
- **Key Metrics**: Monitors Total Users, Pending Processing Requests (Deposits/Withdrawals), and Open Support Tickets.
- **Financial Volume**: Tracks total transaction volume across the entire platform ecosystem.

### E. User Governance (Management)
- **Active User Control**: Admins can view the full list of platform users at `/user-management`.
- **Status Toggle**: Ability to **Activate** or **Deactivate** users instantly to manage platform access and security.
- **Search & Filter**: Find users by Name, Username, or Email for rapid administration.

---

## 5. Security & Authentication Fixes

### A. Transparent User Login
- **Prefix-Less Login**: Users can now log in using their raw email address. The backend `TokenAuthController` was updated with:
    - **Auto-Prefixing**: Automatically attempts login with platform prefixes (e.g., `GP_`) if the tenant context is known.
    - **Global Discovery**: Disables tenant filters to find users by email globally, ensuring a seamless login experience regardless of which platform they are on.
- **Admin Visibility Fix**: Resolved a case-sensitivity issue in the Angular `Sidebar`. The `isAdmin` check now uses `.toLowerCase()` to ensure users like `noshahi@easyfinora.com` always see the Admin Management menu, even if the login email varies in casing.

### B. Tenant & User Isolation
- **Support Tickets**: Fixed a bug where tickets were not properly saving `UserId`. The `SupportTicketAppService` now explicitly links tickets to the `AbpSession` user and auto-fills contact info from the authenticated user profile.

---

## 6. Sidebar Navigation (Access Control)

The sidebar dynamically adjusts based on the logged-in user's role:

| Section | User Menu Items | Admin Menu Items |
| :--- | :--- | :--- |
| **Overview** | Dashboard (Personal) | Dashboard (Personal) |
| **Management** | Deposit, History, Cards | **Admin Dashboard**, **User Management** |
| **Governance** | N/A | **Approve Deposit**, **Approve Withdraw** |
| **Support** | My Tickets, Contact Us | **Support Management** |
| **Audit** | Transactions (Personal) | **Global Transactions** |

---

## 7. Implementation Technical Details
The following backend infrastructure ensures security and cross-platform consistency.

### A. Extended Registration
The `RegisterGlobalPayUser` API accepts **Email**, **Password**, **Country**, and **Phone**, stored as part of the user profile for financial compliance.

### B. Scalable Email Verification
Resolved a critical "User Not Found" issue by implementing **Cross-Tenant Verification**. The `VerifyEmail` method finds users across all tenants, then switches to the correct tenant context for activation.

### C. Unit of Work (UOW) Management
Ensured all logic-heavy Application Service methods (Registration/Verification) are marked as `public virtual` for correct ABP interceptor behavior.

---

## 8. Feature Audit: Admin vs User

| Feature Area | User Capabilities | Admin Capabilities |
| :--- | :--- | :--- |
| **Governance** | N/A | Total Users, Activity Stats, Volume |
| **Users** | Manage personal profile | **Activate / Deactivate any User** |
| **Funding** | Upload proof for manual deposit | Review screenshots & **Approve Funds** |
| **Payouts** | Request bank withdrawal | **Approve / Reject Payouts** |
| **Support** | Open & Track personal tickets | **Reply to & Close any Ticket** |
| **Monitoring** | View personal transaction history | **Audit all platform transactions** |

---

## 8. Roadmap & Missing Features

### Frontend (Missing/Placeholder)
- **Dashboard Analytics**: Most charts on the main dashboard are currently generic visuals. They need integration with `TransactionAppService` for real trend analysis.
- **Profile Edit Functionality**: The "Edit Profile" modal UI exists, but the "Save" action is currently a mock. Needs connection to `CustomerProfileAppService.UpdateAsync`.
- **Business Plan Logic**: Subscription management for business plans is UI-only; requires backend logic for periodic billing.

### Backend (Missing/Enhancements)
- **Real-Time Notifications**: Implementation of SignalR or Email alerts for real-time updates on "Ticket Replied" or "Deposit Approved".
- **Card Spend Simulation**: Endpoints to simulate transactions happening on the virtual cards to test balance deduction logic.

---

*Last Updated: January 23, 2026*
