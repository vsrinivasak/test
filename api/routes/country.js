const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");


const country = require("../models/country");

/* Create country */
router.post("/create",(req, res, next) => {

	const Country = new country({
    _id: new mongoose.Types.ObjectId(),
    ads_id: req.body.ads_id,
	country_name: req.body.country_name,
	country_code: req.body.country_code,
	country_bs_price: req.body.country_bs_price,
	
  });
  Country
    .save()
    .then(result => {
      
      res.json({
		  
		status: "Ok",
        message: "Successfully Created Country",
        countryBusinessPrice: result
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
  
  adspreferences.find()
    .select("_id ads_id country_name country_code country_bs_price country_create")
    .exec()
    .then(docs => {
      res.json({
		status: "Ok",
        message: "List Of Business Types Ads Preferences",
        count: docs.length,
        countryBusinessPriceList: docs.map(doc => {
          return {
			_id: doc._id,
			ads_id: doc.ads_id,
			country_name: doc.country_name,
			country_code: doc.country_code,
			country_bs_price: doc.country_bs_price,
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