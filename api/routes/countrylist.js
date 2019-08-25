const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");


const countrylist = require("../models/countrylist");

/* Create countrylist */
router.post("/create",(req, res, next) => {

	const CountryList = new countrylist({
    _id: new mongoose.Types.ObjectId(),
    ads_id: req.body.ads_id,
	country_name: req.body.country_name,
	country_code: req.body.country_code
	
  });
  CountryList
    .save()
    .then(result => {
      
      res.json({
		  
		status: "Ok",
        message: "Successfully Created Country",
        createdCountryInfo: result
      });
    })
    .catch(err => {
      
      res.status(500).json({
        error: err
      });
    });
 
});

/* Country List */
// Handle incoming GET requests to /List

router.get("/List", (req, res, next) => {
  
  countrylist.find()
    .select("_id country_name country_code country_create")
    .exec()
    .then(docs => {
      res.json({
		status: "Ok",
        message: "List Of Business Countries",
        count: docs.length,
        countryBusinessPriceList: docs.map(doc => {
          return {
			_id: doc._id,
			country_name: doc.country_name,
			country_code: doc.country_code,
			country_create: doc.country_create
	
          };
        })
      });
    })
    .catch(err => {
      res.status(500).json({
        error: err
      });
    });
	
});


module.exports = router;