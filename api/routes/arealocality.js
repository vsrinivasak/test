const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");


const businessAreaLocality = require("../models/arealocality");

/* Create cities */
router.post("/create",(req, res, next) => {

	const BusinessAreaLocality = new businessAreaLocality({
    _id: new mongoose.Types.ObjectId(),
    ads_id: req.body.ads_id,
	c_id: req.body.c_id,
	st_id: req.body.st_id,
	city_id: req.body.city_id,
	arealocality_name: req.body.arealocality_name,
	arealocality_business_price: req.body.arealocality_business_price
	
  });
  BusinessAreaLocality
    .save()
    .then(result => {
      
      res.json({
		  
		status: "Ok",
        message: "Successfully Created Locality Business Prices for ads",
        createdLocalityBusinessPrice: result
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
 
  businessAreaLocality.find()
    .select("_id ads_id c_id st_id city_id arealocality_name arealocality_business_price arealocality_createdate")
    .exec()
    .then(docs => {
      res.json({
		status: "Ok",
        message: "List Of Locality Business Prices for ads",
        count: docs.length,
        LocalityBusinessPriceList: docs.map(doc => {
          return {
			_id: doc._id,
			ads_id: doc.ads_id,
			c_id: doc.c_id,
			st_id: doc.st_id,
			city_id: doc.city_id,
			arealocality_name: doc.arealocality_name,
			arealocality_business_price: doc.arealocality_business_price,
			arealocality_createdate: doc.arealocality_createdate
	
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