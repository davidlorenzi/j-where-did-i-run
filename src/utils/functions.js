import axios from "axios";

const { REACT_APP_CLIENT_ID, REACT_APP_CLIENT_SECRET, REACT_APP_GOOGLE_API_KEY } = process.env;

export const getParamValues = (url) => {
    return url
        .slice(1)
        .split("&")
        .reduce((prev, curr) => {
            const [title, value] = curr.split("=");
            prev[title] = value;
            return prev;
        }, {});
};

export const cleanUpAuthToken = (str) => { return str.split("&")[1].slice(5); };

export const testAuthGetter = async (authTok) => {
  try {
    const response = await axios.post(
      `https://www.strava.com/api/v3/oauth/token?client_id=${REACT_APP_CLIENT_ID}&client_secret=${REACT_APP_CLIENT_SECRET}&code=${authTok}&grant_type=authorization_code`
    );
    return response.data;
  } catch (error) {
    console.log('testAuthGetter() > error: ', error);
  }
};

export const getUserData = async (userID, accessToken) => {
  try {
    const response = await axios.get(
      `https://www.strava.com/api/v3/athletes/${userID}/stats`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    console.log('getUserData() > response: ', response);
    return response;
  } catch (error) {
    console.log('getUserData() > error:', error);
  }
};

export const getUserActivities = async (userID, accessToken, page) => {
  try {
    // "https://www.strava.com/api/v3/athlete/activities?before=&after=&page=&per_page=" "Authorization: Bearer [[token]]"
    const response = await axios.get(
      `https://www.strava.com/api/v3/athlete/activities?page=${page}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return response;
  } catch (error) {
    console.log('getUserActivities() > error:', error);
  }
};

export const reverseGeocode = async (latitude, longitude) => {
  try {
    // https://maps.googleapis.com/maps/api/geocode/json?latlng=40.714224,-73.961452&key=YOUR_API_KEY
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?language=it&latlng=${latitude},${longitude}&key=${REACT_APP_GOOGLE_API_KEY}`
    );
    return response;
  } catch (error) {
    console.log('reverseGeocode() > error:', error);
  }
};
