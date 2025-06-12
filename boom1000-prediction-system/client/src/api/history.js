import axios from 'axios'; 

const API_URL = process.env.REACT_APP_SERVER_URL + '/api/history';

//Function to fetch all prediction history for the current user
export const getHistory = async (token) => {
	try {
		const res = await axios.get(API_URL, {
			headers: { 'x-auth-token': token }
		});
		return res.data; // Returns an array of history objects
	} catch (err) {
		throw err.response.data.msg || err.message;
	}
};

//Functions to add a new prediction history record for the current user
export const addHistoryRecord = async (record, token) => {
	try {
		const res = await axios.post(API_URL, record, {
			headers: { 'x-auth-token': token }
		});
		return res.data; // Returns the newly added history record
	} catch (err) {
		throw err.response.data.msg || err.message;
	}
};

//Function to delete all prediction history for the current user
export const deleteAllHistory = async (token) => {
	try {
		const res = await axios.delete(`${API_URL}/all`, {
			headers: { 'x-auth-token': token }
		});
		return res.data; // Returns { msg }
	} catch (err) {
		throw err.response.data.msg || err.message;
	}
};
