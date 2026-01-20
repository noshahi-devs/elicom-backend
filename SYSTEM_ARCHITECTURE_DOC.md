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

## 6. Access Control Summary
| Role | Recommended Platform Access | Permission Level |
| :--- | :--- | :--- |
| **Buyer** | Smart Store | `None` / `Buyer` |
| **Seller** | Smart Store + Prime Ship | `SmartStore.Seller` / `PrimeShip.Reseller` |
| **Admin** | All Platforms | `GlobalPay.Admin` / `PrimeShip.Admin` |

---

## 7. Database Status (Ready for Launch)
- **5 Categories** and **20 Products** have been pre-seeded.
- **3 Stores** ("Premium Hub", "Smart Deals", "Fashion Express") are active and stocked.
- All transactional tables are prepared with `SourcePlatform` tracking.
