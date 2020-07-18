
# ISS TRACKER

You will need a mapbox token which you can get from mapbox.

Set the token on .env/.env.local in REACT_APP_MAPBOX_ACCESS_TOKEN

Data is fetched from http://www.celestrak.com/NORAD/elements/stations.txt

There's an issue with CORS. You need to enable CORS on browser to be able to fetch data on `Development` mode (`npm start`).

It works properly in `Production` but you have to change the api url to `/satellites` in App.js

## Installation

### `npm install`

## Development Mode

### `npm start`

Runs the app in the development mode.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Production Mode

### `npm run build`

Build the project.

### `node server.js`

Runs the app in the production mode.<br />
Open [http://localhost:8080](http://localhost:8080) to view it in the browser.