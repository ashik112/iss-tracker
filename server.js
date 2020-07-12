const express = require('express');
const bodyParser = require('body-parser')
const path = require('path');
const cors = require('cors');
const request = require('request');
const app = express();


app.use(cors());

app.use(express.static(path.join(__dirname, 'build')));

app.get('/satellites', (req, res) => {
    request('http://www.celestrak.com/NORAD/elements/stations.txt', function (error, response, body) {
        if (!error && response.statusCode === 200) {
            return res.send(body);
        }
    });
});

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(process.env.PORT || 8080);