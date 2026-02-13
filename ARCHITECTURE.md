# System Architecture Diagram

## Complete System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          MONGODB DATABASE                               │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                │
│  │ Organizations│  │   Products   │  │  Categories  │                │
│  └──────────────┘  └──────────────┘  └──────────────┘                │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                │
│  │    Users     │  │  Customers   │  │  Warehouses  │                │
│  │  (Admins)    │  │  (Shoppers)  │  │              │                │
│  └──────────────┘  └──────────────┘  └──────────────┘                │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                │
│  │ Stock Levels │  │    Orders    │  │   Refunds    │                │
│  └──────────────┘  └──────────────┘  └──────────────┘                │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       NODE.JS BACKEND API                               │
│                     http://localhost:3000                               │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                      API ROUTES                                   │ │
│  │                                                                   │ │
│  │  Admin Routes              │  E-Commerce Routes                  │ │
│  │  /api/...                  │  /api/ecommerce/...                 │ │
│  │                            │                                     │ │
│  │  • /products (CRUD)        │  • /products (Read)                │ │
│  │  • /categories (CRUD)      │  • /categories (Read)              │ │
│  │  • /warehouses             │  • /auth/register                  │ │
│  │  • /inventory              │  • /auth/login                     │ │
│  │  • /purchase-orders        │  • /orders (Customer)              │ │
│  │  • /sales-orders           │  • /profile                        │ │
│  │  • /users                  │  • /refunds                        │ │
│  │  • /dashboard              │                                     │ │
│  │  • /reports                │                                     │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                    MIDDLEWARE                                     │ │
│  │  • CORS                                                           │ │
│  │  • JWT Verification (Admin & Customer)                           │ │
│  │  • Organization ID Injection                                     │ │
│  │  • Error Handling                                                │ │
│  └───────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                    │                              │
                    │                              │
        ┌───────────┘                              └───────────┐
        │                                                      │
        ▼                                                      ▼
┌──────────────────────────┐                    ┌──────────────────────────┐
│   ADMIN FRONTEND         │                    │  E-COMMERCE FRONTEND     │
│   (Angular 17+)          │                    │  (Angular 17+)           │
│   localhost:4200         │                    │  localhost:4201          │
│                          │                    │                          │
│  ┌────────────────────┐  │                    │  ┌────────────────────┐  │
│  │   Dashboard        │  │                    │  │   Home Page        │  │
│  │   • Stats          │  │                    │  │   • Hero           │  │
│  │   • Charts         │  │                    │  │   • Featured       │  │
│  │   • Alerts         │  │                    │  │   • Categories     │  │
│  └────────────────────┘  │                    │  └────────────────────┘  │
│                          │                    │                          │
│  ┌────────────────────┐  │                    │  ┌────────────────────┐  │
│  │   Products         │  │                    │  │   Shop             │  │
│  │   • Create         │  │                    │  │   • Browse         │  │
│  │   • Edit           │  │                    │  │   • Filter         │  │
│  │   • Delete         │  │                    │  │   • Search         │  │
│  │   • Bulk Import    │  │                    │  └────────────────────┘  │
│  └────────────────────┘  │                    │                          │
│                          │                    │  ┌────────────────────┐  │
│  ┌────────────────────┐  │                    │  │   Product Detail   │  │
│  │   Inventory        │  │                    │  │   • Images         │  │
│  │   • Stock Levels   │  │                    │  │   • Description    │  │
│  │   • Warehouses     │  │                    │  │   • Add to Cart    │  │
│  │   • Movements      │  │                    │  └────────────────────┘  │
│  │   • Forecasting    │  │                    │                          │
│  └────────────────────┘  │                    │  ┌────────────────────┐  │
│                          │                    │  │   Shopping Cart    │  │
│  ┌────────────────────┐  │                    │  │   • Items          │  │
│  │   Orders           │  │                    │  │   • Quantities     │  │
│  │   • Purchase       │  │                    │  │   • Total          │  │
│  │   • Sales          │  │                    │  └────────────────────┘  │
│  │   • E-commerce     │  │                    │                          │
│  │   • Fulfillment    │  │                    │  ┌────────────────────┐  │
│  └────────────────────┘  │                    │  │   Checkout         │  │
│                          │                    │  │   • Shipping       │  │
│  ┌────────────────────┐  │                    │  │   • Payment        │  │
│  │   Reports          │  │                    │  │   • Confirmation   │  │
│  │   • Sales          │  │                    │  └────────────────────┘  │
│  │   • Inventory      │  │                    │                          │
│  │   • Forecasting    │  │                    │  ┌────────────────────┐  │
│  │   • Export         │  │                    │  │   User Account     │  │
│  └────────────────────┘  │                    │  │   • Profile        │  │
│                          │                    │  │   • Orders         │  │
│  ┌────────────────────┐  │                    │  │   • Refunds        │  │
│  │   Settings         │  │                    │  └────────────────────┘  │
│  │   • Organization   │  │                    │                          │
│  │   • Users/Teams    │  │                    │  ┌────────────────────┐  │
│  │   • Permissions    │  │                    │  │   Auth             │  │
│  │   • 2FA            │  │                    │  │   • Register       │  │
│  └────────────────────┘  │                    │  │   • Login          │  │
│                          │                    │  └────────────────────┘  │
└──────────────────────────┘                    └──────────────────────────┘
         │                                                   │
         │                                                   │
         ▼                                                   ▼
┌──────────────────────────┐                    ┌──────────────────────────┐
│   ADMIN USERS            │                    │   CUSTOMERS              │
│   • Organization Admin   │                    │   • Guest Shoppers       │
│   • Managers             │                    │   • Registered Users     │
│   • Staff                │                    │   • Returning Customers  │
│   • Warehouse Workers    │                    │                          │
└──────────────────────────┘                    └──────────────────────────┘
```

## Authentication Flow

### Admin Login Flow
```
1. Admin visits localhost:4200/login
2. Enters email/password
3. Backend validates against Users collection
4. Returns JWT with admin role
5. Token stored in localStorage
6. Admin accesses dashboard
```

### Customer Login Flow
```
1. Customer visits localhost:4201/auth/login
2. Enters email/password
3. Backend validates against Customers collection
4. Returns JWT with customer role
5. Token stored in localStorage
6. Customer can checkout
```

## Data Flow Example: Place Order

```
┌─────────────┐
│  Customer   │
│  (Browser)  │
└──────┬──────┘
       │ 1. Add items to cart (localStorage)
       │
       ▼
┌─────────────┐
│  Shopping   │
│    Cart     │
└──────┬──────┘
       │ 2. Click "Checkout"
       │
       ▼
┌─────────────┐
│   Login     │
│  Required   │
└──────┬──────┘
       │ 3. POST /api/ecommerce/orders
       │    { items, address, payment }
       │
       ▼
┌─────────────────────────────────────┐
│         Backend API                 │
│  1. Verify JWT token                │
│  2. Validate organizationId         │
│  3. Check stock availability        │
│  4. Start MongoDB transaction       │
│  5. Create order record             │
│  6. Deduct stock from warehouse     │
│  7. Create stock movement           │
│  8. Commit transaction              │
└──────┬──────────────────────────────┘
       │ 4. Return order confirmation
       │
       ▼
┌─────────────┐
│  Customer   │
│  Receives   │
│  Order #    │
└─────────────┘
       │
       │ 5. Admin can view order
       │
       ▼
┌─────────────┐
│   Admin     │
│  Dashboard  │
│  (Orders)   │
└─────────────┘
```

## Multi-Tenant Isolation

```
Organization A                    Organization B
├── Products                      ├── Products
│   ├── Product 1                 │   ├── Product X
│   └── Product 2                 │   └── Product Y
├── Categories                    ├── Categories
│   ├── Category A                │   ├── Category M
│   └── Category B                │   └── Category N
├── Warehouses                    ├── Warehouses
│   └── Warehouse 1               │   └── Warehouse 2
├── Admin Users                   ├── Admin Users
│   ├── Admin A1                  │   ├── Admin B1
│   └── Staff A2                  │   └── Staff B2
└── Customers                     └── Customers
    ├── Customer A1               ├── Customer B1
    └── Customer A2               └── Customer B2

    ↓                                 ↓
Completely Isolated               Completely Isolated
No data sharing                   No data sharing
```

## Technology Stack

```
┌─────────────────────────────────────────┐
│           Frontend Layer                │
│  • Angular 17+                          │
│  • TypeScript 5+                        │
│  • RxJS 7+                              │
│  • SCSS                                 │
│  • Standalone Components                │
└─────────────────────────────────────────┘
                  │
                  │ HTTP/REST
                  │
┌─────────────────────────────────────────┐
│           Backend Layer                 │
│  • Node.js 18+                          │
│  • Express 4+                           │
│  • JWT Authentication                   │
│  • Bcrypt Password Hashing              │
└─────────────────────────────────────────┘
                  │
                  │ Mongoose ODM
                  │
┌─────────────────────────────────────────┐
│           Database Layer                │
│  • MongoDB 6+                           │
│  • Transactions Support                 │
│  • Indexes for Performance              │
│  • Aggregation Pipelines                │
└─────────────────────────────────────────┘
```

## Deployment Architecture (Production)

```
                    ┌──────────────┐
                    │   Internet   │
                    └───────┬──────┘
                            │
                    ┌───────▼──────┐
                    │  Load        │
                    │  Balancer    │
                    └───┬──────┬───┘
                        │      │
        ┌───────────────┘      └───────────────┐
        │                                      │
┌───────▼────────┐                   ┌─────────▼────────┐
│ Admin Frontend │                   │ E-Commerce       │
│ admin.domain   │                   │ Frontend         │
│ (S3 + CF)      │                   │ shop.domain      │
└────────────────┘                   │ (S3 + CF)        │
                                     └──────────────────┘
        │                                      │
        └──────────────┬───────────────────────┘
                       │
                ┌──────▼──────┐
                │   API       │
                │   Gateway   │
                └──────┬──────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
┌───────▼────────┐          ┌─────────▼────────┐
│ Backend API    │          │ Backend API      │
│ Instance 1     │          │ Instance 2       │
│ (EC2/ECS)      │          │ (EC2/ECS)        │
└────────┬───────┘          └─────────┬────────┘
         │                            │
         └──────────┬─────────────────┘
                    │
            ┌───────▼────────┐
            │   MongoDB      │
            │   Atlas        │
            │   (Replica     │
            │    Set)        │
            └────────────────┘
```

## Security Layers

```
┌─────────────────────────────────────────┐
│  1. Frontend Security                   │
│     • Input Validation                  │
│     • XSS Prevention                    │
│     • CSRF Tokens                       │
│     • Secure Storage (JWT)              │
└─────────────────────────────────────────┘
                  │
┌─────────────────────────────────────────┐
│  2. Network Security                    │
│     • HTTPS/TLS                         │
│     • CORS Configuration                │
│     • Rate Limiting                     │
│     • DDoS Protection                   │
└─────────────────────────────────────────┘
                  │
┌─────────────────────────────────────────┐
│  3. API Security                        │
│     • JWT Verification                  │
│     • Role-Based Access                 │
│     • Input Sanitization                │
│     • SQL Injection Prevention          │
└─────────────────────────────────────────┘
                  │
┌─────────────────────────────────────────┐
│  4. Database Security                   │
│     • Encrypted Connections             │
│     • Password Hashing (Bcrypt)         │
│     • Data Encryption at Rest           │
│     • Regular Backups                   │
└─────────────────────────────────────────┘
```
