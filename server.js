'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
const bodyParser = require('body-parser');

var cors = require('cors');

var app = express();
require('dotenv').config();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/
const connection = mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true });

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
});

// your first API endpoint... 
app.get("/api/hello", function(req, res) {
    res.json({ greeting: 'hello API' });
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const validation = /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/gi;

const urlSchema = new mongoose.Schema({
    original_url: { type: String, required: true },
    short_url: Number,
});

const UrlObj = mongoose.model('UrlObj', urlSchema);

app.post("/api/shorturl/new", async(req, res) => {
    const url = req.body.url;
    if (url.match(new RegExp(validation))) {
        const obj = await UrlObj.findOne({ original_url: url });
        if (obj) {
            res.json({ "original_url": obj['original_url'], "short_url": obj['short_url'] });
        } else {
            const all = await UrlObj.find();
            const createdUrl = await UrlObj.create({ original_url: url, short_url: (all.length + 1) });
            res.json({ "original_url": createdUrl['original_url'], "short_url": createdUrl['short_url'] });
        }
    } else {
        res.json({ "error": "invalid URL" });
    }
});

app.get("/api/shorturl/:value", async(req, res) => {
    const obj = await UrlObj.findOne({ short_url: req.params.value });
    if (obj) {
        res.redirect(obj['original_url']);
    } else {
        res.json({ "error": "invalid URL" });
    }
});

app.listen(port, function() {
    console.log('Node.js listening ...');
});