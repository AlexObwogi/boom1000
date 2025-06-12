const mongoose = require('mongoose');

//Define the Tick Schema
const TickSchema = new mongoose.Schema({
	UserId: {
		type: mongoose.Schema.Types.ObjectId, //Link ticks to a specific user
		ref: 'User', //Reference the 'User' model
		required: true
	},
	value: {
		type: Number,
		required: true,
		min: 0 //Tick values should be non-negative
	},
	timestamp: {
		type: Date,
		dafault: Date.now //Automatically set timestamp of when the tick was added
	}
});


//Optional: Add an index for faster querying by user and timestamp
TickSchema.index({ userId:  1, timestamp: 1});

module.exports = mongoose.model('Tick', TickSchema);
