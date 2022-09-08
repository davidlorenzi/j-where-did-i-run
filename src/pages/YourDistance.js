import React, { useState } from "react";
import _ from "lodash";
import { connect } from "react-redux";
import { ProgressBar } from "react-bootstrap";

import { getUserActivities, reverseGeocode } from "../utils/functions";

const YourDistance = ({ user, returnTokens }) => {
  const [status, setStatus] = useState("Need data");
  const [cacheParcentage, setCacheParcentage] = useState(0);
  const [geocodingParcentage, setGeocodingParcentage] = useState(0);
  const [parsingParcentage, setParsingParcentage] = useState(0);
  const [runsByRegion, setRunsByRegion] = useState([]);
  const [runsByCountry, setRunsByCountry] = useState([]);

  const loadAllRuns = async (userId, accessToken, countRuns) => {
    setStatus("Loading...");
    setRunsByRegion([]);
    setRunsByCountry([]);
    setCacheParcentage(0);
    setGeocodingParcentage(0);
    setParsingParcentage(0);
    let allRuns = [];
    let mapLocations = {}
    let page = 1;
    while (allRuns.length < countRuns) {
      setStatus("Loading (page " + page + ")...");
      let activities = await getUserActivities(userId, accessToken, page);
      allRuns = allRuns.concat(activities.data.filter(a => a.sport_type === "Run"));
      setCacheParcentage((100*allRuns.length/countRuns).toFixed(2));
      page++;
    }
    for (let idx = 0; idx < allRuns.length; idx++) {
      const run = allRuns[idx];
      if(run.start_latlng[0] && run.start_latlng[1]){
        const key = run.start_latlng[0]+"_"+run.start_latlng[1];
        if(!mapLocations.hasOwnProperty(key)) mapLocations[key] = { city: "", region: "", country: "" };
      }
    }
    
    setStatus("Gecoding...");
    let countGeocode = 0;
    let totalGeocode = Object.keys(mapLocations).length
    for (const key in mapLocations) {
      if (Object.hasOwnProperty.call(mapLocations, key)) {
        const lat = key.split("_")[0];
        const lng = key.split("_")[1];
        const response = await reverseGeocode(lat, lng);
        countGeocode++;
        const address = response.data.results[0].address_components;
        mapLocations[key].city = address.filter(addr => addr.types.includes("locality")).length > 0 ? address.filter(addr => addr.types.includes("locality"))[0].long_name : 'Unknown';
        mapLocations[key].region = address.filter(addr => addr.types.includes("administrative_area_level_1")).length > 0 ? address.filter(addr => addr.types.includes("administrative_area_level_1"))[0].long_name : 'Unknown';
        mapLocations[key].country = address.filter(addr => addr.types.includes("country")).length > 0 ? address.filter(addr => addr.types.includes("country"))[0].long_name : 'Unknown';
        setGeocodingParcentage((100*countGeocode/totalGeocode).toFixed(2));
      }
    }
  
    for (let idx = 0; idx < allRuns.length; idx++) {
      const run = allRuns[idx];
      const key = run.start_latlng[0]+"_"+run.start_latlng[1];
      if(mapLocations.hasOwnProperty(key)) allRuns[idx] = { ...run, ...mapLocations[key] }
      setParsingParcentage((100*(idx+1)/allRuns.length).toFixed(2));
    }
    console.log('YourDistance.loadAllRuns() > allRuns: ', allRuns);
  
    setRunsByRegion(getRunCounters(allRuns, 'region'));
    console.log('YourDistance.loadAllRuns() > runsByRegion: ', runsByRegion);
  
    setRunsByCountry(getRunCounters(allRuns, 'country'));
    console.log('YourDistance.loadAllRuns() > runsByCountry: ', runsByCountry);
    setStatus("Ready!");
  }
  
  const getRunCounters = (runs, level) => {
    let results = [];
    let draft = _.groupBy(runs, level);
    for (const key in draft) {
      if (Object.hasOwnProperty.call(draft, key) && key !== "undefined") {
        const filteredRuns = draft[key];
        results.push({ name: key, totals: filteredRuns.length, races: filteredRuns.filter(r => r.workout_type === 1).length });
      }
    }
    return results
  }

  return (
    <div>
      <h1>Hi, {returnTokens.athlete.firstname}!</h1>
      <h2>Total runs: {user.data.all_run_totals.count}</h2>
      <h2>Total distance: {user.data.all_run_totals.distance}</h2>
      <button onClick={() => loadAllRuns(returnTokens.athlete.id, returnTokens.access_token, user.data.all_run_totals.count)}>Load complete data</button>
      <div>{status}</div>
      <div>
        Caching: <ProgressBar variant="info" now={cacheParcentage} label={`${cacheParcentage}%`} />
      </div>
      <div>
        Geocoding: <ProgressBar variant="info" now={geocodingParcentage} label={`${geocodingParcentage}%`} />
      </div>
      <div>
        Parsing: <ProgressBar variant="info" now={parsingParcentage} label={`${parsingParcentage}%`} />
      </div>
      <div>
        <h2>Data by Region:</h2>
        { runsByRegion.map(region => <div key={region.name}><p>Name: {region.name} || Runs: {region.totals} - Races: {region.races}</p></div>)}
      </div>
      <div>
        <h2>Data by Country:</h2>
        { runsByCountry.map(country => <div key={country.name}><p>Name: {country.name} || Runs: {country.totals} - Races: {country.races}</p></div>)}
      </div>
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
