# Quick Start Guide - Inventory Management & E-Commerce System

## Prerequisites
- Node.js 18+ installed
- MongoDB running (local or cloud)
- Git installed

## Step 1: Clone & Setup

```bash
cd Inventory-Management-App
```

## Step 2: Backend Setup

```bash
cd backend
npm install

# Create .env file
echo "MONGO_URI=mongodb://localhost:27017/inventory-management
JWT_SECRET=Hello
PORT=3000" > .env

# Start backend
npm start
```

Backend will run on `http://localhost:3000`

## Step 3: Admin Frontend Setup

```bash
cd ../frontend
npm install

# Update environment file if needed
# Edit: src/environments/environment.ts
# Set your organizationId

# Start admin frontend
ng serve
```

Admin frontend will run on `http://localhost:4200`

## Step 4: E-Commerce Frontend Setup

```bash
cd ../ecom-frontend
npm install

# Update environment file if needed
# Edit: src/environments/environment.ts
# Set your organizationId (same as admin frontend)

# Start e-commerce frontend
ng serve --port 4201
```

E-Commerce frontend will run on `http://localhost:4201`

## Step 5: Create Initial Data

### Option A: Using Admin Frontend
1. Go to `http://localhost:4200`
2. Register first admin user
3. Create organization
4. Add categories
5. Add products
6. Add warehouses
7. Set stock levels

### Option B: Using MongoDB Directly
```javascript
// Connect to MongoDB and run:
use inventory-management

// Create organization
db.organizations.insertOne({
  name: "My Store",
  email: "admin@mystore.com",
  phone: "1234567890",
  address: "123 Main St",
  status: "active",
  createdAt: new Date()
})

// Get the organization ID
const orgId = db.organizations.findOne()._id

// Create admin user
db.users.insertOne({
  name: "Admin User",
  email: "admin@mystore.com",
  password: "$2b$10$...", // Use bcrypt to hash password
  role: "admin",
  organizationId: orgId,
  isActive: true,
  createdAt: new Date()
})

// Create categories
db.categories.insertMany([
  { name: "Electronics", organizationId: orgId, status: "active" },
  { name: "Clothing", organizationId: orgId, status: "active" },
  { name: "Home & Garden", organizationId: orgId, status: "active" }
])

// Create warehouse
db.warehouses.insertOne({
  name: "Main Warehouse",
  location: "123 Warehouse St",
  organizationId: orgId,
  createdAt: new Date()
})
```

## Step 6: Test the System

### Test Admin Frontend
1. Login at `http://localhost:4200/login`
2. Navigate to Products
3. Create a new product
4. Set stock levels
5. View dashboard

### Test E-Commerce Frontend
1. Visit `http://localhost:4201`
2. Browse products (should see products created in admin)
3. Register as customer at `/auth/register`
4. Add products to cart
5. Proceed to checkout
6. Place order
7. View order in profile

## Common Issues & Solutions

### Issue: "Organization ID is required"
**Solution**: Make sure `organizationId` is set in environment files for both frontends

### Issue: "No products showing in e-commerce"
**Solution**: 
1. Check products are created in admin frontend
2. Verify products have status "active"
3. Verify stock levels are set
4. Check organizationId matches in both frontends

### Issue: "Cannot login to admin"
**Solution**:
1. Verify user exists in `users` collection
2. Check password is hashed with bcrypt
3. Verify organizationId matches

### Issue: "Cannot login to e-commerce"
**Solution**:
1. Register new customer through e-commerce frontend
2. Customers are in separate `customers` collection
3. Admin users cannot login to e-commerce (different auth system)

### Issue: "CORS errors"
**Solution**: Backend should have CORS enabled for both frontend URLs

### Issue: "Products not showing stock"
**Solution**:
1. Create warehouse in admin
2. Add stock levels for products
3. Stock levels link product + warehouse

## Port Configuration

If ports are already in use, change them:

### Backend
Edit `backend/.env`:
```
PORT=3001
```

### Admin Frontend
```bash
ng serve --port 4202
```

### E-Commerce Frontend
```bash
ng serve --port 4203
```

## Environment Variables

### Backend (.env)
```
MONGO_URI=mongodb://localhost:27017/inventory-management
JWT_SECRET=your-secret-key-change-in-production
PORT=3000
NODE_ENV=development
```

### Admin Frontend (src/environments/environment.ts)
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  organizationId: 'your-organization-id-here'
};
```

### E-Commerce Frontend (src/environments/environment.ts)
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api/ecommerce',
  organizationId: 'your-organization-id-here'
};
```

## Testing Checklist

- [ ] Backend starts without errors
- [ ] MongoDB connection successful
- [ ] Admin frontend loads
- [ ] E-commerce frontend loads
- [ ] Can create admin user
- [ ] Can login to admin
- [ ] Can create products
- [ ] Can set stock levels
- [ ] Products appear in e-commerce
- [ ] Can register customer
- [ ] Can login as customer
- [ ] Can add to cart
- [ ] Can place order
- [ ] Order appears in admin
- [ ] Stock decreases after order

## Next Steps

1. Customize design colors in `styles.scss`
2. Add real product images
3. Configure payment gateway
4. Set up email notifications
5. Add shipping integration
6. Configure production environment
7. Deploy to cloud

## Support

- Backend API: `http://localhost:3000/api`
- Admin Frontend: `http://localhost:4200`
- E-Commerce Frontend: `http://localhost:4201`
- MongoDB: `mongodb://localhost:27017`

## Useful Commands

```bash
# Check if ports are in use
netstat -ano | findstr :3000
netstat -ano | findstr :4200
netstat -ano | findstr :4201

# Kill process on port (Windows)
taskkill /PID <PID> /F

# View MongoDB data
mongosh
use inventory-management
db.products.find()
db.customers.find()
db.orders.find()

# Clear all data (careful!)
db.dropDatabase()
```
