const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); // For password hashing
const jwt = require('jsonwebtoken'); // For creating JWT tokens
const User = require('../models/User'); // User model
const auth = require('../middleware/auth'); // Auth middleware to protect routes

//@route POST /api/auth/register
// @desc Register a new user
//  @access public
router.post('/register', async (req, res) => {
	const { username, password } = req.body;

	try {
		// Check if user already exists
		let user = await User.findOne({ username });
		if (user) {
			return res.status(400).json({ msg: 'User already exists' });
		}

		// Create new user instance
		user = new User({
			username,
			password
		});

		//Hash password
		const salt = await bcrypt.genSalt(10); // Generate a salt (random string)
		user.password = await bcrypt.hash(password, salt); //Hash the password with the salt

		//Save user to database
		await user.save();

		//Create JWT payload (data to be stored in the token)
		const payload = {
			user: {
				id: user.id //MongoDB's default _id is user.id
			}
		};

		//sign the token (create the JWT)
		jwt.sign(
			payload,
			process.env,JWT_SECRET, //Secret key from environment variables
			{ expiresIn: '1h' }, // Token expiration time (e.g., 1 hour)
			(err, token) => {
				if (err) throw err;
				res.json({ token, msg: 'User registered successfullly' }); //Send token back to client
			}
		);
	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server Error');
	}
});

// @route POST /api/auth/login
// @desc Authenticate user & get token
// @access Public
router.post('/login', async (req, res) => {
	const { username, password } = req.body;

	try {
		// Check if user exists
		let user = await User.findOne({ username });
		if (!user) {
			return res.status(400).json({ msg: 'Invalid Credentials' });
		}

		//Compare entered password with hashed password in daabase
		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) {
			return res.status(400).json({ msg: 'Invalid Credentials' });
		}

		//Create JWT payload
		const payload = {
			user: {
				id: user.id
			}
		};

		//sign the token
		jwt.sign(
			payload,
			process.env.JWT_SECRETE,
			{ expiresIN: '1h' },
			(err, token) => {
				if (err) throw err;
				res.json({ token, msg: 'Logged in successfully' });
			}
		);
	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server Error');
	}
});


// @route GET /api/auth/user
// @desc Get logged in user data (protected route to test authentication)
// @access Private
router.get('/user', auth, async (req, res) => {
	try {
		// req.user.id is populated by the 'auth' middleware
		const user = await User.findById(req.user.id).select('-password'); //Don't return password
		res.json(user);
	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server Error');
	}
});


module.exports = router;
