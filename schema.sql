
CREATE TABLE IF NOT EXISTS locations ( 
  id SERIAL PRIMARY KEY, 
  search_query VARCHAR(255), 
  formatted_query VARCHAR(255), 
  latitude NUMERIC(8, 6), 
  longitude NUMERIC(9, 6),
  created_at BIGINT
);

CREATE TABLE IF NOT EXISTS weathers ( 
  id SERIAL PRIMARY KEY, 
  forecast VARCHAR(255), 
  time VARCHAR(255), 
  created_at BIGINT,
  location_id INTEGER NOT NULL REFERENCES locations(id) 
);

CREATE TABLE IF NOT EXISTS yelp ( 
  id SERIAL PRIMARY KEY, 
  name VARCHAR(255),
  image_url VARCHAR(255),
  price VARCHAR(4),
  rating NUMERIC(4,2),
  url VARCHAR(255),
  location_id INTEGER NOT NULL REFERENCES locations(id),
  created_at BIGINT
);

CREATE TABLE IF NOT EXISTS movies ( 
  id SERIAL PRIMARY KEY, 
  title VARCHAR(255), 
  overview VARCHAR(5000), 
  average_votes NUMERIC(4,2),
  total_votes NUMERIC(1000,0),
  image_url VARCHAR(255),
  popularity NUMERIC(4,2),
  released_on VARCHAR(255),
  created_at BIGINT,
  location_id INTEGER NOT NULL REFERENCES locations(id) 
);

CREATE TABLE IF NOT EXISTS meetups (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255),
  link VARCHAR(255),
  creation_date VARCHAR(255),
  host VARCHAR(255),
  created_at BIGINT,
  location_id INTEGER NOT NULL REFERENCES locations(id)
);

CREATE TABLE IF NOT EXISTS trails (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  length NUMERIC(4,2),
  stars NUMERIC(4,2),
  star_votes NUMERIC(255,0),
  summary VARCHAR(255),
  trail_url VARCHAR(255),
  conditions VARCHAR(255),
  condition_date VARCHAR(255),
  condition_time VARCHAR(255),
  created_at BIGINT,
  location_id INTEGER NOT NULL REFERENCES locations(id)
);