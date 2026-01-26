# 🎯 PRIME SHIP ADMIN DASHBOARD - IMPLEMENTATION PLAN

**Date**: January 24, 2026  
**Objective**: Build complete Admin Dashboard with Category & Product Management

---

## 📋 **TASK LIST**

### **PHASE 1: USER & ROUTE UPDATES** ⏱️ 30 mins

#### Task 1.1: Update Login Redirect ✅
- [ ] Change redirect from `/seller/dashboard` to `/admin/dashboard`
- [ ] Update `login.component.ts`
- [ ] Update `auth.guard.ts` if needed
- [ ] Test login flow

#### Task 1.2: Update Route References ✅
- [ ] Rename all `/seller/*` routes to `/admin/*`
- [ ] Update `app.routes.ts`
- [ ] Update navigation links
- [ ] Update breadcrumbs

#### Task 1.3: Make User Admin ✅
- [ ] Check user roles in database
- [ ] Assign Admin role to `engr.adeelnoshahi@gmail.com`
- [ ] Verify role assignment
- [ ] Test admin access

**Deliverable**: User can login and access `/admin/dashboard`

---

### **PHASE 2: API ANALYSIS & BACKEND** ⏱️ 2-3 hours

#### Task 2.1: List Required APIs ✅
**Categories:**
- [ ] GET `/api/services/app/Category/GetAll` - List all categories
- [ ] GET `/api/services/app/Category/Get?id={id}` - Get single category
- [ ] POST `/api/services/app/Category/Create` - Create category
- [ ] PUT `/api/services/app/Category/Update` - Update category
- [ ] DELETE `/api/services/app/Category/Delete?id={id}` - Delete category

**Products:**
- [ ] GET `/api/services/app/Product/GetAll` - List all products
- [ ] GET `/api/services/app/Product/Get?id={id}` - Get single product
- [ ] POST `/api/services/app/Product/Create` - Create product
- [ ] PUT `/api/services/app/Product/Update` - Update product
- [ ] DELETE `/api/services/app/Product/Delete?id={id}` - Delete product
- [ ] GET `/api/services/app/Product/GetByCategory?categoryId={id}` - Products by category

**Public APIs:**
- [ ] GET `/api/services/app/Category/GetAllPublic` - Public categories
- [ ] GET `/api/services/app/Product/GetAllPublic` - Public products

#### Task 2.2: Check Existing Backend APIs ✅
- [ ] Search for `CategoryAppService.cs`
- [ ] Search for `ProductAppService.cs`
- [ ] Document existing endpoints
- [ ] Identify missing endpoints

#### Task 2.3: Analyze Product Model ✅
- [ ] Check `Product.cs` entity
- [ ] Check `ProductDto.cs`
- [ ] Check `CreateProductDto.cs`
- [ ] Check `UpdateProductDto.cs`
- [ ] List missing fields

**Expected Product Fields:**
- [ ] Id (int)
- [ ] Name (string)
- [ ] Description (string)
- [ ] Price (decimal)
- [ ] CategoryId (int)
- [ ] Category (navigation)
- [ ] ImageUrl (string)
- [ ] Stock (int)
- [ ] SKU (string)
- [ ] IsActive (bool)
- [ ] TenantId (int)
- [ ] CreationTime (DateTime)

#### Task 2.4: Update Backend Models ✅
- [ ] Update `Product.cs` entity
- [ ] Update `ProductDto.cs`
- [ ] Update `CreateProductDto.cs`
- [ ] Update `UpdateProductDto.cs`
- [ ] Add missing properties
- [ ] Update database migration

#### Task 2.5: Create/Update API Endpoints ✅
- [ ] Implement CategoryAppService
- [ ] Implement ProductAppService
- [ ] Add authorization attributes
- [ ] Add tenant filtering
- [ ] Test endpoints with Swagger

#### Task 2.6: Write Automated Tests ✅
**Category Tests:**
- [ ] `Category_Create_Test`
- [ ] `Category_GetAll_Test`
- [ ] `Category_Get_Test`
- [ ] `Category_Update_Test`
- [ ] `Category_Delete_Test`

**Product Tests:**
- [ ] `Product_Create_Test`
- [ ] `Product_GetAll_Test`
- [ ] `Product_Get_Test`
- [ ] `Product_Update_Test`
- [ ] `Product_Delete_Test`
- [ ] `Product_GetByCategory_Test`

**Run Tests:**
```bash
cd aspnet-core/test/Elicom.Tests
dotnet test
```

**Deliverable**: All backend APIs working and tested

---

### **PHASE 3: FRONTEND - CATEGORY MANAGEMENT** ⏱️ 2 hours

#### Task 3.1: Create Category Service ✅
- [ ] Create `category.service.ts`
- [ ] Implement `getAll()`
- [ ] Implement `get(id)`
- [ ] Implement `create(dto)`
- [ ] Implement `update(dto)`
- [ ] Implement `delete(id)`
- [ ] Add error handling

#### Task 3.2: Build Category List Page ✅
- [ ] Create `categories.component.ts`
- [ ] Create `categories.component.html`
- [ ] Create `categories.component.scss`
- [ ] Display categories in table/grid
- [ ] Add "Add Category" button
- [ ] Add Edit/Delete actions
- [ ] Add loading state
- [ ] Add empty state

#### Task 3.3: Build Add Category Modal/Page ✅
- [ ] Create add category form
- [ ] Add form validation
- [ ] Implement submit handler
- [ ] Show success/error messages
- [ ] Refresh list after add

#### Task 3.4: Build Edit Category Modal/Page ✅
- [ ] Create edit category form
- [ ] Pre-populate form with data
- [ ] Add form validation
- [ ] Implement submit handler
- [ ] Show success/error messages
- [ ] Refresh list after update

#### Task 3.5: Implement Delete Category ✅
- [ ] Add delete confirmation dialog
- [ ] Implement delete handler
- [ ] Show success/error messages
- [ ] Refresh list after delete

**Deliverable**: Full CRUD for categories

---

### **PHASE 4: FRONTEND - PRODUCT MANAGEMENT** ⏱️ 3 hours

#### Task 4.1: Create Product Service ✅
- [ ] Create `product.service.ts`
- [ ] Implement `getAll()`
- [ ] Implement `get(id)`
- [ ] Implement `create(dto)`
- [ ] Implement `update(dto)`
- [ ] Implement `delete(id)`
- [ ] Implement `getByCategory(categoryId)`
- [ ] Add error handling

#### Task 4.2: Build Product List Page ✅
- [ ] Create `products.component.ts`
- [ ] Create `products.component.html`
- [ ] Create `products.component.scss`
- [ ] Display products in table/grid
- [ ] Show product image
- [ ] Show category name
- [ ] Add "Add Product" button
- [ ] Add Edit/Delete actions
- [ ] Add search/filter
- [ ] Add pagination

#### Task 4.3: Build Add Product Form ✅
- [ ] Create add product form
- [ ] Add all required fields:
  - [ ] Name
  - [ ] Description
  - [ ] Price
  - [ ] Category (dropdown from API)
  - [ ] Image URL
  - [ ] Stock
  - [ ] SKU
  - [ ] IsActive
- [ ] Add form validation
- [ ] Implement submit handler
- [ ] Show success/error messages

#### Task 4.4: Build Edit Product Form ✅
- [ ] Create edit product form
- [ ] Pre-populate all fields
- [ ] Category dropdown
- [ ] Add form validation
- [ ] Implement submit handler
- [ ] Show success/error messages

#### Task 4.5: Implement Delete Product ✅
- [ ] Add delete confirmation dialog
- [ ] Implement delete handler
- [ ] Show success/error messages
- [ ] Refresh list after delete

**Deliverable**: Full CRUD for products

---

### **PHASE 5: PUBLIC PAGE INTEGRATION** ⏱️ 1 hour

#### Task 5.1: Update Homepage Categories ✅
- [ ] Remove dummy category data
- [ ] Call `CategoryService.getAll()`
- [ ] Display real categories
- [ ] Add loading state
- [ ] Handle empty state

#### Task 5.2: Update Homepage Products ✅
- [ ] Remove dummy product data
- [ ] Call `ProductService.getAll()`
- [ ] Display real products
- [ ] Show product images
- [ ] Show product prices
- [ ] Show category names
- [ ] Add loading state
- [ ] Handle empty state

#### Task 5.3: Add Category Filtering ✅
- [ ] Click category → filter products
- [ ] Call `ProductService.getByCategory(id)`
- [ ] Update product list

**Deliverable**: Public page shows real data

---

## 🔄 **WORKFLOW**

### For Each Feature (Category/Product):

```
1. ✅ Check if backend API exists
   ↓
2. ✅ If missing → Create API
   ↓
3. ✅ Write automated test
   ↓
4. ✅ Run test: dotnet test
   ↓
5. ✅ If test fails → Fix API
   ↓
6. ✅ Create frontend service
   ↓
7. ✅ Create UI components
   ↓
8. ✅ Integrate service with components
   ↓
9. ✅ Test in browser
   ↓
10. ✅ Fix any issues
```

---

## 📚 **REFERENCE:**

### Easy Finora Integration Example:
- Check: `easy-finora-frontend/src/app/services/`
- Check: `easy-finora-frontend/src/app/pages/`
- Pattern: Service → Component → Template

---

## ⏱️ **ESTIMATED TIME:**

| Phase | Time | Status |
|-------|------|--------|
| Phase 1: Routes & User | 30 mins | ⏳ Pending |
| Phase 2: Backend APIs | 2-3 hours | ⏳ Pending |
| Phase 3: Category CRUD | 2 hours | ⏳ Pending |
| Phase 4: Product CRUD | 3 hours | ⏳ Pending |
| Phase 5: Public Page | 1 hour | ⏳ Pending |
| **TOTAL** | **8-9 hours** | |

---

## 🎯 **SUCCESS CRITERIA:**

- [ ] User logs in as admin
- [ ] Admin can create categories
- [ ] Admin can edit categories
- [ ] Admin can delete categories
- [ ] Admin can create products with category
- [ ] Admin can edit products
- [ ] Admin can delete products
- [ ] Categories appear on homepage
- [ ] Products appear on homepage
- [ ] Products can be filtered by category
- [ ] All APIs have automated tests
- [ ] All tests pass

---

**Ready to start implementation!** 🚀
