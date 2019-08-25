const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");


const businessCitiesList = require("../models/citieslist");

/* Create Cities List */
router.post("/create",(req, res, next) => {

	const BusinessCitiesList = new businessCitiesList({
    _id: new mongoose.Types.ObjectId(),
	c_id: req.body.c_id,
	st_id: req.body.st_id,
	city_name: req.body.city_name
	
  });
  BusinessCitiesList
    .save()
    .then(result => {
      
      res.json({
		  
		status: "Ok",
        message: "Successfully Created City",
        createdCityInfo: result
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
  
  businessCitiesList.find()
    .select("_id c_id st_id city_name city_createdate")
    .exec()
    .then(docs => {
      res.json({
		status: "Ok",
        message: "List Of Business Cities Business Prices for ads",
        count: docs.length,
        CitiesList: docs.map(doc => {
          return {
			_id: doc._id,
			c_id: doc.c_id,
			st_id: doc.st_id,
			city_name: doc.city_name,
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