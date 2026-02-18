# Order Status Analytics - Debugging Guide

## What I Fixed:
1. ✅ Proper date range calculation (days parameter working)
2. ✅ Clean filter logic (organizationId + date range)
3. ✅ Comprehensive console logging

## Check Backend Console Output:

When you call the API, you should see:
```
=== Order Status Analytics Debug ===
Days: 30
Start Date: 2024-XX-XXTXX:XX:XX.XXXZ
End Date: 2024-XX-XXTXX:XX:XX.XXXZ
Filter: {"createdAt":{"$gte":"...","$lte":"..."},"organizationId":"..."}
Total Orders Found: X
Results Count: X
Results: [...]
=== End Debug ===
```

## If "Total Orders Found: 0" - Check:

1. **Do you have orders in database?**
   ```javascript
   db.orders.countDocuments({})
   ```

2. **Do orders have correct organizationId?**
   ```javascript
   db.orders.find({}).limit(1)
   // Check if organizationId matches what's in the filter
   ```

3. **Are orders within date range?**
   ```javascript
   db.orders.find({}).sort({createdAt: -1}).limit(1)
   // Check the createdAt date
   ```

4. **Check your organizationId in request:**
   - Is `req.organizationId` set correctly?
   - Check authentication middleware

## API Test:

```bash
# Test with 7 days
curl http://localhost:3000/api/dashboard/analytics/order-status?range=7

# Test with 30 days
curl http://localhost:3000/api/dashboard/analytics/order-status?range=30

# Test with 90 days
curl http://localhost:3000/api/dashboard/analytics/order-status?range=90
```

## Frontend Test:

Open browser console and check:
1. Network tab - see the actual API call
2. Check response data
3. Verify `range` parameter is sent correctly

## Common Issues:

❌ **No orders in database** → Create test orders
❌ **Wrong organizationId** → Check middleware/auth
❌ **Orders too old** → Try range=365 or check order dates
❌ **Case sensitivity** → Order model uses lowercase 'order' in require
