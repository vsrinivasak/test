const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const base64 = require('base-64');
const utf8 = require('utf8');
const constants = require("../constants/constants");
const User = require("../models/user");
const PasswordModel = require("../models/otpverify")
const authModel = require("../models/auth");
const fcmModel = require("../models/fcmtoken");
const http = require('http');
const urlencode = require('urlencode');
const UIDGenerator = require('uid-generator');
const uidgen = new UIDGenerator(UIDGenerator.BASE36);
const business_profile = require("../models/businessprofile");
const userDetails = require("../models/userDetails");
const ObjectId = require('mongodb').ObjectID;

router.post("/forgetPassword", (req, res, next) => {

 var keyArray = [ 'mobile', 'email',
  'clientid' ];

  var key = Object.keys(req.body);
  if (keyArray.length == key.length && keyArray.every((v) => key.indexOf(v) >= 0)) {

  if(constants.AndriodClientId === req.body.clientid || constants.IosClientId === req.body.clientid){
  
  User.find( {$and:[
                {$or:
                  [{ email: req.body.email },
                  {username:req.body.email}]},
                  {mobile:req.body.mobile}
              ]})       
    .exec()
    .then(user => {
  		if (user.length < 1) {
        return res.status(200).json({
          status:"Failed",
          message: "Please provide the registered number and username/email."
        });
      } else {

        // sending otp through sms
       
        const otpval = Math.floor(100000 + Math.random() * 900000);
        var msg =utf8.encode("Your OTP is:"+otpval+" Thank You for your interest in fvmegear. The OTP will be valid for 10 minutes.");
        var toNumber = req.body.mobile;
        var username = 'contact@ivicatechnologies.com';
        var hash = '835f8a083d146a9935e829083781420627bd9477cd6afd23ebf858d4e224e9a8'; 
        var sender = 'FvmeGr';

        var data = 'username=' + username + '&hash=' + hash + '&sender=' + sender + '&numbers=' + toNumber + '&message=' + msg;
        var options =  'http://api.textlocal.in/send?' + data;

        callback = function (response) {
          var str = '';
          response.on('data', function (chunk) {
            str += chunk;
          });
          response.on('end', function () {
            console.log(str);
          });
        }
        http.request(options, callback).end();
       
       //saving otp to database
      PasswordModel.find({mobile:parseInt(req.body.mobile)})
                    .exec()
                    .then(userCheck =>{
                      if(userCheck.length<1){
                        const otp = new PasswordModel({
                        _id: new mongoose.Types.ObjectId(),
                        userid: user[0]._id,
                        imei: user[0].imei ,
                        otp: otpval,
                        deviceid: user[0].deviceid,
                        mobile: req.body.mobile,
                        otp_verified: 0
                        })
                        otp.save()
                              .then(result => {

                                  var time= setTimeout(function() {
                                      PasswordModel.findOneAndUpdate({$and:[{userid: user[0]._id},{otp_verified:0}]},{$set:{otp:null,updated_on:Date.now()}})
                                          .exec()
                                          .then(data =>{
                                              clearTimeout(time);
                                          }).catch(err => {
                                                var spliterror=err.message.split(":")
                                                    res.status(500).json({ 
                                                      status: 'Failed',
                                                      message: spliterror[0]+ spliterror[1]
                                                });
                                          });
                                  }, 600000);  //10 mnts expiry for otp
                                    return res.status(200).json({
                                      status: 'Ok',
                                      message: 'Otp sent successfully. Please check your mobile'
                                    });
                                }).catch(err => {
                                      if (err.code === 11000){
                                          var error = err.errmsg;
                                          var spliterror = error.split(":")
                                          res.status(500).json({ 
                                            status: 'Failed',
                                            message: spliterror[2]
                                          })
                                      }
                                      else{
                                        var spliterror=err.message.split(":")
                                        res.status(500).json({ 
                                          status: 'Failed',
                                          message: spliterror[0]
                                        });
                                      }
                                });
                        }
                        else{
                          PasswordModel.findOneAndUpdate({mobile:parseInt(req.body.mobile)},{$set:{otp:otpval, created_at:Date.now(),otp_verified: 0}})
                                        .exec()
                                        .then(newdata =>{

                                            var time = setTimeout(function() {
                                                PasswordModel.findOneAndUpdate({$and:[{userid: user[0]._id},{otp_verified:0}]},{$set:{otp:null,updated_on:Date.now()}})
                                                  .exec()
                                                  .then(data =>{
                                                    clearTimeout(time);
                                                }).catch(err => {
                                                    var spliterror=err.message.split(":")
                                                        res.status(500).json({ 
                                                          status: 'Failed',
                                                          message: spliterror[0]+ spliterror[1]
                                                    });
                                                });
                                            },600000);  //10 mnts expiry for otp
                      
                                            return res.status(200).json({
                                              status: 'Ok',
                                              message: 'Otp sent successfully. Please check your mobile'
                                            });
                                        }).catch(err => {
                                          var spliterror=err.message.split(":")
                                          res.status(500).json({ 
                                            status: 'Failed',
                                            message: spliterror[0]+ spliterror[1]
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
    }).catch(err => {
            var spliterror=err.message.split(":")
            res.status(500).json({ 
              status: 'Failed',
              message: spliterror[0]
            });
    });
    }else {
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


router.post("/changePassword", (req, res, next) => {

 var keyArray = [ 'mobile', 'iv_token',
  'clientid' ];

  var key = Object.keys(req.body);
  if (keyArray.length == key.length && keyArray.every((v) => key.indexOf(v) >= 0)) {

  if(constants.AndriodClientId === req.body.clientid || constants.IosClientId === req.body.clientid){
  
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
              User.find({mobile:req.body.mobile})       
                .exec()
                .then(user => {
                  if (user.length < 1) {
                    return res.status(200).json({
                      status:"Failed",
                      message: "Please provide the registered number."
                    });
                  } else {

                    // sending otp through sms
                   
                    const otpval = Math.floor(100000 + Math.random() * 900000);
                    var msg =utf8.encode("Your OTP is:"+otpval+" Thank You for your interest in fvmegear. The OTP will be valid for 10 minutes.");
                    var toNumber = req.body.mobile;
                    var username = 'contact@ivicatechnologies.com';
                    var hash = '835f8a083d146a9935e829083781420627bd9477cd6afd23ebf858d4e224e9a8'; 
                    var sender = 'FvmeGr';

                    var data = 'username=' + username + '&hash=' + hash + '&sender=' + sender + '&numbers=' + toNumber + '&message=' + msg;
                    var options =  'http://api.textlocal.in/send?' + data;

                    callback = function (response) {
                      var str = '';
                      response.on('data', function (chunk) {
                        str += chunk;
                      });
                      response.on('end', function () {
                        console.log(str);
                      });
                    }
                    http.request(options, callback).end();
                   
                   //saving otp to database
                  PasswordModel.find({mobile:parseInt(req.body.mobile)})
                                .exec()
                                .then(userCheck =>{
                                  if(userCheck.length<1){
                                    const otp = new PasswordModel({
                                    _id: new mongoose.Types.ObjectId(),
                                    userid: user[0]._id,
                                    imei: user[0].imei ,
                                    otp: otpval,
                                    deviceid: user[0].deviceid,
                                    mobile: req.body.mobile,
                                    otp_verified: 0
                                    })
                                    otp.save()
                                          .then(result => {

                                              var time= setTimeout(function() {
                                                  PasswordModel.findOneAndUpdate({$and:[{userid: user[0]._id},{otp_verified:0}]},{$set:{otp:null,updated_on:Date.now()}})
                                                      .exec()
                                                      .then(data =>{
                                                          clearTimeout(time);
                                                      }).catch(err => {
                                                            var spliterror=err.message.split(":")
                                                                res.status(500).json({ 
                                                                  status: 'Failed',
                                                                  message: spliterror[0]+ spliterror[1]
                                                            });
                                                      });
                                              }, 600000);  //10 mnts expiry for otp
                                                return res.status(200).json({
                                                  status: 'Ok',
                                                  message: 'Otp sent successfully. Please check your mobile'
                                                });
                                            }).catch(err => {
                                                  if (err.code === 11000){
                                                      var error = err.errmsg;
                                                      var spliterror = error.split(":")
                                                      res.status(500).json({ 
                                                        status: 'Failed',
                                                        message: spliterror[2]
                                                      })
                                                  }
                                                  else{
                                                    var spliterror=err.message.split(":")
                                                    res.status(500).json({ 
                                                      status: 'Failed',
                                                      message: spliterror[0]
                                                    });
                                                  }
                                            });
                                    }
                                    else{
                                      PasswordModel.findOneAndUpdate({mobile:parseInt(req.body.mobile)},{$set:{otp:otpval, created_at:Date.now(),otp_verified: 0}})
                                                    .exec()
                                                    .then(newdata =>{

                                                        var time = setTimeout(function() {
                                                            PasswordModel.findOneAndUpdate({$and:[{userid: user[0]._id},{otp_verified:0}]},{$set:{otp:null,updated_on:Date.now()}})
                                                              .exec()
                                                              .then(data =>{
                                                                clearTimeout(time);
                                                            }).catch(err => {
                                                                var spliterror=err.message.split(":")
                                                                    res.status(500).json({ 
                                                                      status: 'Failed',
                                                                      message: spliterror[0]+ spliterror[1]
                                                                });
                                                            });
                                                        },600000);  //10 mnts expiry for otp
                                  
                                                        return res.status(200).json({
                                                          status: 'Ok',
                                                          message: 'Otp sent successfully. Please check your mobile'
                                                        });
                                                    }).catch(err => {
                                                      var spliterror=err.message.split(":")
                                                      res.status(500).json({ 
                                                        status: 'Failed',
                                                        message: spliterror[0]+ spliterror[1]
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
                }).catch(err => {
                        var spliterror=err.message.split(":")
                        res.status(500).json({ 
                          status: 'Failed',
                          message: spliterror[0]
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
    }else {
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


router.post("/resetpassword", (req, res, next) => {
  var keyArray = [ 'password',
  'mobile',
  'otp',
  'clientid' ];

  var key = Object.keys(req.body);
  if (keyArray.length == key.length && keyArray.every((v) => key.indexOf(v) >= 0)) {

  if(constants.AndriodClientId === req.body.clientid || constants.IosClientId === req.body.clientid){
  
  var tempPassword = req.body.password;
  var bytes = utf8.encode(tempPassword);
  var hash =  constants.ApiConstant+base64.encode(bytes);
    PasswordModel.find({mobile: parseInt(req.body.mobile)})       
      .exec()
      .then(user => {
        if (user.length < 1) {
          return res.status(200).json({
            status:"Failed",
            message: "Please provide correct mobile number"
          });
        } else {
          if(user[0].otp === req.body.otp){

            User.findOneAndUpdate({mobile: req.body.mobile}, {$set:{password:hash}})       
              .exec()
              .then(users => {
                if(users.length < 1){
                    return res.status(200).json({
                      status:"Failed",
                      message: "Please provide correct mobile number"
                    });
                }
                else{

                    PasswordModel.findOneAndUpdate({$and:
                      [{mobile: parseInt(req.body.mobile)},
                      {otp: req.body.otp}]}, 
                      {$set:{otp_verified:1 ,updated_on:Date.now()}})       
                      .exec()
                      .then(data => {
                          var emailcheck ="";
                          if(users.mobile_verified === 'true'){
                            emailcheck=true;
                          }else{
                            emailcheck=false
                          }

                          uidgen.generate((err, uid) => {
                            if (err) {
                              var spliterror=err.message.split(":")
                                res.status(500).json({ 
                                  status: 'Failed',
                                  message: spliterror[0]+spliterror[1]
                                });
                            }
                            const token = uid;
                            authModel.findOneAndUpdate({userid:users._id},
                                    {$set:{iv_token:token,created_at:Date.now(),removed_at:null}})
                                    .exec()
                                    .then(newdata =>{

                                      userDetails.find({userid:ObjectId(users._id)})
                                          .exec()
                                          .then(dex =>{
                                                 var profileimage = users.profileimage;
                                                                if(users.profileimage === null){
                                                                  profileimage = "uploads/userimage.png"
                                                                }

                                                                var has_selected_interests = true

                                                                  if(users.hobbies.length > 0){
                                                                    has_selected_interests = true
                                                                  }
                                                                  else{
                                                                    has_selected_interests = false
                                                                  }
                                                    var user_category = dex[0].category_type
                                                   var selected_primary_offer = false;
                                                      if(dex[0].offer_details.length > 0){
                                                          var offers = dex[0].offer_details;
                                                          offers.every(function(ele){
                                                            if(ele.is_primary_offer === true){
                                                              selected_primary_offer = true
                                                              return false
                                                            }
                                                            else{
                                                              selected_primary_offer = false
                                                              return true
                                                            }
                                                          })
                                                      }

                                              if(users.usertype === "generaluser"){
                                              fcmModel.findOneAndUpdate({userid:users._id },
                                                                            {$set: {iv_token: token}})
                                                    .exec()
                                                    .then(newdatas => {

                                                     }).catch(err => {
                                                      var spliterror=err.message.split(":")
                                                        res.status(500).json({ 
                                                          status: 'Failed',
                                                          message: spliterror[0]+ spliterror[1]
                                                        });
                                                    });
                                                }
                                               if(users.is_profile_completed === true){
                                                  
                                                  business_profile.find({iv_acountid:users._id})
                                                              .exec()
                                                              .then(result =>{


                                                                  return res.status(200).json({
                                                                    status: 'Ok',
                                                                    message: 'Password changed successfully.',
                                                                    userdetails:{
                                                                      username: users.username,
                                                                      fullname: users.fullname,
                                                                      email:users.email,
                                                                      mobile:users.mobile,
                                                                      iv_token:token,
                                                                      userid: users._id,
                                                                      is_verified: emailcheck,
                                                                      gender: users.gender,
                                                                      language: users.language,
                                                                      postscount: 0,
                                                                      usertype: users.usertype,
                                                                      notificationcount: 0,
                                                                      messagescount: 0,
                                                                      bus_prof_id: result[0]._id,
                                                                      is_profile_completed: users.is_profile_completed,
                                                                      ref_Code:users.ref_Code,
                                                                      profileimage: constants.APIBASEURL+profileimage,
                                                                      has_primary_offer:selected_primary_offer,
                                                                      has_selected_interests:has_selected_interests,
                                                                      user_category:user_category
                                                                    }
                                                                  });
                                                              }).catch(err => {                 // catch statement for user.
                                                                var spliterror=err.message.split(":")
                                                                  res.status(500).json({ 
                                                                    status: 'Failed',
                                                                    message: spliterror[0]
                                                                });
                                                            });
                                                    }
                                                    else{
                                                              return res.status(200).json({
                                                                    status: 'Ok',
                                                                    message: 'Password changed successfully.',
                                                                    userdetails:{
                                                                      username: users.username,
                                                                      fullname: users.fullname,
                                                                      email:users.email,
                                                                      mobile:users.mobile,
                                                                      iv_token:token,
                                                                      userid: users._id,
                                                                      is_verified: emailcheck,
                                                                      gender: users.gender,
                                                                      language: users.language,
                                                                      postscount: 0,
                                                                      usertype: users.usertype,
                                                                      notificationcount: 0,
                                                                      messagescount: 0,
                                                                      bus_prof_id: users.business_profile_id,
                                                                      is_profile_completed: users.is_profile_completed,
                                                                      ref_Code:users.ref_Code,
                                                                      profileimage: constants.APIBASEURL+profileimage,
                                                                      has_primary_offer:selected_primary_offer,
                                                                      has_selected_interests:has_selected_interests,
                                                                      user_category:user_category
                                                                    }
                                                                  });
                                                    }
                                                  }).catch(err => {
                                                                var spliterror=err.message.split(":")
                                                                    res.status(500).json({ 
                                                                        status: 'Failed',
                                                                        message: spliterror[0]+ spliterror[1]
                                                                    });
                                                            })

                                    }).catch(err => {
                                      var spliterror=err.message.split(":")
                                          res.status(500).json({ 
                                              status: 'Failed',
                                              message: spliterror[0]+ spliterror[1]
                                          });
                                  });
                            });
                      }).catch(err => {
                        var spliterror=err.message.split(":")
                        res.status(500).json({ 
                                 status: 'Failed',
                                 message: spliterror[0]+ spliterror[1]
                              });
                      });

                }
                }).catch(err => {
                var spliterror=err.message.split("_")
                if(spliterror[1].indexOf("id")>=0){
                  res.status(500).json({ 
                    status: 'Failed',
                    message: "Please provide correct mobile number"
                  });
                }
                else{
                    res.status(500).json({ 
                       status: 'Failed',
                       message: spliterror[0]+ spliterror[1]
                    });
                }
              });
            }
            else{
              return res.status(200).json({
                status:"Failed",
                message: "Invalid OTP"
              });
            }
        }
    }).catch(err => {
              var spliterror=err.message.split(":")
                res.status(500).json({ 
                  status: 'Failed',
                  message: spliterror[0]
                });

    });
    }else {
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