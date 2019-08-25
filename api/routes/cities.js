const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");


const businessCities = require("../models/cities");

/* Create cities */
router.post("/create",(req, res, next) => {

	const BusinessCities = new businessCities({
    _id: new mongoose.Types.ObjectId(),
    ads_id: req.body.ads_id,
	c_id: req.body.c_id,
	st_id: req.body.st_id,
	city_name: req.body.city_name,
	city_business_price: req.body.city_business_price
	
  });
  BusinessCities
    .save()
    .then(result => {
     
      res.json({
		  
		status: "Ok",
        message: "Successfully Created City Business Prices for ads",
        createdCityBusinessPrice: result
      });
    })
    .catch(err => {
      
      res.status(500).json({
        error: err
      });
    });
 
});

/* Cities List */
// Handle incoming GET requests to /List

router.get("/List", (req, res, next) => {
  
  businessCities.find()
    .select("_id ads_id c_id st_id city_name city_business_price city_createdate")
    .exec()
    .then(docs => {
      res.json({
		status: "Ok",
        message: "List Of Business Cities Business Prices for ads",
        count: docs.length,
        CitiesBusinessPriceList: docs.map(doc => {
          return {
			_id: doc._id,
			ads_id: doc.ads_id,
			c_id: doc.c_id,
			st_id: doc.st_id,
			city_name: doc.city_name,
			city_business_price: doc.city_business_price,
			city_createdate: doc.city_createdate
	
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