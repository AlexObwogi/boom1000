const mongoose = require('mongoose');
const Schema = mongoose.Schema; // You need to define schema from mongoose

//Define the user schema
const UserSchema = new Schema({
	username: {
		type: String,
		required: true,
		unique: true, // Ensure usernames are unique
		trim: true, // Remove whitespace from both ends
		minlength: 3 // Minimun length for username
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
