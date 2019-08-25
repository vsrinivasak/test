const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");


const agelist = require("../models/agelist");

/* Create country */
router.post("/create",(req, res, next) => {

	const Agelist = new agelist({
    _id: new mongoose.Types.ObjectId(),
	age: req.body.age
	
  });
  Agelist
    .save()
    .then(result => {
      res.json({
		  
		status: "Ok",
        message: "Successfully Created Age",
        age: result
      });
    })
    .catch(err => {
      res.status(500).json({
        error: err
      });
    });
 
});

/* Country List */
// Handle incoming GET requests to /List

router.get("/List", (req, res, next) => {
  
  agelist.find()
    .select("_id age age_createdate")
    .exec()
    .then(docs => {
      res.json({
		status: "Ok",
        message: "List Of Ages for Ads Preferences",
        count: docs.length,
        ageList: docs.map(doc => {
          return {
			_id: doc._id,
			age: doc.age,
			age_createdate: doc.age_createdate
	
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