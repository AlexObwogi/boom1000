// server/middleware/auth.js
const jwt = require('jsonwebtoken');

// Middleware to protect routes by verifying JWT token
module.exports = function (req, res, next) {
    // Get token from header
    // Convention: token sent in 'x-auth-token' header
    const token = req.header('x-auth-token'); 

    // Check if not token
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Verify token
    try {
        // jwt.verify decodes the token if valid, returns the payload (user ID)
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach the user ID from the token payload to the request object
        // This makes the user ID available in the subsequent route handlers
        // IMPORTANT: Use 'decoded' here, not 'decode'
        // Also, ensure your JWT payload structure matches (e.g., { user: { id: '...' } })
        // If your JWT payload is just the user ID directly (e.g., jwt.sign(user._id, ...)), then it would be `req.user = decoded;`
        // Based on typical MERN stack, `decoded.user` is common if your JWT has a `{ user: { id: 'some_id' } }` structure.
        req.user = decoded.user; 

        next(); // Proceed to the next middleware/route handler
    } catch (err) {
        // If token is invalid (e.g., expired, malformed), catch the the error
        console.error('JWT verification error:', err.message); // Log the specific error for debugging
        res.status(401).json({ msg: 'Token is not valid' });
    }
};
