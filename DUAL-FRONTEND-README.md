# Inventory Management System - Dual Frontend Architecture

## Overview
This system has **TWO separate frontends** serving different purposes and user types:

## 1. Admin Frontend (`/frontend`)
**Purpose**: Internal inventory management system for business operations

**Users**: 
- Organization Admins
- Team Members
- Warehouse Managers
- Inventory Staff

**Access**: `http://localhost:4200` (default Angular port)

**Features**:
- Product management (CRUD)
- Category management
- Warehouse management
- Stock level tracking
- Purchase orders
- Sales orders
- Inventory forecasting
- Reports and analytics
- User and team management
- Organization settings

**Authentication**: 
- Email/Password login
- Role-based access (Admin, Manager, Staff)
- 2FA support
- Session management

**Login Credentials**: Admin users created through organization setup

---

## 2. E-Commerce Frontend (`/ecom-frontend`)
**Purpose**: Public-facing online store for customers

**Users**:
- Customers (Public)
- Guest shoppers

**Access**: `http://localhost:4201` (or different port)

**Features**:
- Product browsing and search
- Category filtering
- Shopping cart
- Checkout process
- Order history
- Profile management
- Refund requests
- Real-time stock availability

**Authentication**:
- Customer registration (separate from admin)
- Customer login
- Guest checkout (optional)
- Password recovery

**Login Credentials**: Customers self-register through the e-commerce site

---

## Key Differences

| Feature | Admin Frontend | E-Commerce Frontend |
|---------|---------------|---------------------|
| **User Type** | Internal staff | External customers |
| **Database** | Same MongoDB | Same MongoDB |
| **User Collection** | `users` collection | `customers` collection |
| **Authentication** | Admin JWT tokens | Customer JWT tokens |
| **Access Level** | Full CRUD operations | Read products, manage own orders |
| **Design** | Dashboard/Admin UI | Modern e-commerce UI |
| **Port** | 4200 | 4201 |

---

## How It Works

### Backend Integration
Both frontends connect to the **same backend** (`http://localhost:3000/api`) but use different endpoints:

**Admin Frontend Routes**:
- `/api/products` (full CRUD)
- `/api/categories` (full CRUD)
- `/api/warehouses`
- `/api/inventory`
- `/api/purchase-orders`
- `/api/sales-orders`
- `/api/users`
- `/api/dashboard`

**E-Commerce Frontend Routes**:
- `/api/ecommerce/products` (read-only)
- `/api/ecommerce/categories` (read-only)
- `/api/ecommerce/auth/register`
- `/api/ecommerce/auth/login`
- `/api/ecommerce/orders` (customer orders)
- `/api/ecommerce/profile`
- `/api/ecommerce/refunds`

### Multi-Tenant Support
Both systems support multiple organizations through `organizationId`:
- Each organization has its own products, categories, and inventory
- Admin users belong to specific organizations
- Customers shop from specific organizations
- Data is completely isolated between organizations

---

## Running Both Frontends

### Admin Frontend
```bash
cd frontend
npm install
ng serve
# Access at http://localhost:4200
```

### E-Commerce Frontend
```bash
cd ecom-frontend
npm install
ng serve --port 4201
# Access at http://localhost:4201
```

### Backend
```bash
cd backend
npm install
npm start
# Runs on http://localhost:3000
```

---

## Environment Configuration

### Admin Frontend (`frontend/src/environments/environment.ts`)
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  organizationId: 'your-org-id'
};
```

### E-Commerce Frontend (`ecom-frontend/src/environments/environment.ts`)
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api/ecommerce',
  organizationId: 'your-org-id'
};
```

---

## User Flows

### Admin User Flow
1. Admin logs in at `http://localhost:4200/login`
2. Accesses dashboard with inventory metrics
3. Manages products, stock, orders
4. Views reports and analytics
5. Manages team members

### Customer Flow
1. Customer visits `http://localhost:4201`
2. Browses products (no login required)
3. Adds items to cart
4. Registers/logs in for checkout
5. Places order
6. Views order history in profile

---

## Security

### Admin Frontend
- JWT token with admin role
- Role-based route guards
- Organization-scoped data access
- Session timeout
- 2FA optional

### E-Commerce Frontend
- JWT token with customer role
- Auth guard for checkout/profile
- Organization-scoped product access
- Secure payment integration ready
- Customer data privacy

---

## Database Collections

### Shared Collections
- `products` - Product catalog
- `categories` - Product categories
- `warehouses` - Warehouse locations
- `stocklevels` - Current stock quantities
- `stockmovements` - Stock transaction history
- `orders` - All orders (sales + e-commerce)

### Admin-Only Collections
- `users` - Admin/staff users
- `organizations` - Organization details
- `purchaseorders` - Purchase orders
- `suppliers` - Supplier information
- `reports` - Generated reports

### E-Commerce-Only Collections
- `customers` - Customer accounts
- `refunds` - Refund requests

---

## Deployment

### Production Setup
1. Deploy backend to cloud (AWS, Azure, GCP)
2. Deploy admin frontend to internal domain (e.g., `admin.yourcompany.com`)
3. Deploy e-commerce frontend to public domain (e.g., `shop.yourcompany.com`)
4. Configure CORS for both domains
5. Set up SSL certificates
6. Configure environment variables

### Recommended Architecture
```
                    ┌─────────────────┐
                    │   MongoDB       │
                    │   Database      │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   Node.js       │
                    │   Backend API   │
                    └────┬──────┬─────┘
                         │      │
              ┌──────────┘      └──────────┐
              │                            │
    ┌─────────▼─────────┐      ┌──────────▼──────────┐
    │  Admin Frontend   │      │ E-Commerce Frontend │
    │  (Internal)       │      │  (Public)           │
    │  admin.domain.com │      │  shop.domain.com    │
    └───────────────────┘      └─────────────────────┘
```

---

## Support

For issues or questions:
- Admin Frontend: Contact IT support
- E-Commerce Frontend: Contact customer service
- Backend/Integration: Contact development team
