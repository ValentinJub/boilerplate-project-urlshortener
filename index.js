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

//serves the css file
app.use('/public', express.static(`${process.cwd()}/public`));

//serves the HTML file
app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// Display time
app.get('/api/now', function(req, res) {
  res.json({ time: new Date()});
});

//route parameters
app.get('/:word/echo', (req, res) => {
  res.json({echo: req.params.word});
})

//more complex route parameters
app.get('/user/:userName/level/:userLevel', (req, res) => {
  res.json({Greeting: `Hi ${req.params.userName} it's nice to see you again with your massive level ${req.params.userLevel} :)`});
})



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

app.get('/api/shorturl/:short_url', (req, res) => {
  console.log(req.params.short_url);
  findByShortURL(req.params.short_url, (err, data) => {
    if(err) return console.error(err);
    //the url returned is data[0]["url"]
    res.redirect(data[0]["url"]);
  });
})

function findByURL(object, done) {
  //Model.exists returns an object if a result is found
  //otherwise it returns null
  URL.exists({url: object.url}, (err, result) => {
    if(err) return console.error(err);
    else {
      done(null, result);
    }
  });
}

function findByShortURL(short_url, done) {
  //Model.find returns an array of object
  //here we target via unique (they should be unique.... but they aren;t and
  //duplicate may exist, multiple results will be returned but only
  //the first will be used with [0]["url"]
  URL.find({short_url: short_url}, (err, result) => {
    if(err) return console.error(err);
    else {
      done(null, result);
    }
  });
}

app.post("/api/shorturl", (req, res) => {

  let URLvalidator = new RegExp('^https?:\/\/');
  const fullURL = req.body.url;
  const protocolLessURL = fullURL.replace(URLvalidator, '');
  console.log(fullURL);
  console.log(protocolLessURL);
  
  // //clean slate 
  // clearDB();

  let randomNumber = Math.floor(Math.random() * 100000 + 1);
  //if the dns name is not resolved
  if( ! URLvalidator.test(fullURL) ) {
    res.json({error: 'invalid url'});
  }
  else {
    fetchAll((err, arr) => {
      if(err) return console.error(err);
      if (!arr) {
        console.log("Missing `done()` argument");
        return console.error({ message: "Missing callback argument" });
      }
      console.log(`There are ${arr.length} documents in the table URLs`);
    })

    findByURL(req.body, (err, data) => {
      //handle errors before data
      if(err) return console.error(err);
      //url in req body is the one sent through the form 
      creatAndSaveURL({url: req.body.url, short_url: randomNumber}, (err, url) => {
        if(err) return console.error(err);
        if (!url) {
          console.log("Missing `done()` argument");
          return console.error({ message: "Missing callback argument" });
        }
        URL.findById(url._id, function (err, data) {
          if (err) {
            return console.error(err);
          }
          res.json({original_url: data.url, short_url: data.short_url});
        });
      });
    });
  }
});
  //we need to make sure it starts with https://www. || http://www.
  //dns lookup need to have the .com extension and the hostname without the protocol
  //google.com ok | google not ok 
  
function clearDB() {
  URL.deleteMany({url: /\w+/}, (err, result) => {
    if(err) return console.error(err);
    console.log(result);
  });
}

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
