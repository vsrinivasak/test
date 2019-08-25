const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../models/user");
const Content = require("../models/contents");
const constants = require("../constants/constants");

router.post("/postcontent", (req, res, next) => {

  var keyArray = [ 'privacy', 'terms_conditions','clientid'];
  var key = Object.keys(req.body);
  if (keyArray.length == key.length && keyArray.every((v) => key.indexOf(v) >= 0)) {

  	 if(constants.AndriodClientId === req.body.clientid || constants.IosClientId === req.body.clientid){
  
	const newContent = new Content({
		_id: new mongoose.Types.ObjectId(),
		privacy : req.body.privacy,
		terms_conditions : req.body.terms_conditions
	})
	newContent.save()       
	    .then(user => {
	  		return res.status(200).json({
            status: 'Ok',
            message: 'Contents uploaded',
         })
	  }).catch(err => {
  			var spliterror=err.message.split(":")
            res.status(500).json({ 
                status: 'Failed',
                message: spliterror[0]+spliterror[1]
	      	});
	  });
	  }else {
       res.status(200).json({
          status: 'Failed',
          message: 'Bad Request. Please provide clientid.'
      });
    }
	}else{
		 res.status(200).json({
           status: 'Failed',
           message: 'Bad Request. Please check your input parameters.'
       });
	}
});

router.get("/privacy/:clientid", (req, res, next) => {

	if(constants.AndriodClientId === req.body.clientid || constants.IosClientId === req.body.clientid){
	Content.find({})       
		.exec()
		.then(user => {
		      		return res.status(200).json({
			            status: 'Ok',
			            message: 'Content',
			            content: user[0].privacy
		        	})
		  	}).catch(err => {
			      var spliterror=err.message.split(":")
			      res.status(500).json({ 
                     status: 'Failed',
                     message: spliterror[0]
                  });
			});	
			    }                                           
    else {                                   // else for IMEI, DeviceId and clientid
        res.status(200).json({
            status: 'Failed',
            message: 'Bad Request. Please provide correct clientid.'
        });
      }
});

router.get("/terms_conditions/:clientid", (req, res, next) => {
	
	if(constants.AndriodClientId === req.body.clientid || constants.IosClientId === req.body.clientid){
	Content.find({})       
		.exec()
		.then(user => {
		      		return res.status(200).json({
			            status: 'Ok',
			            message: 'Content',
			            content: user[0].terms_conditions
		        	})
		  	}).catch(err => {
			      var spliterror=err.message.split(":")
			      res.status(500).json({ 
                     status: 'Failed',
                     message: spliterror[0]
                  });
			});	
			    }                                           
    else {                                   // else for IMEI, DeviceId and clientid
        res.status(200).json({
            status: 'Failed',
            message: 'Bad Request. Please provide correct clientid.'
        });
      }
});

router.put("/updatecontent", (req, res, next) => {
	  var keyArray = [ 'contenttype', 'contentdata', 'clientid'];	
	  var key= Object.keys(req.body);

 if (keyArray.length == key.length && keyArray.every((v) => key.indexOf(v) >= 0)) {

 		if(constants.AndriodClientId === req.body.clientid || constants.IosClientId === req.body.clientid){

		if (req.body.contenttype === "privacy"){
		Content.update({},{$set:{privacy:req.body.contentdata }})       
		    .exec()
		    .then(user => {
		  		if (user.length < 1) {
		        return res.status(200).json({
		          status:"Failed",
		          message: "No content."
		        });
		      } else {
		      	return res.status(200).json({
		            status: 'Ok',
		            message: 'privacy updated successfully'
		        })
		      }
		  	}).catch(err => {
			      var spliterror=err.message.split(":")
			      res.status(500).json({ 
                     status: 'Failed',
                     message: spliterror[0]+ spliterror[1]
                  });
			 });
		}
		else if (req.params.contenttype === "terms_conditions"){
			Content.update({},{$set:{terms_conditions:req.body.contentdata}})       
		    .exec()
		    .then(user => {
		  		if (user.length < 1) {
		        return res.status(200).json({
		          status:"Failed",
		          message: "No content."
		        });
		      } else {
		      	return res.status(200).json({
		            status: 'Ok',
		            message: 'Terms_conditions updated successfully'
		        })
		      }
		  	}).catch(err => {
			      var spliterror=err.message.split(":")
			      res.status(500).json({ 
                     status: 'Failed',
                     message: spliterror[0]
                  });
			 });
		}
		else{
			res.status(200).json({
		        status: 'Failed',
		        message: 'Bad Request. This content type does not exist.'
	      	});
		}
		}else{
			res.status(200).json({
          		status: 'Failed',
          		message: 'Bad Request. Please provide clientid.'
      		});
		}
	}
	else{
			res.status(200).json({
		        status: 'Failed',
		        message: 'Bad Request. Please check your input parameters.'
	      	});
	}
});

module.exports = router;