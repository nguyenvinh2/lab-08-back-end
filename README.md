# lab-08-back-end

**Author**: Vinh Nguyen
**Version**: 1.0.0

## Overview
This is an educational back-end application build working in various stages with different collaborators using version control git and deployment to Heroku. Refer to repository lab-07 and lab-06 for previous version.

This version in particular will focus in persisting our data from in a SQL database. Upon each request, check the database for the records that match the search query. If the records exist, this application will check how old they are and determin if those records should be used. If the records do not exist, you will request them from the API

## Getting Started
We are working from Vinh's create repo "lab-08-back-end" deploying our back-end to heroku "lab08-backend.herokuapp.com" . Then provisioned a SQL database on Heroku. Followed by:

# Database set-up
* Table Creation within our SQL shell
* Create server logic
   * create a function to check the database for the location information
   * Write a single lookup function that is dynamic and can be shared by all of the models. (accepts: search query, function to execute if the records exist in the table, function to execute if the records do not exist in the table)
* within the route callback, invoke your lookup function, passing the appropriate options
* put database to Heroku instance
# Cache invalidation
* Update each model to include a new property to keep track of when the record was added tot ethe database
* create a dynamic function to delete records from a specific tables, which is shared by all of our models
* For each model, refactor the function that is invoked if the records exist in the database in the following manner:
   * function should include the logic to determine how long ago the records were created and stored
   * Decide how long each table's records should be stored. These durations should be based on the data each API provides.
   * If the records exceeds this amount of time, remove only the records that correspond to the user's search query, while leaving the records from other search queries as-is. Request a new set of data from the API
   * If the records do not exceed this amount of time, send the records in your response to the client



## Architecture
# APIs used
* express
* superagent
* cors
* Node
* dotenv
* postgresql db

# version control/ tools
* github
* Heroku
* Visual Studio
* Ubuntu shell
* Git bash


## Change Log
Use this area to document the iterative changes made to your application as each feature is successfully implemented. Use time stamps. Here's an examples:

01-01-2001 4:59pm - Application now has a fully-functional express server, with a GET route for the location resource.

## Credits and Collaborations
Derrick Hwang
Vinh Nguyen

-->