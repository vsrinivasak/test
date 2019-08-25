const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");


const stateslist = require("../models/stateslist");

/* Create States List */
router.post("/create",(req, res, next) => {

	const StatesList = new stateslist({
    _id: new mongoose.Types.ObjectId(),
	st_name: req.body.st_name,
	st_code: req.body.st_code,
	c_id: req.body.c_id
	
  });
  StatesList
    .save()
    .then(result => {
      
      res.json({
		  
		status: "Ok",
        message: "Successfully Created States",
        createdStateInfo: result
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
  
  stateslist.find()
    .select("_id st_name st_code c_id states_create")
    .exec()
    .then(docs => {
      res.json({
		status: "Ok",
        message: "List Of Business states",
        count: docs.length,
        StateBusinessList: docs.map(doc => {
          return {
			_id: doc._id,
			st_name: doc.st_name,
			st_code: doc.st_code,
			c_id: doc.c_id,
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