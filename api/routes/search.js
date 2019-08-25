const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const isEmpty = require('is-empty');
const math = require('mathjs');
const multer = require('multer');
const constants = require("../constants/constants");
const authModel = require("../models/auth");
const iv_feeds = require("../models/iv_feeds");
const User = require("../models/user");
const bsOffers = require("../models/bsOffers");
const feedtags = require("../models/feedtag");
const ObjectId = require('mongodb').ObjectID;
const contactsModel = require("../models/contacts");
const userDetails = require("../models/userDetails");

// router.post("/get_search_main_page_static", (req, res, next) => {

//   var keyArray = ["userid", "iv_token", "clientid"];
//   var key = Object.keys(req.body);

//   if (keyArray.length == key.length && keyArray.every((v) => key.indexOf(v) >= 0)) {

//     if(constants.AndriodClientId === req.body.clientid || constants.IosClientId === req.body.clientid){

//       authModel.find({iv_token: req.body.iv_token})       
//         .exec()
//         .then(user => { 
//           if (user.length < 1) {
//               return res.status(200).json({
//                 status:"Logout",
//                 message:"You are logged in other device."
//               });
//             } 
//           else {

//             iv_feeds.find({$and:[{feed_type:"video"},{old_feed_id:[]},{has_sensitive_content:false},{feed_expiry_status:0}]},{is_static_feed:false})
//                     .sort({no_views:-1})
//                     .exec()
//                     .then(dex =>{
//                         if(dex.length > 0){

//                           var tags = []

//                           dex.map(dog =>{
//                               var tags_db = dog.feeds_hash_tags
//                               tags_db.forEach(function(efe){
//                                 var found = tags.find(o => String(o) === String(efe))

//                                 if(typeof found === 'undefined'){
//                                   tags.push(efe)
//                                 }
//                               })
//                           })

//                             feedtags.find({feedTag_name:{$in:tags}}).sort({feedTag_used_today : -1})//.limit(10)
//                               .select('feedTag_name feedTag_used -_id')
//                               .exec()
//                               .then(result =>{

//                                 if(result.length<0){
//                                   res.status(200).json({
//                                     status: 'Ok',
//                                     message: 'No tags to display.',
//                                     Search_list:[]
//                                   });
//                                 }
//                                 else{
//                                   var testy = [];
//                                   for(var i=0;i<result.length;i++){
//                                     console.log(result[i].feedTag_name)
//                                     testy.push(result[i].feedTag_name)
//                                   }
//                                   contactsModel.aggregate([{$match:{userid:ObjectId(req.body.userid)}},
//                                                           {$project:{blocked:"$blocked"}}
//                                               ], function(err,data){
//                                                   iv_feeds.find({$and:[{iv_acountid:{$nin:data[0].blocked}},{feeds_hash_tags:{$in:testy}},{feed_type:"video"},{old_feed_id:[]},{has_sensitive_content:false},{feed_expiry_status:0}]})
//                                                       .sort({no_rating:-1})
//                                                       .exec()
//                                                       .then(item =>{
//                                                           iv_permanent_feeds.find({$and:[{iv_acountid:{$nin:data[0].blocked}},{feeds_hash_tags:{$in:testy}},{feed_type:"video"},{old_feed_id:[]},{has_sensitive_content:false},{feed_expiry_status:0}]})
//                                                               .sort({no_rating:-1})
//                                                               .exec()
//                                                               .then(item_his =>{
//                                                                     var test =[];
//                                                                     result.map(doc =>{
//                                                                       var breakTheLoop = false;
//                                                                       var tagitems = [];
//                                                                       var can_show_ad = false
//                                                                         item.every(function(coco){
//                                                                           if(coco.privacy_mode === 1){
//                                                                                can_show_ad = true
//                                                                             }
//                                                                             else{
//                                                                               can_show_ad = false
//                                                                             }
//                                                                           if(tagitems.length<10){
//                                                                             var coo = coco.feeds_hash_tags
//                                                                             var video_dur = coco.video_duration
//                                                                             var video_duration = ""
//                                                                            var video  = video_dur*1000
                                                                                        
//                                                                                   var minutes = Math.floor(video / 60000);
//                                                                                     var seconds = ((video % 60000) / 1000).toFixed(0);
//                                                                                  minutes = minutes.toString()
//                                                                                   seconds = seconds.toString()
//                                                                                 var video_duration = minutes+":"+seconds

//                                                                                 if(minutes.length === 1 && seconds.length === 1){
//                                                                                   video_duration = "0"+minutes+":"+"0"+seconds

//                                                                                 }
//                                                                                 else if(minutes.length === 1){
//                                                                                   if(seconds === '60'){
//                                                                                     video_duration = "01:00"
//                                                                                   }
//                                                                                   else{
//                                                                                     video_duration = "0"+minutes+":"+seconds
//                                                                                   }
//                                                                                   if(seconds.length === 1){
//                                                                                     video_duration = "0"+minutes+":"+"0"+seconds
//                                                                                   }
//                                                                                 }
//                                                                                 else{
//                                                                                   if(seconds.length === 1){
//                                                                                     video_duration = minutes+":"+"0"+seconds
//                                                                                   }if(minutes.length === 1){
//                                                                                     video_duration = "0"+minutes+":"+"0"+seconds
//                                                                                   }
//                                                                                 }
//                                                                             var picked = coo.find(tagname => tagname === doc.feedTag_name);
//                                                                             if(picked != null){
//                                                                               tagitems.push({
//                                                                               "feed_id":coco._id,
//                                                                               "can_show_ad":can_show_ad,
//                                                                               "preview_url":constants.APIBASEURL+coco.preview_url,
//                                                                               "video_duration":video_duration
//                                                                           })
//                                                                             }
//                                                                             return true;
//                                                                           }else{
//                                                                             return false;
//                                                                           }
//                                                                         })
//                                                                       console.log("tag items length "+tagitems.length)
//                                                                       if(tagitems.length >=10){
//                                                                              var feedtag_name_new = doc.feedTag_name
                                                                            
//                                                                            feedtag_name_new = feedtag_name_new.replace(/#/g,"")
//                                                                           var foo = {
//                                                                             "tag_name":"#"+feedtag_name_new,
//                                                                             "hash_desc":"Trending on Fvmegear.",
//                                                                             "total_views":doc.feedTag_used,
//                                                                             "items":tagitems
//                                                                           }
//                                                                           test.push(foo);
//                                                                       }
//                                                                       else{

//                                                                             var remaining_length = 10-tagitems.length

//                                                                             console.log("remaining length "+remaining_length)

//                                                                            item_his.every(function(coco){
//                                                                               if(coco.privacy_mode === 1){
//                                                                                    can_show_ad = true
//                                                                                 }
//                                                                                 else{
//                                                                                   can_show_ad = false
//                                                                                 }
//                                                                               if(tagitems.length<remaining_length){

//                                                                                 console.log("inside tag items "+tagitems.length)
//                                                                                 var coo = coco.feeds_hash_tags
//                                                                                 var video_dur = coco.video_duration
//                                                                                 var video_duration = ""
//                                                                                var video  = video_dur*1000
                                                                                            
//                                                                                       var minutes = Math.floor(video / 60000);
//                                                                                         var seconds = ((video % 60000) / 1000).toFixed(0);
//                                                                                      minutes = minutes.toString()
//                                                                                       seconds = seconds.toString()
//                                                                                     var video_duration = minutes+":"+seconds

//                                                                                     if(minutes.length === 1 && seconds.length === 1){
//                                                                                       video_duration = "0"+minutes+":"+"0"+seconds

//                                                                                     }
//                                                                                     else if(minutes.length === 1){
//                                                                                       if(seconds === '60'){
//                                                                                         video_duration = "01:00"
//                                                                                       }
//                                                                                       else{
//                                                                                         video_duration = "0"+minutes+":"+seconds
//                                                                                       }
//                                                                                       if(seconds.length === 1){
//                                                                                         video_duration = "0"+minutes+":"+"0"+seconds
//                                                                                       }
//                                                                                     }
//                                                                                     else{
//                                                                                       if(seconds.length === 1){
//                                                                                         video_duration = minutes+":"+"0"+seconds
//                                                                                       }if(minutes.length === 1){
//                                                                                         video_duration = "0"+minutes+":"+"0"+seconds
//                                                                                       }
//                                                                                     }
//                                                                                 var picked = coo.find(tagname => tagname === doc.feedTag_name);
//                                                                                 if(picked != null){
//                                                                                   tagitems.push({
//                                                                                   "feed_id":coco._id,
//                                                                                   "can_show_ad":can_show_ad,
//                                                                                   "preview_url":constants.APIBASEURL+coco.preview_url,
//                                                                                   "video_duration":video_duration
//                                                                               })
//                                                                                 }
//                                                                                 return true;
//                                                                               }else{
//                                                                                 return false;
//                                                                               }
//                                                                             })
//                                                                              var feedtag_name_new = doc.feedTag_name
                                                                              
//                                                                              feedtag_name_new = feedtag_name_new.replace(/#/g,"")
//                                                                             var foo = {
//                                                                               "tag_name":"#"+feedtag_name_new,
//                                                                               "hash_desc":"Trending on Fvmegear.",
//                                                                               "total_views":doc.feedTag_used,
//                                                                               "items":tagitems
//                                                                             }
//                                                                             test.push(foo);
//                                                                       }
//                                                                     })

//                                                                     if(test.length >= 10){
//                                                                         res.status(200).json({
//                                                                             status: 'Ok',
//                                                                             message: 'Search main page',
//                                                                             userid: req.body.userid,
//                                                                             Search_list:test
//                                                                         });
//                                                                     }
//                                                                     else{

//                                                                       console.log(test)
//                                                                       var test_length = 10 - test.length

//                                                                       console.log("test length "+test_length)

//                                                                       feedtags.find({feedTag_name:{$nin:tags}}).sort({feedTag_used_today : -1}).limit(50)
//                                                                                 .select('feedTag_name feedTag_used -_id')
//                                                                                 .exec()
//                                                                                 .then(results =>{

//                                                                                     var testys = [];
//                                                                                     for(var i=0;i<results.length;i++){
//                                                                                       testys.push(results[i].feedTag_name)
//                                                                                     }
//                                                                                                             iv_permanent_feeds.find({$and:[{iv_acountid:{$nin:data[0].blocked}},{feeds_hash_tags:{$in:testys}},{feed_type:"video"},{old_feed_id:[]},{has_sensitive_content:false},{feed_expiry_status:0}]})
//                                                                                                                 .sort({no_rating:-1})
//                                                                                                                 .exec()
//                                                                                                                 .then(item_hisy =>{
//                                                                                                                       results.map(docy =>{
//                                                                                                                         var breakTheLoop = false;
//                                                                                                                         var tagitems = [];
//                                                                                                                         var can_show_ad = false
//                                                                                                                           item_hisy.every(function(coco){
//                                                                                                                             if(coco.privacy_mode === 1){
//                                                                                                                                  can_show_ad = true
//                                                                                                                               }
//                                                                                                                               else{
//                                                                                                                                 can_show_ad = false
//                                                                                                                               }
//                                                                                                                             if(tagitems.length<10){
//                                                                                                                               var coo = coco.feeds_hash_tags
//                                                                                                                               var video_dur = coco.video_duration
//                                                                                                                               var video_duration = ""
//                                                                                                                              var video  = video_dur*1000
                                                                                                                                          
//                                                                                                                                     var minutes = Math.floor(video / 60000);
//                                                                                                                                       var seconds = ((video % 60000) / 1000).toFixed(0);
//                                                                                                                                    minutes = minutes.toString()
//                                                                                                                                     seconds = seconds.toString()
//                                                                                                                                   var video_duration = minutes+":"+seconds

//                                                                                                                                   if(minutes.length === 1 && seconds.length === 1){
//                                                                                                                                     video_duration = "0"+minutes+":"+"0"+seconds

//                                                                                                                                   }
//                                                                                                                                   else if(minutes.length === 1){
//                                                                                                                                     if(seconds === '60'){
//                                                                                                                                       video_duration = "01:00"
//                                                                                                                                     }
//                                                                                                                                     else{
//                                                                                                                                       video_duration = "0"+minutes+":"+seconds
//                                                                                                                                     }
//                                                                                                                                     if(seconds.length === 1){
//                                                                                                                                       video_duration = "0"+minutes+":"+"0"+seconds
//                                                                                                                                     }
//                                                                                                                                   }
//                                                                                                                                   else{
//                                                                                                                                     if(seconds.length === 1){
//                                                                                                                                       video_duration = minutes+":"+"0"+seconds
//                                                                                                                                     }if(minutes.length === 1){
//                                                                                                                                       video_duration = "0"+minutes+":"+"0"+seconds
//                                                                                                                                     }
//                                                                                                                                   }
//                                                                                                                               var picked = coo.find(tagname => tagname === docy.feedTag_name);
//                                                                                                                               if(picked != null){
//                                                                                                                                 tagitems.push({
//                                                                                                                                 "feed_id":coco._id,
//                                                                                                                                 "can_show_ad":can_show_ad,
//                                                                                                                                 "preview_url":constants.APIBASEURL+coco.preview_url,
//                                                                                                                                 "video_duration":video_duration
//                                                                                                                             })
//                                                                                                                               }
//                                                                                                                               return true;
//                                                                                                                             }else{
//                                                                                                                               return false;
//                                                                                                                             }
//                                                                                                                           })
//                                                                                                                         if(tagitems.length > 0){
//                                                                                                                                var feedtag_name_new = docy.feedTag_name
                                                                                                                              
//                                                                                                                              feedtag_name_new = feedtag_name_new.replace(/#/g,"")
//                                                                                                                             var foo = {
//                                                                                                                               "tag_name":"#"+feedtag_name_new,
//                                                                                                                               "hash_desc":"Trending on Fvmegear.",
//                                                                                                                               "total_views":docy.feedTag_used,
//                                                                                                                               "items":tagitems
//                                                                                                                             }
//                                                                                                                             test.push(foo);
//                                                                                                                         }
                                                                                                                        
//                                                                                                                       })

//                                                                                                                           res.status(200).json({
//                                                                                                                               status: 'Ok',
//                                                                                                                               message: 'Search main page',
//                                                                                                                               userid: req.body.userid,
//                                                                                                                               Search_list:test
//                                                                                                                           });
                                                                                                                     
                                                                                                                        
//                                                                                                                 }).catch(err => {
//                                                                                                                   console.log(err)
//                                                                                                                     // var spliterror=err.message.split(":")
//                                                                                                                     //   res.status(500).json({ 
//                                                                                                                     //     status: 'Failed',
//                                                                                                                     //     message: spliterror[0]
//                                                                                                                     //   });
//                                                                                                                 });
                                                                                                        
                                                                                                
                                                                                    
//                                                                                 }).catch(err => {
//                                                                                   console.log(err)
//                                                                                   // var spliterror=err.message.split(":")
//                                                                                   //   res.status(500).json({ 
//                                                                                   //     status: 'Failed',
//                                                                                   //     message: spliterror[0]
//                                                                                   //   });
//                                                                                 });
//                                                                     }
                                                                      
//                                                               }).catch(err => {
//                                                                 console.log(err)
//                                                                   // var spliterror=err.message.split(":")
//                                                                   //   res.status(500).json({ 
//                                                                   //     status: 'Failed',
//                                                                   //     message: spliterror[0]
//                                                                   //   });
//                                                               });
//                                                       }).catch(err => {
//                                                         console.log(err)
//                                                         // var spliterror=err.message.split(":")
//                                                         //   res.status(500).json({ 
//                                                         //     status: 'Failed',
//                                                         //     message: spliterror[0]
//                                                         //   });
//                                                     });
//                                               })
//                                   }
//                               }).catch(err => {
//                                   console.log(err)
//                                 // var spliterror=err.message.split(":")
//                                 //   res.status(500).json({ 
//                                 //     status: 'Failed',
//                                 //     message: spliterror[0]
//                                 //   });
//                               });
//                         }
//                         else{
//                           res.status(200).json({
//                                   status: 'Ok',
//                                   message: 'No tags to display.',
//                                   Search_list:[]
//                                 });
//                         }
//                     }).catch(err => {
//                       console.log(err)
//                         // var spliterror=err.message.split(":")
//                         //   res.status(500).json({ 
//                         //     status: 'Failed',
//                         //     message: spliterror[0]
//                         //   });
//                     });
//           }
//         }).catch(err => {
//             var spliterror=err.message.split(":")
//               res.status(500).json({ 
//                 status: 'Failed',
//                 message: spliterror[0]
//               });
//         });
//       }else {
//        res.status(200).json({
//           status: 'Failed',
//           message: 'Bad Request. Please provide clientid.'
//       });
//     }
//   }else{
//      res.status(200).json({
//            status: 'Failed',
//            message: 'Bad Request. Please check your input parameters.'
//        });
//   }
// });

router.post("/get_search_main_page", (req, res, next) => {

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

            iv_feeds.find({$and:[{iv_acountid:{$ne:ObjectId(req.body.userid)}},{feed_type:"video"},{old_feed_id:[]},{has_sensitive_content:false},{feed_expiry_status:0},{is_static_feed:false}]})
                    .sort({no_views:-1})
                    .exec()
                    .then(dex =>{
                      console.log(dex.length)
                        if(dex.length > 0){

                          var tags = []

                          dex.map(dog =>{
                              var tags_db = dog.feeds_hash_tags
                              tags_db.forEach(function(efe){
                                var found = tags.find(o => String(o) === String(efe))

                                if(typeof found === 'undefined'){
                                  tags.push(efe)
                                }
                              })
                          })

                            feedtags.find({feedTag_name:{$in:tags}}).sort({feedTag_used_today : -1}).limit(10)
                              .select('feedTag_name feedTag_used -_id')
                              .exec()
                              .then(result =>{

                                if(result.length<0){
                                  res.status(200).json({
                                  status: 'Ok',
                                  message: 'No tags to display.',
                                  Search_list:[]
                                });
                                }
                                else{
                                  //console.log('result length ---------------------'+result.length)
                                  var testy = [];
                                  for(var i=0;i<result.length;i++){
                                    testy.push(result[i].feedTag_name)
                                  }
                                  contactsModel.aggregate([{$match:{userid:ObjectId(req.body.userid)}},
                                                          {$project:{blocked:"$blocked"}}
                                              ], function(err,data){

                                                  iv_feeds.find({$and:[{iv_acountid:{$ne:ObjectId(req.body.userid)}},{iv_acountid:{$nin:data[0].blocked}},{feeds_hash_tags:{$in:testy}},{feed_type:"video"},{old_feed_id:[]},{has_sensitive_content:false},{feed_expiry_status:0}]})
                                                      .sort({ is_static_feed:1,no_rating:-1})
                                                      .exec()
                                                      .then(item =>{
                                                        var test =[];
                                                        result.map(doc =>{
                                                          var breakTheLoop = false;
                                                          var tagitems = [];
                                                          var can_show_ad = false
                                                            item.every(function(coco){
                                                              if(coco.privacy_mode === 1){
                                                                   can_show_ad = true
                                                                }
                                                                else{
                                                                  can_show_ad = false
                                                                }
                                                              if(tagitems.length<10){
                                                                var coo = coco.feeds_hash_tags
                                                                var video_dur = coco.video_duration
                                                                var video_duration = ""
                                                               var video  = video_dur*1000
                                                                            
                                                                      var minutes = Math.floor(video / 60000);
                                                                        var seconds = ((video % 60000) / 1000).toFixed(0);
                                                                     minutes = minutes.toString()
                                                                      seconds = seconds.toString()
                                                                    var video_duration = minutes+":"+seconds

                                                                    if(minutes.length === 1 && seconds.length === 1){
                                                                      video_duration = "0"+minutes+":"+"0"+seconds

                                                                    }
                                                                    else if(minutes.length === 1){
                                                                      video_duration = "0"+minutes+":"+seconds
                                                                      if(seconds.length === 1){
                                                                        video_duration = "0"+minutes+":"+"0"+seconds
                                                                      }
                                                                    }
                                                                    else{
                                                                      if(seconds.length === 1){
                                                                        video_duration = minutes+":"+"0"+seconds
                                                                      }if(minutes.length === 1){
                                                                        video_duration = "0"+minutes+":"+"0"+seconds
                                                                      }
                                                                    }
                                                                var picked = coo.find(tagname => tagname === doc.feedTag_name);
                                                                if(picked != null){
                                                                  tagitems.push({
                                                                  "feed_id":coco._id,
                                                                  "can_show_ad":can_show_ad,
                                                                  "preview_url":constants.APIBASEURL+coco.preview_url,
                                                                  "video_duration":video_duration
                                                              })
                                                                }
                                                                return true;
                                                              }else{
                                                                return false;
                                                              }
                                                            })
                                                          if(tagitems.length >0){

                                                            var feedtag_name_new = doc.feedTag_name
                                                            
                                                           feedtag_name_new = feedtag_name_new.replace(/#/g,"")

                                                           
                                                           console.log("original name "+doc.feedTag_name)
                                                           console.log(feedtag_name_new)

                                                          var foo = {
                                                            "tag_name":"#"+feedtag_name_new,
                                                            "hash_desc":"Trending on Fvmegear.",
                                                            "total_views":doc.feedTag_used,
                                                            "items":tagitems
                                                          }
                                                          test.push(foo);
                                                          }
                                                        })
                                                        //console.log(test)
                                                          res.status(200).json({
                                                          status: 'Ok',
                                                          message: 'Search main page',
                                                          userid: req.body.userid,
                                                          Search_list:test
                                                      });
                                                      }).catch(err => {
                                                        var spliterror=err.message.split(":")
                                                          res.status(500).json({ 
                                                            status: 'Failed',
                                                            message: spliterror[0]
                                                          });
                                                    });
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
                                  status: 'Ok',
                                  message: 'No tags to display.',
                                  Search_list:[]
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


router.post("/get_feeds_by_tags", (req, res, next) => {

  var keyArray = ["userid", "iv_token", "clientid", "page_no", "tag_name"];
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
				var skip = ((perPage * page) - perPage)
          contactsModel.aggregate([{$match:{userid:ObjectId(req.body.userid)}},
                                    {$project:{blocked:"$blocked"}}
            ], function(err,data){
                iv_feeds.find({$and:[{iv_acountid:{$nin:data[0].blocked}},{feeds_hash_tags:req.body.tag_name},{feed_type:"video"},{old_feed_id:[]},{has_sensitive_content:false},{feed_expiry_status:0}]})
                  .sort({is_static_feed:1,no_rating:-1})
                  .skip(skip)
                  .limit(perPage)
                  .exec()
                  .then(item =>{

                            iv_feeds.find({$and:[{iv_acountid:{$nin:data[0].blocked}},{feeds_hash_tags:req.body.tag_name},{feed_type:"video"},{old_feed_id:[]},{has_sensitive_content:false},{feed_expiry_status:0}]}).count().exec(function(err, count) {
                             

                                if (err){
                                  res.status(500).json({
                                   status: "Failed",
                                   message: "Error fetching feeds."
                                  })
                                }
                                else{
                                  var test =[];
                                  var can_show_ad = false;
                                  item.map(coco => {
                                    if(coco.privacy_mode === 1){
                                       can_show_ad = true
                                    }
                                    else{
                                      can_show_ad = false
                                    }
                                    var video_dur = coco.video_duration
                                    var video_duration = ""
                                                      var video  = video_dur*1000
                                                                
                                                          var minutes = Math.floor(video / 60000);
                                                            var seconds = ((video % 60000) / 1000).toFixed(0);
                                                           minutes = minutes.toString()
                                                          seconds = seconds.toString()
                                                        var video_duration = minutes+":"+seconds

                                                        if(minutes.length === 1 && seconds.length === 1){
                                                          video_duration = "0"+minutes+":"+"0"+seconds

                                                        }
                                                        else if(minutes.length === 1){
                                                          if(seconds === '60'){
                                                            video_duration = "01:00"
                                                          }
                                                          else{
                                                            video_duration = "0"+minutes+":"+seconds
                                                          }
                                                          if(seconds.length === 1){
                                                            video_duration = "0"+minutes+":"+"0"+seconds
                                                          }
                                                        }
                                                        else{
                                                          if(seconds.length === 1){
                                                            video_duration = minutes+":"+"0"+seconds
                                                          }if(minutes.length === 1){
                                                            video_duration = "0"+minutes+":"+"0"+seconds
                                                          }
                                                        }
                                    test.push({
                                       "feed_id":coco._id,
                                       "can_show_ad":can_show_ad,
                                       "preview_url":constants.APIBASEURL+coco.preview_url,
                                       "video_duration":video_duration
                                    })
                                  })

                                  var count_final= count
                                  res.status(200).json({
                                      status: 'Ok',
                                      message: 'Feeds by tag',
                                      total_pages: Math.ceil(count_final / perPage),
                                      current_page: page,
                                      total_items: count_final,
                                      userid: req.body.userid,
                                      tag_name: req.body.tag_name,
                                      items:test
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
            })
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


router.post("/get_search", (req, res, next) => {

  var keyArray = ["userid", "iv_token", "clientid", "search_query"];
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
			           var page = 1

				        var skip = ((perPage * page) - perPage)
            contactsModel.aggregate([{$match:{userid:ObjectId(req.body.userid)}},
                                    {$project:{blocked:"$blocked"}}
            ], function(err,data){
                  var blocked = data[0].blocked
                  var main_user = req.body.search_query
                  var queryuser = {$or:[{$text: {$search: req.body.search_query, $language: 'en'}},
                            {$and:[{_id:{$nin:data[0].blocked}},{username:{$regex: "^"+req.body.search_query, '$options' : 'i'}}]}]};
                  
                  var querytag = {$or:[{$text: {$search: req.body.search_query, $language: 'en'}},
                            {feedTag_name:{$regex: "^"+req.body.search_query, '$options' : 'i'}}]};

                  feedtags.find(querytag)
                      .skip(skip)
                      .limit(perPage)
                      .exec()
                      .then(posts => {
                        feedtags.find(querytag).count().exec(function(err, counttag) {
                            if (err){
                              res.status(500).json({
                            status: "Failed",
                            message: "Error fetching feedtags."
                          })
                            }
                            else{
                          User.find(queryuser)
                            .skip(skip)
                              .limit(perPage)
                            .exec()
                            .then(data =>{
                              User.find(queryuser).count().exec(function(err, countuser) {
                                    if (err){
                                      res.status(500).json({
                                    status: "Failed",
                                    message: "Error fetching users."
                                  })
                                    }
                                    else{
                                  var tags =[];
                                  var users =[];
                                  if(posts.length>0){
                                    posts.map(docs =>{
                                      var foe = {
                                        "tag_name":docs.feedTag_name,
                                        "total_views":docs.feedTag_used
                                      }
                                      tags.push(foe)
                                    })
                                  }
                                  if(data.length>0){
                                    data.map(doc =>{
                                      var profileimage =  doc.profileimage//constants.APIBASEURL+
                                      if(profileimage === null){
                                        profileimage =  'uploads/userimage.png'
                                      }
                                      console.log(profileimage)
                                      var is_blocked = false
                                      if(blocked.length > 0){
                                          blocked.every(function(ele){
                                            if(String(doc._id) === String(ele)){
                                              is_blocked = true
                                              return false
                                            }
                                            else{
                                              is_blocked = false
                                              return true
                                            }
                                          })
                                      }
                                      if(is_blocked === false){
                                        var foo ={
                                          "username":doc.username,
                                          "userid":doc._id,
                                          "fullname":doc.fullname,
                                          "profileimage":constants.APIBASEURL+profileimage
                                        }
                                        users.push(foo)
                                      }
                                    })
                                  }
                                  res.status(200).json({ 
                                        status: 'Ok',
                                        message: 'Search result',
                                        total_users_pages: Math.ceil(countuser / perPage),
                                        total_tags_pages: Math.ceil(counttag / perPage),
                                        userid: req.body.userid,
                                        users: users,
                                        tags: tags,
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
                })
                }).catch(err => {
                      var spliterror=err.message.split(":")
                        res.status(500).json({ 
                          status: 'Failed',
                          message: spliterror[0]
                        });
                  });
                })
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

router.post("/get_search_by_type", (req, res, next) => {

  var keyArray = ["userid", "iv_token", "clientid", "search_query", "search_type", "page_no"];
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
        var skip = ((perPage * page) - perPage)
           contactsModel.aggregate([{$match:{userid:ObjectId(req.body.userid)}},
                                    {$project:{blocked:"$blocked"}}
                  ], function(err,data){
                    var blocked = data[0].blocked
                  if(req.body.search_type === 'user'){
                    var query = {$or:[{$text: {$search: req.body.search_query, $language: 'en'}},
                            {$and:[{_id:{$nin:data[0].blocked}},{username:{$regex: "^"+req.body.search_query, '$options' : 'i'}}]}]};
                    
                    User.find(query)
                        .skip(skip)
                        .limit(perPage)
                      .exec()
                      .then(data =>{
                        User.find(query).count().exec(function(err, count) {
                              if (err){
                                res.status(500).json({
                              status: "Failed",
                              message: "Error fetching users."
                            })
                              }
                              else{
                            var users =[];
                            if(data.length>0){
                              data.map(doc =>{
                                var profileimage = doc.profileimage 
                                if(profileimage === null){
                                  profileimage = 'uploads/userimage.png' 
                                }
                                      var is_blocked = false
                                      if(blocked.length > 0){
                                          blocked.every(function(ele){
                                            if(String(doc._id) === String(ele)){
                                              is_blocked = true
                                              return false
                                            }
                                            else{
                                              is_blocked = false
                                              return true
                                            }
                                          })
                                      }
                                if(is_blocked === false){
                                  var foo ={
                                    "username":doc.username,
                                    "userid":doc._id,
                                    "fullname":doc.fullname,
                                    "profileimage":constants.APIBASEURL+profileimage
                                  }
                                  users.push(foo)
                                }
                              })
                            }
                            res.status(200).json({ 
                              status: 'Ok',
                              message: 'Search result',
                              total_users_pages: Math.ceil(count / perPage),
                          current_page: page,
                          total_items: count,
                              userid: req.body.userid,
                              users: users
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
                  else if(req.body.search_type === 'tag'){
                    var query = {$or:[{$text: {$search: req.body.search_query, $language: 'en'}},
                              {feedTag_name:{$regex: "^"+req.body.search_query, '$options' : 'i'}}]};
                    
                    feedtags.find(query)
                        .exec()
                        .then(posts => {
                          feedtags.find(query).count().exec(function(err, count) {
                              if (err){
                                res.status(500).json({
                              status: "Failed",
                              message: "Error fetching feedtags."
                            })
                              }
                              else{
                            var tags =[];
                            if(posts.length>0){
                              posts.map(docs =>{
                                var foe = {
                                  "tag_name":docs.feedTag_name,
                                  "total_views":docs.feedTag_used
                                }
                                tags.push(foe)
                              })
                            }
                            res.status(200).json({ 
                                  status: 'Ok',
                                  message: 'Search result',
                                  total_tags_pages: Math.ceil(count / perPage),
                          current_page: page,
                          total_items: count,
                                  userid: req.body.userid,
                                  tags: tags
                              });
                      }
                    });
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
                      message: 'Bad Request. Please provide correct search_type.'
                  });
                  }
            })
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



router.post("/get_contact_search", (req, res, next) => {

  var keyArray = ["userid", "iv_token", "clientid", "search_query", "search_type", "page_no"];
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
                var skip = ((perPage * page) - perPage)
                var limit = skip+perPage;

                if(req.body.search_type === 'Invites'){
                      contactsModel.find({userid:ObjectId(req.body.userid)})
                          .populate('existing_contacts.contact')
                          .exec()
                          .then(docs =>{
                                var test =[]
                                var contacts = docs[0].new_contacts 
                                var existing_contacts = docs[0].existing_contacts
                                const count = contacts.length 

                                var found = contacts.filter(o => String(o.username).toLowerCase().indexOf(String(req.body.search_query).toLowerCase()) == 0)

                                found.forEach(function(dex){
                                  var mobile = dex.mobile
                                  var fix = existing_contacts.find(o => String(o.contact.mobile) === String(mobile))

                                  var mob = String(mobile).replace(/ /g,"")

                                  if(typeof fix === 'undefined'){
                                    var foe = {
                                        'username':dex.username,
                                        'fullname':"",
                                        'userid':"",
                                        'mobile':mob,
                                        'profileimage':constants.APIBASEURL+'uploads/userimage.png',
                                        "is_following":false
                                      }
                                      test.push(foe)
                                  } 
                                })

                                totalcontacts = test.length
                                var totalPages = 1

                                if(test.length > perPage){
                                      totalPages = Math.ceil((test.length) / perPage);
                                     test = test.slice(skip,limit);
                                }
                                else{
                                  page = 1
                                  totalPages = 1
                                }

                                res.status(200).json({ 
                                  status: 'Ok',
                                  message: 'List of contacts',
                                  total_pages: totalPages,
                                  current_page:page,
                                  total_contacts:totalcontacts,
                                  userid:req.body.userid,
                                  contacts: test
                                });

                          }).catch(err => {
                            var spliterror=err.message.split(":")
                              res.status(500).json({ 
                                status: 'Failed',
                                message: spliterror[0]
                              });
                        });
                }
                else if(req.body.search_type === 'Contacts'){
                    contactsModel.aggregate([ {$match:{userid:ObjectId(req.body.userid)}},
                        {$project:{blocked:'$blocked',
                            existing_contacts:'$existing_contacts.contact_details'
                        }}
                    ], function(err,data){
                        if(err){
                          res.status(200).json({ 
                            status: 'Failed',
                            message: "Please provide correct userid"
                          });
                        }else{    
                          if(data.length < 1){
                            res.status(200).json({
                                  status: 'Ok',
                                  message: 'No contacts to Display.',
                                  contacts:[]
                              });
                          }
                          else{
                                userDetails.find({$and:[{userid:{$nin:data[0].blocked}},{_id:{$in:data[0].existing_contacts}}]})
                                    .populate("userid","_id username profileimage mobile fullname")
                                    //.skip(skip)
                                    //.limit(limit)
                                    .exec()
                                    .then(docs =>{

                                        userDetails.find({$and:[{userid:{$nin:data[0].blocked}},{_id:{$in:data[0].existing_contacts}}]}).count().exec(function(err, count) {
                                            if (err){
                                              res.status(500).json({
                                              status: "Failed",
                                              message: "Error fetching contacts."
                                        })
                                            }
                                            else{
                                              if (docs.length < 1) {
                                                return res.status(200).json({
                                                  status:"Ok",
                                                  message:"No contacts to display.",
                                                  contacts:[]
                                                });
                                              } 
                                          else {
                                              var testapi = [];

                                              var found = docs.filter(o => String(o.userid.username).toLowerCase().indexOf(String(req.body.search_query).toLowerCase()) == 0)
                                              found.map(conn =>{
                                                  var profileimage = conn.userid.profileimage;
                                                  if(conn.userid.profileimage === null){
                                                    profileimage = "uploads/userimage.png"
                                                  }
                                                  var tess = {
                                                    "username":conn.userid.username,
                                                    "fullname":conn.userid.fullname,
                                                    "userid":conn.userid._id,
                                                    "mobile":conn.userid.mobile,
                                                    "profileimage": constants.APIBASEURL+'uploads/userimage.png',//constants.APIBASEURL+profileimage,
                                                    "is_following":false
                                                   // "view_points":conn.view_points,
                                                   // "talent_points":conn.talent_points
                                                  }
                                                  testapi.push(tess)
                                            })

                                          var totalPages= 1;
                                      
                                          if(testapi.length > perPage){
                                            
                                              testapi.slice(skip,limit)
                                          }

                                        
                                          res.status(200).json({ 
                                                  status: 'Ok',
                                                  message: 'List of contacts',
                                                  total_pages: Math.ceil(testapi.length / perPage),
                                                  current_page:page,
                                                  total_contacts:testapi.length,
                                                  userid:req.body.userid,
                                                  contacts: testapi
                                              });
                                        }
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
                    }
                  })
                }
                else if(req.body.search_type === 'contacts_by_category'){

                  userDetails.find({userid:ObjectId(req.body.userid)})
                            .exec()
                            .then(dog =>{
                                     contactsModel.aggregate([ {$match:{userid:ObjectId(req.body.userid)}},
                                        {$match:{'existing_contacts.user_category':dog[0].category_type}},
                                        {$project:{blocked:'$blocked',
                                            existing_contacts:'$existing_contacts.contact_details'
                                        }}
                                      ], function(err,data){
                                          if(err){
                                            res.status(200).json({ 
                                              status: 'Failed',
                                              message: "Please provide correct userid"
                                            });
                                          }else{    
                                            if(data.length < 1){
                                              res.status(200).json({
                                                    status: 'Ok',
                                                    message: 'No contacts to Display.',
                                                    contacts:[]
                                                });
                                            }
                                            else{
                                                  userDetails.find({$and:[{userid:{$nin:data[0].blocked}},{_id:{$in:data[0].existing_contacts}}]})
                                                      .populate("userid","_id username profileimage mobile fullname")
                                                      //.skip(skip)
                                                      //.limit(limit)
                                                      .exec()
                                                      .then(docs =>{

                                                          userDetails.find({$and:[{userid:{$nin:data[0].blocked}},{_id:{$in:data[0].existing_contacts}}]}).count().exec(function(err, count) {
                                                              if (err){
                                                                res.status(500).json({
                                                                status: "Failed",
                                                                message: "Error fetching contacts."
                                                          })
                                                              }
                                                              else{
                                                                if (docs.length < 1) {
                                                                  return res.status(200).json({
                                                                    status:"Ok",
                                                                    message:"No contacts to display.",
                                                                    contacts:[]
                                                                  });
                                                                } 
                                                            else {
                                                                var testapi = [];

                                                                var found = docs.filter(o => String(o.userid.username).toLowerCase().indexOf(String(req.body.search_query).toLowerCase()) == 0)
                                                                found.map(conn =>{
                                                                    var profileimage = conn.userid.profileimage;
                                                                    if(conn.userid.profileimage === null){
                                                                      profileimage = "uploads/userimage.png"
                                                                    }
                                                                    var tess = {
                                                                      "username":conn.userid.username,
                                                                      "fullname":conn.userid.fullname,
                                                                      "userid":conn.userid._id,
                                                                      "mobile":conn.userid.mobile,
                                                                      "profileimage":constants.APIBASEURL+profileimage,
                                                                      "is_following":false
                                                                      // "view_points":conn.view_points,
                                                                      // "talent_points":conn.talent_points
                                                                    }
                                                                    testapi.push(tess)
                                                              })

                                                            var totalPages= 1;
                                                        
                                                            if(testapi.length > perPage){
                                                              
                                                                testapi.slice(skip,limit)
                                                            }

                                                            res.status(200).json({ 
                                                                    status: 'Ok',
                                                                    message: 'List of contacts',
                                                                    total_pages: Math.ceil(testapi.length / perPage),
                                                                    current_page:page,
                                                                    total_contacts:testapi.length,
                                                                    userid:req.body.userid,
                                                                    contacts: testapi
                                                                });
                                                          }
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
                else if(req.body.search_type === 'Followers'){
                    contactsModel.distinct("existing_contacts.contact_details",{userid:ObjectId(req.body.userid)})
                                  .exec()
                                  .then(dex =>{

                                    userDetails.find({userid:ObjectId(req.body.userid)})
                                      .populate({path : 'followers', populate : {path : 'userid'}})
                                      .exec()
                                      .then(data =>{
                                        var test = [];
                                          if(data[0].followers.length>0){
                                            var followers = data[0].followers
                                            var following = data[0].following

                                            var found = followers.filter(o => String(o.userid.username).toLowerCase().indexOf(String(req.body.search_query).toLowerCase()) == 0)

                                            found.map(doc =>{
                                                var is_contact = false
                                                dex.every(function(ele){
                                                  if(String(ele) === String(doc._id)){
                                                    is_contact = true
                                                    return false
                                                  }
                                                  else{
                                                    is_contact = false
                                                    return true
                                                  }

                                                })
                                                if(is_contact === false){
                                                    var is_following =  false;
                                                  var found = following.find(o => String(o) === String(doc._id))

                                                  if(typeof found === 'undefined'){
                                                    is_following = false
                                                  }
                                                  else{
                                                    is_following = true
                                                  }

                                                  var profileimage = doc.userid.profileimage;
                                                  if(doc.userid.profileimage === null){
                                                    profileimage = "uploads/userimage.png"
                                                  }
                                                  var foe = {
                                                    'username':doc.userid.username,
                                                    'fullname':doc.userid.fullname,
                                                    'userid':doc.userid._id,
                                                    'profileimage':constants.APIBASEURL+profileimage,
                                                    'mobile':doc.userid.mobile,
                                                    'is_following':is_following
                                                  }
                                                  test.push(foe)
                                                }
                                                else{
                                                  userDetails.findOneAndUpdate({userid:ObjectId(req.body.userid)},{$pull:{followers:ObjectId(doc._id)}, $inc:{followers_count:-1}})
                                                        .exec()

                                                }
                                            })
                                            const totalcount = test.length;
                                            test = test.slice(skip,limit)
                                            res.status(200).json({ 
                                              status: 'Ok',
                                              message: "Followers",
                                              total_pages: Math.ceil(totalcount / perPage),
                                              current_page:page,
                                              total_contacts:totalcount,
                                              userid: req.body.userid,
                                              contacts:test
                                            }); 
                                          }else{
                                            res.status(200).json({ 
                                              status: 'Ok',
                                              message: "No user is following you.",
                                              contacts:test
                                            }); 
                                          }
                                      }).catch(err => {
                                        var spliterror=err.message.split("_")
                                        if(spliterror[1].indexOf("id")>=0){
                                          res.status(200).json({ 
                                            status: 'Failed',
                                            message: "Please provide correct userid"
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
                                        res.status(200).json({ 
                                          status: 'Failed',
                                          message: "Please provide correct userid"
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
                else if(req.body.search_type === 'Following'){
                    contactsModel.distinct("existing_contacts.contact_details",{userid:ObjectId(req.body.userid)})
                          .exec()
                          .then(dex =>{
                            userDetails.find({userid:ObjectId(req.body.userid)})
                              .populate({path : 'following', populate : {path : 'userid'}})
                              .exec()
                              .then(data =>{
                                var test = [];
                                  if(data[0].following.length>0){
                                    var following = data[0].following
                                    count = 0
                                    var found = following.filter(o => String(o.userid.username).toLowerCase().indexOf(String(req.body.search_query).toLowerCase()) == 0)
                                    found.map(doc =>{
                                        var is_contact = false
                                        dex.every(function(ele){
                                          if(String(ele) === String(doc._id)){
                                            is_contact = true
                                            return false
                                          }
                                          else{
                                            is_contact = false
                                            return true
                                          }

                                        })
                                          if(is_contact === false){
                                            var profileimage = doc.userid.profileimage;
                                            if(doc.userid.profileimage === null){
                                              profileimage = "uploads/userimage.png"
                                            }
                                            var foe = {
                                              'username':doc.userid.username,
                                              'fullname':doc.userid.fullname,
                                              'userid':doc.userid._id,
                                              'profileimage':constants.APIBASEURL+profileimage,
                                              'mobile':doc.userid.mobile,
                                              'is_following':true
                                            }
                                            test.push(foe)
                                          }
                                          else{
                                            userDetails.findOneAndUpdate({userid:ObjectId(req.body.userid)},{$pull:{following:ObjectId(doc._id)}, $inc:{following_count:-1}})
                                                .exec()
                                          }
                                          
                                        
                                    })
                                    const totalcount = test.length;
                                    test = test.slice(skip,limit)

                                    res.status(200).json({ 
                                      status: 'Ok',
                                      message: "Following users",
                                      total_pages: Math.ceil(totalcount / perPage),
                                      current_page:page,
                                      total_contacts:totalcount,
                                      userid: req.body.userid,
                                      contacts:test
                                    }); 
                                  }else{
                                    res.status(200).json({ 
                                      status: 'Ok',
                                      message: "You are not following any user.",
                                      contacts:test
                                    }); 
                                  }
                              }).catch(err => {
                                var spliterror=err.message.split("_")
                                if(spliterror[1].indexOf("id")>=0){
                                  res.status(200).json({ 
                                    status: 'Failed',
                                    message: "Please provide correct userid"
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
                                res.status(200).json({ 
                                  status: 'Failed',
                                  message: "Please provide correct userid"
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

module.exports = router;