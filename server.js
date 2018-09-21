'use strict';

const express = require('express');
const superagent = require('superagent');
const cors = require('cors');
const app = express();
const pg = require('pg');
const PORT = process.env.PORT || 3000;
require('dotenv').config();

const clients = new pg.Client(process.env.DATABASE_URL);
clients.connect();
clients.on('error', err => console.error(err));

app.use(cors());


app.get('/weather', getWeather);
app.get('/movies', getMovies);
app.get('/yelp', getYelp);
app.get('/location', searchLocation);


//Common Functions BLOCK START
//erase form database
const eraseTable = (table, city) => {
  const SQL = `DELETE from ${table} WHERE location_id=${city};`;
  return clients.query(SQL);
}

//lookup database for matches
function lookUp(options) {
  const SQL = `SELECT * FROM weathers WHERE location_id=$1;`;
  const values = [options.query.id];
  clients.query(SQL, values)
    .then(result => {
      if (result.rowCount > 0) {
        options.cacheHit(result.rows);
      } else {
        options.cacheMiss();
      }
    })
    .catch(error => handleError(error));
}

function handleError(err, res) {
  console.error(err);
  if (res) res.status(500).send('Error 505');
}
//COMMON Functions BLOCK END

//location functions START BLOCK
// constructor function for geolocation - called upon inside the request for location
function LocationData(query, result) {
  this.tableName = 'locations';
  this.search_query = query;
  this.formatted_query = result.body.results[0].formatted_address;
  this.latitude = result.body.results[0].geometry.location.lat;
  this.longitude = result.body.results[0].geometry.location.lng;
  this.created_at = Date.now();
}

//Main Function for location runs by app.
function searchLocation(request, response) {
  LocationData.lookupLocation({
    tableName: LocationData.tableName,
    query: request.query.data,
    cacheHit: function (result) {
      response.send(result);
    },
    cacheMiss: function () {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${request.query.data}&key=${process.env.GOOGLE_API_KEY}`;
      return superagent.get(url)
        .then(result => {
          const location = new LocationData(this.query, result);
          location.save()
            .then(location => response.send(location));
        })
        .catch(error => handleError(error));
    }
  });
}

//Checks postgres database
LocationData.lookupLocation = (location) => {
  const SQL = `SELECT * FROM locations WHERE search_query=$1;`;
  const values = [location.query];
  return clients.query(SQL, values)
    .then(result => {
      if (result.rowCount > 0) {
        location.cacheHit(result.rows[0]);
      } else {
        location.cacheMiss();
      }
    })
    .catch(console.error);
}

//for saving data
LocationData.prototype = {
  save: function () {
    const SQL = `INSERT INTO locations (search_query, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING RETURNING id;`;
    const values = [this.search_query, this.formatted_query, this.latitude, this.longitude];
    return clients.query(SQL, values)
      .then(result => {
        this.id = result.rows[0].id;
        return this;
      });
  }
}
//LOCATION FUNCTIONS END BLOCK

//weather functions START BLOCK
function Weather(day) {
  this.tableName = 'weathers';
  this.time = new Date(day.time * 1000).toString().slice(0, 15);
  this.forecast = day.summary;
  this.created_at = Date.now();
}

Weather.prototype = {
  save: function (location_id) {
    const SQL = `INSERT INTO ${this.tableName} (forecast, time, created_at, location_id) VALUES ($1, $2, $3, $4);`;
    const values = [this.forecast, this.time, this.created_at, location_id];
    clients.query(SQL, values);
  }
}

//send request to DarkSkys API and gets data back, then calls on Weather function to display data
function getWeather(request, response) {
  lookUp({
    tableName: Weather.tableName,
    query: request.query.data,
    cacheMiss: function () {
      const url=`https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${request.query.data.latitude},${request.query.data.longitude}`;
      return superagent.get(url)
        .then(result => {
          const weatherSummaries = result.body.daily.data.map(day => {
            const weatherItem = new Weather(day);
            weatherItem.save(request.query.data.id);
            return weatherItem;
          });
          response.send(weatherSummaries);
        })
        .catch(error => handleError(error, response));
    },
    cacheHit: function (resultsArray) {
      let ageOfResultsInMinutes = (Date.now() - resultsArray[0].created_at) / (1000 * 60);
      if (ageOfResultsInMinutes > 30) {
        eraseTable(Weather.tableName, request.query.data.id);
        this.cacheMiss();
      } else {
        response.send(resultsArray);
      }
    }
  });
}
//End weather functions block______________________________________________________________________________________
// Yelp Constructor Function
function Yelp(data) {
  this.tableName = 'yelp';
  this.name = data.name;
  this.image_url = data.image_url;
  this.price = data.price;
  this.rating = data.rating;
  this.url = data.url;
  this.created_at = Date.now();
}

//Yelp save values into array function
Yelp.prototype = {
  save: function (location_id) {
    const SQL = `INSERT INTO ${this.tableName} (name, image_url, price, rating, url, location_id) VALUES ($1, $2, $3, $4, $5, $6);`;
    const values = [this.name, this.image_url, this.price, this.rating, this.url, location_id];
    clients.query(SQL, values);
  }
}

function getYelp(request, response) {
  lookUp({
    tableName: Yelp.tableName,
    query: request.query.data,
    cacheMiss: function () {
      const url = `https://api.yelp.com/v3/businesses/search?location=${request.query.data.search_query}`;
      return superagent.get(url)
        .set('Authorization', `Bearer ${process.env.YELP_API_KEY}`)
        .then(result => {
          const businessSummaries = result.body.businesses.map(data => {
            const yelpItem = new Yelp(data);
            yelpItem.save(request.query.data.id);
            return yelpItem;
          });
          console.log(request.query.data);
          console.log(businessSummaries);
          response.send(businessSummaries);
        })
        .catch(error => handleError(error, response));
    },
    cacheHit: function (resultsArray) {
      let ageOfResultsInMinutes = (Date.now() - resultsArray[0].created_at) / (1000 * 60);
      if (ageOfResultsInMinutes > 120) {
        eraseTable(Yelp.tableName, request.query.data.id);
        this.cacheMiss();
      } else {
        response.send(resultsArray);
      }
    }
  });
}
//YELP BLOCK END


//MOVIES BLOCK START

//Movies save values into array function
function MoviesData(movies) {
  this.tableName = 'movies';
  this.title = movies.title;
  this.overview = movies.overview;
  this.average_votes = movies.vote_average;
  this.total_votes = movies.vote_count;
  this.image_url = `https://image.tmdb.org/t/p/w200_and_h300_bestv2${movies.poster_path}`;
  this.popularity = movies.popularity;
  this.released_on = movies.release_date;
  this.created_at = Date.now();
}

MoviesData.prototype = {
  save: function (location_id) {
    const SQL = `INSERT INTO ${this.tableName} (title, overview, average_votes, total_votes, image_url, popularity, released_on, location_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);`;
    const values = [this.title, this.overview, this.averae_votes, this.total_votes, this.image_url, this.popularity, this.released_on, location_id];
    clients.query(SQL, values);
  }
}

function getMovies(request, response) {

  lookUp({
    tableName: MoviesData.tableName,
    query: request.query.data,
    cacheMiss: function () {
      const url = `https://api.themoviedb.org/3/search/movie?api_key=${process.env.MOVIES_API_KEY}&query=${request.query.data.search_query}`;
      return superagent.get(url)
        .then(result => {
          const moviesSummaries = result.body.results.map(data => {
            const moviesItem = new MoviesData(data);
            moviesItem.save(request.query.data.id);
            return moviesItem;
          });
          response.send(moviesSummaries);
        })
        .catch(error => handleError(error, response));
    },
    cacheHit: function (resultsArray) {
      let ageOfResultsInMinutes = (Date.now() - resultsArray[0].created_at) / (1000 * 60);
      if (ageOfResultsInMinutes > 180) {
        eraseTable(Yelp.tableName, request.query.data.id);
        this.cacheMiss();
      } else {
        response.send(resultsArray);
      }
    }
  });
}
//MOVIES BLOCK END

app.listen(PORT, () => console.log(`Listening on ${PORT}`));
