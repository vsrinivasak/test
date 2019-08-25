const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const constants = require("../constants/constants");
const User = require("../models/user");
const authModel = require("../models/auth");
const fcmModel = require("../models/fcmtoken");
const details = require("../models/userDetails");
const contactsModel = require("../models/contacts");
const notificationModel = require("../models/notifications");
const soundModel = require("../models/sounds");
const soundCategoryModel = require("../models/sound_category");
const multer = require('multer');
const userDetails = require("../models/userDetails");
const isEmpty = require("is-empty");
const ObjectId = require('mongodb').ObjectID;
const http = require('http');
const fs = require('fs');
const messageModel = require("../models/iv_message");
const moment = require('moment')

router.post("/get_sound_page", (req, res, next) => {

  var keyArray = ["userid", "iv_token", "clientid"];
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
                soundModel.find({})
                    .sort({no_used:-1})
                    .limit(10)
                    .exec()
                    .then(docs =>{
                        var trending = []
                        if(docs.length > 0){
                            docs.map(doc =>{
                                var foe ={
                                    'sound_name': doc.sound_name,
                                    'sound_desc':doc.sound_desc,
                                    'sound_url':constants.APIBASEURL+doc.sound_url,
                                    'sound_logo':constants.APIBASEURL+'uploads/music.png',
                                    'sound_id': doc._id,
                                    'categoryType':"trending_sounds"
                                }
                                trending.push(foe)
                            })
                        }

                        soundCategoryModel.find({})
                                        .sort({category_name:-1})
                                        .limit(10)
                                        .exec()
                                        .then(data =>{
                                            var categories = []
                                            if(data.length > 0){
                                                data.map(dex =>{
                                                    var fox ={
                                                        'category_id':dex._id,
                                                        'category_name':dex.category_name,
                                                        'category_logo':constants.APIBASEURL+dex.category_logo
                                                    }
                                                    categories.push(fox)
                                                })
                                            }

                                            res.status(200).json({
                                                status: 'Ok',
                                                message: 'Sounds main page',
                                                userid: req.body.userid,
                                                songcategories:trending,
                                                sound_categories:categories
                                            });

                                        }).catch(err => {
                                            var spliterror=err.message.split(":")
                                              res.status(500).json({ 
                                                status: 'Failed',
                                                message: spliterror[0]
                                              });
                                        });

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
          message: 'Bad Request. Please provide clientid.'
      });
    }
  }else{
     res.status(200).json({
           status: 'Failed',
           message: 'Bad Request. Please check your input parameters.'
       });
  }
})


router.post("/get_sound_search", (req, res, next) => {

  var keyArray = ["userid", "iv_token", "clientid", "search_query", "page_no"];
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
                var perPage = 20
                var page = req.body.page_no

                if(isEmpty(page)){
                    page=1
                }
                var skip = (perPage * page) - perPage;
                var limit = skip+perPage;

                var querytag = {$text: {$search: req.body.search_query, $language: 'en'}}

                var querytag = {$or:[{sound_desc:{$regex: "^"+req.body.search_query, '$options' : 'i'}},
                                  {sound_name:{$regex: "^"+req.body.search_query, '$options' : 'i'}}]};

                soundModel.find(querytag)
                            .skip(skip)
                            .limit(perPage)
                            .exec()
                            .then(docs =>{
                                soundModel.find(querytag).count().exec(function(err, count){
                                    if (err){
                                        res.status(500).json({
                                         status: "Failed",
                                         message: "Error fetching sounds."
                                        })
                                    }
                                    else{
                                            var test = []
                                            docs.map(doc =>{
                                                var foe = {
                                                    'sound_name': doc.sound_name,
                                                    'sound_desc':doc.sound_desc,
                                                    'sound_url':constants.APIBASEURL+doc.sound_url,
                                                    'sound_logo':constants.APIBASEURL+'uploads/music.png',
                                                    'sound_id': doc._id
                                                }
                                                test.push(foe)
                                            })

                                            res.status(200).json({
                                                status: 'Ok',
                                                message: 'Sounds list',
                                                userid: req.body.userid,
                                                total_pages: Math.ceil(count / perPage),
                                                current_page:page,
                                                total_sounds:count,
                                                sounds: test
                                            });
                                    }
                                })
                            }).catch(err => {
                              console.log(err)
                                // var spliterror=err.message.split(":")
                                //   res.status(500).json({ 
                                //     status: 'Failed',
                                //     message: spliterror[0]
                                //   });
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


router.post("/get_sounds_on_category", (req, res, next) => {

  var keyArray = ["userid", "iv_token", "clientid", "category_id", "page_no"];
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
                  var perPage = 20
                  var page = req.body.page_no

                  if(isEmpty(page)){
                    page=1
                  }
                  var skip = (perPage * page) - perPage;
                  var limit = skip+perPage;

                  soundModel.find({sound_category:ObjectId(req.body.category_id)})
                            .sort({no_used:-1})
                            .skip(skip)
                            .limit(limit)
                            .exec()
                            .then(docs =>{
                                soundModel.find({sound_category:ObjectId(req.body.category_id)}).count().exec(function(err,count){
                                     if (err){
                                        res.status(500).json({
                                         status: "Failed",
                                         message: "Error fetching sounds."
                                        })
                                      }
                                      else{
                                            var test = []
                                            docs.map(doc =>{
                                                var foe = {
                                                    'sound_name': doc.sound_name,
                                                    'sound_desc':doc.sound_desc,
                                                    'sound_url':constants.APIBASEURL+doc.sound_url,
                                                    'sound_logo':constants.APIBASEURL+'uploads/music.png',
                                                    'sound_id': doc._id
                                                }
                                                test.push(foe)
                                            })

                                            res.status(200).json({
                                                status: 'Ok',
                                                message: 'Sounds list',
                                                userid: req.body.userid,
                                                total_pages: Math.ceil(count / perPage),
                                                total_sounds:count,
                                                current_page:page,
                                                sounds: test
                                            });
                                      }
                                })
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


router.post("/get_sounds", (req, res, next) => {

  var keyArray = ["userid", "iv_token", "clientid", "page_no"];
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
                  var perPage = 20
                  var page = req.body.page_no

                  if(isEmpty(page)){
                    page=1
                  }
                  var skip = (perPage * page) - perPage;
                  var limit = skip+perPage;

                  soundModel.find({})
                            .sort({no_used:-1})
                            .skip(skip)
                            .limit(limit)
                            .exec()
                            .then(docs =>{
                                soundModel.find({}).count().exec(function(err,count){
                                     if (err){
                                        res.status(500).json({
                                         status: "Failed",
                                         message: "Error fetching sounds."
                                        })
                                      }
                                      else{
                                            var test = []
                                            docs.map(doc =>{
                                                var foe = {
                                                    'sound_name': doc.sound_name,
                                                    'sound_desc':doc.sound_desc,
                                                    'sound_url':constants.APIBASEURL+doc.sound_url,
                                                    'sound_logo':constants.APIBASEURL+'uploads/music.png',
                                                    'sound_id': doc._id
                                                }
                                                test.push(foe)
                                            })

                                            res.status(200).json({
                                                status: 'Ok',
                                                message: 'Sounds list',
                                                userid: req.body.userid,
                                                total_pages: Math.ceil(count / perPage),
                                                total_sounds:count,
                                                current_page:page,
                                                sounds: test
                                            });
                                      }
                                })
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

router.post("/add_sounds", (req, res, next) => {

      var sound =  new soundModel({
                              _id: new mongoose.Types.ObjectId(),
                              sound_category: ObjectId(req.body.sound_category),
                              sound_name:req.body.sound_name,
                              sound_desc:req.body.sound_desc,
                              sound_url:req.body.sound_url,
                              created_on: Date.now()
                            });
                          
                            sound
                              .save()
                              .then(userCheck => {
                                     res.status(200).json({
                                           status: 'Ok',
                                           message: userCheck
                                       });
                              })
});


module.exports = router;

