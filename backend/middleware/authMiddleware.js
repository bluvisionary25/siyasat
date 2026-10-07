const jwt = require('jsonwebtoken');

// Verify JWT Token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });

    jwt.verify(token, process.env.JWT_SECRET || 'siyasat_super_secret_key_2026', (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid or expired token.' });
        req.user = user;
        next();
    });
};

// Authorize specific roles
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        const userRole = req.user && req.user.role ? req.user.role.toUpperCase() : '';
        const upperRoles = roles.map(r => r.toUpperCase());
        if (!userRole || !upperRoles.includes(userRole)) {
            return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
        }
        next();
    };
};

module.exports = { authenticateToken, authorizeRoles };