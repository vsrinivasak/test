const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const multer = require('multer');
//var path = require('path');

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
	//global.filePath = req.file;
    cb(null, './business_posts/');
  },
  filename: function(req, file, cb) {
    cb(null, new Date().toISOString() + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  // reject a file
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
	  
    cb(null, true);
  } else {
    cb(null, false);
  }
};


const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5
  },
  fileFilter: fileFilter
});

const bspost = require("../models/bspost");

router.post("/create",(req, res, next) => {


	const Bspost = new bspost({
    _id: new mongoose.Types.ObjectId(),
    iv_acountid: req.body.iv_acountid,
    bus_prof_id: req.body.bus_prof_id,
	business_post_desc: req.body.business_post_desc
  });
  Bspost
    .save()
    .then(result => {
    
      res.json({
        status: "Ok",
        message: "Successfully Created Business Post/Offer",
        createdBusinessPost: result
      });
    })
    .catch(err => {
      res.status(500).json({
        error: err
      });
    });


 

});

router.get("/view/:busPrfId", (req, res, next) => {
  const id = req.params.busPrfId;
  bspost.find({'_id':id})
    .select("_id iv_acountid")
    .exec()
    .then(docs => {
      res.json({
		status: "Ok",
        message: "List Of Business Post/Offer Details",
        count: docs.length,
        businessProfileDetailsById: docs.map(doc => {
          return {
            bus_prof_id: doc._id,
			iv_acountid: doc.iv_acountid
	
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