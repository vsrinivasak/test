const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");


const statesprice = require("../models/statesprice");

/* Create states price */
router.post("/create",(req, res, next) => {

	const StatesPrice = new statesprice({
    _id: new mongoose.Types.ObjectId(),
    ads_id: req.body.ads_id,
	c_id: req.body.c_id,
	st_id: req.body.st_id,
	states_bs_price: req.body.states_bs_price
	
  });
  StatesPrice
    .save()
    .then(result => {
      
      res.json({
		  
		status: "Ok",
        message: "Successfully Created States Business Price",
        createdStateBusinessPrice: result
      });
    })
    .catch(err => {
      
      res.status(500).json({
        error: err
      });
    });
 
});

/* states List Business Price */
// Handle incoming GET requests to /List

router.get("/List", (req, res, next) => {
  
  statesprice.find()
    .select("_id c_id st_id ads_id states_bs_price states_price_create")
    .exec()
    .then(docs => {
      res.json({
		status: "Ok",
        message: "List Of Business States Prices",
        count: docs.length,
        StateBusinessPriceList: docs.map(doc => {
          return {
			_id: doc._id,
			c_id: doc.c_id,
			st_id: doc.st_id,
			ads_id: doc.ads_id,
			c_id: doc.c_id,
			states_bs_price: doc.states_bs_price,
			states_price_create: doc.states_price_create
	
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