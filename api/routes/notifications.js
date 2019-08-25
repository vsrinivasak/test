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
const notificationModel = require("../models/notifications");
const userDetails = require("../models/userDetails");
const challenges = require("../models/challenge");
const isodate = require("isodate");
const moment = require("moment");

router.post("/notification_list", (req, res, next) => {

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
          		    notificationModel.find({userid:ObjectId(req.body.userid)})
                                .populate('notifications.profileimage notifications.member_profile')
                                .exec()
                                .then(docs =>{
                                    var notify = docs[0].notifications;
                                    var test = [];
                                    if(notify.length < 1){
                                      return res.status(200).json({
                                          status:"Ok",
                                          message:"No notifications to display.",
                                          notifications:test
                                        });
                                    }
                                    else{
                                      notify.sort(function(a,b){
                                        return new Date(b.created_at) - new Date(a.created_at);
                                      });
                                      var count = notify.length
                                      var notifix = notify.slice(skip,limit);
                                      notifix.map(doc =>{
                                            var date = new Date()
                                            var date1 = date.setTime(date.getTime());
                                            var dateNow = new Date(date1).toISOString();
                                            var time = Date.parse(dateNow) - Date.parse(doc.created_at);
                                            var seconds1 = Math.floor( (time/1000) % 60 );
                                            var minutes1 = Math.floor( (time/1000/60) % 60 );
                                            var hours1 = Math.floor( (time/(1000*60*60)) % 24 );
                                            var days1 = Math.floor( time/(1000*60*60*24) );
                                            var calculatetime = ''

                                            if(seconds1 >= 1 && seconds1 < 60 && minutes1===0 && hours1===0 && days1 === 0){
                                              if(seconds1 === 1){
                                                calculatetime = seconds1 + ' second ago';
                                              }
                                              else{
                                                calculatetime = seconds1+ ' seconds ago';
                                              }
                                            }

                                            else if(minutes1 >= 1 && minutes1 < 60 && hours1===0 && days1 === 0){
                                              if(minutes1 === 1){
                                                calculatetime = minutes1 + ' minute ago';
                                              }
                                              else{
                                                calculatetime = minutes1 + ' minutes ago';
                                              }
                                            }

                                            else if(hours1 >= 1 && hours1 < 24 && days1 === 0){
                                              if(hours1 === 1){

                                                calculatetime = hours1 + ' hour ago';
                                              }
                                              else{
                                                calculatetime = hours1 + ' hours ago';
                                              }
                                            }
                                            else{
                                                if(days1 === 1){
                                                    calculatetime = days1 + ' day ago'
                                                }
                                                else if(days1 <= 7){
                                                    calculatetime = days1 + ' days ago'
                                                }
                                                else{
                                                  calculatetime = String(doc.created_at).substring(0,10)
                                                }
                                                
                                            }
                                              var profileimage = doc.profileimage
                   
                                                if(typeof profileimage === 'undefined'){
                                                      profileimage = constants.APIBASEURL+'uploads/userimage.png'
                                                    }
                                                    else{
                                                      if(profileimage === null){
                                                          profileimage = constants.APIBASEURL+"uploads/announce.png"
                                                      }
                                                      else{
                                                       if(profileimage.profileimage === null){
                                                          profileimage = constants.APIBASEURL+'uploads/userimage.png'
                                                        }
                                                        else{
                                                          profileimage = constants.APIBASEURL+profileimage.profileimage
                                                        }
                                                      }

                                                    }
                                                  

                                              var member_profile = doc.member_profile
         
                                                    if(typeof member_profile === 'undefined'){
                                                      member_profile = constants.APIBASEURL+'uploads/userimage.png'
                                                    }
                                                    else{
                                                      if(member_profile.profileimage === null){
                                                        member_profile = constants.APIBASEURL+'uploads/userimage.png'
                                                      }
                                                      else{
                                                              member_profile = constants.APIBASEURL+member_profile.profileimage
                                                            }
                                                    }
                                                
                                              var amount = 0;
                                              if(typeof doc.additional_details.challenge_amount != 'undefined'){
                                                var chall_amount = doc.additional_details.challenge_amount
                                                if(chall_amount > 0){
                                                  amount = chall_amount
                                                }
                                              }

                                              var sender = ""
                                              var message = ""
                                              var title =""
                                              var msg_id = ""
                                              var msg_created_at = Date.now()
                                              if(typeof doc.sender != 'undefined'){
                                                sender = doc.sender
                                              }

                                              if(typeof doc.message != 'undefined'){
                                                message = doc.message
                                              }

                                              if(typeof msg_created_at != 'undefined'){
                                                  msg_created_at = doc.msg_created_at
                                              }

                                              if(typeof title != 'undefined'){
                                                title = doc.title
                                              }

                                              if(typeof msg_id != 'undefined'){
                                                msg_id = doc.msg_id
                                              }

                                            var foe = {
                                              'message' : doc.notification_data,
                                              'item_id' :String(doc.item_id),
                                              'notification_id' : doc.notification_number,
                                              'created_at' : calculatetime,
                                              'profileimage': profileimage,
                                              'additional_details':{
                                                  userid:doc.additional_details.userid,
                                                  feed_id:doc.additional_details.feed_id,
                                                  member_feed_id:doc.additional_details.member_feed_id,
                                                  member_id:doc.additional_details.member_id,
                                                  'member_url': profileimage,
                                                  'member_name':doc.username,
                                                  'url':member_profile,
                                                  'username':doc.member_name,
                                                  user_preview_url:doc.additional_details.user_preview_url,
                                                  member_preview_url:doc.additional_details.member_preview_url,
                                                  challenge_amount:String(amount)
                                              },
                                              'sender':sender,
                                              'msg': message,
                                              'title':title,
                                              'msg_id':msg_id,
                                              'msg_created_at':msg_created_at,
                                              'notification_slug': doc.notification_type,
                                              'feed_type':doc.feed_type,
                                              'view_status':doc.view_status
                                            }
                                            test.push(foe)
                                      })
                                        res.status(200).json({
                                           status: 'Ok',
                                           message: 'List of notifications.',
                                           total_pages: Math.ceil(count / perPage),
                                          current_page:page,
                                          total_notifications:count,
                                           notifications:test
                                       });
                                    }
                                }).catch(err =>{
                                  console.log(err)
                                   // var spliterror=err.message.split("_")
                                   //  if(spliterror[1].indexOf("id")>=0){
                                   //     res.status(200).json({ 
                                   //         status: 'Failed',
                                   //         message: "Please provide correct userid"
                                   //     });
                                   //  }
                                   //  else{
                                   //     res.status(500).json({ 
                                   //         status: 'Failed',
                                   //         message: err.message
                                   //     });
                                   //  }
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


router.post("/notification_grouping", (req, res, next) => {

  var keyArray = ["userid", "iv_token", "clientid", "page_no", "screen_type"];
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

                  var day = new Date()
                  day = day.setDate(day.getDate() + 1)
                  day = new Date(day).setHours(0,0,0,0)
                  var last_wk = new Date()
                  var last_week = last_wk.setDate(last_wk.getDate() - 6)
                  last_week = new Date(last_week).setHours(0,0,0,0)

                  if(req.body.screen_type === "offers"){

                                notificationModel.aggregate([
                                  {$match:{userid: ObjectId(req.body.userid)}},
                                  {$unwind: "$notifications"},
                                  {$match:{$and: [{$or: [{"notifications.notification_type": 'OfferGroup'},
                                                       {"notifications.notification_type": 'CreateOfferGroup'}]},
                                                       {"notifications.created_at":{$gte:new Date(last_week),$lte:new Date(day)}}]}},
                                       {$group:{
                                        _id:  "$userid" ,
                                        notifications: { $addToSet:"$notifications"},
                                        count:{$sum:1}
                                       }
                                   } 
                                ])
                                .exec()
                                .then(data =>{
                                    if(data.length < 1){
                                      return res.status(200).json({
                                          status:"Ok",
                                          message:"No notifications to display.",
                                          notifications:[]
                                        });
                                    }
                                    else{
                                      var notes = data[0].notifications;
                                      var test = [];
                                      notificationModel.populate(data,{path : 'notifications.profileimage notifications.member_profile'},function(err,docs){

                                        if(err){
                                            return res.status(200).json({
                                              status:"Failed",
                                              message:"Error fetching notifications."
                                            });
                                        }
                                        else{

                                              var notify = docs[0].notifications;
                                              
                                              notify.sort(function(a,b){
                                                return new Date(b.created_at) - new Date(a.created_at);
                                              });
                                              var count = notify.length
                                              var notifix = notify.slice(skip,limit);

                                              notifix.map(doc =>{
                                                    var date = new Date()
                                                    var date1 = date.setTime(date.getTime());
                                                    var dateNow = new Date(date1).toISOString();
                                                    var time = Date.parse(dateNow) - Date.parse(doc.created_at);
                                                    var seconds1 = Math.floor( (time/1000) % 60 );
                                                    var minutes1 = Math.floor( (time/1000/60) % 60 );
                                                    var hours1 = Math.floor( (time/(1000*60*60)) % 24 );
                                                    var days1 = Math.floor( time/(1000*60*60*24) );
                                                    var calculatetime = ''

                                                    if(seconds1 >= 1 && seconds1 < 60 && minutes1===0 && hours1===0 && days1 === 0){
                                                      if(seconds1 === 1){
                                                        calculatetime = seconds1 + ' second ago';
                                                      }
                                                      else{
                                                        calculatetime = seconds1+ ' seconds ago';
                                                      }
                                                    }

                                                    else if(minutes1 >= 1 && minutes1 < 60 && hours1===0 && days1 === 0){
                                                      if(minutes1 === 1){
                                                        calculatetime = minutes1 + ' minute ago';
                                                      }
                                                      else{
                                                        calculatetime = minutes1 + ' minutes ago';
                                                      }
                                                    }

                                                    else if(hours1 >= 1 && hours1 < 24 && days1 === 0){
                                                      if(hours1 === 1){

                                                        calculatetime = hours1 + ' hour ago';
                                                      }
                                                      else{
                                                        calculatetime = hours1 + ' hours ago';
                                                      }
                                                    }
                                                    else{
                                                        if(days1 === 1){
                                                            calculatetime = days1 + ' day ago'
                                                        }
                                                        else if(days1 <= 7){
                                                            calculatetime = days1 + ' days ago'
                                                        }
                                                        else{
                                                          calculatetime = String(doc.created_at).substring(0,10)
                                                        }
                                                        
                                                    }
                                                      var profileimage = doc.profileimage
                           
                                                        if(typeof profileimage === 'undefined'){
                                                              profileimage = constants.APIBASEURL+'uploads/userimage.png'
                                                            }
                                                            else{
                                                              if(profileimage === null){
                                                                  profileimage = constants.APIBASEURL+"uploads/announce.png"
                                                              }
                                                              else{
                                                               if(profileimage.profileimage === null){
                                                                  profileimage = constants.APIBASEURL+'uploads/userimage.png'
                                                                }
                                                                else{
                                                                  profileimage = constants.APIBASEURL+profileimage.profileimage
                                                                }
                                                              }

                                                            }
                                                          

                                                      var member_profile = doc.member_profile
                 
                                                            if(typeof member_profile === 'undefined'){
                                                              member_profile = constants.APIBASEURL+'uploads/userimage.png'
                                                            }
                                                            else{
                                                              if(member_profile.profileimage === null){
                                                                member_profile = constants.APIBASEURL+'uploads/userimage.png'
                                                              }
                                                              else{
                                                                      member_profile = constants.APIBASEURL+member_profile.profileimage
                                                                    }
                                                            }
                                                        
                                                      var amount = 0;
                                                      if(typeof doc.additional_details.challenge_amount != 'undefined'){
                                                        var chall_amount = doc.additional_details.challenge_amount
                                                        if(chall_amount > 0){
                                                          amount = chall_amount
                                                        }
                                                      }

                                                      var sender = ""
                                                      var message = ""
                                                      var title =""
                                                      var msg_id = ""
                                                      var msg_created_at = Date.now()
                                                      var is_action_done = true

                                                      if(typeof doc.sender != 'undefined'){
                                                        sender = doc.sender
                                                      }

                                                      if(typeof doc.message != 'undefined'){
                                                        message = doc.message
                                                      }

                                                      if(typeof doc.msg_created_at != 'undefined'){
                                                          msg_created_at = doc.msg_created_at
                                                      }

                                                      if(typeof doc.title != 'undefined'){
                                                        title = doc.title
                                                      }

                                                      if(typeof doc.msg_id != 'undefined'){
                                                        msg_id = doc.msg_id
                                                      }

                                                      if(typeof doc.is_action_done != 'undefined'){
                                                        is_action_done = doc.is_action_done
                                                      }

                                                      console.log("is action done status "+is_action_done)

                                                    var foe = {
                                                      'message' : doc.notification_data,
                                                      'item_id' :String(doc.item_id),
                                                      'notification_id' : doc.notification_number,
                                                      'created_at' : calculatetime,
                                                      'profileimage': profileimage,
                                                      'additional_details':{
                                                          userid:doc.additional_details.userid,
                                                          feed_id:doc.additional_details.feed_id,
                                                          member_feed_id:doc.additional_details.member_feed_id,
                                                          member_id:doc.additional_details.member_id,
                                                          'member_url': profileimage,
                                                          'member_name':doc.username,
                                                          'url':member_profile,
                                                          'username':doc.member_name,
                                                          user_preview_url:doc.additional_details.user_preview_url,
                                                          member_preview_url:doc.additional_details.member_preview_url,
                                                          challenge_amount:String(amount)
                                                      },
                                                      'sender':sender,
                                                      'msg': message,
                                                      'title':title,
                                                      'msg_id':msg_id,
                                                      'msg_created_at':msg_created_at,
                                                      'notification_slug': doc.notification_type,
                                                      'feed_type':doc.feed_type,
                                                      'view_status':doc.view_status,
                                                      'is_action_done':is_action_done
                                                    }
                                                    test.push(foe)
                                              })
                                                res.status(200).json({
                                                   status: 'Ok',
                                                   message: 'List of notifications.',
                                                   total_pages: Math.ceil(count / perPage),
                                                  current_page:page,
                                                  total_notifications:count,
                                                   notifications:test
                                               });
                                        }
                                    
                                      })
                                    }
                                }).catch(err =>{
                                  console.log(err)
                                   // var spliterror=err.message.split("_")
                                   //  if(spliterror[1].indexOf("id")>=0){
                                   //     res.status(200).json({ 
                                   //         status: 'Failed',
                                   //         message: "Please provide correct userid"
                                   //     });
                                   //  }
                                   //  else{
                                   //     res.status(500).json({ 
                                   //         status: 'Failed',
                                   //         message: err.message
                                   //     });
                                   //  }
                                })
                  }
                  else if(req.body.screen_type === "challenges"){

                                notificationModel.aggregate([
                                  {$match:{userid: ObjectId(req.body.userid)}},
                                  {$unwind: "$notifications"},
                                  {$match:{$and: [{$or: [{"notifications.notification_type": 'challenge_create'},
                                                         {"notifications.notification_type": 'ChallengeDetails'},
                                                        {"notifications.notification_type": 'challenge_reject'}]},
                                                        {"notifications.created_at":{$gte:new Date(last_week),$lte:new Date(day)}}]}},
                                       {$group:{
                                        _id:  "$userid" ,
                                        notifications: { $addToSet:"$notifications"},
                                        count:{$sum:1}
                                       }
                                   } 
                                ])
                                .exec()
                                .then(data =>{
                                    if(data.length < 1){
                                      return res.status(200).json({
                                          status:"Ok",
                                          message:"No notifications to display.",
                                          notifications:[]
                                        });
                                    }
                                    else{
                                       var notes = data[0].notifications;
                                      var test = [];
                                      notificationModel.populate(data,{path : 'notifications.profileimage notifications.member_profile'},function(err,docs){

                                        if(err){
                                            return res.status(200).json({
                                              status:"Failed",
                                              message:"Error fetching notifications."
                                            });
                                        }
                                        else{

                                              var notify = docs[0].notifications;
                                              
                                              notify.sort(function(a,b){
                                                return new Date(b.created_at) - new Date(a.created_at);
                                              });
                                              var count = notify.length
                                              var notifix = notify.slice(skip,limit);

                                              notifix.map(doc =>{
                                                    var date = new Date()
                                                    var date1 = date.setTime(date.getTime());
                                                    var dateNow = new Date(date1).toISOString();
                                                    var time = Date.parse(dateNow) - Date.parse(doc.created_at);
                                                    var seconds1 = Math.floor( (time/1000) % 60 );
                                                    var minutes1 = Math.floor( (time/1000/60) % 60 );
                                                    var hours1 = Math.floor( (time/(1000*60*60)) % 24 );
                                                    var days1 = Math.floor( time/(1000*60*60*24) );
                                                    var calculatetime = ''

                                                    if(seconds1 >= 1 && seconds1 < 60 && minutes1===0 && hours1===0 && days1 === 0){
                                                      if(seconds1 === 1){
                                                        calculatetime = seconds1 + ' second ago';
                                                      }
                                                      else{
                                                        calculatetime = seconds1+ ' seconds ago';
                                                      }
                                                    }

                                                    else if(minutes1 >= 1 && minutes1 < 60 && hours1===0 && days1 === 0){
                                                      if(minutes1 === 1){
                                                        calculatetime = minutes1 + ' minute ago';
                                                      }
                                                      else{
                                                        calculatetime = minutes1 + ' minutes ago';
                                                      }
                                                    }

                                                    else if(hours1 >= 1 && hours1 < 24 && days1 === 0){
                                                      if(hours1 === 1){

                                                        calculatetime = hours1 + ' hour ago';
                                                      }
                                                      else{
                                                        calculatetime = hours1 + ' hours ago';
                                                      }
                                                    }
                                                    else{
                                                        if(days1 === 1){
                                                            calculatetime = days1 + ' day ago'
                                                        }
                                                        else if(days1 <= 7){
                                                            calculatetime = days1 + ' days ago'
                                                        }
                                                        else{
                                                          calculatetime = String(doc.created_at).substring(0,10)
                                                        }
                                                        
                                                    }
                                                      var profileimage = doc.profileimage
                           
                                                        if(typeof profileimage === 'undefined'){
                                                              profileimage = constants.APIBASEURL+'uploads/userimage.png'
                                                            }
                                                            else{
                                                              if(profileimage === null){
                                                                  profileimage = constants.APIBASEURL+"uploads/announce.png"
                                                              }
                                                              else{
                                                               if(profileimage.profileimage === null){
                                                                  profileimage = constants.APIBASEURL+'uploads/userimage.png'
                                                                }
                                                                else{
                                                                  profileimage = constants.APIBASEURL+profileimage.profileimage
                                                                }
                                                              }

                                                            }
                                                          

                                                      var member_profile = doc.member_profile
                 
                                                            if(typeof member_profile === 'undefined'){
                                                              member_profile = constants.APIBASEURL+'uploads/userimage.png'
                                                            }
                                                            else{
                                                              if(member_profile.profileimage === null){
                                                                member_profile = constants.APIBASEURL+'uploads/userimage.png'
                                                              }
                                                              else{
                                                                      member_profile = constants.APIBASEURL+member_profile.profileimage
                                                                    }
                                                            }
                                                        
                                                      var amount = 0;
                                                      if(typeof doc.additional_details.challenge_amount != 'undefined'){
                                                        var chall_amount = doc.additional_details.challenge_amount
                                                        if(chall_amount > 0){
                                                          amount = chall_amount
                                                        }
                                                      }

                                                      var sender = ""
                                                      var message = ""
                                                      var title =""
                                                      var msg_id = ""
                                                      var msg_created_at = Date.now()
                                                      var is_action_done = true
                                                      if(typeof doc.sender != 'undefined'){
                                                        sender = doc.sender
                                                      }

                                                      if(typeof doc.message != 'undefined'){
                                                        message = doc.message
                                                      }

                                                      if(typeof doc.msg_created_at != 'undefined'){
                                                          msg_created_at = doc.msg_created_at
                                                      }

                                                      if(typeof doc.title != 'undefined'){
                                                        title = doc.title
                                                      }

                                                      if(typeof doc.msg_id != 'undefined'){
                                                        msg_id = doc.msg_id
                                                      }

                                                      if(typeof doc.is_action_done != 'undefined'){
                                                        is_action_done = doc.is_action_done
                                                      }

                                                      console.log("is action done status "+is_action_done)

                                                    var foe = {
                                                      'message' : doc.notification_data,
                                                      'item_id' :String(doc.item_id),
                                                      'notification_id' : doc.notification_number,
                                                      'created_at' : calculatetime,
                                                      'profileimage': profileimage,
                                                      'additional_details':{
                                                          userid:doc.additional_details.userid,
                                                          feed_id:doc.additional_details.feed_id,
                                                          member_feed_id:doc.additional_details.member_feed_id,
                                                          member_id:doc.additional_details.member_id,
                                                          'member_url': profileimage,
                                                          'member_name':doc.username,
                                                          'url':member_profile,
                                                          'username':doc.member_name,
                                                          user_preview_url:doc.additional_details.user_preview_url,
                                                          member_preview_url:doc.additional_details.member_preview_url,
                                                          challenge_amount:String(amount)
                                                      },
                                                      'sender':sender,
                                                      'msg': message,
                                                      'title':title,
                                                      'msg_id':msg_id,
                                                      'msg_created_at':msg_created_at,
                                                      'notification_slug': doc.notification_type,
                                                      'feed_type':doc.feed_type,
                                                      'view_status':doc.view_status,
                                                      'is_action_done':is_action_done
                                                    }
                                                    test.push(foe)
                                              })
                                                res.status(200).json({
                                                   status: 'Ok',
                                                   message: 'List of notifications.',
                                                   total_pages: Math.ceil(count / perPage),
                                                  current_page:page,
                                                  total_notifications:count,
                                                   notifications:test
                                               });
                                        }
                                    
                                      })
                                    }
                                }).catch(err =>{
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
                                })
                  }
                  else{

                                notificationModel.aggregate([
                                  {$match:{userid: ObjectId(req.body.userid)}},
                                  {$unwind: "$notifications"},
                                  {$match: {$and:[{"notifications.notification_type":{$nin:[ 'challenge_create','ChallengeDetails','challenge_reject','OfferGroup','CreateOfferGroup']}},
                                                  {"notifications.created_at":{$gte:new Date(last_week),$lte:new Date(day)}}]}},
                                       {$group:{
                                        _id:  "$userid" ,
                                        notifications: { $addToSet:"$notifications"},
                                        count:{$sum:1}
                                       }
                                   } 
                                ])
                                .exec()
                                .then(data =>{
                                    if(data.length < 1){
                                      return res.status(200).json({
                                          status:"Ok",
                                          message:"No notifications to display.",
                                          notifications:[]
                                        });
                                    }
                                    else{
                                       var notes = data[0].notifications;
                                        var test = [];
                                      notificationModel.populate(data,{path : 'notifications.profileimage notifications.member_profile'},function(err,docs){

                                        if(err){
                                            return res.status(200).json({
                                              status:"Failed",
                                              message:"Error fetching notifications."
                                            });
                                        }
                                        else{

                                              var notify = docs[0].notifications;
                                              
                                              notify.sort(function(a,b){
                                                return new Date(b.created_at) - new Date(a.created_at);
                                              });
                                              var count = notify.length
                                              var notifix = notify.slice(skip,limit);

                                              notifix.map(doc =>{
                                                    var date = new Date()
                                                    var date1 = date.setTime(date.getTime());
                                                    var dateNow = new Date(date1).toISOString();
                                                    var time = Date.parse(dateNow) - Date.parse(doc.created_at);
                                                    var seconds1 = Math.floor( (time/1000) % 60 );
                                                    var minutes1 = Math.floor( (time/1000/60) % 60 );
                                                    var hours1 = Math.floor( (time/(1000*60*60)) % 24 );
                                                    var days1 = Math.floor( time/(1000*60*60*24) );
                                                    var calculatetime = ''

                                                    if(seconds1 >= 1 && seconds1 < 60 && minutes1===0 && hours1===0 && days1 === 0){
                                                      if(seconds1 === 1){
                                                        calculatetime = seconds1 + ' second ago';
                                                      }
                                                      else{
                                                        calculatetime = seconds1+ ' seconds ago';
                                                      }
                                                    }

                                                    else if(minutes1 >= 1 && minutes1 < 60 && hours1===0 && days1 === 0){
                                                      if(minutes1 === 1){
                                                        calculatetime = minutes1 + ' minute ago';
                                                      }
                                                      else{
                                                        calculatetime = minutes1 + ' minutes ago';
                                                      }
                                                    }

                                                    else if(hours1 >= 1 && hours1 < 24 && days1 === 0){
                                                      if(hours1 === 1){

                                                        calculatetime = hours1 + ' hour ago';
                                                      }
                                                      else{
                                                        calculatetime = hours1 + ' hours ago';
                                                      }
                                                    }
                                                    else{
                                                        if(days1 === 1){
                                                            calculatetime = days1 + ' day ago'
                                                        }
                                                        else if(days1 <= 7){
                                                            calculatetime = days1 + ' days ago'
                                                        }
                                                        else{
                                                          calculatetime = String(doc.created_at).substring(0,10)
                                                        }
                                                        
                                                    }
                                                      var profileimage = doc.profileimage
                           
                                                        if(typeof profileimage === 'undefined'){
                                                              profileimage = constants.APIBASEURL+'uploads/userimage.png'
                                                            }
                                                            else{
                                                              if(profileimage === null){
                                                                  profileimage = constants.APIBASEURL+"uploads/announce.png"
                                                              }
                                                              else{
                                                               if(profileimage.profileimage === null){
                                                                  profileimage = constants.APIBASEURL+'uploads/userimage.png'
                                                                }
                                                                else{
                                                                  profileimage = constants.APIBASEURL+profileimage.profileimage
                                                                }
                                                              }

                                                            }
                                                          

                                                      var member_profile = doc.member_profile
                 
                                                            if(typeof member_profile === 'undefined'){
                                                              member_profile = constants.APIBASEURL+'uploads/userimage.png'
                                                            }
                                                            else{
                                                              if(member_profile.profileimage === null){
                                                                member_profile = constants.APIBASEURL+'uploads/userimage.png'
                                                              }
                                                              else{
                                                                      member_profile = constants.APIBASEURL+member_profile.profileimage
                                                                    }
                                                            }
                                                        
                                                      var amount = 0;
                                                      if(typeof doc.additional_details.challenge_amount != 'undefined'){
                                                        var chall_amount = doc.additional_details.challenge_amount
                                                        if(chall_amount > 0){
                                                          amount = chall_amount
                                                        }
                                                      }

                                                      var sender = ""
                                                      var message = ""
                                                      var title =""
                                                      var msg_id = ""
                                                      var msg_created_at = Date.now()
                                                      var is_action_done = true

                                                      if(typeof doc.sender != 'undefined'){
                                                        sender = doc.sender
                                                      }

                                                      if(typeof doc.message != 'undefined'){
                                                        message = doc.message
                                                      }

                                                      if(typeof doc.msg_created_at != 'undefined'){
                                                          msg_created_at = doc.msg_created_at
                                                      }

                                                      if(typeof doc.title != 'undefined'){
                                                        title = doc.title
                                                      }

                                                      if(typeof doc.msg_id != 'undefined'){
                                                        msg_id = doc.msg_id
                                                      }

                                                      if(typeof doc.is_action_done != 'undefined'){
                                                        is_action_done = doc.is_action_done
                                                      }

                                                    var foe = {
                                                      'message' : doc.notification_data,
                                                      'item_id' :String(doc.item_id),
                                                      'notification_id' : doc.notification_number,
                                                      'created_at' : calculatetime,
                                                      'profileimage': profileimage,
                                                      'additional_details':{
                                                          userid:doc.additional_details.userid,
                                                          feed_id:doc.additional_details.feed_id,
                                                          member_feed_id:doc.additional_details.member_feed_id,
                                                          member_id:doc.additional_details.member_id,
                                                          'member_url': profileimage,
                                                          'member_name':doc.username,
                                                          'url':member_profile,
                                                          'username':doc.member_name,
                                                          user_preview_url:doc.additional_details.user_preview_url,
                                                          member_preview_url:doc.additional_details.member_preview_url,
                                                          challenge_amount:String(amount)
                                                      },
                                                      'sender':sender,
                                                      'msg': message,
                                                      'title':title,
                                                      'msg_id':msg_id,
                                                      'msg_created_at':msg_created_at,
                                                      'notification_slug': doc.notification_type,
                                                      'feed_type':doc.feed_type,
                                                      'view_status':doc.view_status,
                                                      'is_action_done':is_action_done
                                                    }
                                                    test.push(foe)
                                              })
                                                res.status(200).json({
                                                   status: 'Ok',
                                                   message: 'List of notifications.',
                                                   total_pages: Math.ceil(count / perPage),
                                                  current_page:page,
                                                  total_notifications:count,
                                                   notifications:test
                                               });
                                        }
                                    
                                      })
                                    }
                                }).catch(err =>{
                                  console.log(err)
                                   // var spliterror=err.message.split("_")
                                   //  if(spliterror[1].indexOf("id")>=0){
                                   //     res.status(200).json({ 
                                   //         status: 'Failed',
                                   //         message: "Please provide correct userid"
                                   //     });
                                   //  }
                                   //  else{
                                   //     res.status(500).json({ 
                                   //         status: 'Failed',
                                   //         message: err.message
                                   //     });
                                   //  }
                                })
                  }
            }
        }).catch(err => {
          console.log(err)
            // var spliterror=err.message.split(":")
            //   res.status(500).json({ 
            //     status: 'Failed',
            //     message: spliterror[0]
            //   });
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

router.post("/notification_status", (req, res, next) => {

    var keyArray = ["userid", "iv_token", "clientid", "notification_id"];
    var key = Object.keys(req.body);

    if (keyArray.length == key.length && keyArray.every((v) => key.indexOf(v) >= 0)) {

        if (constants.AndriodClientId === req.body.clientid || constants.IosClientId === req.body.clientid) {

            authModel.find({iv_token: req.body.iv_token})
                .exec()
                .then(user => {
                    if (user.length < 1) {
                        return res.status(200).json({
                            status: "Logout",
                            message: "You are logged in other device."
                        });
                    } else {
                        notificationModel.aggregate([{
                            $match: {
                                userid: ObjectId(req.body.userid),
                            }
                        },
                            {
                                $project: {
                                    "notifications": 1
                                }
                            }
                        ])
                            .exec()
                            .then(docs => {
                                var update_index = "";
                                var notifications = docs[0].notifications;
                                for (var i in notifications) {
                                    if (notifications[i].notification_number == req.body.notification_id) {
                                        update_index = i;
                                        break;
                                    }
                                }
                                var update_key = 'notifications.' + update_index + '.view_status';

                                var updateObj = {
                                    $set: {
                                        [update_key]: true
                                    }
                                }
                                notificationModel.findOneAndUpdate({userid: ObjectId(req.body.userid)}, updateObj)
                                    .exec()
                                    .then((doc) => {
                                        res.json({
                                            status: "Ok",
                                            message: "Changed notification status successfully."
                                        })
                                    }).catch(err => {
                                      console.log(err);
                                      var spliterror = err.message.split("_")
                                      if (spliterror[1].indexOf("id") >= 0) {
                                          res.status(200).json({
                                              status: 'Failed',
                                              message: "Please provide correct userid"
                                          });
                                      } else {
                                          res.status(500).json({
                                              status: 'Failed',
                                              message: err.message
                                          });
                                      }
                                })

                            }).catch(err => {
                              console.log(err)
                              var spliterror = err.message.split("_")
                              if (spliterror[1].indexOf("id") >= 0) {
                                  res.status(200).json({
                                      status: 'Failed',
                                      message: "Please provide correct userid"
                                  });
                              } else {
                                  res.status(500).json({
                                      status: 'Failed',
                                      message: err.message
                                  });
                              }
                        })
                    }
                }).catch(err => {
                var spliterror = err.message.split(":")
                res.status(500).json({
                    status: 'Failed',
                    message: spliterror[0]
                });
            });
        } else {
            res.status(200).json({
                status: 'Failed',
                message: 'Bad Request. Please provide clientid.'
            });
        }
    } else {
        res.status(200).json({
            status: 'Failed',
            message: 'Bad Request. Please check your input parameters.'
        });
    }
});


router.post("/offer_notifications", (req, res, next) => {

  var keyArray = ["userid", "iv_token", "clientid"];
  var key = Object.keys(req.body);

  if (keyArray.length == key.length && keyArray.every((v) => key.indexOf(v) >= 0)) {

      if (constants.AndriodClientId === req.body.clientid || constants.IosClientId === req.body.clientid) {

          authModel.find({iv_token: req.body.iv_token})
              .exec()
              .then(user => {
                  if (user.length < 1) {
                      return res.status(200).json({
                          status: "Logout",
                          message: "You are logged in other device."
                      });
                  } else {    
                     var perPage = 5
                    var page = 1

                    if(isEmpty(page)){
                      page=1
                    }
                    var skip = (perPage * page) - perPage;
                    var limit = skip+perPage;                            

                    notificationModel.aggregate([
                                  {$match:{userid: ObjectId(req.body.userid)}},
                                  {$unwind: "$notifications"},
                                  {$match:{$and: [{$or: [{"notifications.notification_type": 'OfferGroup'}, {"notifications.notification_type": 'CreateOfferGroup'}]},
                                                  {"notifications.view_status": true}]}},
                                       {$group:{
                                        _id:  "$userid" ,
                                        notifications: { $addToSet:"$notifications"},
                                        count:{$sum:1}
                                       }
                                   } 
                                ])
                                .exec()
                                .then(data =>{

                                    if(data.length < 1){
                                      return res.status(200).json({
                                          status:"Ok",
                                          message:"No notifications to display.",
                                          notifications:[]
                                        });
                                    }
                                    else{
                                      var notes = data[0].notifications;
                                      var test = [];
                                      notificationModel.populate(data,{path : 'notifications.profileimage notifications.member_profile'},function(err,docs){

                                        if(err){
                                            return res.status(200).json({
                                              status:"Failed",
                                              message:"Error fetching notifications."
                                            });
                                        }
                                        else{

                                              var notify = docs[0].notifications;
                                              
                                              notify.sort(function(a,b){
                                                return new Date(b.created_at) - new Date(a.created_at);
                                              });

                                              var count = notify.length
                                              var notifix = notify.slice(skip,limit);

                                              notifix.map(doc =>{
                                                    var date = new Date()
                                                    var date1 = date.setTime(date.getTime());
                                                    var dateNow = new Date(date1).toISOString();
                                                    var time = Date.parse(dateNow) - Date.parse(doc.created_at);
                                                    var seconds1 = Math.floor( (time/1000) % 60 );
                                                    var minutes1 = Math.floor( (time/1000/60) % 60 );
                                                    var hours1 = Math.floor( (time/(1000*60*60)) % 24 );
                                                    var days1 = Math.floor( time/(1000*60*60*24) );
                                                    var calculatetime = ''

                                                    if(seconds1 >= 1 && seconds1 < 60 && minutes1===0 && hours1===0 && days1 === 0){
                                                      if(seconds1 === 1){
                                                        calculatetime = seconds1 + ' second ago';
                                                      }
                                                      else{
                                                        calculatetime = seconds1+ ' seconds ago';
                                                      }
                                                    }

                                                    else if(minutes1 >= 1 && minutes1 < 60 && hours1===0 && days1 === 0){
                                                      if(minutes1 === 1){
                                                        calculatetime = minutes1 + ' minute ago';
                                                      }
                                                      else{
                                                        calculatetime = minutes1 + ' minutes ago';
                                                      }
                                                    }

                                                    else if(hours1 >= 1 && hours1 < 24 && days1 === 0){
                                                      if(hours1 === 1){

                                                        calculatetime = hours1 + ' hour ago';
                                                      }
                                                      else{
                                                        calculatetime = hours1 + ' hours ago';
                                                      }
                                                    }
                                                    else{
                                                        if(days1 === 1){
                                                            calculatetime = days1 + ' day ago'
                                                        }
                                                        else if(days1 <= 7){
                                                            calculatetime = days1 + ' days ago'
                                                        }
                                                        else{
                                                          calculatetime = String(doc.created_at).substring(0,10)
                                                        }
                                                        
                                                    }
                                                      var profileimage = doc.profileimage
                           
                                                        if(typeof profileimage === 'undefined'){
                                                              profileimage = constants.APIBASEURL+'uploads/userimage.png'
                                                            }
                                                            else{
                                                              if(profileimage === null){
                                                                  profileimage = constants.APIBASEURL+"uploads/announce.png"
                                                              }
                                                              else{
                                                               if(profileimage.profileimage === null){
                                                                  profileimage = constants.APIBASEURL+'uploads/userimage.png'
                                                                }
                                                                else{
                                                                  profileimage = constants.APIBASEURL+profileimage.profileimage
                                                                }
                                                              }

                                                            }
                                                          

                                                      var member_profile = doc.member_profile
                 
                                                            if(typeof member_profile === 'undefined'){
                                                              member_profile = constants.APIBASEURL+'uploads/userimage.png'
                                                            }
                                                            else{
                                                              if(member_profile.profileimage === null){
                                                                member_profile = constants.APIBASEURL+'uploads/userimage.png'
                                                              }
                                                              else{
                                                                      member_profile = constants.APIBASEURL+member_profile.profileimage
                                                                    }
                                                            }
                                                        
                                                      var amount = 0;
                                                      if(typeof doc.additional_details.challenge_amount != 'undefined'){
                                                        var chall_amount = doc.additional_details.challenge_amount
                                                        if(chall_amount > 0){
                                                          amount = chall_amount
                                                        }
                                                      }

                                                      var sender = ""
                                                      var message = ""
                                                      var title =""
                                                      var msg_id = ""
                                                      var msg_created_at = Date.now()
                                                      if(typeof doc.sender != 'undefined'){
                                                        sender = doc.sender
                                                      }

                                                      if(typeof doc.message != 'undefined'){
                                                        message = doc.message
                                                      }

                                                      if(typeof msg_created_at != 'undefined'){
                                                          msg_created_at = doc.msg_created_at
                                                      }

                                                      if(typeof title != 'undefined'){
                                                        title = doc.title
                                                      }

                                                      if(typeof msg_id != 'undefined'){
                                                        msg_id = doc.msg_id
                                                      }

                                                    var foe = {
                                                      'message' : doc.notification_data,
                                                      'item_id' :String(doc.item_id),
                                                      'notification_id' : doc.notification_number,
                                                      'created_at' : calculatetime,
                                                      'profileimage': profileimage,
                                                      'additional_details':{
                                                          userid:doc.additional_details.userid,
                                                          feed_id:doc.additional_details.feed_id,
                                                          member_feed_id:doc.additional_details.member_feed_id,
                                                          member_id:doc.additional_details.member_id,
                                                          'member_url': profileimage,
                                                          'member_name':doc.username,
                                                          'url':member_profile,
                                                          'username':doc.member_name,
                                                          user_preview_url:doc.additional_details.user_preview_url,
                                                          member_preview_url:doc.additional_details.member_preview_url,
                                                          challenge_amount:String(amount)
                                                      },
                                                      'sender':sender,
                                                      'msg': message,
                                                      'title':title,
                                                      'msg_id':msg_id,
                                                      'msg_created_at':msg_created_at,
                                                      'notification_slug': doc.notification_type,
                                                      'feed_type':doc.feed_type,
                                                      'view_status':doc.view_status
                                                    }
                                                    test.push(foe)
                                              })
                                                res.status(200).json({
                                                   status: 'Ok',
                                                   message: 'List of notifications.',
                                                   total_pages: Math.ceil(count / perPage),
                                                  current_page:page,
                                                  total_notifications:count,
                                                   notifications:test
                                               });
                                        }
                                    
                                      })
                                    }
                                }).catch(err =>{
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
                                })
                          
                  }
              }).catch(err => {
              var spliterror = err.message.split(":")
              res.status(500).json({
                  status: 'Failed',
                  message: spliterror[0]
              });
          });
      } else {
          res.status(200).json({
              status: 'Failed',
              message: 'Bad Request. Please provide clientid.'
          });
      }
  } else {
      res.status(200).json({
          status: 'Failed',
          message: 'Bad Request. Please check your input parameters.'
      });
  }
});



router.post("/consume_offer_notifications", (req, res, next) => {

    var keyArray = ["userid", "iv_token", "clientid"];
    var key = Object.keys(req.body);

    if (keyArray.length == key.length && keyArray.every((v) => key.indexOf(v) >= 0)) {

        if (constants.AndriodClientId === req.body.clientid || constants.IosClientId === req.body.clientid) {

            authModel.find({iv_token: req.body.iv_token})
                .exec()
                .then(user => {
                    if (user.length < 1) {
                        return res.status(200).json({
                            status: "Logout",
                            message: "You are logged in other device."
                        });
                    } else {

                            notificationModel.update(
                                {$and: [{$or: [{"notifications.notification_type": 'OfferGroup'}, {"notifications.notification_type": 'CreateOfferGroup'}]}, {userid: ObjectId(req.body.userid)}]},
                                {"$set": {"notifications.$[elem].view_status": true}},
                                {
                                    "arrayFilters": [{$or: [{'elem.notification_type': 'OfferGroup'}, {'elem.notification_type': 'CreateOfferGroup'}]}],
                                    "multi": true
                                })
                                .exec()
                                .then((doc) => {
                                    res.json({
                                        status: "Ok",
                                        message: "successfully Changed notification status"
                                    })
                                }).catch(err => {
                                console.log(err);
                                var spliterror = err.message.split("_")
                                if (spliterror[1].indexOf("id") >= 0) {
                                    res.status(200).json({
                                        status: 'Failed',
                                        message: "Please provide correct userid"
                                    });
                                } else {
                                    res.status(500).json({
                                        status: 'Failed',
                                        message: err.message
                                    });
                                }
                            })
                    }
                }).catch(err => {
                var spliterror = err.message.split(":")
                res.status(500).json({
                    status: 'Failed',
                    message: spliterror[0]
                });
            });
        } else {
            res.status(200).json({
                status: 'Failed',
                message: 'Bad Request. Please provide clientid.'
            });
        }
    } else {
        res.status(200).json({
            status: 'Failed',
            message: 'Bad Request. Please check your input parameters.'
        });
    }
});

module.exports = router;