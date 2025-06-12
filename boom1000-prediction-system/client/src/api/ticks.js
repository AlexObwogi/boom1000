import axios from 'axios';

const API_URL = process.env.REACT_APP_SERVER_URL + '/api/ticks';

//Function to fetch all ticks for the current user
export const getTicks = async (token) => {
	try {
		const res = await axios.get(API_URL, {
			headers: { 'x-auth-token': token } // send token for authentication
		});
		return res.data; // Returns an array of tick objects
	} catch (err) {
		throw err.response.data.msg || err.message;
	}
};

//Functions to add a new tick for the current user
export const addTick = async (value, token) => {
	try {
		const res = await axios.post(API_URL, { value }, {
			headers: { 'x-auth-token': token } // Send token for authentication
		});
		return res.data; // Returns the newly added tick object
	} catch (err) {
		throw err.response.data.msg || err.message;
	}
};

//Function to delete all ticks foe the current user
export const deleteAllTicks = async (token) => {
	try {
		const res = await axios.delete(`${API_URL}/all`, {
			headers: { 'x-auth-token': token } // SEnd token for authentication
		});
		return res.data; // Returns { msg }
	} catch (err) {
		throw err.response.data.msg || err.message;
	}
};

