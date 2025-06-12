const jwt = require('jsonwebtoken');

//Middleware to protect routes by verifying JET token
module.exports = function (req, res, next) {
	//Get token from header
	const token = req.header('x-auth-token'); // Convention: token sent in 'x-auth-token' header
	 //check if not token 
	if (!token) {
		return res.status(401).json({ msg: 'No token, authorization denied'});

		//Verify token
		try {
			//jwt.verify decodes the token if valid, returns the payload (user ID)
			const decoded = jwt.verify(token, process.env.JWT_SECRET);

			//Attach the user ID from the token payload to the request object
			//This makes the user ID available in the subsequent route handlers
			req.user = decoded.user;
			next(); //Proceed to the next middleware/route handler
		} catch (err) {
			res.status(401).json({ msg: 'Token is not valid' });
		}
};
