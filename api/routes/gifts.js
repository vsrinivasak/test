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

router.post("/get_trending_monday", (req, res, next) => {

    var keyArray = ["userid", "iv_token", "clientid"];
    var key = Object.keys(req.body);

    if (keyArray.length == key.length && keyArray.every((v) => key.indexOf(v) >= 0)) {

        if (constants.AndriodClientId === req.body.clientid || constants.IosClientId === req.body.clientid) {

            authModel.find({ iv_token: req.body.iv_token })
                .exec()
                .then(user => {
                    if (user.length < 1) {
                        return res.status(200).json({
                            status: "Logout",
                            message: "You are logged in other device."
                        });
                    } else {

                        var perPage = 50;
                        var page = 1
                        var skip = (perPage * page) - perPage;
                        var limit = skip + perPage;

                        trend.find({})
                            .exec()
                            .then(data => {
                                var test = []
                                var dex = data[0].details
                                dex.map(doc => {

                                    var foe = {
                                        'column1': doc.profileimage,
                                        'column2': doc.username,
                                        'column3': doc.connections,
                                        'userid': doc.userid
                                    }

                                    test.push(foe)

                                })



                                test.sort((a, b) => b.column3 - a.column3)



                                var found = test.find(o => String(o.userid) === String(req.body.userid))
                                var user_index = 0

                                if (found != 'undefined') {
                                    user_index = test.indexOf(found)
                                } else {
                                    user_index = -1
                                }


                                var is_win = false
                                var count = 0

                                if (user_index === 0) {
                                    is_win = false //true
                                }

                                if (user_index > 50) {
                                    test = test.slice(skip, limit)
                                } else {
                                    //test.splice(user_index,1)
                                    test = test.slice(skip, limit)
                                }

                                var testapi = []
                                var final_user = ""

                                for (var i = 0; i < test.length; i++) {

                                    if (i != 0 && test[i].column3 === test[i - 1].column3) {
                                        count = count
                                    } else {
                                        count = count + 1
                                    }

                                    var is_winner = false

                                    if (count === 1) {
                                        is_winner = false //true
                                    }

                                    if (i === user_index) {
                                        final_user = {
                                            'column_one': found.column1,
                                            'column_two': found.column2,
                                            'column_three': found.column3,
                                            'column_four': "#" + count,
                                            "is_winner": is_win,
                                            "destination_info": {
                                                'slug': "UserProfile",
                                                'id': found.userid
                                            }
                                        }
                                    } else {
                                        var fog = {
                                            'column_one': test[i].column1,
                                            'column_two': test[i].column2,
                                            'column_three': test[i].column3,
                                            'column_four': "#" + count,
                                            "is_winner": is_winner,
                                            "destination_info": {
                                                'slug': "UserProfile",
                                                'id': test[i].userid
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
                                    details: testapi,
                                    trending_header: {
                                        header_one: "USER",
                                        header_two: "CONNECTIONS",
                                        header_three: "RANK"
                                    }
                                });


                            }).catch(err => {
                                console.log(err)
                                // var spliterror=err.message.split("_")
                                // if(spliterror[1].indexOf("id")>=0){
                                //  res.status(200).json({ 
                                //    status: 'Failed',
                                //    message: "Please provide correct userid"
                                //  });
                                // }
                                // else{
                                //  res.status(500).json({ 
                                //    status: 'Failed',
                                //    message: err.message
                                //  });
                                // }
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

router.post("/list_announcements", (req, res, next) => {

    var keyArray = ["userid", "iv_token", "clientid"];
    var key = Object.keys(req.body);

    if (keyArray.length == key.length && keyArray.every((v) => key.indexOf(v) >= 0)) {

        if (constants.AndriodClientId === req.body.clientid || constants.IosClientId === req.body.clientid) {

            authModel.find({ iv_token: req.body.iv_token })
                .exec()
                .then(details => {
                    if (details.length < 1) {
                        return res.status(200).json({
                            status: "Logout",
                            message: "You are logged in other device."
                        });
                    } else {
                        announcements.find({})
                            .sort({ created_at: -1 })
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

                                if (docs.length > 0) {
                                    var test = []
                                    docs.map(doc => {
                                        var foe = {
                                            'text': doc.ann_text,
                                            'image': constants.APIBASEURL + "uploads/announce.png"
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

                                } else {
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


router.post("/get_trending", (req, res, next) => {

    var keyArray = ["userid", "iv_token", "clientid"];
    var key = Object.keys(req.body);

    if (keyArray.length == key.length && keyArray.every((v) => key.indexOf(v) >= 0)) {

        if (constants.AndriodClientId === req.body.clientid || constants.IosClientId === req.body.clientid) {

            authModel.find({ iv_token: req.body.iv_token })
                .exec()
                .then(user => {
                    if (user.length < 1) {
                        return res.status(200).json({
                            status: "Logout",
                            message: "You are logged in other device."
                        });
                    } else {

                        var perPage = 50;
                        var page = 1
                        var skip = (perPage * page) - perPage;
                        var limit = skip + perPage;

                        var day23 = new Date()

                        day1 = day23.getDay()

                        if (day1 === 1) {
                            var day = day23.setDate(day23.getDate())
                        } else {
                            day2 = (day1 - 1)
                            var day = day23.setDate(day23.getDate() - day2)
                        }

                        day = new Date(day).setHours(7, 30, 0, 0) //17,30,0,0
                        console.log("today date " + new Date(day))
                        var last_wk = new Date(day)
                        var last_week = last_wk.setDate(last_wk.getDate() - 7) //+7
                        last_week = new Date(last_week).setHours(0, 0, 0, 0)
                        console.log("next week date " + new Date(last_week))

                        // challenges.find({'challenges_history.created_at':{$gte:new Date(last_week),$lte:new Date(day)}})
                        challenges.aggregate([
                                { $unwind: "$challenges_history" },
                                {
                                    $match: {
                                     //   $and: [{ "challenges_history.created_at": { $gte: new Date(day), $lte: new Date(last_week) } },
                                     $and: [{ "challenges_history.created_at": { $gte: new Date(last_week), $lte: new Date(day) } },
                                            { "challenges_history.amount": { $gte: 50 } }
                                        ]
                                    }
                                },
                                {
                                    $group: {
                                        _id: "$userid",
                                        challenges_history: { $addToSet: "$challenges_history" },
                                        count: { $sum: 1 }
                                    }
                                }
                            ])
                            .exec()
                            .then(docs => {
                                if (docs.length > 0) {

                                    User.populate(docs, { path: '_id' }, function(err, result) {
                                        userDetails.populate(result, { path: 'challenges_history.my_userid' }, function(err, dex) {

                                            var test = []
                                            dex.map(doc => {
                                                var challenges = doc.challenges_history
                                                var user_details = doc.challenges_history[0].my_userid
                                                var followers = user_details.followers.length
                                                var no_contacts = user_details.no_contacts

                                                var total_connections = followers + no_contacts

                                                //   console.log("followers "+followers)
                                                //   console.log("contacts "+no_contacts)
                                                var found_user = []
                                                var won_challenges = []

                                                if (challenges.length > 0) {
                                                    found_user = challenges.filter(o => o.user_views >= 0) //Math.floor(o.amount*4/5)
                                                    won_challenges = challenges.filter(o => o.user_views >= 0 && o.user_views > o.member_views) //Math.floor(o.amount*4/5)
                                                }
                                                if (found_user.length > 0) {
                                                    test.push({
                                                        'column1': constants.APIBASEURL + doc._id.profileimage,
                                                        'column2': doc._id.username,
                                                        'column3': found_user.length,
                                                        'won_challenges': won_challenges.length,
                                                        'total_connections': total_connections,
                                                        'userid': doc._id._id
                                                    })
                                                }
                                            })
                                            test.sort((a, b) => b.column3 - a.column3)

                                            var found = test.find(o => String(o.userid) === String(req.body.userid))
                                            var user_index = 0

                                            if (found != 'undefined') {
                                                user_index = test.indexOf(found)
                                            } else {
                                                user_index = -1
                                            }


                                            var is_win = false
                                            var count = 0

                                            if (user_index === 0) {
                                                is_win = false //true
                                            }

                                            if (user_index > 50) {
                                                test = test.slice(skip, limit)
                                            } else {
                                                //test.splice(user_index,1)
                                                test = test.slice(skip, limit)
                                            }

                                            var testapi = []
                                            var final_user = ""

                                            for (var i = 0; i < test.length; i++) {

                                                if (i != 0 && test[i].column3 === test[i - 1].column3) {
                                                    count = count
                                                } else {
                                                    count = count + 1
                                                }

                                                var is_winner = false

                                                if (count === 1) {
                                                    is_winner = false //true
                                                }

                                                if (i === user_index) {
                                                    final_user = {
                                                        'column_one': found.column1,
                                                        'column_two': found.column2,
                                                        'column_three': found.column3,
                                                        'column_four': "#" + count,
                                                        "is_winner": is_win,
                                                        "won_challenges": found.won_challenges,
                                                        'total_connections': found.total_connections,
                                                        "destination_info": {
                                                            'slug': "UserProfile",
                                                            'id': found.userid
                                                        }
                                                    }
                                                } else {
                                                    var fog = {
                                                        'column_one': test[i].column1,
                                                        'column_two': test[i].column2,
                                                        'column_three': test[i].column3,
                                                        'column_four': "#" + count,
                                                        "is_winner": is_winner,
                                                        "won_challenges": test[i].won_challenges,
                                                        'total_connections': test[i].total_connections,
                                                        "destination_info": {
                                                            'slug': "UserProfile",
                                                            'id': test[i].userid
                                                        }
                                                    }
                                                    testapi.push(fog)
                                                }
                                            }

                                            console.log(user_index)

                                            var test_user = []

                                            if (user_index === -1) {
                                                final_user = ""
                                            }

                                            if (final_user != "") {
                                                test_user.push(final_user)
                                            }

                                            console.log(test_user)

                                            if (test_user != []) {
                                                test_user = test_user.concat(testapi)
                                            } else {
                                                test_user = testapi
                                            }



                                            res.status(200).json({
                                                status: 'Ok',
                                                message: "Trending",
                                                details: test_user,
                                                trending_header: {
                                                    header_one: "USER",
                                                    header_two: "CHALLENGES",
                                                    header_three: "RANK"
                                                }
                                            });
                                        })
                                    })

                                } else {
                                    res.status(200).json({
                                        status: 'Ok',
                                        message: "Trending",
                                        details: [],
                                        trending_header: {
                                            header_one: "USER",
                                            header_two: "CHALLENGES",
                                            header_three: "RANK"
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


router.get("/get_trending_list", (req, res, next) => {


    userDetails.find({})
        .populate("userid")
        .exec()
        .then(data => {
            var test = []
            data.map(doc => {
                var followers = doc.followers.length
                var contacts = doc.no_contacts

                var connections = followers + contacts

                var profileimage = doc.userid.profileimage

                if (profileimage === null) {
                    profileimage = "uploads/userimage.png"
                }

                var foe = {
                    'column1': constants.APIBASEURL + profileimage,
                    'column2': doc.userid.username,
                    'column3': connections,
                    'column4': doc.userid.mobile,
                    'column5': doc.userid.email,
                    'userid': doc.userid._id
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

            for (var i = 0; i < test.length; i++) {

                if (i != 0 && test[i].column3 === test[i - 1].column3) {
                    count = count
                } else {
                    count = count + 1
                }

                var is_winner = false

                if (count === 1) {
                    is_winner = false //true
                }

                var fog = {
                    'userid': test[i].userid,
                    'username': test[i].column2,
                    'connections': test[i].column3,
                    'mobile': test[i].column4,
                    'email': test[i].column5,
                    'rank': "#" + count,
                    'profileimage': test[i].column1
                }
                testapi.push(fog)
            }


            var test_user = []

            test_user = testapi

            res.status(200).json({
                status: 'Ok',
                message: "Trending",
                details: test_user,
                trending_header: {
                    header_one: "USER",
                    header_two: "CONNECTIONS",
                    header_three: "RANK"
                }
            });


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

});


router.post("/get_trending_database", (req, res, next) => {

    var keyArray = ["userid", "iv_token", "clientid"];
    var key = Object.keys(req.body);

    if (keyArray.length == key.length && keyArray.every((v) => key.indexOf(v) >= 0)) {

        if (constants.AndriodClientId === req.body.clientid || constants.IosClientId === req.body.clientid) {

            authModel.find({ iv_token: req.body.iv_token })
                .exec()
                .then(user => {
                    if (user.length < 1) {
                        return res.status(200).json({
                            status: "Logout",
                            message: "You are logged in other device."
                        });
                    } else {

                        var perPage = 50;
                        var page = 1
                        var skip = (perPage * page) - perPage;
                        var limit = skip + perPage;

                        var day23 = new Date()

                        day1 = day23.getDay()

                        if (day1 === 1) {
                            var day = day23.setDate(day23.getDate())
                        } else {
                            day2 = (day1 - 1)
                            var day = day23.setDate(day23.getDate() - day2)
                        }

                        day = new Date(day).setHours(7, 30, 0, 0) //17,30,0,0
                        console.log("today date " + new Date(day))
                        var last_wk = new Date(day)
                        var last_week = last_wk.setDate(last_wk.getDate() - 8)
                        last_week = new Date(last_week).setHours(0, 0, 0, 0)
                        console.log("next week date " + new Date(last_week))

                        // challenges.find({'challenges_history.created_at':{$gte:new Date(last_week),$lte:new Date(day)}})
                        challenges.aggregate([
                                { $unwind: "$challenges_history" },
                                {
                                    $match: {
                                        $and: [{ "challenges_history.created_at": { $gte: new Date(last_week), $lte: new Date(day) } },
                                            { "challenges_history.amount": { $gte: 50 } }
                                        ]
                                    }
                                },
                                {
                                    $group: {
                                        _id: "$userid",
                                        challenges_history: { $addToSet: "$challenges_history" },
                                        count: { $sum: 1 }
                                    }
                                }
                            ])
                            .exec()
                            .then(docs => {
                                if (docs.length > 0) {

                                    User.populate(docs, { path: '_id' }, function(err, result) {
                                        userDetails.populate(result, { path: 'challenges_history.my_userid' }, function(err, dex) {

                                            var test = []
                                            dex.map(doc => {
                                                var challenges = doc.challenges_history
                                                var user_details = doc.challenges_history[0].my_userid
                                                var followers = user_details.followers.length
                                                var no_contacts = user_details.no_contacts

                                                var total_connections = followers + no_contacts

                                                //   console.log("followers "+followers)
                                                //   console.log("contacts "+no_contacts)
                                                var found_user = []
                                                var won_challenges = []

                                                if (challenges.length > 0) {
                                                    found_user = challenges.filter(o => o.user_views >= 0) //Math.floor(o.amount*4/5)
                                                    won_challenges = challenges.filter(o => o.user_views >= 0 && o.user_views > o.member_views) //Math.floor(o.amount*4/5)
                                                }
                                                if (found_user.length > 0) {
                                                    test.push({
                                                        'profileimage': constants.APIBASEURL + doc._id.profileimage,
                                                        'username': doc._id.username,
                                                        'connections': found_user.length,
                                                        'won': won_challenges.length,
                                                        'friends': total_connections,
                                                        'mobile': doc._id.mobile,
                                                        'email': doc._id.email,
                                                        'userid': doc._id._id
                                                    })
                                                }
                                            })

                                            //test.splice(user_index,1)
                                            test = test.slice(skip, limit)

                                            var count = 0
                                            var testapi = []
                                            var final_users = []
                                            var final_user = ""

                                            for (var i = 0; i < test.length; i++) {

                                                if (i != 0 && test[i].connections === test[i - 1].connections) {
                                                    count = count
                                                } else {
                                                    count = count + 1
                                                }

                                                var is_winner = false

                                                if (count === 1) {
                                                    is_winner = false //true
                                                } else {
                                                    var fog = {
                                                        'rank': count,
                                                        'profileimage': test[i].profileimage,
                                                        'username': test[i].username,
                                                        'connections': test[i].connections,
                                                        'won': test[i].won,
                                                        'friends': test[i].friends,
                                                        'mobile': test[i].mobile,
                                                        'email': test[i].email,
                                                        'userid': test[i].userid
                                                    }
                                                    testapi.push(fog)
                                                }
                                            }

                                            var trends = new trend({
                                                _id: new mongoose.Types.ObjectId(),
                                                contest_name:"Challenge contest week 1",
                                                constest_date:new Date(),
                                                details:testapi
                                            })
                                            trends.save()
                                                  .then(trend_list =>{
                                                     testapi.map(dex =>{
                                                        userDetails.findOneAndUpdate({userid:ObjectId(dex.userid)},
                                                                                      {$push:{
                                                                                        contests_won:{
                                                                                          contest_id:trend_list._id,
                                                                                          contest_name:trend_list.contest_name,
                                                                                          contest_date:new Date(),
                                                                                          rank:dex.rank,
                                                                                          has_contest_seen:false
                                                                                        }
                                                                                      }}).exec()
                                                    })

                                                  })

                                        })
                                    })

                                } else {
                                    res.status(200).json({
                                        status: 'Ok',
                                        message: "Trending",
                                        details: [],
                                        trending_header: {
                                            header_one: "USER",
                                            header_two: "CHALLENGES",
                                            header_three: "RANK"
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