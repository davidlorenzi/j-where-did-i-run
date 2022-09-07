import React from "react";
import { connect } from "react-redux";

import { getUserActivities, reverseGeocode } from "../utils/functions";

const loadAllRuns = async (userId, accessToken, countRuns) => {
  let allRuns = [];
  let mapLocations = {}
  let page = 1;
  while (allRuns.length < countRuns) {
    console.log('YourDistance.loadAllRuns() > page: ', page);
    let activities = await getUserActivities(userId, accessToken, page);
    allRuns = allRuns.concat(activities.data.filter(a => a.sport_type === "Run"))
    page++;
  }
  for (let idx = 0; idx < allRuns.length; idx++) {
    const run = allRuns[idx];
    if(run.start_latlng[0] && run.start_latlng[1]){
      const key = run.start_latlng[0]+"_"+run.start_latlng[1];
      if(!mapLocations.hasOwnProperty(key)) mapLocations[key] = { city: "", region: "", country: "" };
    }
  }
  console.log('YourDistance.loadAllRuns() > mapLocations: ', mapLocations);
  
  for (const key in mapLocations) {
    if (Object.hasOwnProperty.call(mapLocations, key)) {
      const lat = key.split("_")[0];
      const lng = key.split("_")[1];
      const response = await reverseGeocode(lat, lng);
      const address = response.data.results[0].address_components;
      mapLocations[key].city = address.filter(addr => addr.types.includes("locality")).length > 0 ? address.filter(addr => addr.types.includes("locality"))[0].long_name : 'Unknown';
      mapLocations[key].region = address.filter(addr => addr.types.includes("administrative_area_level_1")).length > 0 ? address.filter(addr => addr.types.includes("administrative_area_level_1"))[0].long_name : 'Unknown';
      mapLocations[key].country = address.filter(addr => addr.types.includes("country")).length > 0 ? address.filter(addr => addr.types.includes("country"))[0].long_name : 'Unknown';
    }
  }
  console.log('YourDistance.loadAllRuns() > mapLocations: ', mapLocations);
  for (let idx = 0; idx < allRuns.length; idx++) {
    const run = allRuns[idx];
    const key = run.start_latlng[0]+"_"+run.start_latlng[1];
    if(mapLocations.hasOwnProperty(key)) allRuns[idx] = { ...run, ...mapLocations[key] }
  }
  console.log('YourDistance.loadAllRuns() > allRuns: ', allRuns);
  // const user = await getUserActivities(userId, accessToken);
}

const YourDistance = ({ user, returnTokens }) => {
  console.log('YourDistance > returnTokens: ', returnTokens);
  return (
    <div>
      <h1>Hi, {returnTokens.athlete.firstname}!</h1>
      <h2>Total runs: {user.data.all_run_totals.count}</h2>
      <h2>Total distance: {user.data.all_run_totals.distance}</h2>
      <button onClick={() => loadAllRuns(returnTokens.athlete.id, returnTokens.access_token, user.data.all_run_totals.count)}>Load complete data</button>
    </div>
  );
};

const mapStateToProps = (state) => {
  return {
    user: state.user,
    returnTokens: state.returnTokens,
  };
};

export default connect(mapStateToProps)(YourDistance);
