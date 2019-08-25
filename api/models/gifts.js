const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const constants = require("../constants/constants");
const User = require("../models/user");
const userDetails = require("../models/userDetails");
const authModel = require("../models/auth");
const categoryModel = require("../models/iv_category");
const bsOffers = require("../models/bsOffers");
const multer = require('multer'); 
const isEmpty = require("is-empty");
const business = require("../models/business");
const customeOffer = require("../models/customoffers");
const contactsModel = require("../models/contacts");
const colorCodeModel = require("../models/colorcodes");
const notificationModel = require("../models/notifications");
const announceModel = require("../models/announcements");
const trendingModel = require("../models/trending");
const challenges = require("../models/challenge");
const FCM = require('fcm-node');
const fcmModel = require("../models/fcmtoken");
const fs = require('fs');
const csv = require('fast-csv');
const ObjectId = require('mongodb').ObjectID;
const iv_feeds = require("../models/iv_feeds");
const feeds = require("../models/iv_feeds");
const announcements = require("../models/announcements")
const trend = require("../models/Trending_users");

router.post("/get_trending", (req, res, next) => {

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

          	        var perPage = 50;
                    var page = 1
                    var skip = (perPage * page) - perPage;
                    var limit = skip + perPage;

                trend.find({})
                        .exec()
                        .then(data =>{
                            var test =[]
                            var dex = data[0].details
                            dex.map(doc =>{

                                var foe ={
                                    'column1':doc.profileimage,
                                    'column2':doc.username,
                                    'column3':doc.connections,
                                    'userid':doc.userid
                                }

                                test.push(foe)

                            })



							test.sort((a, b) => b.column3 - a.column3)



							var found = test.find(o => String(o.userid) === String(req.body.userid))
							var user_index = 0

							if(found != 'undefined'){
								user_index = test.indexOf(found)
							}
                            else{
                                user_index = -1
                            }


							var is_win = false
							var count = 0

							if(user_index === 0){
								is_win = false   //true
							}

							if(user_index > 50){
								test = test.slice(skip,limit)
							}
							else{
								//test.splice(user_index,1)
								test = test.slice(skip,limit)
							}

							var testapi = []
                            var final_user = ""
							
							for(var i=0 ; i< test.length ; i++){

                                if(i != 0 && test[i].column3 === test[i-1].column3){
                                    count = count
                                }
                                else{
                                    count = count +1
                                }

								var is_winner = false

								if(count === 1){
									is_winner = false   //true
								}

								if(i === user_index){
									final_user = {
                                        'column_one':found.column1,
                                        'column_two':found.column2,
                                        'column_three':found.column3,
                                        'column_four':"#"+count,
                                        "is_winner":is_win,
                                        "destination_info":{
                                            'slug':"UserProfile",
                                            'id':found.userid
                                        }
                                    }
								}
                                
                                else{
                                    var fog = {
                                            'column_one':test[i].column1,
                                            'column_two':test[i].column2,
                                            'column_three':test[i].column3,
                                            'column_four':"#"+count,
                                            "is_winner":is_winner,
                                            "destination_info":{
                                                'slug':"UserProfile",
                                                'id':test[i].userid
                                            }
                                    }
                                    testapi.push(fog)
                                }
							}

							// console.log(user_index)

							// var test_user = []

       //                      if(user_index === -1){
       //                          final_user = {}
       //                      }

       //                      if(final_user != {}){
       //                           test_user.push(final_user)
       //                      }

							// test_user = test_user.concat(testapi)

							    res.status(200).json({
                                    status: 'Ok',
                                    message: "Trending",
                                    details:testapi,
                                    trending_header:{
                                        header_one:"USER",
                                        header_two:"CONNECTIONS",
                                        header_three:"RANK"
                                    }
                                });


						}).catch(err => {
                            console.log(err)
							// var spliterror=err.message.split("_")
							// if(spliterror[1].indexOf("id")>=0){
							// 	res.status(200).json({ 
							// 		status: 'Failed',
							// 		message: "Please provide correct userid"
							// 	});
							// }
							// else{
							// 	res.status(500).json({ 
							// 		status: 'Failed',
							// 		message: err.message
							// 	});
							// }
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

router.post("/list_announcements", (req, res, next) => {

    var keyArray = ["userid", "iv_token", "clientid"];
    var key = Object.keys(req.body);

    if (keyArray.length == key.length && keyArray.every((v) => key.indexOf(v) >= 0)) {

        if (constants.AndriodClientId === req.body.clientid || constants.IosClientId === req.body.clientid) {

            authModel.find({iv_token: req.body.iv_token})
                .exec()
                .then(details => {
                    if (details.length < 1) {
                        return res.status(200).json({
                            status: "Logout",
                            message: "You are logged in other device."
                        });
                    } else {
                        announcements.find({})
                            .sort({created_at: -1})
                            .exec()
                            .then(docs => {

                                var perPage = 50;
                                var page = 1;
                                if (isEmpty(page)) {
                                    page = 1
                                }
                                var skip = (perPage * page) - perPage;
                                var limit = skip + perPage;
                                var totalPages = 1;

                                if(docs.length > 0){
                                    var test = []
                                    docs.map(doc =>{
                                        var foe = {
                                            'text':doc.ann_text,
                                            'image':constants.APIBASEURL+"uploads/announce.png"
                                        }
                                        test.push(foe)
                                    })

                                    const totalAnnouncements = docs.length;
                                    if (docs.length > perPage) {
                                        totalPages = Math.ceil((docs.length) / perPage);
                                        docs = docs.slice(skip, limit);
                                    } else {
                                        page = 1;
                                    }

                                    res.status(200).json({
                                        status: 'Ok',
                                        message: "announcements",
                                        total_pages: totalPages,
                                        current_page: page,
                                        total_announcements: totalAnnouncements,
                                        announcements: test
                                    });

                                }
                                else{
                                    res.status(200).json({
                                        status: 'Ok',
                                        message: "announcements",
                                        total_pages: 1,
                                        current_page: 1,
                                        total_announcements: 0,
                                        announcements: []
                                    });
                                }

                                
                            }).catch(err => {
                            var spliterror = err.message.split(":")
                            res.status(500).json({
                                status: 'Failed',
                                message: spliterror[0]
                            });
                        });
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


router.post("/get_trending_monday", (req, res, next) => {

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

                    var perPage = 50;
                    var page = 1
                    var skip = (perPage * page) - perPage;
                    var limit = skip + perPage;

                      var day = new Date()
                      day = day.setDate(day.getDate() + 1)
                      day = new Date(day).setHours(0,0,0,0)
                      var last_wk = new Date()
                      var last_week = last_wk.setDate(last_wk.getDate() - 9)
                      last_week = new Date(last_week).setHours(0,0,0,0)

                   // challenges.find({'challenges_history.created_at':{$gte:new Date(last_week),$lte:new Date(day)}})
                   challenges.aggregate([
                                  {$unwind: "$challenges_history"},
                                  {$match:{$and: [{"challenges_history.created_at":{$gte:new Date(last_week),$lte:new Date(day)}},
                                               //{"challenges_history.amount":{$gte:50}},
                                                {"challenges_history.user_views":{$gte:Math.floor("$challenges_history.amount"*4/5)}}]}},
                                       {$group:{
                                        _id:  "$userid" ,
                                        challenges_history: { $addToSet:"$challenges_history"},
                                        count:{$sum:1}
                                       }
                                   } 
                                ])
                            .exec()
                            .then(docs =>{
                                if(docs.length > 0){
                                    var test =[]
                                    docs.map(doc =>{
                                        test.push(doc)

                                    })
                                    res.status(200).json({
                                            status: 'Ok',
                                            message: "Trending",
                                            details:test,
                                            trending_header:{
                                                header_one:"USER",
                                                header_two:"CHALLENGES",
                                                header_three:"RANK"
                                            }
                                        });
                                }
                                else{
                                    res.status(200).json({
                                        status: 'Ok',
                                        message: "Trending",
                                        details:[],
                                        trending_header:{
                                            header_one:"USER",
                                            header_two:"CHALLENGES",
                                            header_three:"RANK"
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


router.get("/get_trending_list", (req, res, next) => {


                    userDetails.find({})
                        .populate("userid")
                        .exec()
                        .then(data =>{
                            var test =[]
                            data.map(doc =>{
                                var followers = doc.followers.length
                                var contacts = doc.no_contacts

                                var connections = followers+contacts

                                var profileimage = doc.userid.profileimage

                                if(profileimage === null){
                                    profileimage = "uploads/userimage.png"
                                }

                                var foe ={
                                    'column1':constants.APIBASEURL+profileimage,
                                    'column2':doc.userid.username,
                                    'column3':connections,
                                    'column4':doc.userid.mobile,
                                    'column5':doc.userid.email,
                                    'userid':doc.userid._id
                                }

                                test.push(foe)

                            })



                            test.sort((a, b) => b.column3 - a.column3)

                            var is_win = false
                            var count = 0


                            // if(user_index > 50){
                            //     test = test.slice(skip,limit)
                            // }
                            // else{
                            //     //test.splice(user_index,1)
                            //     test = test.slice(skip,limit)
                            // }

                            var testapi = []
                            var final_user = ""
                            
                            for(var i=0 ; i< test.length ; i++){

                                if(i != 0 && test[i].column3 === test[i-1].column3){
                                    count = count
                                }
                                else{
                                    count = count +1
                                }

                                var is_winner = false

                                if(count === 1){
                                    is_winner = false   //true
                                }

                                    var fog = {
                                            'userid':test[i].userid,
                                            'username':test[i].column2,
                                            'connections':test[i].column3,
                                            'mobile':test[i].column4,
                                            'email':test[i].column5,
                                            'rank':"#"+count,
                                            'profileimage':test[i].column1
                                    }
                                    testapi.push(fog)
                            }


                            var test_user = []

                            test_user = testapi

                                res.status(200).json({
                                    status: 'Ok',
                                    message: "Trending",
                                    details:test_user,
                                    trending_header:{
                                        header_one:"USER",
                                        header_two:"CONNECTIONS",
                                        header_three:"RANK"
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
          
});


module.exports = router;