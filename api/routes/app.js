const express = require("express");
const app = express();
const morgan = require("morgan");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const requestIp = require('request-ip');


const businessRoutes = require("./api/routes/business");
const businessProfileRoutes = require("./api/routes/businessProfile");
const adsTypeRoutes = require("./api/routes/adstype");
const adsPreferencesRoutes = require("./api/routes/adspreferences");
const countrypriceRoutes = require("./api/routes/countryprice");
const statespriceRoutes = require("./api/routes/statesprice");
const citiespriceRoutes = require("./api/routes/citiesprice");
const arealocalitypriceRoutes = require("./api/routes/arealocalityprice");

const bspostRoutes = require("./api/routes/bspost");

const countrylistRoutes = require("./api/routes/countrylist");
const stateslistRoutes = require("./api/routes/stateslist");
const citieslistRoutes = require("./api/routes/citieslist");
const arealocalitylistRoutes = require("./api/routes/arealocalitylist");
const agelistRoutes = require("./api/routes/agelist");
const professionlistRoutes = require("./api/routes/professionlist");
const genderlistRoutes = require("./api/routes/genderlist");
const agelistpriceRoutes = require("./api/routes/agelistprice");
const professionlistpriceRoutes = require("./api/routes/professionlistprice");
const genderlistpriceRouts = require("./api/routes/genderlistprice");
const adspriceverificationRouts = require("./api/routes/adspriceverification");
const reviewQuestionPriceRouts = require("./api/routes/reviewQuestionPrice");

const userRoutes = require('./api/routes/user');
const passwordRoutes = require('./api/routes/password');
const contentRoutes = require('./api/routes/content');
const offerRoutes = require('./api/routes/offers');
const contactsRoutes = require('./api/routes/contacts');
const feedRoutes = require('./api/routes/feeds')
const searchRoutes = require('./api/routes/search')
const userDetailsRoutes = require('./api/routes/userDetails')
const challengeRoutes = require('./api/routes/challenge')
const notificationRoutes = require('./api/routes/notifications')
const hobbiesRoutes = require('./api/routes/interests')
//const getBusinessRoutes = require("./api/routes/getBusiness");
/*app.use((req, res, next) => {
	res.status(200).json({
		message: 'It works!'
	});
  
});*/

mongoose.connect('mongodb://159.89.171.82:27017/FvmeGear_Testing',{ useNewUrlParser: true });

mongoose.Promise = global.Promise;

app.use(morgan("dev"));
app.use('/uploads', express.static('uploads'));
app.use('/uplad_business_ads', express.static('uplad_business_ads'));
app.use('/business_posts', express.static('business_posts'));
app.use('/feeds_files', express.static('feeds_files'));
app.use('/feeds_files_comprs', express.static('feeds_files_comprs'));
app.use('/thumbnail', express.static('thumbnail'));
app.use('/thumbnails', express.static('thumbnails'));
app.use('/uploads_comprs', express.static('uploads_comprs'));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(bodyParser.json({limit: '4000mb'}));
app.use(bodyParser.urlencoded({limit: '4000mb', extended: false}));
/*
app.use((req, res, next) => {
  res.status(200).json({
	  message: 'It works'
  });
});
*/
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
    return res.status(200).json({});
  }
  next();
});

// Routes which should handle requests
app.use("/Business", businessRoutes);
app.use("/BusinessProfile", businessProfileRoutes);
//app.use("/listOfBusiness", businessRoutes);
app.use("/businessAds", adsTypeRoutes);
app.use("/preferencesAds", adsPreferencesRoutes);
app.use("/country", countrylistRoutes);

app.use("/state", stateslistRoutes);
app.use("/cities", citieslistRoutes);
app.use("/locality", arealocalitylistRoutes);
app.use("/businessPost", bspostRoutes);
app.use("/age", agelistRoutes);
app.use("/profession", professionlistRoutes);
app.use("/gender", genderlistRoutes);

/* Prices */
app.use("/countryPrice", countrypriceRoutes);
app.use("/statePrice", statespriceRoutes);
app.use("/citiesPrice", citiespriceRoutes);
app.use("/localityPrice", arealocalitypriceRoutes);
app.use("/ageWisePrice", agelistpriceRoutes);
app.use("/professionPrice",professionlistpriceRoutes);
app.use("/genderPrice", genderlistpriceRouts);
app.use("/adsprice", adspriceverificationRouts);
app.use("/review", reviewQuestionPriceRouts);

app.use("/user", userRoutes);
app.use("/password", passwordRoutes);
app.use("/content", contentRoutes);
app.use("/offers", offerRoutes);
app.use("/contacts", contactsRoutes);
app.use("/feeds", feedRoutes);
app.use("/search", searchRoutes);
app.use("/userdetails",userDetailsRoutes);
app.use("/challenge",challengeRoutes);
app.use("/notifications",notificationRoutes);
app.use("/hobbies",hobbiesRoutes);

/* End Prices */

//app.use("/getBusinessProfiles/:iv_acountid", businessRoutes);

app.use((req, res, next) => {
  const error = new Error("Not found");
   const clientIp = requestIp.getClientIp(req); 
   console.log(clientIp);
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message
    }
  });
});

/*app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message
    }
  });
});*/

module.exports = app;
/*var mongoose = require('mongoose');
var db = mongoose.createConnection('mongodb://127.0.0.1:27017/ivicatech_business');
db.on('error', function (err) {
console.log('connection error', err);
});
db.once('open', function () {
console.log('connected.');
});

// create a schema
var businessprofileSchema = mongoose.Schema({
iv_acountid: Number,
bus_prof_name: String,
bus_prof_location: String,
bus_prof_mobile: Number,
bus_prof_email: String,
bus_prof_gst: String,
bus_prof_pan: String,
bus_prof_typeofbusiness: String,
bus_prof_menu: String,
bus_prof_create:{ type: Date, default: Date.now },
bus_prof_update: Date
});

// we need to create a business_profile model using it
var business_profile = db.model('business_profile', businessprofileSchema,'business_profile');


var express = require("express");
var cors = require("cors");
var app = express();
var http = require('http');
app.use(express.static('./'));

app.listen(3699, function(){
    console.log('listening on port 3699')
})
//var router = express.Router();
var session = require("express-session");

var bodyParser = require('body-parser');
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(cors());
*/

/*
var business_profileSave = new business_profile({
iv_acountid: 12345,
bus_prof_name: 'Hema',
bus_prof_location: 'Hyderabad',
bus_prof_mobile: 7993874286,
bus_prof_email: 'vsrinivasa.rk@gmail.com',
bus_prof_gst: '123wer234',
bus_prof_pan: 'CAPGK1',
bus_prof_typeofbusiness: 'feed',
bus_prof_menu: 'Menu'
});

business_profileSave.save(function (err,data){
console.log(data);
});
*/

/* Create Business Profile API */

// Create Api for Book
/*
app.post('/createBusinessProfile/add', function(req,res) {
	//:bookName/:quantity/:branch/:author
	//res.send(req.body);
	     if(req.body.forfactor) {
			 console.log(req.body.forfactor);
		 } else {
			 console.log('No form factor');
		 }
		 
		 var iv_acountid = req.body.iv_acountid;
		 var bussiness_name = req.body.bussiness_name;
		 var bussiness_location = req.body.bussiness_location;
		 var bussiness_mobile = req.body.bussiness_mobile;
		 var bussiness_email = req.body.bussiness_email;
		 var bussiness_gst = req.body.bussiness_gst;
		 var bussiness_pancard = req.body.bussiness_pancard;
		 var bussiness_menu = req.body.bussiness_menu;
		 
		 //var date = req.params.date;
		 
		 var newBusiness_profileSave = new business_profileSave();
		 
		 //newBook.bookName = bookName;
		 newBusiness_profileSave.iv_acountid = iv_acountid;
		 newBusiness_profileSave.bussiness_name = bussiness_name;
		 newBusiness_profileSave.bussiness_location = bussiness_location;
		 newBusiness_profileSave.bussiness_mobile = bussiness_mobile;
		 newBusiness_profileSave.bussiness_email = bussiness_email;
		 newBusiness_profileSave.bussiness_gst = bussiness_gst;
		 newBusiness_profileSave.bussiness_pancard = bussiness_pancard;
		 newBusiness_profileSave.bussiness_menu = bussiness_menu;
		 //newBook.date = new Date();
		 
		 newBusiness_profileSave.save(function(err, saveBsProfile) {
			 if(err) {
				 console.log(err);
				 res.status(500).send();
			 } else {
				 
				 res.send(saveBsProfile);
			 }
		 })
});
*/
/* End API for Create Business Profile API */
/*
// create a schema
var userSchema = mongoose.Schema({
firstname: String,
lastname: String
});
// we need to create a model using it
var User = db.model('User', userSchema);
var u1 = new User({
firstname: 'Manish',
lastname: 'Prakash',
});
u1.save(function (err,data){
console.log(data);
});

var mongoose = require('mongoose');
 
mongoose.connect('mongodb://127.0.0.1:27017/kvsr	', function (err) {
 
   if (err) throw err;
 
   console.log('Successfully connected');
 
});
var mongoose = require('mongoose');
var conn = mongoose.createConnection('mongodb://localhost/admin');

    if (conn) {
		console.log("successfully connected to the database");
        
    } else {
        console.log("doesn't connected DB");
    }
   */