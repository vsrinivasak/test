const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");


const genderlistprice = require("../models/genderlistprice");

/* Create Genders List */
router.post("/create",(req, res, next) => {

	const Genderlistprice = new genderlistprice({
    _id: new mongoose.Types.ObjectId(),
    ads_id: req.body.ads_id,
    gender_id: req.body.gender_id,
    gender_business_price: req.body.gender_business_price
	
  });
  Genderlistprice
    .save()
    .then(result => {
      
      res.json({
		  
		status: "Ok",
        message: "Successfully Created Gender Price for Ads",
        createdCityInfo: result
      });
    })
    .catch(err => {
      
      res.status(500).json({
        error: err
      });
    });
 
});

/* Gender Price List for Ads Prefernce */
// Handle incoming GET requests to /List

router.get("/List", (req, res, next) => {
  

  genderlistprice.find()
    .select("_id ads_id, gender_id, gender_business_price")
    .exec()
    .then(docs => {
      res.json({
		status: "Ok",
        message: "List Of Business Gender Prices for ads",
        count: docs.length,
        GenderListPrices: docs.map(doc => {
          return {
			_id: doc._id,
      ads_id: doc.ads_id,
      gender_id: doc.gender_id,
			gender_business_price: doc.gender_business_price,
			gender_price_createdate: doc.gender_price_createdate
	
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