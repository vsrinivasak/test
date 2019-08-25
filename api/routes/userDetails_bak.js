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
const FCM = require('fcm-node');
const fcmModel = require("../models/fcmtoken");
const fs = require('fs');
const csv = require('fast-csv');
const ObjectId = require('mongodb').ObjectID;
const iv_feeds = require("../models/iv_feeds");
const feeds = require("../models/iv_feeds");
const http = require('http');
const utf8 = require('utf8');
//const winston = require('../../winston')
const announcements = require("../models/announcements")
const trend = require("../models/Trending_users");
const math = require('mathjs');
router.post("/follow_user", (req, res, next) => {

  var keyArray = ["userid", "iv_token", "clientid", "member_id", "status"];
  var key = Object.keys(req.body);

  if (keyArray.length == key.length && keyArray.every((v) => key.indexOf(v) >= 0)) {

    if(constants.AndriodClientId === req.body.clientid || constants.IosClientId === req.body.clientid){

      authModel.find({iv_token: req.body.iv_token})
        .exec()
        .then(user => {
          if (user.length < 1) {
	          	var response = {
	          		status:"Logout",
	                message:"You are logged in other device."
	          	}
	          	var datenow = new Date()
	          	var logfile = datenow+"\n"+response.status +"\n"+response.message

				fs.writeFile("logfile.txt", logfile, function(err) {
				});
              return res.status(200).json(response)
               // status:"Logout",
               // message:"You are logged in other device."
              //});
            }
          else {
          	console.log(req.body.status)
          	contactsModel.find({userid:req.body.userid},
          						{'existing_contacts':1})
          				.exec()
          				.then(docs =>{
          					if(docs.length < 1){
          						   return res.status(200).json({
					                status:"Failed",
					                message:"Please provide correct userid."
					              });
          					}
          					else{
          						console.log(req.body.status)
          						var is_following = false;

          						if(docs[0].existing_contacts.length > 0){
          							var exe = docs[0].existing_contacts;
          							var found = exe.find(ele => String(ele.contact) === String(req.body.member_id))

          							if(typeof found === 'undefined'){
          								is_following = false
          							}
          							else{
          								is_following = true
          							}
          						}else{
          							is_following = false;
          						}
          						if(is_following === false){
          							var users =[];
					          		users.push(ObjectId(req.body.userid));
					          		users.push(ObjectId(req.body.member_id))
									userDetails.find({userid:{$in:users}})
										.populate('userid')
										.exec()
										.then(data =>{
												var user_id = "";
												var msgbody = "";
												var following_id = "";
												var profileimage =""
												var username =""
												var followarray =[];
												data.map(doc =>{
													if(String(doc.userid._id) === String(req.body.userid)){
														user_id = doc._id
														msgbody = doc.userid.username + " started following you."
														profileimage = doc.userid.profileimage;
														username = doc.userid.username;
														if(doc.userid.profileimage === null){
															profileimage = constants.APIBASEURL+"uploads/userimage.png"
														}
														if(doc.following.length > 0){
															followarray = doc.following
														}

													}else{
														following_id = doc._id
													}
													if(followarray.length>0){
														followarray.every(function(ele){
																if(String(ele) === String(following_id)){
																	is_following = true
																	return false
																}
																else{
																	is_following = false
																	return true
																}
															})
													}else{
														is_following = false
													}

												})
													if(req.body.status === false){

														if(is_following === false){

															userDetails.findOneAndUpdate({userid:ObjectId(req.body.userid)},
																				{$push:{following:ObjectId(following_id)},
																				$inc:{following_count:1}})
																.exec()
																.then(result =>{
																		userDetails.findOneAndUpdate({userid:ObjectId(req.body.member_id)},
																							{$push:{followers:ObjectId(user_id)},
																							$inc:{followers_count:1}})
																			.exec()
																			.then(results =>{
																					const note_no =Math.floor(10000000000 + Math.random() * 90000000000);
																					notificationModel.findOneAndUpdate({userid:ObjectId(req.body.member_id)},
																							{$push:{notifications:{
																								notification_data: msgbody,
																								member_id: req.body.userid,
																								notification_type: 'UserProfile',
																								notification_number:note_no,
																								username:username,
																								item_id: req.body.userid,
																								profileimage:ObjectId(req.body.userid),
																								created_at:Date.now()
																							}}})
																								.exec()
																								.then(dosy =>{
																									if(dosy === null){
																										return res.status(200).json({
																						                	status:"Failed",
																						                	message:"Please provide correct userid."
																						              });
																									}
																									else{
													      												fcmModel.find({userid : req.body.member_id})
																										        .exec()
																										        .then(user => {
																										        	console.log(user)
																										          if (user.length < 1) {
																										              return res.status(200).json({
																										                status:"Failed",
																										                message:"Please provide correct member_id."
																										              });
																										            }
																										          else {
																											            var serverKey = constants.FCMServerKey;
																											            var fcm = new FCM(serverKey);

																											            var message = {
																											                to : user[0].fcmtoken,
																											                collapse_key: 'exit',

																											                notification: {
																											                    title: 'FvmeGear',
																											                    body: msgbody ,
																											                } ,
																											                data : {
																											                  notification_id : note_no,
																											                    message: msgbody,
																											                    notification_slug: 'UserProfile',
																											                    url: constants.APIBASEURL+profileimage,
																											                    username:username,
																											                    item_id: req.body.userid,

																															            userid:"",
																															            feed_id:"",
																															            member_feed_id:"",
																															            member_id:"",
																															       is_from_push:true
																											                },
																												              android:{
																												                priority:"high"
																												              },
																											                 webpush: {
																											                  headers: {
																											                    "Urgency": "high"
																											                  }
																											                }
																											            };
																											            var is_err = false
																											            fcm.send(message, function(err, response){

																											            });
																											            	res.status(200).json({
																																	status: 'Ok',
																																	message: "Followed successfully."
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
																			}).catch(err => {					//catch for userid update
																				var spliterror=err.message.split("_")
																				if(spliterror[1].indexOf("id")>=0){
																					res.status(200).json({
																						status: 'Failed',
																						message: "Please provide correct following_userid"
																					});
																				}
																				else{
																					res.status(500).json({
																						status: 'Failed',
																						message: err.message
																					});
																				}
														                    });
																}).catch(err => {					//catch for userid update
																	var spliterror=err.message.split("_")
																	if(spliterror[1].indexOf("id")>=0){
																		res.status(200).json({
																			status: 'Failed',
																			message: "Please provide correct following_userid"
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
														else{
															return res.status(200).json({
												                status:"Failed",
												                message:"You are already following this user."
												              });
														}
													}
													else{
														userDetails.findOneAndUpdate({userid:ObjectId(req.body.userid)},
																				{$pull:{following:ObjectId(following_id)},
																				$inc:{following_count:-1}})
																.exec()
																.then(result =>{
																		userDetails.findOneAndUpdate({userid:ObjectId(req.body.member_id)},
																							{$pull:{followers:ObjectId(user_id)},
																							$inc:{followers_count:-1}})
																			.exec()
																			.then(result =>{
																					res.status(200).json({
																						status: 'Ok',
																						message: "Unfollowed successfully."
																					});

																			}).catch(err => {					//catch for userid update
																				var spliterror=err.message.split("_")
																				if(spliterror[1].indexOf("id")>=0){
																					res.status(200).json({
																						status: 'Failed',
																						message: "Please provide correct member_id"
																					});
																				}
																				else{
																					res.status(500).json({
																						status: 'Failed',
																						message: err.message
																					});
																				}
														                    });
																}).catch(err => {					//catch for userid update

																	var spliterror=err.message.split("_")
																	if(spliterror[1].indexOf("id")>=0){
																		res.status(200).json({
																			status: 'Failed',
																			message: "Please provide correct following_userid"
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

											var spliterror=err.message.split("_")
											if(spliterror[1].indexOf("id")>=0){
												res.status(200).json({
													status: 'Failed',
													message: "Please provide correct userid"
												});
											}
											else{
												winston.error(err.stack)
												res.status(500).json({
													status: 'Failed',
													message: err.message
												});
											 }
							            });
          						}
          						else{
          						   return res.status(200).json({
					                status:"Failed",
					                message:"You are already following this user."
					              });
          						}
          					}
          				}).catch(err => {
									res.status(500).json({
										status: 'Failed',
										message: err
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


router.post("/get_following", (req, res, next) => {

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
          	var perPage = 100;
			var page = req.body.page_no;

			if(isEmpty(page)){
				page=1
			}
			var skip = (perPage * page) - perPage;
			var limit = skip+perPage;

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
									following.map(doc =>{
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
									test.sort(
															  function(a, b) {
															    if ((a.username).toLowerCase() < (b.username).toLowerCase()) return -1;
															    if ((a.username).toLowerCase() > (b.username).toLowerCase()) return 1;
															    return 0;
															  }
														);
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

router.post("/get_followers", (req, res, next) => {

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
          	var perPage = 100;
			var page = req.body.page_no;

			if(isEmpty(page)){
				page=1
			}
			var skip = (perPage * page) - perPage;
			var limit = skip+perPage;

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
									followers.map(doc =>{
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
									test.sort(
															  function(a, b) {
															    if ((a.username).toLowerCase() < (b.username).toLowerCase()) return -1;
															    if ((a.username).toLowerCase() > (b.username).toLowerCase()) return 1;
															    return 0;
															  }
														);
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

router.post("/block_user", (req, res, next) => {

  var keyArray = ["userid", "iv_token", "clientid", "member_id"];
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
			userDetails.find({userid:{$in:[ObjectId(req.body.userid),ObjectId(req.body.member_id)]}})
						.exec()
						.then(data =>{
							var member_id = ""
							var userid = ""
							var blocked = []
							var is_blocked = false
							if(String(data[0].userid) === String(req.body.userid)){
								userid = data[0]._id
								member_id = data[1]._id
								blocked = data[0].blocked

							}
							else{
								userid = data[1]._id
								blocked = data[1].blocked
								member_id = data[0]._id
							}

							if(blocked.length > 0){
								var found = blocked.find(o => String(o) === String(member_id))
								if(typeof found === 'undefined'){
									is_blocked = false
								}
								else{
									is_blocked = true
								}
							}

							if(is_blocked === false){
								userDetails.findOneAndUpdate({userid:ObjectId(req.body.userid)},
														{$push:{blocked:ObjectId(member_id)},
																$pull:{followers:ObjectId(member_id),
																following:ObjectId(member_id)},
																$inc:{blocked_count:1}})
										.exec()
										.then(result =>{
											if(result === null){
												res.status(200).json({
													status: 'Failed',
													message: "Error Blocking the user"
												});
											}else{
												contactsModel.findOneAndUpdate({userid:ObjectId(req.body.userid)},
																{$push:{blocked:ObjectId(req.body.member_id)},
																$pull:{existing_contacts:{contact:ObjectId(req.body.member_id)}}})
												.exec()
												.then(result =>{
													if(result === null){
														res.status(200).json({
															status: 'Failed',
															message: "Error Blocking the user"
														});
													}else{
														res.status(200).json({
															status: 'Ok',
															message: "Blocked the user."
														});
													}
												}).catch(err => {					//catch for userid update
													var spliterror=err.message.split("_")
													if(spliterror[1].indexOf("id")>=0){
														res.status(200).json({
															status: 'Failed',
															message: "Please provide correct member_id"
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
										}).catch(err => {					//catch for userid update
											var spliterror=err.message.split("_")
											if(spliterror[1].indexOf("id")>=0){
												res.status(200).json({
													status: 'Failed',
													message: "Please provide correct member_id"
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
							else{
									res.status(200).json({
										status: 'Failed',
										message: "You have already blocked this user."
									});
							}

						}).catch(err => {
							var spliterror=err.message.split("_")
								if(spliterror[1].indexOf("id")>=0){
									res.status(200).json({
										status: 'Failed',
										message: "Please provide correct member_id"
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


router.post("/unblock_user", (req, res, next) => {

  var keyArray = ["userid", "iv_token", "clientid", "member_id"];
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
			userDetails.find({userid:ObjectId(req.body.member_id)})
						.exec()
						.then(data =>{
							userDetails.findOneAndUpdate({userid:ObjectId(req.body.userid)},
														{$pull:{blocked:ObjectId(data[0]._id)},
																$inc:{blocked_count:-1}})
										.exec()
										.then(result =>{
											if(result === null){
												res.status(200).json({
													status: 'Failed',
													message: "Error Unblocking the user"
												});
											}else{
												contactsModel.findOneAndUpdate({userid:ObjectId(req.body.userid)},
																{$pull:{blocked:ObjectId(data[0].userid)},
																$push:{existing_contacts:{
																	contact:ObjectId(req.body.member_id),
																	contact_details:ObjectId(data[0]._id),
																	user_category:data[0].category_type
																}}})
												.exec()
												.then(result =>{
													if(result === null){
														res.status(200).json({
															status: 'Failed',
															message: "Error Unblocking the user"
														});
													}else{
														res.status(200).json({
															status: 'Ok',
															message: "Unblocked the user."
														});
													}
												}).catch(err => {					//catch for userid update
													var spliterror=err.message.split("_")
													if(spliterror[1].indexOf("id")>=0){
														res.status(200).json({
															status: 'Failed',
															message: "Please provide correct member_id"
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
										}).catch(err => {					//catch for userid update
											var spliterror=err.message.split("_")
											if(spliterror[1].indexOf("id")>=0){
												res.status(200).json({
													status: 'Failed',
													message: "Please provide correct member_id"
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
										message: "Please provide correct member_id"
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

router.post("/get_blocked_contacts", (req, res, next) => {

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

			userDetails.find({userid:ObjectId(req.body.userid)})
					.populate({path : 'blocked', populate : {path : 'userid'}})
					.exec()
					.then(data =>{
						var test = [];
							if(data[0].blocked.length>0){
								var blocked = data[0].blocked
								blocked.map(doc =>{
										var profileimage = doc.userid.profileimage;
										if(doc.userid.profileimage === null){
											profileimage = "uploads/userimage.png"
										}
										var foe = {
											'username':doc.userid.username,
											'fullname':doc.userid.fullname,
											'userid':doc.userid._id,
											'profileimage':constants.APIBASEURL+profileimage,
											'mobile':doc.userid.mobile
										}
										test.push(foe)
								})
								const totalcount = data[0].blocked_count;
								res.status(200).json({
									status: 'Ok',
									message: "Blocked contacts",
									userid: req.body.userid,
									contacts:test
								});
							}else{
								res.status(200).json({
									status: 'Ok',
									message: "No users were blocked.",
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


router.post("/redirection", (req, res, next) => {

res.redirect(307,'http://bizzgear.com/user/username')

});


router.get("/user_category_cronjob", (req, res, next) =>{
 	User.find({})
 		.exec()
 		.then(docs =>{
 			docs.map(data =>{
 				 	var date = new Date()
 				 	var dates = new Date()
 					var dated = new Date(date.setDate(date.getDate() - 7));
 					iv_feeds.find({iv_acountid:ObjectId(data._id),feed_post_create:{'$gte':dated, '$lte':dates} })
 						.exec()
 						.then(dex =>{
 							var count = 0
 							if(dex.length >= 10){
 								dex.map(foe =>{
 									if(foe.no_views >= 70 && parsInt(foe.feed_rating) >= 4){
 										count += 1
 									}
 								})

 								if(count >= 10){
 									userDetails.findOneAndUpdate({userid:ObjectId(data._id)},{$set:{category_type:"Supernova"}},{new:true})
 												.exec()
 												.then(dot =>{
 													//console.log(dot)
 												})

 								}
 								else{
 									userDetails.findOneAndUpdate({userid:ObjectId(data._id)},{$set:{category_type:"Stellar"}},{new:true})
 												.exec()
 												.then(dot =>{
 													//console.log(dot)
 												})
 								}
 							}
 							else{
 									userDetails.findOneAndUpdate({userid:ObjectId(data._id)},{$set:{category_type:"Stellar"}},{new:true})
 												.exec()
 												.then(dot =>{
 													//console.log(dot)
 												})
 								}

 						}).catch(err => {
 							console.log(err)
				        });

				         // res.status(200).json({
			          //       status: 'Ok',
			          //       message: "Done"
			          //     });
 			})
 			console.log("Done with user category")
 		}).catch(err => {
            var spliterror=err.message.split(":")
              res.status(500).json({
                status: 'Failed',
                message: spliterror[0]
              });
        });
})

router.get("/user_category_contacts_cronjob", (req, res, next) =>{
 	contactsModel.find({},{userid:1, existing_contacts:1})
 		.populate('existing_contacts.contact_details')
 		.exec()
 		.then(docs =>{
 			docs.map(data =>{
 				var contacts = data.existing_contacts
 				contacts.map(dex => {
 					var userdetails = dex.contact_details
 					var userid = userdetails._id
 					var category = userdetails.category_type
 					contactsModel.updateMany({'existing_contacts.contact_details':userid},
 											{$set:{'existing_contacts.$.user_category':category}})
 								.exec()
 								.then(dot =>{
 									//	console.log(dot)

 								})
 				})

 			})
 					console.log("done with contact category sync")
 		}).catch(err => {
            var spliterror=err.message.split(":")
              res.status(500).json({
                status: 'Failed',
                message: spliterror[0]
              });
        });
})

router.get("/user_contacts_cronjob", (req, res, next) =>{
 	User.find({})
 		.exec()
 		.then(docs =>{
 			console.log(docs.length)
 			docs.forEach(function(data){
 				contactsModel.distinct("existing_contacts.contact",{userid:ObjectId(data._id)})
 								.exec()
 								.then(dex =>{
 									var no_contacts = 0
 									if(dex.length > 0){
 										no_contacts = dex.length
 									}
 									userDetails.findOneAndUpdate({userid:ObjectId(data._id)},
 																{$set:{no_contacts:no_contacts}})
 												.exec()
 								}).catch(err => {
						            var spliterror=err.message.split(":")
						              res.status(500).json({
						                status: 'Failed',
						                message: spliterror[0]
						              });
						        });

 			})
 					console.log("done with contact sync")
 		}).catch(err => {
            var spliterror=err.message.split(":")
              res.status(500).json({
                status: 'Failed',
                message: spliterror[0]
              });
        });
})

router.get("/update_contacts_server", (req, res, next) => {

	User.find({})
		.exec()
		.then(data =>{

			data.map(dex =>{
				contactsModel.find({userid:ObjectId(dex._id)},{'new_contacts':1,'existing_contacts':1,'userid':1})
				.exec()
				.then(docs => {
					if(docs.length > 0){
						docs.map(doc =>{
							var userid = doc.userid
							var contacts = doc.new_contacts
							var contact_list =[]
							var exe_contacts = doc.existing_contacts

							contacts.map(data =>{
								//console.log()
								contact_mobile = String(data.mobile).replace(/\s/g, "")
			          			contact_mobile = contact_mobile.replace(/-/g,"")
			          			contact_mobile = contact_mobile.replace(/ /g,"")
			          			contact_mobile = contact_mobile.replace(/[`~!@#$%^&*()_|\-=?;:'",.<>\{\}\[\]\\\/]/gi, '')
			          			if(contact_mobile.length > 10){

			          				if(contact_mobile.substring(0,1) === '0'){
			          						contact_mobile = contact_mobile.substring(1)
			          							//console.log(contact_mobile)
			          				}

			          				else if(contact_mobile.substring(0,1) === '+'){

			          					contact_mobile = contact_mobile.substring(3)
			          					//console.log(contact_mobile)
			          				}

			          				else{

			          					if(contact_mobile.substring(0,2) === '91'){

			          						contact_mobile = contact_mobile.substring(2)
			          					//console.log(contact_mobile)
			          					}
			          				}
			          			}
			          				contact_list.push(contact_mobile)
							})


							if(doc.new_contacts.length > 0){

								User.find({mobile:{$in:contact_list}})
									.exec()
									.then(dex =>{
										var existing_contacts = []
										var delete_contacts =[]
										if(dex.length > 0){
											//console.log(dex)
											dex.map(dog =>{
											//	console.log(dog.username + " "+dog._id )
												existing_contacts.push(ObjectId(dog._id))
												delete_contacts.push(dog.mobile)
											})

											userDetails.find({userid:{$in:existing_contacts}})
														.exec()
														.then(result =>{
															if(result.length > 0){

																var fig = []

																result.map(fox =>{

																	var found = exe_contacts.find(o => String(o.contact) === String(fox.userid))

																	//console.log(found)

																	if(typeof found === 'undefined' && String(fox.userid) != String(userid)){
																		//console.log(found)
																		var fur ={
																			'contact': ObjectId(fox.userid),
																			'contact_details':ObjectId(fox._id),
																			'user_category':fox.category_type,
																			'status':""
																		}
																		fig.push(fur)
																	}
																})

																//console.log(fig)
																contactsModel.findOneAndUpdate({userid:ObjectId(dex._id)},
																					{ $push: { existing_contacts: { $each: fig } }
																					})
																			.exec()
															}
														}).catch(err => {
															console.log(err)
										                });
										}
									}).catch(err => {
									//	console.log(err)
					                });
							}
						})
					}

				}).catch(err => {
					console.log(err)
                });
			})
			console.log("Done with contact sync for each user!!")
		}).catch(err => {
					console.log(err)
                });
});

router.post("/gift_points", (req, res, next) => {

    var keyArray = ["userid", "iv_token", "clientid", "feed_id"];
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

                        userDetails.find({
			                            userid: ObjectId(req.body.userid)
			                        }, {talent_points: 1, view_points: 1, userid: 1})
                            .populate('userid')
                            .exec()
                            .then(user_result => {

                                feeds.find({
		                                    _id: ObjectId(req.body.feed_id)
		                                }, {_id: 1, iv_acountid: 1, feed_desc: 1, feed_type: 1})

                                    .exec()
                                    .then(feed_result => {
                                        var remaining_points = 0;
                                        var amount = 1
                                        var talent_points = user_result[0].talent_points;
                                        var view_points = user_result[0].view_points;
                                        var enough_coins = true;
                                        var user_condition = "";

                                        if (talent_points >= amount) {
                                            user_condition = {$inc: {talent_points: -amount}}
                                        }
                                        else if (view_points >= amount) {
                                            user_condition = {$inc: {view_points: -amount}}
                                        }
                                        else {
                                            enough_coins = false
                                        }

                                        if (enough_coins === false) {
                                            return res.status(200).json({
                                                status: "Failed",
                                                message: "Insufficient points in your account to donate."
                                            });
                                        }
                                        else {
                                            userDetails.findOneAndUpdate({userid: ObjectId(req.body.userid)}, user_condition, { new: true})
                                                .exec()
                                                .then(decremented_user_doc => {
                                                    userDetails.findOneAndUpdate({userid: ObjectId(feed_result[0].iv_acountid)}, {$inc: {talent_points: amount}}, {new: true})
                                                        .exec()
                                                        .then(incremented_user_doc => {

                                                            var username = user_result[0].userid.username;
                                                            var feed_desc = "";
                                                            var msgbody = username + " gifted a point for your post"
                                                            var profileimage = user_result[0].userid.profileimage;
                                                            if (profileimage === null) {
                                                                profileimage = 'uploads/userimage.png'
                                                            }
                                                            const note_no = Math.floor(10000000000 + Math.random() * 90000000000);
                                                            notificationModel.findOneAndUpdate({userid: ObjectId(feed_result[0].iv_acountid)},
                                                                {
                                                                    $push: {
                                                                        notifications: {
                                                                            notification_data: msgbody,
                                                                            member_id: req.body.userid,
                                                                            notification_type: 'feed_details',
                                                                            notification_number: note_no,
                                                                            username: username,
                                                                            item_id: req.body.feed_id,
                                                                            profileimage: ObjectId(req.body.userid),
                                                                            feed_type: feed_result[0].feed_type,
                                                                            created_at: Date.now()
                                                                        }
                                                                    }
                                                                })
                                                                .exec()
                                                                .then(dosy => {
                                                                    if (dosy === null) {
                                                                        return res.status(200).json({
                                                                            status: "Failed",
                                                                            message: "Please provide correct member_id."
                                                                        });
                                                                    } else {
                                                                        fcmModel.find({userid: feed_result[0].iv_acountid})
                                                                            .exec()
                                                                            .then(user => {
                                                                                //console.log(user)
                                                                                if (user.length < 1) {
                                                                                    return res.status(200).json({
                                                                                        status: "Failed",
                                                                                        message: "Please provide correct member_id."
                                                                                    });
                                                                                } else {
                                                                                    var serverKey = constants.FCMServerKey;
                                                                                    var fcm = new FCM(serverKey);

                                                                                    var message = {
                                                                                        to: user[0].fcmtoken,
                                                                                        collapse_key: 'exit',

                                                                                        notification: {
                                                                                            title: 'FvmeGear',
                                                                                            body: msgbody,
                                                                                        },
                                                                                        data: {
                                                                                            notification_id: note_no,
                                                                                            message: msgbody,
                                                                                            notification_slug: 'feed_details',
                                                                                            url: constants.APIBASEURL + profileimage,
                                                                                            username: username,
                                                                                            item_id: req.body.feed_id,
                                                                                            userid: "",
                                                                                            feed_id: "",
                                                                                            member_feed_id: "",
                                                                                            member_id: "",
                                                                                            is_from_push: true,
                                                                                            feed_type: feed_result[0].feed_type
                                                                                        },
                                                                                        android: {
                                                                                            priority: "high"
                                                                                        },
                                                                                        webpush: {
                                                                                            headers: {
                                                                                                "Urgency": "high"
                                                                                            }
                                                                                        }
                                                                                    };
                                                                                    fcm.send(message, function (err, response) {

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

                                                            res.json({
                                                                status: "Ok",
                                                                msg: "You have donated a point successfully"
                                                            })
                                                        }).catch(err => {              //catch for userid find
                                                        // console.log("ch1", err);
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
                                                    });

                                                }).catch(err => {              //catch for userid find
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
                                            });
                                        }
                                    }).catch(err => {
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
                                });


                            }).catch(err => {              //catch for userid find
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


router.post("/get_app_data_dynamic", (req, res, next) => {

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

			userDetails.find({userid:ObjectId(req.body.userid)})
					.populate('offers_history.primary_offer userid')
					.exec()
					.then(data =>{
						var offer_history = data[0].offers_history
						var lotter_offer = []
						var user_details =[]
						var offer_details =[]
						var required_app_update=true
						 var announcement_details = {}
						var notification_count = 0
						var signup_video_url= "" //constants.APIBASEURL+"uploads/fvmegearad1.mp4"
						var app_usage_video_url="" //constants.APIBASEURL+"uploads/fvmegearad2.mp4"
						var emailcheck ="";
                        if(data[0].userid.mobile_verified === 'true'){

                          emailcheck=true;
                        }else{
                          emailcheck=false
                        }

                        var announcement_seen_on = data[0].announcement_seen_on
                        var Query = ""

                        if(announcement_seen_on === null){
                        	Query ={}
                        }
                        else{
                        	announcement_seen_on = new Date(announcement_seen_on)
                        	Query = {created_at:{$gte:announcement_seen_on}}
                        }

                        announcements.find(Query)
                            .sort({created_at: -1})
                            .exec()
                            .then(dex => {

                            	var announcement_count = dex.length
                            	var has_shown_announcements = true

                            	if(announcement_count > 0){
                            		userDetails.findOneAndUpdate({userid:ObjectId(req.body.userid)},
                            									{$set:{has_shown_announcements:false}})
                            					.exec()
                            		has_shown_announcements = false
                            	}
                            	else{
                            		has_shown_announcements = true
                            	}

                            	 if(has_shown_announcements === true){
                            	 	announcement_count = 0
                            	 }

                            	if(dex.length > 0){
                            		announcement_details = {
                            			text:dex[0].ann_text,
										slug:"announcements_tab",
                            		}
                            	}
                            	else{
                            		announcement_details ={}
                            	}


							    notificationModel.aggregate([{
			                            $match: {
			                                userid: ObjectId(req.body.userid),
			                            }
			                        	},
			                            {
			                                $project: {
			                                    "notifications.view_status": 1
			                                }
			                            }
			                        ])
		                            .exec()
		                            .then(docs => {
		                            	var notifications = []
		                            	if(docs.length > 0){
		                            		notifications = docs[0].notifications;
			                                if (notifications.length < 1) {
			                                	notification_count = 0
			                                } else {
			                                    // console.log("notify", notify)
			                                    var count = 0;

			                                    notifications.map((doc) => {

			                                        if (doc.view_status === false) {
			                                            count++;
			                                        }
			                                    })

			                                    notification_count = count

			                                }
		                            	}

		                                if(notification_count < 1){
		                                	notification_count = 0
		                                }

										if(offer_history.length > 0){
											var found = offer_history.find(o => o.is_primary_offer === true && o.is_lottery_showed === false)

											if(typeof found != 'undefined'){
													lotter_offer.push(found)
													lotter_offer.map(doc =>{
													var profileimage = data[0].userid.profileimage

													if(data[0].userid.profileimage === null){
														profileimage = constants.APIBASEURL+"uploads/userimage.png"
													}

													var foe = {
														'username': data[0].userid.username,
														'userid':data[0].userid._id,
														'profileimage':profileimage
													}

													user_details.push(foe)

													var fog = {
														"offer_id": doc.primary_offer._id,
														"offer_name":doc.primary_offer.business_post_name,
														"offer_desc": doc.primary_offer.business_post_desc,
														"offer_img_url": constants.APIBASEURL+doc.primary_offer.business_post_logo,
													}

													offer_details.push(fog)
												})

												res.status(200).json({
													status:"Ok",
													message:"App data dynamics",
													app_data_details:{
														notificationcount: notification_count,
														announcement_count: announcement_count,
														show_adds: false,
														show_google_ads:true,
														required_app_version:22,
														signup_video_url:signup_video_url,
														app_usage_video_url:app_usage_video_url,
														is_user_verified: emailcheck,
														enable_gift_feature:true,
														required_app_update:required_app_update,
														lottery_details:{
															lottery_message: "Hey!! "+user_details[0].username+ "\n\n"+ "Congratulations"+"\n" + "You have won the primary offer lottery.",
															user_details:user_details[0],
															offer_details:offer_details[0]
														},
														offer_popup_details:{

														},
														announcement_details:announcement_details
													}
												})
											}
											else{
												res.status(200).json({
													status:"Ok",
													message:"App data dynamics",
													app_data_details:{
														notificationcount:notification_count,
														announcement_count: announcement_count,
														show_adds: false,
														show_google_ads:true,
														enable_gift_feature:true,
														required_app_version:22,
														required_app_update:true,
														signup_video_url:signup_video_url,
														app_usage_video_url:app_usage_video_url,
														is_user_verified: emailcheck,
														lottery_details:{},
														announcement_details:announcement_details
													}
												})
											}

										}
										else{
											res.status(200).json({
												status:"Ok",
												message:"App data dynamics",
												app_data_details:{
													notificationcount: notification_count,
													announcement_count: announcement_count,
													show_adds: false,
													show_google_ads:true,
													enable_gift_feature:true,
													required_app_version:22,
													required_app_update:true,
													signup_video_url:signup_video_url,
													app_usage_video_url:app_usage_video_url,
													is_user_verified: emailcheck,
													lottery_details:{},
													announcement_details:announcement_details
												}

											})
										}
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

                        }).catch(err => {
				            var spliterror=err.message.split(":")
				              res.status(500).json({
				                status: 'Failed',
				                message: spliterror[0]
				              });
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


router.get("/feed_count", (req, res, next) => {

iv_feeds.find({'feed_type':"video"})
		.exec()
		.then(docs =>{
			if(docs.length > 0){

	var i=0;
	docs.map(data => {

	  var OddRand = Math.floor(Math.random() * 1) + 1
	  var rand = Math.floor(Math.random() * 4) + 1
	  var random = Math.floor(Math.random() * 250) + 100
	  var Useriv_acountid = data.iv_acountid._id;


	  var EvenView = math.divide(i, 2);
	  var dividedByView = [];
	  if(EvenView === 0)
	  {
		  //console.log('test1');
		  if(data.no_views < random){
			iv_feeds.findOneAndUpdate({_id:ObjectId(data._id)},{$inc:{no_views:rand}})
			  .exec()
			  .then(dex =>{

				userDetails.findOneAndUpdate({userid: Useriv_acountid},
				   {$inc: {t_views: rand}})
				   .exec();

				   userDetails.find({userid: Useriv_acountid})
				   .exec()
				   .then(docsFetch =>{


					   var fetchView = docsFetch[0].t_views;

					   if(fetchView >= 10)
					   {


						 var dividedByView1 = math.divide(fetchView, 10);
						  dividedByView.push(dividedByView1);

						 if (String(dividedByView1).indexOf('.') != -1)
						 {

						 var splitViews = String(dividedByView1).split('.');
						 var addTalentPoint = parseInt(splitViews[0]);
						 var remainViewPoint = parseInt(splitViews[1]);
						}
						else
						{

							if(dividedByView1 === 1)
							{
							  var addTalentPoint = parseInt(1);
										  var remainViewPoint = 0;
							}

						}


						 userDetails.findOneAndUpdate({userid: Useriv_acountid},
						 {
							 $inc:{talent_points:addTalentPoint},
							 $set:{t_views:remainViewPoint}
						 }
						 )
						.exec()


					   }


				   })


			  })


			console.log("done with count")
		  }
		  dividedByView = [];
	 }
	 else
	 {

	   if(data.no_views < random){
		 iv_feeds.findOneAndUpdate({_id:ObjectId(data._id)},{$inc:{no_views:OddRand}})
		   .exec()
		   .then(dex =>{

			 userDetails.findOneAndUpdate({userid: Useriv_acountid},
														  {$inc: {t_views: OddRand}})
														  .exec();
			userDetails.find({userid: Useriv_acountid})
				   .exec()
				   .then(docsFetch =>{

			   var fetchView = docsFetch[0].t_views;


		if(fetchView >= 10)
				   {

					  var dividedByView1 = math.divide(fetchView, 10);
							dividedByView.push(dividedByView1);

					 if(String(dividedByView1).indexOf('.') != -1)
					 {

					 var splitViews =String(dividedByView1).split('.');
					 var addTalentPoint = parseInt(splitViews[0]);
					 var remainViewPoint = parseInt(splitViews[1]);
					}
					else
					{


		if(dividedByView1 === 1)
		{
		  var addTalentPoint = parseInt(1);
					  var remainViewPoint = 0;
		}


					}
					 userDetails.findOneAndUpdate({userid: Useriv_acountid},
					 {
						 $inc:{talent_points:addTalentPoint},
						 $set:{t_views:remainViewPoint}
					 }
					 )
					.exec()


				   }

			//  })
			})
		   })
		 console.log("done with OddFeeds count")
	   }
		 dividedByView = [];
	 }


	  i++;
	})


			}
		}).catch(err => {
			console.log(err)
		});
});



router.post("/update_lottery_details", (req, res, next) => {

  var keyArray = ["userid", "iv_token", "clientid", "offer_id"];
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

			userDetails.find({userid:ObjectId(req.body.userid),
							 'offers_history.primary_offer':ObjectId(req.body.offer_id)},
							 {'offers_history.$':1})
					.exec()
					.then(data =>{
						var offer_history = data[0].offers_history

						if(offer_history.length > 0){
							userDetails.findOneAndUpdate({userid:ObjectId(req.body.userid),
							 				'offers_history.primary_offer':ObjectId(req.body.offer_id)},
							 				{$set:{'offers_history.$.is_lottery_showed':true}})
										.exec()
										.then(docs =>{
											if(docs === null){
												res.status(200).json({
													status: 'Failed',
													message: "Please provide correct offer_id"
												});
											}
											else{
												res.status(200).json({
													status: 'Ok',
													message: "successfully updated lottery details."
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


router.get("/primary_offer_lottery", (req, res, next) => {
	userDetails.find({'offer_details.is_primary_offer':true},
						{'offer_details.$':1})
				.exec()
				.then(docs =>{
					if(docs.length > 0){
						var offer_details = docs[0].offer_details

						if(offer_details.length > 0){

							var offer = offer_details[0].primary_offer

							userDetails.findOneAndUpdate({},
															{$push:{offers_history:{
																primary_offer:ObjectId(offer),
																redeemed_on:Date.now(),
																is_primary_offer:true,
																payment_status:"completed",
															}},$pull:{ offer_details:{primary_offer:offer}}},{new:true})
										.exec()
										.then(data =>{
											console.log("primary offer done.")
										}).catch(err => {
											console.log(err)
								        });
						}
					}
				}).catch(err => {
					console.log(err)
		        });

});

router.post("/consumeAnnouncement", (req, res, next) => {

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

							userDetails.findOneAndUpdate({userid:ObjectId(req.body.userid)},
							 				{$set:{'has_shown_announcements':true, announcement_seen_on:Date.now()}})
										.exec()
										.then(docs =>{
											if(docs === null){
												res.status(200).json({
													status: 'Failed',
													message: "Please provide correct userid"
												});
											}
											else{
												res.status(200).json({
													status: 'Ok',
													message: "successfully updated announcement details."
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



router.get("/individual_msg_notification", (req, res, next) => {
	User.find({})
		.exec()
		.then(docs =>{
			var names = []
			var count = 0
			if(docs.length > 0){
				docs.map(doc =>{
					count = count+1
					console.log(count)
							var message = ""
							var msg = ""

							msg  = utf8.encode("Hi, fvmegear users, we are back from maintenance. Now you can watch, post videos and get offers as you used to. Sorry for the inconvenience created.Thank you.");

							message = "Hi, fvmegear users, we are back from maintenance. Now you can watch, post videos and get offers as you used to. Sorry for the inconvenience created.Thank you."

							if(message != ""){
															        // var msg =utf8.encode("You have won the lottery for having more no. of connections.");
						        var toNumber = doc.mobile
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

						     	var msgbody = message
						     	const note_no =Math.floor(10000000000 + Math.random() * 90000000000);
																						notificationModel.findOneAndUpdate({userid:ObjectId(doc._id)},
																								{$push:{notifications:{
																									notification_data: msgbody,
																									member_id: "",
																									notification_type: 'announcements_tab',
																									notification_number:note_no,
																									username:"",
																									item_id: "",
																									profileimage:ObjectId(null),
																									created_at:Date.now()
																								}}})
																									.exec()
																									.then(dosy =>{
																										if(dosy === null){

																										}
																										else{
														      												fcmModel.find({userid :doc._id})
																											        .exec()
																											        .then(user => {
																											        	console.log(user)
																											          if (user.length < 1) {

																											            }
																											          else {
																												            var serverKey = constants.FCMServerKey;
																												            var fcm = new FCM(serverKey);


																												            var message = {
																												                to : user[0].fcmtoken,
																												                collapse_key: 'exit',

																												                notification: {
																												                    title: 'FvmeGear',
																												                    body: msgbody ,
																												                } ,
																												                data : {
																												                  notification_id : note_no,
																												                    message: msgbody,
																												                    notification_slug: 'announcements_tab',
																												                    url: "",
																												                    username:"",
																												                    item_id: "",

																																            userid:"",
																																            feed_id:"",
																																            member_feed_id:"",
																																            member_id:"",
																																       is_from_push:true
																												                },
																													              android:{
																													                priority:"high"
																													              },
																												                 webpush: {
																												                  headers: {
																												                    "Urgency": "high"
																												                  }
																												                }
																												            };
																												            var is_err = false
																												            fcm.send(message, function(err, response){
																												            	console.log(response)

																												            });
																											        }
																											    }).catch(err => {
																											        console.log(err)
																											    });
																											}
																									}).catch(err => {
																											console.log(err)
																									});
										}

				})
			}
		}).catch(err =>{
			console.log(err)
		})
 });


router.get("/bulk_msgs_notifications", (req, res, next) => {
	User.find({})
				.then(docs =>{
					if(docs.length > 0){

						var userid = []
						var objectuserid = []
						var contact =[]

						docs.map(doc =>{
							userid.push(doc._id)
							objectuserid.push(ObjectId(doc._id))
							contact.push(doc.mobile)
						})

						var msg = ""

							msg  = utf8.encode("Hi, fvmegear users, we are back from maintenance. Now you can watch, post videos and get offers as you used to. Sorry for the inconvenience created.Thank you.");

								var toNumber = contact
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

					        var msgbody ="Hurry!! Amazon, KFC, McDonalds, etc gifts cards of worth 500/- on flat 75% discount. Post or Watch videos to get the special discounts."
					     	const note_no =Math.floor(10000000000 + Math.random() * 90000000000);
																					notificationModel.updateMany({userid:{$in:objectuserid}},
																							{$push:{notifications:{
																								notification_data: msgbody,
																								member_id: "",
																								notification_type: 'announcements_tab',
																								notification_number:note_no,
																								username:"",
																								item_id: "",
																								profileimage:ObjectId(null),
																								created_at:Date.now()
																							}}})
																								.exec()
																								.then(dosy =>{
																									if(dosy === null){
																										return res.status(200).json({
																						                	status:"Failed",
																						                	message:"Please provide correct userid."
																						              });
																									}
																									else{
													      												fcmModel.find({userid : {$in:userid}})
																										        .exec()
																										        .then(user => {
																										        	console.log(user)
																										          if (user.length < 1) {
																										              return res.status(200).json({
																										                status:"Failed",
																										                message:"Please provide correct member_id."
																										              });
																										            }
																										          else {
																											            var serverKey = constants.FCMServerKey;
																											            var fcm = new FCM(serverKey);

																											            var user_fcm = [];
																														user.forEach(function(ele){
																															user_fcm.push(ele.fcmtoken)
																														})

																											            var message = {
																											                registration_ids : user_fcm,
																											                collapse_key: 'exit',

																											                notification: {
																											                    title: 'FvmeGear',
																											                    body: msgbody ,
																											                } ,
																											                data : {
																											                  notification_id : note_no,
																											                    message: msgbody,
																											                    notification_slug: 'announcements_tab',
																											                    url: "",
																											                    username:"",
																											                    item_id: "",

																															            userid:"",
																															            feed_id:"",
																															            member_feed_id:"",
																															            member_id:"",
																															       is_from_push:true
																											                },
																												              android:{
																												                priority:"high"
																												              },
																											                 webpush: {
																											                  headers: {
																											                    "Urgency": "high"
																											                  }
																											                }
																											            };
																											            var is_err = false
																											            fcm.send(message, function(err, response){
																											            	console.log(response)

																											            });
																											     //        	res.status(200).json({
																																// 	status: 'Ok',
																																// 	message: "Sent successfully"
																																// });
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
																								console.log("message sent.")

					}
				}).catch(err => {
					console.log(err)
		        });
})

router.get("/bulk_notifications", (req, res, next) => {
	User.find({})
				.then(docs =>{
					if(docs.length > 0){

						var userid = []
						var objectuserid = []
						var contact =[]

						docs.map(doc =>{
							userid.push(doc._id)
							objectuserid.push(ObjectId(doc._id))
						})

					        var msgbody ="Discount on DISCOUNTS! Yup! you heard us right. Buy a product for 50% OFF or above and get Rs.100/- as reward. Buy more to earn more! Winners get Rs.1000/- gift vouchers."
					     	const note_no =Math.floor(10000000000 + Math.random() * 90000000000);
																					notificationModel.updateMany({userid:{$in:objectuserid}},
																							{$push:{notifications:{
																								notification_data: msgbody,
																								member_id: "",
																								notification_type: 'announcements_tab',
																								notification_number:note_no,
																								username:"",
																								item_id: "",
																								profileimage:ObjectId(null),
																								created_at:Date.now()
																							}}})
																								.exec()
																								.then(dosy =>{
																									if(dosy === null){
																										return res.status(200).json({
																						                	status:"Failed",
																						                	message:"Please provide correct userid."
																						              });
																									}
																									else{
													      												fcmModel.find({userid : {$in:userid}})
																										        .exec()
																										        .then(user => {
																										        	console.log(user)
																										          if (user.length < 1) {
																										              return res.status(200).json({
																										                status:"Failed",
																										                message:"Please provide correct member_id."
																										              });
																										            }
																										          else {
																											            var serverKey = constants.FCMServerKey;
																											            var fcm = new FCM(serverKey);

																											            var user_fcm = [];
																														user.forEach(function(ele){
																															user_fcm.push(ele.fcmtoken)
																														})

																											            var message = {
																											                registration_ids : user_fcm,
																											                collapse_key: 'exit',

																											                notification: {
																											                    title: 'FvmeGear',
																											                    body: msgbody ,
																											                } ,
																											                data : {
																											                  notification_id : note_no,
																											                    message: msgbody,
																											                    notification_slug: 'announcements_tab',
																											                    url: "",
																											                    username:"",
																											                    item_id: "",

																															            userid:"",
																															            feed_id:"",
																															            member_feed_id:"",
																															            member_id:"",
																															       is_from_push:true
																											                },
																												              android:{
																												                priority:"high"
																												              },
																											                 webpush: {
																											                  headers: {
																											                    "Urgency": "high"
																											                  }
																											                }
																											            };
																											            var is_err = false
																											            fcm.send(message, function(err, response){
																											            	console.log(response)

																											            });
																											     //        	res.status(200).json({
																																// 	status: 'Ok',
																																// 	message: "Sent successfully"
																																// });
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
																								console.log("message sent.")

					}
				}).catch(err => {
					console.log(err)
		        });
})

router.get("/bulk_notification_morning", (req, res, next) => {
	User.find({})
				.then(docs =>{
					if(docs.length > 0){

						var userid = []
						var objectuserid = []
						var contact =[]

						docs.map(doc =>{
							userid.push(doc._id)
							objectuserid.push(ObjectId(doc._id))
						})

					        var msgbody ="Hurry!! Amazon, KFC, McDonalds, etc gifts cards of worth 500/- on flat 75% discount. Post or Watch videos to get the special discounts."
					     	const note_no =Math.floor(10000000000 + Math.random() * 90000000000);
																					notificationModel.updateMany({userid:{$in:objectuserid}},
																							{$push:{notifications:{
																								notification_data: msgbody,
																								member_id: "",
																								notification_type: 'announcements_tab',
																								notification_number:note_no,
																								username:"",
																								item_id: "",
																								profileimage:ObjectId(null),
																								created_at:Date.now()
																							}}})
																								.exec()
																								.then(dosy =>{
																									if(dosy === null){
																										return res.status(200).json({
																						                	status:"Failed",
																						                	message:"Please provide correct userid."
																						              });
																									}
																									else{
													      												fcmModel.find({userid : {$in:userid}})
																										        .exec()
																										        .then(user => {
																										        	console.log(user)
																										          if (user.length < 1) {
																										              return res.status(200).json({
																										                status:"Failed",
																										                message:"Please provide correct member_id."
																										              });
																										            }
																										          else {
																											            var serverKey = constants.FCMServerKey;
																											            var fcm = new FCM(serverKey);

																											            var user_fcm = [];
																														user.forEach(function(ele){
																															user_fcm.push(ele.fcmtoken)
																														})

																											            var message = {
																											                registration_ids : user_fcm,
																											                collapse_key: 'exit',

																											                notification: {
																											                    title: 'FvmeGear',
																											                    body: msgbody ,
																											                } ,
																											                data : {
																											                  notification_id : note_no,
																											                    message: msgbody,
																											                    notification_slug: 'announcements_tab',
																											                    url: "",
																											                    username:"",
																											                    item_id: "",

																															            userid:"",
																															            feed_id:"",
																															            member_feed_id:"",
																															            member_id:"",
																															       is_from_push:true
																											                },
																												              android:{
																												                priority:"high"
																												              },
																											                 webpush: {
																											                  headers: {
																											                    "Urgency": "high"
																											                  }
																											                }
																											            };
																											            var is_err = false
																											            fcm.send(message, function(err, response){
																											            	console.log(response)

																											            });
																											     //        	res.status(200).json({
																																// 	status: 'Ok',
																																// 	message: "Sent successfully"
																																// });
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
																								console.log("message sent.")

					}
				}).catch(err => {
					console.log(err)
		        });
})


router.get("/bulk_notification_afternun", (req, res, next) => {
	User.find({})
				.then(docs =>{
					if(docs.length > 0){

						var userid = []
						var objectuserid = []
						var contact =[]

						docs.map(doc =>{
							userid.push(doc._id)
							objectuserid.push(ObjectId(doc._id))
						})

					        var msgbody ="Discount on DISCOUNTS! Yup! you heard us right. Buy a product for 50% OFF or above and get Rs.100/- as reward. Buy more to earn more! Winners get Rs.1000/- gift vouchers."
					     	const note_no =Math.floor(10000000000 + Math.random() * 90000000000);
																					notificationModel.updateMany({userid:{$in:objectuserid}},
																							{$push:{notifications:{
																								notification_data: msgbody,
																								member_id: "",
																								notification_type: 'announcements_tab',
																								notification_number:note_no,
																								username:"",
																								item_id: "",
																								profileimage:ObjectId(null),
																								created_at:Date.now()
																							}}})
																								.exec()
																								.then(dosy =>{
																									if(dosy === null){
																										return res.status(200).json({
																						                	status:"Failed",
																						                	message:"Please provide correct userid."
																						              });
																									}
																									else{
													      												fcmModel.find({userid : {$in:userid}})
																										        .exec()
																										        .then(user => {
																										        	console.log(user)
																										          if (user.length < 1) {
																										              return res.status(200).json({
																										                status:"Failed",
																										                message:"Please provide correct member_id."
																										              });
																										            }
																										          else {
																											            var serverKey = constants.FCMServerKey;
																											            var fcm = new FCM(serverKey);

																											            var user_fcm = [];
																														user.forEach(function(ele){
																															user_fcm.push(ele.fcmtoken)
																														})

																											            var message = {
																											                registration_ids : user_fcm,
																											                collapse_key: 'exit',

																											                notification: {
																											                    title: 'FvmeGear',
																											                    body: msgbody ,
																											                } ,
																											                data : {
																											                  notification_id : note_no,
																											                    message: msgbody,
																											                    notification_slug: 'announcements_tab',
																											                    url: "",
																											                    username:"",
																											                    item_id: "",

																															            userid:"",
																															            feed_id:"",
																															            member_feed_id:"",
																															            member_id:"",
																															       is_from_push:true
																											                },
																												              android:{
																												                priority:"high"
																												              },
																											                 webpush: {
																											                  headers: {
																											                    "Urgency": "high"
																											                  }
																											                }
																											            };
																											            var is_err = false
																											            fcm.send(message, function(err, response){
																											            	console.log(response)

																											            });
																											     //        	res.status(200).json({
																																// 	status: 'Ok',
																																// 	message: "Sent successfully"
																																// });
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
																								console.log("message sent.")

					}
				}).catch(err => {
					console.log(err)
		        });
})


router.get("/bulk_notification_night", (req, res, next) => {
	User.find({})
				.then(docs =>{
					if(docs.length > 0){

						var userid = []
						var objectuserid = []
						var contact =[]

						docs.map(doc =>{
							userid.push(doc._id)
							objectuserid.push(ObjectId(doc._id))
						})

					        var msgbody ="Rs 20000/- gift cards free every week.\nRefer your friends and family members and win a chance to get 20000/- worth gift cards."
					     	const note_no =Math.floor(10000000000 + Math.random() * 90000000000);
																					notificationModel.updateMany({userid:{$in:objectuserid}},
																							{$push:{notifications:{
																								notification_data: msgbody,
																								member_id: "",
																								notification_type: 'announcements_tab',
																								notification_number:note_no,
																								username:"",
																								item_id: "",
																								profileimage:ObjectId(null),
																								created_at:Date.now()
																							}}})
																								.exec()
																								.then(dosy =>{
																									if(dosy === null){
																										return res.status(200).json({
																						                	status:"Failed",
																						                	message:"Please provide correct userid."
																						              });
																									}
																									else{
													      												fcmModel.find({userid : {$in:userid}})
																										        .exec()
																										        .then(user => {
																										        	console.log(user)
																										          if (user.length < 1) {
																										              return res.status(200).json({
																										                status:"Failed",
																										                message:"Please provide correct member_id."
																										              });
																										            }
																										          else {
																											            var serverKey = constants.FCMServerKey;
																											            var fcm = new FCM(serverKey);

																											            var user_fcm = [];
																														user.forEach(function(ele){
																															user_fcm.push(ele.fcmtoken)
																														})

																											            var message = {
																											                registration_ids : user_fcm,
																											                collapse_key: 'exit',

																											                notification: {
																											                    title: 'FvmeGear',
																											                    body: msgbody ,
																											                } ,
																											                data : {
																											                  notification_id : note_no,
																											                    message: msgbody,
																											                    notification_slug: 'announcements_tab',
																											                    url: "",
																											                    username:"",
																											                    item_id: "",

																															            userid:"",
																															            feed_id:"",
																															            member_feed_id:"",
																															            member_id:"",
																															       is_from_push:true
																											                },
																												              android:{
																												                priority:"high"
																												              },
																											                 webpush: {
																											                  headers: {
																											                    "Urgency": "high"
																											                  }
																											                }
																											            };
																											            var is_err = false
																											            fcm.send(message, function(err, response){
																											            	console.log(response)

																											            });
																											     //        	res.status(200).json({
																																// 	status: 'Ok',
																																// 	message: "Sent successfully"
																																// });
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
																								console.log("message sent.")

					}
				}).catch(err => {
					console.log(err)
		        });
})


router.get("/bulk_notification_update", (req, res, next) => {
	User.find({})
				.then(docs =>{
					if(docs.length > 0){

						var userid = []
						var objectuserid = []
						var contact =[]

						docs.map(doc =>{
							userid.push(doc._id)
							objectuserid.push(ObjectId(doc._id))
						})

					        var msgbody ="A new version of App is available on Play Store, Please update to take advantage of latest features."
					     	const note_no =Math.floor(10000000000 + Math.random() * 90000000000);
																					notificationModel.updateMany({userid:{$in:objectuserid}},
																							{$push:{notifications:{
																								notification_data: msgbody,
																								member_id: "",
																								notification_type: 'update_app',
																								notification_number:note_no,
																								username:"",
																								item_id: "",
																								profileimage:ObjectId(null),
																								created_at:Date.now()
																							}}})
																								.exec()
																								.then(dosy =>{
																									if(dosy === null){
																										return res.status(200).json({
																						                	status:"Failed",
																						                	message:"Please provide correct userid."
																						              });
																									}
																									else{
													      												fcmModel.find({userid : {$in:userid}})
																										        .exec()
																										        .then(user => {
																										        	console.log(user)
																										          if (user.length < 1) {
																										              return res.status(200).json({
																										                status:"Failed",
																										                message:"Please provide correct member_id."
																										              });
																										            }
																										          else {
																											            var serverKey = constants.FCMServerKey;
																											            var fcm = new FCM(serverKey);

																											            var user_fcm = [];
																														user.forEach(function(ele){
																															user_fcm.push(ele.fcmtoken)
																														})

																											            var message = {
																											                registration_ids : user_fcm,
																											                collapse_key: 'exit',

																											                notification: {
																											                    title: 'FvmeGear',
																											                    body: msgbody ,
																											                } ,
																											                data : {
																											                  notification_id : note_no,
																											                    message: msgbody,
																											                    notification_slug: 'update_app',
																											                    url: "",
																											                    username:"",
																											                    item_id: "",

																															            userid:"",
																															            feed_id:"",
																															            member_feed_id:"",
																															            member_id:"",
																															       is_from_push:true
																											                },
																												              android:{
																												                priority:"high"
																												              },
																											                 webpush: {
																											                  headers: {
																											                    "Urgency": "high"
																											                  }
																											                }
																											            };
																											            var is_err = false
																											            fcm.send(message, function(err, response){
																											            	console.log(response)

																											            });
																											     //        	res.status(200).json({
																																// 	status: 'Ok',
																																// 	message: "Sent successfully"
																																// });
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
																								console.log("message sent.")

					}
				}).catch(err => {
					console.log(err)
		        });
})


router.get("/update_passwords", (req, res, next) => {
	User.find({})
		.exec()
		.then(docs =>{
			if(docs.length > 0){
				docs.map(doc =>{
					var pass = doc.password
					var new_pass_late = pass.substring(10)
					var new_pass = constants.ApiConstant+String(new_pass_late)
					User.findOneAndUpdate({_id:ObjectId(doc._id)},{$set:{password:new_pass}})
						.exec()
						.then(data =>{
							console.log("changed "+doc.username)
						}).catch(err =>{
							console.log(err)
						})
				})

			}
		}).catch(err =>{
			console.log(err)
		})
 });


router.get("/get_current_users", (req, res, next) => {
	User.find({})
		.exec()
		.then(docs =>{
			if(docs.length > 0){
				var test =[]
				docs.map(doc =>{
	  				test.push(doc._id)
				})

				trend.find({})
					.exec()
					.then(data =>{
						var dexs = data[0].details
						var dex =[]

						dexs.map(ele =>{
							var found = test.find(o => String(o._id) === String(ele.userid))
							if(typeof found === 'undefined'){
								dex.push(ele)
							}
						})
						console.log(dex.length)
						res.status(200).json({
		        			status: 'Ok',
		           			details: dex
		       			});


					}).catch(err =>{
						console.log(err)
					})
			}
		}).catch(err =>{
			console.log(err)
		})
 });

router.post("/get_user_tags", (req, res, next) => {

  var keyArray = ["userid", "iv_token", "clientid", "tag"];
  var key = Object.keys(req.body);

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
          	var tag = String(req.body.tag).replace(/@/g,"")

          		User.find({username:{$regex: '^' + tag, $options: 'i'}})
          			.exec()
          			.then(docs =>{

          				var feedTag_name = [];
					    docs.map(doc => {

					    	var profileimage = doc.profileimage

					    	if(doc.profileimage === null){
								profileimage = constants.APIBASEURL+"uploads/userimage.png"
							}

					        feedTag_name.push({
					        	'username':doc.username,
					        	'fullname':doc.fullname,
					        	'profileimage':profileimage
					        })

					    })

					    res.status(200).json({
					        status: "Ok",
					        message: "List of tags.",
					        users: feedTag_name
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

router.get("/get_current_offers", (req, res, next) => {
	userDetails.find({'offer_details.is_primary_offer':false, offer_details:{$ne:[]}})
		.populate('userid')
		.exec()
		.then(docs =>{
			if(docs.length > 0){
				var test =[]
				docs.map(doc =>{
          		test.push({
					'username':doc.userid.username,
					'userid':doc.userid._id
					})
				})


						res.status(200).json({
		        			status: 'Ok',
		           			details: test
		       			});
			}
		}).catch(err =>{
			console.log(err)
		})
 });

module.exports = router;
