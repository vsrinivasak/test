const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");


const adstype = require("../models/adstype");
/* Create businessTypesAds */
router.post("/create",(req, res, next) => {

	const Adstype = new adstype({
    _id: new mongoose.Types.ObjectId(),
	ads_name: req.body.ads_name
	
  });
  Adstype
    .save()
    .then(result => {
      res.json({
		  
		status: "Ok",
        message: "Successfully Created Business Ads",
        adsCreateInfo: result
      });
    })
    .catch(err => {
      res.status(500).json({
        error: err
      });
    });
 
});

/* List of Businees by Business Profile Id */
// Handle incoming GET requests to /orders

router.get("/List", (req, res, next) => {
  
  adstype.find()
    .select("_id ads_name ads_create")
    .exec()
    .then(docs => {
      res.json({
		status: "Ok",
        message: "List Of Business Types of Ads",
        count: docs.length,
        adsInfoList: docs.map(doc => {
          return {
			_id: doc._id,
			ads_name: doc.ads_name,
			ads_create: doc.ads_create
	
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