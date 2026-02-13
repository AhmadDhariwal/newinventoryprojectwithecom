# E-Commerce Frontend - Elegant Classic Design

## Overview
This is a modern, elegant e-commerce frontend built with Angular 17+ featuring a classic, sophisticated design inspired by high-end fashion e-commerce websites. The application is fully integrated with the backend inventory management system.

## Design Features

### Design System
- **Typography**: Playfair Display (headings) + Inter (body text)
- **Color Palette**: 
  - Primary: #1a1a1a (Deep Black)
  - Secondary: #c9a961 (Elegant Gold)
  - Accent: #8b7355 (Warm Brown)
  - Background: #ffffff (Pure White)
  - Secondary BG: #f5f5f5 (Light Gray)

### Key Design Elements
- Minimal, clean layouts with ample white space
- Elegant typography with proper hierarchy
- Smooth transitions and hover effects
- Responsive grid layouts
- Icon-based navigation
- Image-focused product displays

## Pages & Features

### 1. Home Page (`/`)
- Hero section with full-width background image
- Featured products grid
- Categories showcase
- Features section (shipping, support, payment, returns)
- Fully responsive layout

### 2. Shop/Products Page (`/products`)
- Filterable product catalog
- Sidebar with category and price filters
- Search functionality
- Sort options (newest, price low-high, price high-low)
- Product grid with hover effects
- Empty state handling

### 3. Product Detail Page (`/products/:id`)
- Large product image gallery with thumbnails
- Product information (name, SKU, price, description)
- Stock availability indicator
- Quantity selector
- Add to cart functionality
- Warehouse availability display
- Breadcrumb navigation

### 4. Shopping Cart (`/cart`)
- Table-style cart layout
- Quantity adjustment controls
- Remove item functionality
- Order summary sidebar
- Responsive mobile view
- Empty cart state

### 5. Checkout (`/checkout`)
- Protected route (requires authentication)
- Shipping and billing address forms
- Order review
- Payment integration ready

### 6. User Pages (`/user/*`)
- Profile management (`/user/profile`)
- Order history (`/user/orders`)
- Refund requests (`/user/refund-request`)
- Protected routes

### 7. Authentication (`/auth/*`)
- Login page (`/auth/login`)
- Registration page (`/auth/register`)
- Clean, centered form layouts
- Error handling
- Form validation

### 8. About Page (`/about`)
- Company story
- Values showcase
- Responsive layout

### 9. Contact Page (`/contact`)
- Contact information
- Contact form
- Location, phone, email display

## Components

### Shared Components

#### Navbar
- Sticky header with logo
- Centered navigation links
- Icon-based actions (search, profile, cart)
- Cart badge with item count
- Responsive design

#### Footer
- Multi-column layout
- Newsletter subscription
- Social media links
- Quick links
- Responsive grid

#### Product Card
- Image with hover overlay
- Quick add to cart button
- Product name, category, price
- Out of stock badge
- Smooth animations

## Backend Integration

### API Service
- Centralized HTTP client
- Organization ID injection
- Error handling
- Base URL configuration

### Services
- **ProductService**: Fetch products, product details
- **CartService**: Cart management (add, remove, update, get total)
- **OrderService**: Create orders, fetch order history
- **AuthService**: Login, register, token management
- **CustomerService**: Profile management

### Models
- Product
- Customer
- Order
- OrderItem
- Address
- RefundRequest

## Technical Stack

- **Framework**: Angular 17+
- **Styling**: SCSS with CSS custom properties
- **Routing**: Angular Router with lazy loading
- **Forms**: Reactive Forms
- **HTTP**: HttpClient with interceptors
- **State Management**: RxJS Observables
- **Guards**: Auth guard for protected routes

## Installation & Setup

```bash
# Install dependencies
npm install

# Set environment variables
# Update src/environments/environment.ts with:
# - apiUrl: Backend API URL
# - organizationId: Your organization ID

# Run development server
ng serve

# Build for production
ng build --configuration production
```

## Environment Configuration

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  organizationId: 'your-organization-id'
};
```

## Folder Structure

```
src/app/
├── core/
│   ├── guards/          # Route guards
│   ├── interceptors/    # HTTP interceptors
│   ├── models/          # TypeScript interfaces
│   └── services/        # API services
├── modules/
│   ├── home/           # Home page
│   ├── products/       # Product list & detail
│   ├── cart/           # Shopping cart
│   ├── checkout/       # Checkout process
│   ├── auth/           # Login & register
│   ├── user/           # User profile & orders
│   ├── about/          # About page
│   └── contact/        # Contact page
├── shared/
│   └── components/     # Reusable components
│       ├── navbar/
│       ├── footer/
│       ├── product-card/
│       ├── loading/
│       └── empty-state/
└── styles.scss         # Global styles
```

## Features

### Implemented
✅ Product browsing with filters
✅ Product detail view
✅ Shopping cart management
✅ User authentication
✅ Order placement
✅ Profile management
✅ Order history
✅ Refund requests
✅ Responsive design
✅ Loading states
✅ Empty states
✅ Error handling

### Backend Integration
✅ Multi-tenant support via organizationId
✅ Real-time stock availability
✅ Warehouse-based inventory
✅ Customer authentication
✅ Order management
✅ Profile updates

## Responsive Breakpoints

- Desktop: 1200px+
- Tablet: 768px - 1199px
- Mobile: < 768px

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance Optimizations

- Lazy loading of routes
- Standalone components
- Optimized images (placeholder URLs)
- CSS custom properties
- Minimal dependencies

## Future Enhancements

- Product reviews and ratings
- Wishlist functionality
- Advanced search with filters
- Product recommendations
- Payment gateway integration
- Order tracking
- Live chat support
- Multi-language support
- Dark mode

## License

This project is part of the Inventory Management System.
