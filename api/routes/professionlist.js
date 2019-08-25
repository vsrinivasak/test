const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");


const professionlist = require("../models/professionlist");

/* Create profession */
router.post("/create",(req, res, next) => {

	const Professionlist = new professionlist({
    _id: new mongoose.Types.ObjectId(),
	profession_name: req.body.profession_name
	
  });
  Professionlist
    .save()
    .then(result => {
      
      res.json({
		  
		status: "Ok",
        message: "Successfully Created Profession",
        age: result
      });
    })
    .catch(err => {
      
      res.status(500).json({
        error: err
      });
    });
 
});

/* profession List */
// Handle incoming GET requests to /List

router.get("/List", (req, res, next) => {
  
  professionlist.find()
    .select("_id profession_name profession_createdate")
    .exec()
    .then(docs => {
      res.json({
		status: "Ok",
        message: "List Of Ages for Ads Preferences",
        count: docs.length,
        professionList: docs.map(doc => {
          return {
			_id: doc._id,
			profession_name: doc.profession_name,
			profession_createdate: doc.profession_createdate
	
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