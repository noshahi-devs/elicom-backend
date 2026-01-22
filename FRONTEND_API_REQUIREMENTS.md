# Easy Finora - Frontend API Requirements

## 📋 Overview
This document lists all APIs required by the Easy Finora frontend. Each API must be tested and verified by backend before frontend integration.

---

## 🔐 Authentication APIs (Already Implemented ✅)

### 1. Login
- **Endpoint**: `POST /api/TokenAuth/Authenticate`
- **Request**:
  ```json
  {
    "userNameOrEmailAddress": "string",
    "password": "string",
    "rememberClient": true
  }
  ```
- **Response**:
  ```json
  {
    "accessToken": "string",
    "encryptedAccessToken": "string",
    "expireInSeconds": 86400,
    "userId": 1
  }
  ```
- **Status**: ✅ Implemented & Tested

### 2. Register
- **Endpoint**: `POST /api/services/app/Account/RegisterGlobalPayUser`
- **Request**:
  ```json
  {
    "emailAddress": "string",
    "password": "string",
    "phoneNumber": "string",
    "country": "string"
  }
  ```
- **Response**: `200 OK`
- **Status**: ✅ Implemented & Tested

### 3. Logout
- **Frontend Only** (Clear localStorage)
- **Status**: ✅ Implemented

---

## 💰 Deposit APIs

### 4. Get P2P Bank Accounts
- **Endpoint**: `GET /api/services/app/Deposit/GetP2PBankAccounts`
- **Headers**: `Authorization: Bearer {token}`
- **Response**:
  ```json
  {
    "result": [
      {
        "id": 1,
        "country": "Pakistan",
        "currency": "PKR",
        "accountNumber": "XX-0011",
        "accountHolder": "SHAN ALI",
        "bankName": "Allied Bank Limited",
        "branchName": "Allama Iqbal Town Branch",
        "iban": "PK72ABPA0010140687020011",
        "bankAddress": "G78V+RC6, Gulshan Block...",
        "receiverNumber": "212 571 1298",
        "flag": "https://easyfinora.com/flags/pk.png",
        "region": "South Asian",
        "lastPaymentDate": null
      }
    ]
  }
  ```
- **Status**: ⚠️ **NEEDS BACKEND IMPLEMENTATION**

### 5. Submit P2P Deposit
- **Endpoint**: `POST /api/services/app/Deposit/SubmitP2PDeposit`
- **Headers**: `Authorization: Bearer {token}`
- **Request** (multipart/form-data):
  ```
  bankAccountId: number
  amount: number
  paymentConfirmed: boolean
  proofFile: File
  ```
- **Response**:
  ```json
  {
    "result": {
      "depositId": 123,
      "status": "Pending",
      "message": "Deposit submitted successfully"
    }
  }
  ```
- **Status**: ⚠️ **NEEDS BACKEND IMPLEMENTATION**

### 6. Submit Crypto Deposit
- **Endpoint**: `POST /api/services/app/Deposit/SubmitCryptoDeposit`
- **Headers**: `Authorization: Bearer {token}`
- **Request** (multipart/form-data):
  ```
  amount: number
  walletAddress: string
  transactionProofFile: File
  ```
- **Response**:
  ```json
  {
    "result": {
      "depositId": 124,
      "status": "Pending",
      "message": "Crypto deposit submitted successfully"
    }
  }
  ```
- **Status**: ⚠️ **NEEDS BACKEND IMPLEMENTATION**

### 7. Get Crypto Wallet Address
- **Endpoint**: `GET /api/services/app/Deposit/GetCryptoWalletAddress`
- **Headers**: `Authorization: Bearer {token}`
- **Response**:
  ```json
  {
    "result": {
      "walletAddress": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
      "network": "Bitcoin",
      "qrCodeUrl": "https://api.qrserver.com/v1/create-qr-code/?data=..."
    }
  }
  ```
- **Status**: ⚠️ **NEEDS BACKEND IMPLEMENTATION**

---

## 📊 Transaction History APIs

### 8. Get Deposit History
- **Endpoint**: `GET /api/services/app/Deposit/GetDepositHistory`
- **Headers**: `Authorization: Bearer {token}`
- **Query Params**:
  - `skipCount`: number (default: 0)
  - `maxResultCount`: number (default: 10)
  - `status`: string (optional: "Pending", "Approved", "Rejected")
- **Response**:
  ```json
  {
    "result": {
      "totalCount": 25,
      "items": [
        {
          "id": 123,
          "amount": 1000,
          "currency": "USD",
          "method": "P2P",
          "status": "Pending",
          "createdDate": "2026-01-22T00:00:00Z",
          "approvedDate": null,
          "bankAccount": "Allied Bank - XX-0011",
          "proofUrl": "/uploads/proof-123.jpg"
        }
      ]
    }
  }
  ```
- **Status**: ⚠️ **NEEDS BACKEND IMPLEMENTATION**

### 9. Get Transaction History
- **Endpoint**: `GET /api/services/app/Transaction/GetTransactionHistory`
- **Headers**: `Authorization: Bearer {token}`
- **Query Params**:
  - `skipCount`: number
  - `maxResultCount`: number
  - `type`: string (optional: "Deposit", "Withdrawal", "Transfer")
- **Response**:
  ```json
  {
    "result": {
      "totalCount": 50,
      "items": [
        {
          "id": 1,
          "type": "Deposit",
          "amount": 1000,
          "currency": "USD",
          "status": "Completed",
          "date": "2026-01-22T00:00:00Z",
          "description": "P2P Deposit"
        }
      ]
    }
  }
  ```
- **Status**: ⚠️ **NEEDS BACKEND IMPLEMENTATION**

---

## 👤 User Profile APIs

### 10. Get User Profile
- **Endpoint**: `GET /api/services/app/User/GetCurrentUser`
- **Headers**: `Authorization: Bearer {token}`
- **Response**:
  ```json
  {
    "result": {
      "id": 1,
      "userName": "user@example.com",
      "emailAddress": "user@example.com",
      "name": "John",
      "surname": "Doe",
      "phoneNumber": "+1234567890",
      "country": "USA",
      "balance": 5000.00,
      "currency": "USD",
      "isEmailConfirmed": true,
      "profilePictureUrl": null
    }
  }
  ```
- **Status**: ⚠️ **NEEDS BACKEND IMPLEMENTATION**

### 11. Update User Profile
- **Endpoint**: `PUT /api/services/app/User/UpdateProfile`
- **Headers**: `Authorization: Bearer {token}`
- **Request**:
  ```json
  {
    "name": "John",
    "surname": "Doe",
    "phoneNumber": "+1234567890",
    "country": "USA"
  }
  ```
- **Response**: `200 OK`
- **Status**: ⚠️ **NEEDS BACKEND IMPLEMENTATION**

### 12. Get User Balance
- **Endpoint**: `GET /api/services/app/User/GetBalance`
- **Headers**: `Authorization: Bearer {token}`
- **Response**:
  ```json
  {
    "result": {
      "balance": 5000.00,
      "currency": "USD",
      "pendingDeposits": 1000.00,
      "availableBalance": 4000.00
    }
  }
  ```
- **Status**: ⚠️ **NEEDS BACKEND IMPLEMENTATION**

---

## 💳 Card Management APIs

### 13. Get User Cards
- **Endpoint**: `GET /api/services/app/Card/GetUserCards`
- **Headers**: `Authorization: Bearer {token}`
- **Response**:
  ```json
  {
    "result": [
      {
        "id": 1,
        "cardNumber": "**** **** **** 1234",
        "cardType": "Visa",
        "expiryDate": "12/25",
        "holderName": "John Doe",
        "isDefault": true
      }
    ]
  }
  ```
- **Status**: ⚠️ **NEEDS BACKEND IMPLEMENTATION**

### 14. Add Card
- **Endpoint**: `POST /api/services/app/Card/AddCard`
- **Headers**: `Authorization: Bearer {token}`
- **Request**:
  ```json
  {
    "cardNumber": "4111111111111111",
    "expiryMonth": "12",
    "expiryYear": "25",
    "cvv": "123",
    "holderName": "John Doe"
  }
  ```
- **Response**:
  ```json
  {
    "result": {
      "cardId": 1,
      "message": "Card added successfully"
    }
  }
  ```
- **Status**: ⚠️ **NEEDS BACKEND IMPLEMENTATION**

---

## 📈 Dashboard APIs

### 15. Get Dashboard Summary
- **Endpoint**: `GET /api/services/app/Dashboard/GetSummary`
- **Headers**: `Authorization: Bearer {token}`
- **Response**:
  ```json
  {
    "result": {
      "totalBalance": 5000.00,
      "totalDeposits": 10000.00,
      "totalWithdrawals": 5000.00,
      "pendingTransactions": 2,
      "recentTransactions": [...]
    }
  }
  ```
- **Status**: ⚠️ **NEEDS BACKEND IMPLEMENTATION**

---

## 📝 Summary

### APIs Status:
- ✅ **Implemented**: 3 (Auth APIs)
- ⚠️ **Needs Implementation**: 12 (Deposit, Transaction, Profile, Card, Dashboard)

### Priority Order:
1. **High Priority** (Core Functionality):
   - Get P2P Bank Accounts
   - Submit P2P Deposit
   - Submit Crypto Deposit
   - Get User Profile
   - Get User Balance

2. **Medium Priority** (User Experience):
   - Get Deposit History
   - Get Transaction History
   - Get Dashboard Summary

3. **Low Priority** (Future Features):
   - Card Management APIs
   - Update Profile

---

**Next Step**: Backend team implements and tests each API before frontend integration begins.
