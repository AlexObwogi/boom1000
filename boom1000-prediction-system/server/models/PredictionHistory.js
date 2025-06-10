const mongoose = require('mongoose');

//Define the PredictionHistory Schema
const PredictionHistorySchema = new mongoose.Schema({
	userId: {
		type: mongoose.Schema.Types.ObjectId, //Link history to a specific user
		ref: 'User', // Reference the 'User' model
		required: true
	},
	predictedValue: {
		type: Number,
		required: true
	},
	actualValue: {
		type: Number,
		required: true
	},
	isCorrect: {
		type: Boolean,
		requuired: true
	},
	timestamp: {
		type: Date,
		default: Date.now
	},
	pattern: { // The pattern that led to the prediction (e.g., "10..5, 20")
		type: String,
		required: true
	},
	confidence: { // Confidence level of the prediction at the time
		type: Number,
		required: true
	},
	predictedRange: { // The range the actual value fell into (e.g., "Close (+/-1)")
		type: String,
		required: true
	}
});


//Optional: Add an index for faster querying by the user timestamp
PredictionHistorySchema.index({ userId: 1, timestamp: 1});


module.exports = mongoose.model('PredictionHistory', PredictionHistorySchema);

