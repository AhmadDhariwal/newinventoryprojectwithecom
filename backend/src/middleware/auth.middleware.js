const jwt = require("jsonwebtoken");
const User = require("../models/user");

async function verifytoken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: "Authentication token missing"
    });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Error! Token was not provided."
    });
  }

  try {
    const decoded = jwt.verify(token, "Hello");

    // Attach user info to request - now includes organizationId
    req.user = {
      userid: decoded.userid,
      role: decoded.role,
      organizationId: decoded.organizationId // Added for multi-tenant support
    };
    req.userid = decoded.userid;
    req.role = decoded.role;
    req.organizationId = decoded.organizationId;

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

function restrictto(roles = []) {
  return async function (req, res, next) {
    if (!req.userid) {
      return res.status(401).json({ message: "Invalid token" });
    }

    if (!roles.includes(req.role)) {
      return res.status(403).json({
        message: "Unauthorized. Insufficient permissions.",
        requiredRoles: roles,
        userRole: req.role
      });
    }
    next();
  }
}

async function user(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, "Hello");

    req.user = {
      userid: decoded.userid,
      role: decoded.role,
      organizationId: decoded.organizationId
    };
    req.userid = decoded.userid;
    req.organizationId = decoded.organizationId;

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

// Verify customer token for E-Commerce
async function verifyCustomerToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: "Authentication token missing"
    });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Error! Token was not provided."
    });
  }

  try {
    const decoded = jwt.verify(token, "Hello");

    // Verify this is a customer token
    if (decoded.role !== 'customer') {
      return res.status(403).json({
        success: false,
        message: "Invalid token type"
      });
    }

    // Attach customer info to request
    req.customer = {
      customerId: decoded.customerId,
      email: decoded.email,
      organizationId: decoded.organizationId,
      role: decoded.role
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}


// Optional customer token for E-Commerce (allows guests)
async function optionalCustomerAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, "Hello");
    if (decoded.role === 'customer') {
      req.customer = {
        customerId: decoded.customerId,
        email: decoded.email,
        organizationId: decoded.organizationId,
        role: decoded.role
      };
      req.organizationId = decoded.organizationId;
    }
    next();
  } catch (err) {
    // If token is invalid, just proceed as guest
    next();
  }
}

module.exports = {
  verifytoken,
  restrictto,
  user,
  verifyCustomerToken,
  optionalCustomerAuth,
  optionalAuth: optionalCustomerAuth
}
