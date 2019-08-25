const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");


const businessGenderList = require("../models/genderlist");

/* Create Genders List */
router.post("/create",(req, res, next) => {

	const BusinessGenderList = new businessGenderList({
    _id: new mongoose.Types.ObjectId(),
	gender_name: req.body.gender_name
	
  });
  BusinessGenderList
    .save()
    .then(result => {
      
      res.json({
		  
		status: "Ok",
        message: "Successfully Created Gender",
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
  
  businessGenderList.find()
    .select("_id gender_name")
    .exec()
    .then(docs => {
      res.json({
		status: "Ok",
        message: "List Of Business Gender for ads",
        count: docs.length,
        GenderList: docs.map(doc => {
          return {
			_id: doc._id,
			gender_name: doc.gender_name,
			gender_createdate: doc.gender_createdate
	
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