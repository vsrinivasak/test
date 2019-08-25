const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");


const agelistprice = require("../models/agelistprice");

/* Create Age List Price */
router.post("/create",(req, res, next) => {

	const Agelistprice = new agelistprice({
    _id: new mongoose.Types.ObjectId(),
  ads_id: req.body.ads_id,
	age_id: req.body.age_id,
  age_business_price:req.body.age_business_price
	
  });
  Agelistprice
    .save()
    .then(result => {
      res.json({
		  
		status: "Ok",
        message: "Successfully Created Age Wise Price",
        age: result
      });
    })
    .catch(err => {
      res.status(500).json({
        error: err
      });
    });
 
});

/* Country List Age Wise Price */
// Handle incoming GET requests to /List

router.get("/List", (req, res, next) => {
  
  agelistprice.find()
    .select("_id ads_id age_id age_business_price age_price_createdate")
    .exec()
    .then(docs => {
      res.json({
		status: "Ok",
        message: "List Of Age Wise Business Price",
        count: docs.length,
        ageListPrices: docs.map(doc => {
          return {
			_id: doc._id,
      ads_id: doc.ads_id,
      age_id: doc.age_id,
			age_business_price: doc.age_business_price,
			age_price_createdate: doc.age_price_createdate
	
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