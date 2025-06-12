const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); //Authentication middleware
const PredictionHistory = require('../models/PredictionHistory'); // Prediction history model

//@route GET /api/history
//@desc Get all prediction history for the authenticated user
//@access Private
router.get('/', auth, async (req, res) => {
	try {
		//Find all history recors for the user, sorted by timestamp in descending (latest first)
		const history = await PredictionHistory.find({ userId: req.user.id }).sort({ timestamp: -1});
		res.json(history);
	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server Error');
	}
});


//@route POST /api/history
//@desc Add a new prediction history record for the authenticated user
//@access Private
router.post('/', auth, async (req, res) => {
	const { predictedValue, actualValue, isCorrect, pattern, confidence, predictedRange } = req.body;

	//Basci validation (add more as needed)
	if (typeof predictedValue === 'undefined' || typeof actualValue === 'undefined' || typeof isCorrect === 'undefined' || !pattern || typeof confidence === 'undefined' || typeof predictedRange === 'undefined') {
		return res.status(400).json({msg: 'please provide all required fields for prediction history' });
	}

	try {
		//Create a new PredictionHistory instance
		const newHistoryRecord = new PredictionHistory({
			userId: req.user.id, //Associate with the logged in user
			predictedValue,
			actualValue,
			isCorrect,
			pattern,
			confidence,
			predictedRange
		});

		//Save the record to the database
		const historyRecord = await newHistoryRecord.save();
		res.json(historyRecord); // Respond with the saved record
	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server Error');
	}
});


//@route DELETE /api/history/all
//@desc Delete all prediction history for the authenticated user
//@access Private
router.delete('/all'. auth, async (req, res) => {
	try {
		//Delete all history records where the userId matches the authenticated user's ID
		await PredictionHistory.deletemany({ userId: req.user.id });
		res.json({ msg: 'All prediction history deleted successfully' });
	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server Error');
	}
});


module.exports = router;
