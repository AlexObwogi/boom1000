const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); //Authenticaton middleware
const Tick = require('../models/Tick'); //Tick model

// @route GET /api/ticks
// @desc get all ticks for the authenticated user
// @access Private
router.get('/', auth, async (req, res) => {
	try {
		//Find all ticks belonging to the user ID from the authenticated request
		const ticks = await Tick.find({ userId: req.user.id }).sort({ timestamp: 1}); //Sort by timestamp ascending
		res.json(ticks);
	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server Error');
	}
});

// @route POST /api/ticks
// @desc Add a new tick for the authenticated user
// @access Private
router.post('/', auth, async (req, res) => {
	const { value } = req.body;

	//Basic Validation
	if (typeof value !== 'number' || value < 0) {
		return res.status(400).json({ msg: 'Please enter a valid non-negative number for tick value' });
	}

	try {
		//create a new tick instance
		const newTick = new Tick({
			userId: req.user.id, // Associate tick with the logged-in user
			value
		});

		//Save the tick to the database
		const tick = await newTick.save();
		res.json(tick); // Respond with the saved tick
	} catc (err) {
		console.error(err.message);
		res.status(500).send('Server Error');
	}
});


// @route DELETE /api/ticks/all
// @desc Delete all ticks for the authenticated user
// @access private
router.delete('/all', auth, async (req,res) => {
	try {
		// Delete all ticks where the userId matches the authenticated user's ID
		await Tick.deleteMany({ userId: req.user.id });
		res.json({ msg: 'All ticks deleted successfully' });
	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server Error');
	}
});


module.exports = router;
