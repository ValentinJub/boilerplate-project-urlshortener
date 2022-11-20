require('dotenv').config();
//used for the db
const mongoose = require('mongoose');

//used for dns.lookup()
const dns = require('dns');
//used to handle http requests
const express = require('express');
const app = express();

//used to parse the raw data which contains a lot of metadata 
//of the POST request to only extract the data we want
//using REQUEST.body object
const bodyParser = require('body-parser');
//Here we are configuring express to use body-parser as middle-ware.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//cross origin something, used for security and exchanging data protocols
const cors = require('cors');

//we connect to our DB using .env VAR
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

//we need to create a schema that holds the shortkey and the link
const urlSchema = new mongoose.Schema({
  url: {type: String, required: true},
  short_url: Number
});

//creates a model from schema, mdels are fancy constructors 
let URL = mongoose.model('URL', urlSchema);

//create one that deletes
//create one that queries by short-url
//create one that queries by url
function retrieveURLId(url, done) {
  URL.findOne({url: url}, (err, data) => {
    if(err) return console.error(err);
    else {
      console.log(data);
      done(null, data);
    }
  })
}

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

//create a function that create and save a document
function creatAndSaveURL(object, done) {
  //create the new document from URL
  let newEntry = new URL({
    url: object.url,
    short_url: object.short_url
  });
  newEntry.save((err, data) => {
    if(err) return console.error(err);
    else {
      console.log("New entry in the database: " + data);
      done(null, data);
    }
  });
};

function fetchAll(done) {
  URL.find((err, arr) => {
    if(err) console.error(err);
    if (!arr) {
      console.log("Missing `done()` argument");
      return console.error({ message: "Missing callback argument" });
    }
    done(null, arr);
  });
}

function findByURL(url, done) {
  URL.find({url: url}, (err, data) => {
    if(err) return console.error(err);
    if (!data) {
      console.log("Missing `done()` argument");
      return console.error({ message: "Missing callback argument" });
    }
    done(null, data);
  });
}

app.post("/api/shorturl", (req, res) => {
  let count = 0;
  let index;

  fetchAll((err, arr) => {
    if(err) return console.error(err);
    if (!arr) {
      console.log("Missing `done()` argument");
      return console.error({ message: "Missing callback argument" });
    }
    index = arr;
    count = arr.length;
    console.log(`There are ${count} documents in the table URLs`);
  })

  findByURL(req.body.url, (err, data) => {
    if(err) return next(err);
    if (!data) {
      console.log("Missing `done()` argument");
      return console.error({ message: "Missing callback argument" });
    }
    console.log("Entry found for req.body.url: " + data);
  })

  //url in req body is the one sent through the form 
  creatAndSaveURL({url: req.body.url, short_url: count + 1}, (err, url) => {
    if(err) return nconsole.error(err);
    if (!url) {
      console.log("Missing `done()` argument");
      return console.error({ message: "Missing callback argument" });
    }
    URL.findById(url._id, function (err, data) {
      if (err) {
        return console.error(err);
      }
      res.json(data);
  });
});
  //we need to make sure it starts with https://www. || http://www.
  //dns lookup need to have the .com extension and the hostname without the protocol
  //google.com ok | google not ok 
  // dns.lookup(postData.url, function onLookup(err, address, family) {
  //   //if the dns name is not resolved
  //   if(err) console.log(err.stack);
    
  //   //if the dns is valid
  //   else {
  //     console.log('Valid DNS');
  //     console.log(URL.find({url: postData.url}, (err, data) => {
  //       if(err) return console.error(err);
  //       else {
  //         return console.log(data);
  //       }
  //     }));
  // });
});
  

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
