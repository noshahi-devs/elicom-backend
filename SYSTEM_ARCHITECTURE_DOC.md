# Elicom Ecosystem: Unified Backend Specification

This document provides a comprehensive technical and functional overview of the three-platform ecosystem managed by a single backend.

---

## 1. Core Architecture
- **Unified Identity**: One `UserId` across all platforms (based on Email).
- **Platform Separation**: Strictly enforced by `SourcePlatform` identifiers and scoped permissions (`Pages.GlobalPay`, `Pages.PrimeShip`, `Pages.SmartStore`).
- **Financial Core**: A centralized **Wallet & Escrow System** that handles all currency movements.

---

## 2. Platform 1: GlobalPayUK (The Financial Engine)
**Role**: Managing money, card funding, and manual approvals.

### A. Manual Funding Flow (GlobalPayUK Card)
1. **User Action**: Enters Amount and selects Country (e.g., UK).
2. **System Response**: Displays the designated bank account (e.g., Barclays Bank).
3. **User Action**: Uploads a screenshot (SS) as proof of payment.
4. **Endpoint**: `POST /api/services/app/DepositRequest/Create`
5. **Status**: Set to `Pending`.

### B. Admin Approval Workflow
1. **Admin Action**: Views all pending requests in the Admin Dashboard.
2. **Endpoint**: `GET /api/services/app/DepositRequest/GetAllRequests`
3. **Admin Action**: Clicks "Approve" (with Optional Remarks) or "Reject" (with Required Reason).
4. **Approval Endpoint**: `POST /api/services/app/DepositRequest/Approve`
5. **Result**: System triggers `WalletManager.DepositAsync`, immediately updating the user's GlobalPay balance.

---

## 3. Platform 2: Prime Ship UK (The Wholesale Warehouse)
**Role**: Sourcing products, wholesale pricing, and warehousing fulfillment.

### A. Admin Catalog Management
1. **Role**: Admin (Warehouse Owner) creates products.
2. **Key Data**: `SupplierPrice` (Base price) and `ResellerMaxPrice` (Maximum allowable retail price).
3. **Storage**: Entities are tagged with `SourcePlatform = "PrimeShip"`.

### B. Wholesale Purchase Flow (Upfront)
1. **User Role**: Reseller (Seller).
2. **Action**: Selects products and specifies a **Smart Store customer's** shipping address.
3. **Payment**: Funds are deducted **instantly** from the GlobalPay wallet balance.
4. **Wholesale Order Creation**:
    - **Endpoint**: `POST /api/services/app/Wholesale/PlaceWholesaleOrder`
    - **Result**: Generates a `ReferenceCode` (e.g., `WHOLE-XXXX`).
    - **Status**: `Purchased`.

---

## 4. Platform 3: Smart Store (The Seller Marketplace)
**Role**: Customer-facing marketplace where resellers sell warehouse products.

### A. Public Marketplace View
1. **Role**: Anyone (Unauthenticated).
2. **Logic**: Aggregates all `StoreProducts` that are active and belong to active stores.
3. **Endpoint**: `GET /api/services/app/SmartStorePublic/GetGlobalMarketplaceProducts`

### B. Seller Product Mapping
1. **Role**: Reseller.
2. **Action**: Finds a product in the Prime Ship marketplace and clicks "Add to Store".
3. **Logic**: Creates a `StoreProduct` entry with a custom markup price (within `ResellerMaxPrice` limits).

### C. The Order Connection Flow (Drop-shipping)
1. **Retail Purchase**: A Buyer orders from a Reseller's store (Escrow payment held by Smart Store Admin).
2. **Seller Action**: Reseller goes to Prime Ship and performs a **Wholesale Purchase** (Step 3B).
3. **The Linkage**:
    - Seller pastes the `WHOLE-XXXX` reference into the Smart Store order.
    - **Endpoint**: `POST /api/services/app/Order/LinkWholesaleOrder`.
    - **Automation**: Retail order status moves from `Pending` → `Processing`. Wholesale order is tagged as `LinkedToOrder`.

---

## 5. Automated Settlement Flow
This is the final stage that moves money from Escrow to the Profit participants.

1. **Step**: Prime Ship Admin marks wholesale order as `Delivered`.
2. **Step**: Smart Store Admin marks retail order as `Delivered`.
3. **Automation Trigger**: `MarkAsDelivered` method in `OrderAppService`.
4. **Logic**:
    - **Wholesale Release**: Wholesale price is sent to the Prime Ship Admin (if they were external) or handled as realized revenue.
    - **Profit Release**: The difference (`Retail Price - Wholesale Price`) is deposited into the **Reseller's Wallet**.
    - **Status**: Orders set to `Completed` and `Settled`.

---

## 6. Notification Layer (SMTP Workflows)
A unified communication engine is integrated to provide real-time updates and secure account management across the Prime Ship ecosystem.

### A. Core SMTP Configuration
- **Engine**: ABP `IEmailSender` wrapper using **MailKit**.
- **Security**: Port 465 (Explicit SSL) for secure transport.
- **Provider**: `primeshipuk.com` dedicated SMTP relay.
- **Reliability**: All email operations are wrapped in `try-catch` blocks with logging to ensure SMTP downtime does not block business logic (e.g., an order will still be placed even if the email fails).

### B. Order Notification Matrix (Prime Ship)
The system triggers professional HTML notifications for critical lifecycle events:
1.  **Order Placement**: Instantly sent to the Seller and Admin upon wholesale purchase, including the `ReferenceCode` and customer shipping data.
2.  **Shipping Update**: Sent when the Warehouse Admin adds tracking information, notifying the Seller that the product is in transit.
3.  **Delivery Confirmation**: Triggered when the order reaches the final destination, signaling the start of the settlement window.
4.  **Profit Settlement**: A unique notification sent to the Seller when funds are released from escrow and their profit is deposited into their GlobalPay wallet.
5.  **Order Cancellation/Issue**: Sent if an order is rejected or cancelled, providing the reason and details of any refunds initiated.

### C. Seller Registration Workflow
To maintain a premium and secure marketplace, seller onboarding is strictly managed via email verification:
1.  **Initial Registration**: Seller accounts are created as **Inactive** with the default password `Noshahi.000`.
2.  **Verification Email**: A rich-HTML email is sent with a **High-CTA Verification Button**.
3.  **The Redirect**: Clicking the link activates the account instantly and provides a smooth 3-second automated redirect to the login page.

### D. Password Security & Recovery
A secure, token-based self-service recovery system is implemented:
1.  **Forget Password**: Users enter their email to request a reset.
2.  **Reset Link**: A secure, one-time-use token link is sent via email with an expiry of 24 hours.
3.  **Reset Page**: A minimal, dedicated UI allows the user to set a new password, which is then encrypted and updated in the identity database.
4.  **Security Notification**: Upon successful reset, a confirmation is sent to Ensure the user is aware of the account change.

### E. Strategic Isolation
Out-of-box platform notifications (like Smart Store automatic order creation) are purposefully **omitted** from the global notification handler. This ensures that customers and resellers perceive the platforms as independent entities, maintaining the "Marketplace Illusion."

---

## 7. Access Control Summary
| Role | Recommended Platform Access | Permission Level |
| :--- | :--- | :--- |
| **Buyer** | Smart Store | `None` / `Buyer` |
| **Seller** | Smart Store + Prime Ship | `SmartStore.Seller` / `PrimeShip.Reseller` |
| **Admin** | All Platforms | `GlobalPay.Admin` / `PrimeShip.Admin` |

---

## 8. Database & Environment Status
- **Pre-seeded**: 5 Categories, 20 Products, 3 Active Stores.
- **SMTP Credentials**: Persisted in `AbpSettings` table for dynamic updates.
- **Email Logs**: All failures logged via `Logger.Error` in a `try-catch` wrapper to prevent order failure on SMTP downtime.
