const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");


const professionlistprice = require("../models/professionlistprice");

/* Create Profession Price */
router.post("/create",(req, res, next) => {

	const Professionlistprice = new professionlistprice({
    _id: new mongoose.Types.ObjectId(),
    ads_id: req.body.ads_id,
	profession_id: req.body.profession_id,
  profession_price: req.body.profession_price
	
  });
  Professionlistprice
    .save()
    .then(result => {
      
      res.json({
		  
		status: "Ok",
        message: "Successfully Created Profession Price",
        age: result
      });
    })
    .catch(err => {
      
      res.status(500).json({
        error: err
      });
    });
 
});

/* Profession List Prices */
// Handle incoming GET requests to /List

router.get("/List", (req, res, next) => {
  
  professionlistprice.find()
    .select("_id ads_id profession_id profession_price profession_price_createdate")
    .exec()
    .then(docs => {
      res.json({
		status: "Ok",
        message: "List Of Profession Price for Ads Preferences",
        count: docs.length,
        professionListPrices: docs.map(doc => {
          return {
			_id: doc._id,
      ads_id: doc.ads_id,
			profession_id: doc.profession_id,
      profession_price: doc.profession_price,
			profession_price_createdate: doc.profession_price_createdate
	
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