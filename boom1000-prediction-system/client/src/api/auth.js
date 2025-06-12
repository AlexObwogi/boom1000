 import axios from 'axios';

//Get server URL from environment variables
const API_URL = process.env.REACT_APP_SERVER_URL + '/api/auth';

// Function to register a new user
export const registerUser = async (username, password) => {
	try {
		const res = await axios.post(`${API_URL}/register`, { username, password });
		return res.data; // Returns { token, msg }
	} catch (err) {
		throw err.response.data.msg || err.msg; //Throw error message
	}
};

//Function to log in a user
export const loginUser = async (username, password) => {
	try {
		const res = await axios.post(`${API_URL}/login`, { username, password });
		return res.data; // Returns { token, msg}
	} catch (err) {
		throw err.response.data.msg || err.messsage; // Throw error messae
	}
};
