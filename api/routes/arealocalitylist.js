const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");


const businessAreaLocalityList = require("../models/arealocalitylist");

/* Create cities */
router.post("/create",(req, res, next) => {

	const BusinessAreaLocalityList = new businessAreaLocalityList({
    _id: new mongoose.Types.ObjectId(),
	c_id: req.body.c_id,
	st_id: req.body.st_id,
	city_id: req.body.city_id,
	arealocality_name: req.body.arealocality_name
	
  });
  BusinessAreaLocalityList
    .save()
    .then(result => {
      res.json({
		  
		status: "Ok",
        message: "Successfully Created Locality for ads",
        createdLocalityInfo: result
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
 
  businessAreaLocalityList.find()
    .select("_id c_id st_id city_id arealocality_name arealocality_createdate")
    .exec()
    .then(docs => {
      res.json({
		status: "Ok",
        message: "List Of Locality for ads",
        count: docs.length,
        LocalityListInfo: docs.map(doc => {
          return {
			_id: doc._id,
			c_id: doc.c_id,
			st_id: doc.st_id,
			city_id: doc.city_id,
			arealocality_name: doc.arealocality_name,
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