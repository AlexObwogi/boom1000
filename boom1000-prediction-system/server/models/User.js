const mongoose = require('mongoose');

//Define the user schema
const userSchema = new mongoose.Schema({
	username: {
		type: String,
		required: true,
		unique: true, // Ensure usernames are unique
		trim: true // Remove whitespace from both ends
	},
	password: {
		type: String,
		required: true
	},
	date: {
		type: Date,
		default: Date.now //Automatically set creation date
	}
});


module.exports = mongoose.model('User', UserSchema);
