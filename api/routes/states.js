const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");


const states = require("../models/states");

/* Create states */
router.post("/create",(req, res, next) => {

	const States = new states({
    _id: new mongoose.Types.ObjectId(),
    ads_id: req.body.ads_id,
	st_name: req.body.st_name,
	st_code: req.body.st_code,
	c_id: req.body.c_id,
	states_bs_price: req.body.states_bs_price
	
  });
  States
    .save()
    .then(result => {
      
      res.json({
		  
		status: "Ok",
        message: "Successfully Created States",
        createdStateBusinessPrice: result
      });
    })
    .catch(err => {
      
      res.status(500).json({
        error: err
      });
    });
 
});

/* states List */
// Handle incoming GET requests to /List

router.get("/List", (req, res, next) => {
  
  adspreferences.find()
    .select("_id ads_id st_name st_code c_id states_bs_price")
    .exec()
    .then(docs => {
      res.json({
		status: "Ok",
        message: "List Of Business states prices",
        count: docs.length,
        StateBusinessPriceList: docs.map(doc => {
          return {
			_id: doc._id,
			ads_id: doc.ads_id,
			st_name: doc.st_name,
			st_code: doc.st_code,
			c_id: doc.c_id,
			states_bs_price: doc.states_bs_price,
			states_create: doc.states_create
	
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