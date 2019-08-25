const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const isEmpty = require('is-empty');
const multer = require('multer');
const constants = require("../constants/constants");
const authModel = require("../models/auth");
const business = require("../models/business");
const User = require("../models/user");
//var path = require('path');

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
	//global.filePath = req.file;
    cb(null, './uploads/');
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
  //fileFilter: fileFilter
});

const business_profile = require("../models/businessprofile");

router.post("/create",upload.single('bus_prof_photo'), (req, res, next) => {

var keyArray = ["userid", "iv_token", "clientid", "bus_prof_mobile", "bus_prof_email", "bus_prof_gst", "bus_prof_pan", "bus_prof_aadhar"];

var key = Object.keys(req.body);
var bs_file_path  = "";


    if(key.indexOf("bus_prof_photo")>=0){
      
      bs_file_path = req.body.bus_prof_photo;
      keyArray.push("bus_prof_photo");
    }

      if(req.file)
       {
		   
		 var bs_file_path  = req.file.path;
	   }
	   
	   
     
   if (keyArray.length == key.length && keyArray.every((v) => key.indexOf(v) >= 0)) 
   { 

            if(constants.AndriodClientId === req.body.clientid)
            {

                  authModel.find({iv_token: req.body.iv_token})       
                  .exec()
                  .then(user => { 

                   if (user.length < 1) 
                   {
                      return res.status(200).json({
                        status:"Logout",
                        message:"You are logged in other device."
                      });
                   } 
                   else 
                   {

                    	const businessprofile = new business_profile({
                    		
                        _id: new mongoose.Types.ObjectId(),
                        iv_acountid: req.body.userid,
                    	bus_prof_photo: bs_file_path,
                    	bus_prof_mobile: req.body.bus_prof_mobile,
                    	bus_prof_email: req.body.bus_prof_email,
                    	bus_prof_gst: req.body.bus_prof_gst,
                    	bus_prof_pan: req.body.bus_prof_pan,
                      bus_prof_aadhar: req.body.bus_prof_aadhar
                    	
                      });
                      businessprofile
                        .save()
                        .then(result => {
              if(isEmpty(result.bus_prof_photo))
							 {
								 var bus_prof_photopath = "";
							 }
							 else
							 {
								 var bus_prof_photopath = constants.APIBASEURL+result.bus_prof_photo;
							 }
                          reslt = {
                          "bus_prof_id": result._id,
                          "userid": result.iv_acountid,
                          "bus_prof_photo": bus_prof_photopath,
                          "bus_prof_mobile": result.bus_prof_mobile,
                          "bus_prof_email": result.bus_prof_email,
                          "bus_prof_gst": result.bus_prof_gst,
                          "bus_prof_pan": result.bus_prof_pan,
                          "bus_prof_aadhar": result.bus_prof_aadhar
                      
                              };
                          
                User.updateOne({_id: req.body.userid }, { is_profile_completed: true}).exec();  

                          res.status(200).json({
                            status: "Ok",
                            message: "Successfully Created Business Profile",
                            createdBusinessProfile: reslt
                          });
                        })
                        .catch(err => {                         // catch the auth schema save errors here 
                         
                              var spliterror=err.message.split(":")
                              res.status(500).json({ 
                                status: 'Failed',
                                message: spliterror[0]+spliterror[1]
                              });
                            
                  });

                  }

                  }).catch(err => {
                        var spliterror=err.message.split(":")
                        res.status(500).json({ 
                          status: 'Failed',
                          message: spliterror[0]
                        });
                  });

              }
              else
              {
                res.status(200).json({
                    status: 'Failed',
                    message: 'Bad Request. Please provide correct clientid.'
                });
              }

      }else{
       res.status(200).json({
           status: 'Failed',
           message: 'Bad Request. Please check your input parameters.'
       });
      }
 

});
router.post("/business_profile_name", (req, res, next) => {    
  
  var keyArray = ["bus_prof_name"];
  var key = Object.keys(req.body);
  if (keyArray.length == key.length && keyArray.every((v) => key.indexOf(v) >= 0)) {

  business_profile.find({bus_prof_name: req.body.bus_prof_name})       
    .exec()
    .then(user => { 
      if (user.length >= 1) {
          return res.status(200).json({
            status:"Failed",
            message:"Business Profie Name already exist"
          });
        } 
        else {
          return res.status(200).json({
            status:"OK",
            message:"Business Profie Name available"
          });
        }
      }).catch(err => {
            var spliterror=err.message.split(":")
            res.status(500).json({ 
              status: 'Failed',
              message: spliterror[0]
            });
      }); 
  }else{
          res.status(200).json({
            status: 'Failed',
            message: 'Bad Request. Please check your input parameters.'
        });
  }
});

router.get("/view/:clientid/:iv_token/:busPrfId", (req, res, next) => {
   
  if(constants.AndriodClientId === req.params.clientid){
    authModel.find({iv_token: req.params.iv_token})       
      .exec()
      .then(user => { 
    if (user.length < 1) {
              return res.status(200).json({
                status:"Logout",
                message:"You are logged in other device."
              });
          } 
          else {
  var resultArray = {
                      BusinessProfileDetails : [],
                      BusinessList : []
            
                     };
  const id = req.params.busPrfId;
  business_profile.find({'_id':id})
    .select("_id iv_acountid bus_prof_photo bus_prof_mobile bus_prof_email bus_prof_gst bus_prof_pan bus_prof_aadhar bus_prof_create")
    .exec()
    .then(docs => {
      
      User.find({_id:docs[0].iv_acountid})
          .exec()
          .then(data =>{
     
   businessProfileDetailsById: docs.map(doc => { 
   if(isEmpty(doc.bus_prof_photo))
   {
     var bus_prof_photopath = "";
   }
   else{
     var bus_prof_photopath = constants.APIBASEURL+doc.bus_prof_photo;
   }
    BusinessProfileDetails = {
            bus_prof_id: doc._id,
      userid: doc.iv_acountid,
      bus_prof_photo: bus_prof_photopath,
      bus_prof_mobile: doc.bus_prof_mobile,
      bus_prof_email: doc.bus_prof_email,
      bus_prof_gst: doc.bus_prof_gst,
      bus_prof_pan: doc.bus_prof_pan,
      bus_prof_create: doc.bus_prof_create,
      bus_prof_aadhar: doc.bus_prof_aadhar,
      ref_Code: data[0].ref_Code
      
          };
          resultArray.BusinessProfileDetails.push(BusinessProfileDetails);
     
    });
    
    business.find({'bus_prof_id':id})
    .select("_id iv_acountid bus_prof_id bus_name bus_logo bus_location bus_category bus_menu bus_tags bus_prof_create")
    .exec()
    .then(docs => { 
          
          businessList: docs.map(doc => {

         BusinessList = {
      bus_id: doc._id,
      userid: doc.iv_acountid,
      bus_prof_id: doc.bus_prof_id,
      bus_name: doc.bus_name,
      bus_logo: constants.APIBASEURL+doc.bus_logo,
      bus_location: doc.bus_location,
      bus_category: doc.bus_category,
      bus_menu: constants.APIBASEURL+doc.bus_menu,
      bus_tags: doc.bus_tags,
      bus_prof_create: doc.bus_prof_create
  
          };
          resultArray.BusinessList.push(BusinessList);

    });
  var BusinessProfileDetails = resultArray.BusinessProfileDetails;
  var BusinessList = resultArray.BusinessList;
  
          res.json({        status: "Ok",
                        message: "List Of Business Details",
            BusinessProfileDetails: BusinessProfileDetails,
            BusinessList: BusinessList
                        });
        });
    }).catch(err => {
              var spliterror=err.message.split("_")
              if(spliterror[1].indexOf("id")>=0){
                res.status(500).json({ 
                  status: 'Failed',
                  message: "Please provide correct user id"
                });
              }
              else{
                res.status(500).json({ 
                  status: 'Failed',
                  message: err.message
                });
              }
            });
    }).catch(err => {
              var spliterror=err.message.split("_")
              if(spliterror[1].indexOf("id")>=0){
                res.status(500).json({ 
                  status: 'Failed',
                  message: "Please provide correct business profile id"
                });
              }
              else{
                res.status(500).json({ 
                  status: 'Failed',
                  message: err.message
                });
              }
            });
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
        res.json({
            status: 'Failed',
            message: 'Bad Request. Please provide correct clientid.'
        });
    } 

});

router.post("/update",upload.single('bus_prof_photo'), (req, res, next) => {    
  
  var keyArray = ["bus_prof_id","iv_token", "clientid","bus_prof_mobile","bus_prof_email", "bus_prof_gst", "bus_prof_pan", "bus_prof_aadhar"];
  var key = Object.keys(req.body);
  var bs_file_path  = "";


    
        
      if(req.file && req.file.fieldname === 'bus_prof_photo')
       {
        if(key.indexOf("bus_prof_photo")>=0){
      
      bs_file_path = req.body.bus_prof_photo;
      keyArray.push("bus_prof_photo");
        }
       var bs_file_path  = req.file.path;
       }
       else if(!req.file)
       {
         //var bs_file_paths  = req.body.bus_prof_photo;

        // var bs_file_pathss = bs_file_paths.split(constants.APIBASEURL);
         var bs_file_path = "";
       }
       else
       {
         res.status(200).json({
                      status: 'Failed',
                      message: 'Bad Request. please check the bus_prof_photo parameter.'
                    });
       }
    console.log(keyArray);
    console.log(key);

  if (keyArray.length == key.length && keyArray.every((v) => key.indexOf(v) >= 0)) {

    if(constants.AndriodClientId === req.body.clientid){

      authModel.find({iv_token: req.body.iv_token})       
        .exec()
        .then(user => { 
          if (user.length < 1) {
              return res.status(200).json({
                status:"Logout",
                message:"You are logged in other device."
              });
            } 
          else {

              business_profile.find({_id: req.body.bus_prof_id})       
                .exec()
                .then(user => { 
                  if (user.length < 1) {
                      return res.status(200).json({
                        status:"Failed",
                        message:"Business profile does not exist"
                      });
                    } 
                  else {

                    if(user[0].bus_prof_photo != bs_file_path || user[0].bus_prof_mobile != req.body.bus_prof_mobile || user[0].bus_prof_email != req.body.bus_prof_email || user[0].bus_prof_gst != req.body.bus_prof_gst
                         || user[0].bus_prof_pan != req.body.bus_prof_pan || user[0].bus_prof_aadhar != req.body.bus_prof_aadhar ){
                     if(isEmpty(bs_file_path))
                     {
                        business_profile.update({ _id: req.body.bus_prof_id },
                                                {$set:{
                                                        
                                                        bus_prof_mobile:req.body.bus_prof_mobile,
                                                        bus_prof_email:req.body.bus_prof_email,
                                                        bus_prof_gst:req.body.bus_prof_gst,
                                                        bus_prof_pan:req.body.bus_prof_pan,
                                                        bus_prof_aadhar:req.body.bus_prof_aadhar}})
                          .exec()
                          .then(userCheck => {
                            return res.status(200).json({
                                status:"OK",
                                message:"Business Profile updated successfully"
                            })
                          }).catch(err => {
                             var spliterror=err.message.split(":")
                              res.status(500).json({ 
                                 status: 'Failed',
                                 message: spliterror[0]+ spliterror[1]
                              });
                          });
                     }
                     else
                     {

                      business_profile.update({ _id: req.body.bus_prof_id },
                                                {$set:{
                                                        bus_prof_photo:bs_file_path,
                                                        bus_prof_mobile:req.body.bus_prof_mobile,
                                                        bus_prof_email:req.body.bus_prof_email,
                                                        bus_prof_gst:req.body.bus_prof_gst,
                                                        bus_prof_pan:req.body.bus_prof_pan,
                                                        bus_prof_aadhar:req.body.bus_prof_aadhar}})
                          .exec()
                          .then(userCheck => {
                            return res.status(200).json({
                                status:"OK",
                                message:"Business Profile updated successfully"
                            })
                          }).catch(err => {
                             var spliterror=err.message.split(":")
                              res.status(500).json({ 
                                 status: 'Failed',
                                 message: spliterror[0]+ spliterror[1]
                              });
                          });

                     }
                      
                      
                    }
                    else{
                      res.status(200).json({
                        status: 'Failed',
                        message: 'Bad Request. Same data available in database.'
                      });
                    }
                  }
                }).catch(err => {
                      var spliterror=err.message.split("_")
                      if(spliterror[1].indexOf("id")>=0){
                        res.status(200).json({ 
                          status: 'Failed',
                          message: "Business profile does not exist, Please provide correct business profile id"
                        });
                      }
                      else{
                       var spliterror=err.message.split(":")
                res.status(500).json({ 
                  status: 'Failed',
                  message: spliterror[0]+spliterror[1]
            });
                      }
                  }); 
            }
        }).catch(err => {
                var spliterror=err.message.split(":")
                res.status(500).json({ 
                  status: 'Failed',
                  message: spliterror[0]+spliterror[1]
            });
        });
      }
      else{
          res.status(200).json({
              status: 'Failed',
              message: 'Bad Request. Please provide correct clientid.'
          });
      }
    }else{
       res.status(200).json({
           status: 'Failed',
           message: 'Bad Request. Please check your input parameters.'
       });
    }

});
module.exports = router;