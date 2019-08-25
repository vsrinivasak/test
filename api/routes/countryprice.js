const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");


const countryprice = require("../models/countryprice");

/* Create countryprice */
router.post("/create",(req, res, next) => {

	const Countryprice = new countryprice({
    _id: new mongoose.Types.ObjectId(),
    ads_id: req.body.ads_id,
	c_id: req.body.c_id,
	country_bs_price: req.body.country_bs_price
	
  });
  Countryprice
    .save()
    .then(result => {
      
      res.json({
		  
		status: "Ok",
        message: "Successfully Created Country Price",
        countryBusinessPrice: result
      });
    })
    .catch(err => {
      
      res.status(500).json({
        error: err
      });
    });
 
});

/* Country List Of Prices */
// Handle incoming GET requests to /List

router.get("/List", (req, res, next) => {
  
  countryprice.find()
    .select("_id ads_id c_id country_bs_price country_price_create")
    .exec()
    .then(docs => {
      res.json({
		status: "Ok",
        message: "List Of Business Country Prices",
        count: docs.length,
        countryBusinessPriceList: docs.map(doc => {
          return {
			_id: doc._id,
			ads_id: doc.ads_id,
			c_id: doc.c_id,
			country_code: doc.country_code,
			country_bs_price: doc.country_bs_price,
			country_price_create: doc.country_price_create
	
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