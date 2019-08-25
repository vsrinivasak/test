const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const constants = require("../constants/constants");
const User = require("../models/user");
var moment = require('moment');
var async = require('async');
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
const challenges = require("../models/challenge");
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
const userTransactions = require("../models/user_transactions")
const wishlistOffers = require("../models/wishlist");
const primaryOfferLottery =  require("../models/primary_offer_lottery");


router.post("/follow_user", (req, res, next) => {

    var keyArray = ["userid", "iv_token", "clientid", "member_id", "status"];
    var key = Object.keys(req.body);

    if (keyArray.length == key.length && keyArray.every((v) => key.indexOf(v) >= 0)) {

        if (constants.AndriodClientId === req.body.clientid || constants.IosClientId === req.body.clientid) {

            authModel.find({ iv_token: req.body.iv_token })
                .exec()
                .then(user => {
                    if (user.length < 1) {
                        var response = {
                            status: "Logout",
                            message: "You are logged in other device."
                        }
                        var datenow = new Date()
                        var logfile = datenow + "\n" + response.status + "\n" + response.message

                        fs.writeFile("logfile.txt", logfile, function(err) {});
                        return res.status(200).json(response)
                        // status:"Logout",
                        // message:"You are logged in other device."
                        //});
                    } else {
                        console.log(req.body.status)
                        contactsModel.find({ userid: req.body.userid }, { 'existing_contacts': 1 })
                            .exec()
                            .then(docs => {
                                if (docs.length < 1) {
                                    return res.status(200).json({
                                        status: "Failed",
                                        message: "Please provide correct userid."
                                    });
                                } else {
                                    console.log(req.body.status)
                                    var is_following = false;

                                    if (docs[0].existing_contacts.length > 0) {
                                        var exe = docs[0].existing_contacts;
                                        var found = exe.find(ele => String(ele.contact) === String(req.body.member_id))

                                        if (typeof found === 'undefined') {
                                            is_following = false
                                        } else {
                                            is_following = true
                                        }
                                    } else {
                                        is_following = false;
                                    }
                                    if (is_following === false) {
                                        var users = [];
                                        users.push(ObjectId(req.body.userid));
                                        users.push(ObjectId(req.body.member_id))
                                        userDetails.find({ userid: { $in: users } })
                                            .populate('userid')
                                            .exec()
                                            .then(data => {
                                                var user_id = "";
                                                var msgbody = "";
                                                var following_id = "";
                                                var profileimage = ""
                                                var username = ""
                                                var followarray = [];
                                                data.map(doc => {
                                                    if (String(doc.userid._id) === String(req.body.userid)) {
                                                        user_id = doc._id
                                                        msgbody = doc.userid.username + " started following you."
                                                        profileimage = doc.userid.profileimage;
                                                        username = doc.userid.username;
                                                        if (doc.userid.profileimage === null) {
                                                            profileimage = constants.APIBASEURL + "uploads/userimage.png"
                                                        }
                                                        if (doc.following.length > 0) {
                                                            followarray = doc.following
                                                        }

                                                    } else {
                                                        following_id = doc._id
                                                    }
                                                    if (followarray.length > 0) {
                                                        followarray.every(function(ele) {
                                                            if (String(ele) === String(following_id)) {
                                                                is_following = true
                                                                return false
                                                            } else {
                                                                is_following = false
                                                                return true
                                                            }
                                                        })
                                                    } else {
                                                        is_following = false
                                                    }

                                                })
                                                if (req.body.status === false) {

                                                    if (is_following === false) {

                                                        userDetails.findOneAndUpdate({ userid: ObjectId(req.body.userid) }, {
                                                                $push: { following: ObjectId(following_id) },
                                                                $inc: { following_count: 1 }
                                                            })
                                                            .exec()
                                                            .then(result => {
                                                                userDetails.findOneAndUpdate({ userid: ObjectId(req.body.member_id) }, {
                                                                        $push: { followers: ObjectId(user_id) },
                                                                        $inc: { followers_count: 1 }
                                                                    })
                                                                    .exec()
                                                                    .then(results => {
                                                                        const note_no = Math.floor(10000000000 + Math.random() * 90000000000);
                                                                        notificationModel.findOneAndUpdate({ userid: ObjectId(req.body.member_id) }, {
                                                                                $push: {
                                                                                    notifications: {
                                                                                        notification_data: msgbody,
                                                                                        member_id: req.body.userid,
                                                                                        notification_type: 'UserProfile',
                                                                                        notification_number: note_no,
                                                                                        username: username,
                                                                                        item_id: req.body.userid,
                                                                                        profileimage: ObjectId(req.body.userid),
                                                                                        created_at: Date.now()
                                                                                    }
                                                                                }
                                                                            })
                                                                            .exec()
                                                                            .then(dosy => {
                                                                                if (dosy === null) {
                                                                                    return res.status(200).json({
                                                                                        status: "Failed",
                                                                                        message: "Please provide correct userid."
                                                                                    });
                                                                                } else {
                                                                                    fcmModel.find({ userid: req.body.member_id })
                                                                                        .exec()
                                                                                        .then(user => {
                                                                                            console.log(user)
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
                                                                                                        notification_slug: 'UserProfile',
                                                                                                        url: constants.APIBASEURL + profileimage,
                                                                                                        username: username,
                                                                                                        item_id: req.body.userid,

                                                                                                        userid: "",
                                                                                                        feed_id: "",
                                                                                                        member_feed_id: "",
                                                                                                        member_id: "",
                                                                                                        is_from_push: true
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
                                                                                                var is_err = false
                                                                                                fcm.send(message, function(err, response) {

                                                                                                });
                                                                                                res.status(200).json({
                                                                                                    status: 'Ok',
                                                                                                    message: "Followed successfully."
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
                                                                    }).catch(err => { //catch for userid update
                                                                        var spliterror = err.message.split("_")
                                                                        if (spliterror[1].indexOf("id") >= 0) {
                                                                            res.status(200).json({
                                                                                status: 'Failed',
                                                                                message: "Please provide correct following_userid"
                                                                            });
                                                                        } else {
                                                                            res.status(500).json({
                                                                                status: 'Failed',
                                                                                message: err.message
                                                                            });
                                                                        }
                                                                    });
                                                            }).catch(err => { //catch for userid update
                                                                var spliterror = err.message.split("_")
                                                                if (spliterror[1].indexOf("id") >= 0) {
                                                                    res.status(200).json({
                                                                        status: 'Failed',
                                                                        message: "Please provide correct following_userid"
                                                                    });
                                                                } else {
                                                                    res.status(500).json({
                                                                        status: 'Failed',
                                                                        message: err.message
                                                                    });
                                                                }
                                                            });
                                                    } else {
                                                        return res.status(200).json({
                                                            status: "Failed",
                                                            message: "You are already following this user."
                                                        });
                                                    }
                                                } else {
                                                    userDetails.findOneAndUpdate({ userid: ObjectId(req.body.userid) }, {
                                                            $pull: { following: ObjectId(following_id) },
                                                            $inc: { following_count: -1 }
                                                        })
                                                        .exec()
                                                        .then(result => {
                                                            userDetails.findOneAndUpdate({ userid: ObjectId(req.body.member_id) }, {
                                                                    $pull: { followers: ObjectId(user_id) },
                                                                    $inc: { followers_count: -1 }
                                                                })
                                                                .exec()
                                                                .then(result => {
                                                                    res.status(200).json({
                                                                        status: 'Ok',
                                                                        message: "Unfollowed successfully."
                                                                    });

                                                                }).catch(err => { //catch for userid update
                                                                    var spliterror = err.message.split("_")
                                                                    if (spliterror[1].indexOf("id") >= 0) {
                                                                        res.status(200).json({
                                                                            status: 'Failed',
                                                                            message: "Please provide correct member_id"
                                                                        });
                                                                    } else {
                                                                        res.status(500).json({
                                                                            status: 'Failed',
                                                                            message: err.message
                                                                        });
                                                                    }
                                                                });
                                                        }).catch(err => { //catch for userid update

                                                            var spliterror = err.message.split("_")
                                                            if (spliterror[1].indexOf("id") >= 0) {
                                                                res.status(200).json({
                                                                    status: 'Failed',
                                                                    message: "Please provide correct following_userid"
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
                                                    winston.error(err.stack)
                                                    res.status(500).json({
                                                        status: 'Failed',
                                                        message: err.message
                                                    });
                                                }
                                            });
                                    } else {
                                        return res.status(200).json({
                                            status: "Failed",
                                            message: "You are already following this user."
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


router.post("/get_following", (req, res, next) => {

    var keyArray = ["userid", "iv_token", "clientid", "page_no"];
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
                        var perPage = 100;
                        var page = req.body.page_no;

                        if (isEmpty(page)) {
                            page = 1
                        }
                        var skip = (perPage * page) - perPage;
                        var limit = skip + perPage;

                        contactsModel.distinct("existing_contacts.contact_details", { userid: ObjectId(req.body.userid) })
                            .exec()
                            .then(dex => {
                                userDetails.find({ userid: ObjectId(req.body.userid) })
                                    .populate({ path: 'following', populate: { path: 'userid' } })
                                    .exec()
                                    .then(data => {
                                        var test = [];
                                        if (data[0].following.length > 0) {
                                            var following = data[0].following
                                            var blocked = data[0].blocked
                                            count = 0
                                            following.map(doc => {
                                                var is_contact = false
                                                var found = blocked.find(o => String(o) === String(doc._id))

                                                if (typeof found === 'undefined') {
                                                    dex.every(function(ele) {
                                                        if (String(ele) === String(doc._id)) {
                                                            is_contact = true
                                                            return false
                                                        } else {
                                                            is_contact = false
                                                            return true
                                                        }

                                                    })
                                                    if (is_contact === false) {
                                                        var profileimage = doc.userid.profileimage;
                                                        if (doc.userid.profileimage === null) {
                                                            profileimage = "uploads/userimage.png"
                                                        }
                                                        var foe = {
                                                            'username': doc.userid.username,
                                                            'fullname': doc.userid.fullname,
                                                            'userid': doc.userid._id,
                                                            'profileimage': constants.APIBASEURL + profileimage,
                                                            'mobile': doc.userid.mobile,
                                                            'is_following': true
                                                        }
                                                        test.push(foe)
                                                    } else {
                                                        userDetails.findOneAndUpdate({ userid: ObjectId(req.body.userid) }, {
                                                                $pull: { following: ObjectId(doc._id) },
                                                                $inc: { following_count: -1 }
                                                            })
                                                            .exec()
                                                    }
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
                                            test = test.slice(skip, limit)

                                            res.status(200).json({
                                                status: 'Ok',
                                                message: "Following users",
                                                total_pages: Math.ceil(totalcount / perPage),
                                                current_page: page,
                                                total_contacts: totalcount,
                                                userid: req.body.userid,
                                                contacts: test
                                            });
                                        } else {
                                            res.status(200).json({
                                                status: 'Ok',
                                                message: "You are not following any user.",
                                                contacts: test
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

router.post("/get_followers", (req, res, next) => {

    var keyArray = ["userid", "iv_token", "clientid", "page_no"];
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
                        var perPage = 100;
                        var page = req.body.page_no;

                        if (isEmpty(page)) {
                            page = 1
                        }
                        var skip = (perPage * page) - perPage;
                        var limit = skip + perPage;

                        contactsModel.distinct("existing_contacts.contact_details", { userid: ObjectId(req.body.userid) })
                            .exec()
                            .then(dex => {

                                userDetails.find({ userid: ObjectId(req.body.userid) })
                                    .populate({ path: 'followers', populate: { path: 'userid' } })
                                    .exec()
                                    .then(data => {
                                        var test = [];
                                        if (data[0].followers.length > 0) {
                                            var followers = data[0].followers
                                            var following = data[0].following
                                            var blocked = data[0].blocked
                                            followers.map(doc => {
                                                var found = blocked.find(o => String(o) === String(doc._id))
                                                var is_contact = false
                                                if (typeof found === 'undefined') {
                                                    dex.every(function(ele) {
                                                        if (String(ele) === String(doc._id)) {
                                                            is_contact = true
                                                            return false
                                                        } else {
                                                            is_contact = false
                                                            return true
                                                        }

                                                    })
                                                    if (is_contact === false) {
                                                        var is_following = false;
                                                        var found = following.find(o => String(o) === String(doc._id))

                                                        if (typeof found === 'undefined') {
                                                            is_following = false
                                                        } else {
                                                            is_following = true
                                                        }

                                                        var profileimage = doc.userid.profileimage;
                                                        if (doc.userid.profileimage === null) {
                                                            profileimage = "uploads/userimage.png"
                                                        }
                                                        var foe = {
                                                            'username': doc.userid.username,
                                                            'fullname': doc.userid.fullname,
                                                            'userid': doc.userid._id,
                                                            'profileimage': constants.APIBASEURL + profileimage,
                                                            'mobile': doc.userid.mobile,
                                                            'is_following': is_following
                                                        }
                                                        test.push(foe)
                                                    } else {
                                                        userDetails.findOneAndUpdate({ userid: ObjectId(req.body.userid) }, {
                                                                $pull: { followers: ObjectId(doc._id) },
                                                                $inc: { followers_count: -1 }
                                                            })
                                                            .exec()

                                                    }
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
                                            test = test.slice(skip, limit)
                                            res.status(200).json({
                                                status: 'Ok',
                                                message: "Followers",
                                                total_pages: Math.ceil(totalcount / perPage),
                                                current_page: page,
                                                total_contacts: totalcount,
                                                userid: req.body.userid,
                                                contacts: test
                                            });
                                        } else {
                                            res.status(200).json({
                                                status: 'Ok',
                                                message: "No user is following you.",
                                                contacts: test
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

router.post("/block_user", (req, res, next) => {

    var keyArray = ["userid", "iv_token", "clientid", "member_id"];
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
                        userDetails.find({ userid: { $in: [ObjectId(req.body.userid), ObjectId(req.body.member_id)] } })
                            .exec()
                            .then(data => {
                                var member_id = ""
                                var userid = ""
                                var blocked = []
                                var is_blocked = false
                                if (String(data[0].userid) === String(req.body.userid)) {
                                    userid = data[0]._id
                                    member_id = data[1]._id
                                    blocked = data[0].blocked

                                } else {
                                    userid = data[1]._id
                                    blocked = data[1].blocked
                                    member_id = data[0]._id
                                }

                                if (blocked.length > 0) {
                                    var found = blocked.find(o => String(o) === String(member_id))
                                    if (typeof found === 'undefined') {
                                        is_blocked = false
                                    } else {
                                        is_blocked = true
                                    }
                                }

                                if (is_blocked === false) {
                                    userDetails.findOneAndUpdate({ userid: ObjectId(req.body.userid) }, {
                                            $push: { blocked: ObjectId(member_id), user_blocked: ObjectId(member_id) },
                                            $inc: { blocked_count: 1 }
                                        })
                                        .exec()
                                        .then(result2 => {
                                            userDetails.findOneAndUpdate({ userid: ObjectId(req.body.member_id) }, {
                                                    $push: { blocked: ObjectId(userid) },
                                                    $inc: { blocked_count: 1 }
                                                })
                                                .exec()
                                                .then(result3 => {


                                                    if (result2 === null || result3 === null) {
                                                        res.status(200).json({
                                                            status: 'Failed',
                                                            message: "Error Blocking the user"
                                                        });
                                                    } else {
                                                        contactsModel.findOneAndUpdate({ userid: ObjectId(req.body.userid) }, {
                                                                $push: { blocked: ObjectId(req.body.member_id) }
                                                            })
                                                            .exec()
                                                            .then(result1 => {
                                                                contactsModel.findOneAndUpdate({ userid: ObjectId(req.body.member_id) }, {
                                                                        $push: { blocked: ObjectId(req.body.userid) }
                                                                    })
                                                                    .exec()
                                                                    .then(result => {

                                                                        if (result === null || result1 === null) {
                                                                            res.status(200).json({
                                                                                status: 'Failed',
                                                                                message: "Error Blocking the user"
                                                                            });
                                                                        } else {
                                                                            res.status(200).json({
                                                                                status: 'Ok',
                                                                                message: "Blocked the user."
                                                                            });
                                                                        }
                                                                    }).catch(err => { //catch for userid update
                                                                        var spliterror = err.message.split("_")
                                                                        if (spliterror[1].indexOf("id") >= 0) {
                                                                            res.status(200).json({
                                                                                status: 'Failed',
                                                                                message: "Please provide correct member_id"
                                                                            });
                                                                        } else {
                                                                            res.status(500).json({
                                                                                status: 'Failed',
                                                                                message: err.message
                                                                            });
                                                                        }
                                                                    });
                                                            }).catch(err => { //catch for userid update
                                                                var spliterror = err.message.split("_")
                                                                if (spliterror[1].indexOf("id") >= 0) {
                                                                    res.status(200).json({
                                                                        status: 'Failed',
                                                                        message: "Please provide correct member_id"
                                                                    });
                                                                } else {
                                                                    res.status(500).json({
                                                                        status: 'Failed',
                                                                        message: err.message
                                                                    });
                                                                }
                                                            });
                                                    }
                                                }).catch(err => { //catch for userid update
                                                    var spliterror = err.message.split("_")
                                                    if (spliterror[1].indexOf("id") >= 0) {
                                                        res.status(200).json({
                                                            status: 'Failed',
                                                            message: "Please provide correct member_id"
                                                        });
                                                    } else {
                                                        res.status(500).json({
                                                            status: 'Failed',
                                                            message: err.message
                                                        });
                                                    }
                                                });
                                        }).catch(err => { //catch for userid update
                                            var spliterror = err.message.split("_")
                                            if (spliterror[1].indexOf("id") >= 0) {
                                                res.status(200).json({
                                                    status: 'Failed',
                                                    message: "Please provide correct member_id"
                                                });
                                            } else {
                                                res.status(500).json({
                                                    status: 'Failed',
                                                    message: err.message
                                                });
                                            }
                                        });
                                } else {
                                    res.status(200).json({
                                        status: 'Failed',
                                        message: "You have already blocked this user."
                                    });
                                }

                            }).catch(err => {
                                var spliterror = err.message.split("_")
                                if (spliterror[1].indexOf("id") >= 0) {
                                    res.status(200).json({
                                        status: 'Failed',
                                        message: "Please provide correct member_id"
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


router.post("/unblock_user", (req, res, next) => {

    var keyArray = ["userid", "iv_token", "clientid", "member_id"];
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
                        userDetails.find({ userid: { $in: [ObjectId(req.body.userid), ObjectId(req.body.member_id)] } })
                            .exec()
                            .then(data => {
                                var member_id = ""
                                var userid = ""
                                var blocked = []
                                var is_blocked = false
                                if (String(data[0].userid) === String(req.body.userid)) {
                                    userid = data[0]._id
                                    member_id = data[1]._id
                                    user_category = data[0].category_type
                                    member_category = data[1].category_type
                                } else {
                                    userid = data[1]._id
                                    member_id = data[0]._id
                                    user_category = data[1].category_type
                                    member_category = data[0].category_type
                                }

                                userDetails.findOneAndUpdate({ userid: ObjectId(req.body.userid) }, {
                                        $pull: { blocked: ObjectId(member_id), user_blocked: ObjectId(member_id) },
                                        $inc: { blocked_count: -1 }
                                    })
                                    .exec()
                                    .then(result => {
                                        userDetails.findOneAndUpdate({ userid: ObjectId(req.body.member_id) }, {
                                                $pull: { blocked: ObjectId(userid) },
                                                $inc: { blocked_count: -1 }
                                            })
                                            .exec()
                                            .then(result2 => {


                                                if (result === null || result2 === null) {
                                                    res.status(200).json({
                                                        status: 'Failed',
                                                        message: "Error Unblocking the user"
                                                    });
                                                } else {
                                                    contactsModel.findOneAndUpdate({ userid: ObjectId(req.body.userid) }, {
                                                            $pull: { blocked: ObjectId(req.body.member_id) }
                                                        })
                                                        .exec()
                                                        .then(result1 => {
                                                            contactsModel.findOneAndUpdate({ userid: ObjectId(req.body.member_id) }, {
                                                                    $pull: { blocked: ObjectId(req.body.userid) }
                                                                })
                                                                .exec()
                                                                .then(result1 => {

                                                                    if (result1 === null) {
                                                                        res.status(200).json({
                                                                            status: 'Failed',
                                                                            message: "Error Unblocking the user"
                                                                        });
                                                                    } else {
                                                                        res.status(200).json({
                                                                            status: 'Ok',
                                                                            message: "Unblocked the user."
                                                                        });
                                                                    }
                                                                }).catch(err => { //catch for userid update
                                                                    var spliterror = err.message.split("_")
                                                                    if (spliterror[1].indexOf("id") >= 0) {
                                                                        res.status(200).json({
                                                                            status: 'Failed',
                                                                            message: "Please provide correct member_id"
                                                                        });
                                                                    } else {
                                                                        res.status(500).json({
                                                                            status: 'Failed',
                                                                            message: err.message
                                                                        });
                                                                    }
                                                                });
                                                        }).catch(err => { //catch for userid update
                                                            var spliterror = err.message.split("_")
                                                            if (spliterror[1].indexOf("id") >= 0) {
                                                                res.status(200).json({
                                                                    status: 'Failed',
                                                                    message: "Please provide correct member_id"
                                                                });
                                                            } else {
                                                                res.status(500).json({
                                                                    status: 'Failed',
                                                                    message: err.message
                                                                });
                                                            }
                                                        });
                                                }
                                            }).catch(err => { //catch for userid update
                                                var spliterror = err.message.split("_")
                                                if (spliterror[1].indexOf("id") >= 0) {
                                                    res.status(200).json({
                                                        status: 'Failed',
                                                        message: "Please provide correct member_id"
                                                    });
                                                } else {
                                                    res.status(500).json({
                                                        status: 'Failed',
                                                        message: err.message
                                                    });
                                                }
                                            });

                                    }).catch(err => { //catch for userid update
                                        var spliterror = err.message.split("_")
                                        if (spliterror[1].indexOf("id") >= 0) {
                                            res.status(200).json({
                                                status: 'Failed',
                                                message: "Please provide correct member_id"
                                            });
                                        } else {
                                            res.status(500).json({
                                                status: 'Failed',
                                                message: err.message
                                            });
                                        }
                                    });

                            }).catch(err => {
                                var spliterror = err.message.split("_")
                                if (spliterror[1].indexOf("id") >= 0) {
                                    res.status(200).json({
                                        status: 'Failed',
                                        message: "Please provide correct member_id"
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

router.post("/get_blocked_contacts", (req, res, next) => {

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

                        userDetails.find({ userid: ObjectId(req.body.userid) })
                            .populate({ path: 'user_blocked', populate: { path: 'userid' } })
                            .exec()
                            .then(data => {
                                var test = [];
                                if (data[0].user_blocked.length > 0) {
                                    var blocked = data[0].user_blocked
                                    blocked.map(doc => {
                                        var profileimage = doc.userid.profileimage;
                                        if (doc.userid.profileimage === null) {
                                            profileimage = "uploads/userimage.png"
                                        }
                                        var foe = {
                                            'username': doc.userid.username,
                                            'fullname': doc.userid.fullname,
                                            'userid': doc.userid._id,
                                            'profileimage': constants.APIBASEURL + profileimage,
                                            'mobile': doc.userid.mobile
                                        }
                                        test.push(foe)
                                    })
                                    const totalcount = data[0].blocked_count;
                                    res.status(200).json({
                                        status: 'Ok',
                                        message: "Blocked contacts",
                                        userid: req.body.userid,
                                        contacts: test
                                    });
                                } else {
                                    res.status(200).json({
                                        status: 'Ok',
                                        message: "No users were blocked.",
                                        contacts: test
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


router.post("/redirection", (req, res, next) => {

    res.redirect(307, 'http://bizzgear.com/user/username')

});


router.get("/user_category_cronjob", (req, res, next) => {

    var day23 = new Date()

    var day = day23.setDate(day23.getDate())

    day = new Date(day).setHours(0, 0, 0, 0)
    console.log("today date " + new Date(day))
    var last_wk = new Date(day)
    var last_week = last_wk.setDate(last_wk.getDate() - 7)
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
                var test_supernova = []
                var test_stellar = []

                docs.map(doc => {
                    var challenges = doc.challenges_history
                    var found_user = []

                    if (challenges.length > 0) {
                        found_user = challenges.filter(o => o.user_views >= o.member_views)
                    }

                    if (found_user.length > 0 && found_user.length >= 5) {
                        test_supernova.push(ObjectId(doc._id))
                    } else {
                        test_stellar.push(ObjectId(doc._id))
                    }
                })

                userDetails.updateMany({ userid: { $in: test_supernova } }, { $set: { category_type: "Supernova" } }).exec()
                userDetails.updateMany({ userid: { $in: test_stellar } }, { $set: { category_type: "Stellar" } }).exec()

                console.log("done with category")

            }
        })
})


router.get("/user_category_cronjob_feeds", (req, res, next) => {
    User.find({})
        .exec()
        .then(docs => {
            docs.map(data => {
                var date = new Date()
                var dates = new Date()
                var dated = new Date(date.setDate(date.getDate() - 7));
                iv_feeds.find({ iv_acountid: ObjectId(data._id), feed_post_create: { '$gte': dated, '$lte': dates } })
                    .exec()
                    .then(dex => {
                        var count = 0
                        if (dex.length >= 10) {
                            dex.map(foe => {
                                if (foe.no_views >= 70 && parseInt(foe.feed_rating) >= 4) {
                                    count += 1
                                }
                            })

                            if (count >= 10) {
                                userDetails.findOneAndUpdate({ userid: ObjectId(data._id) }, { $set: { category_type: "Supernova" } }, { new: true })
                                    .exec()
                                    .then(dot => {
                                        //console.log(dot)
                                    })

                            } else {
                                userDetails.findOneAndUpdate({ userid: ObjectId(data._id) }, { $set: { category_type: "Stellar" } }, { new: true })
                                    .exec()
                                    .then(dot => {
                                        //console.log(dot)
                                    })
                            }
                        } else {
                            userDetails.findOneAndUpdate({ userid: ObjectId(data._id) }, { $set: { category_type: "Stellar" } }, { new: true })
                                .exec()
                                .then(dot => {
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
            var spliterror = err.message.split(":")
            res.status(500).json({
                status: 'Failed',
                message: spliterror[0]
            });
        });
})

router.get("/user_category_contacts_cronjob", (req, res, next) => {
    contactsModel.find({}, { userid: 1, existing_contacts: 1 })
        .populate('existing_contacts.contact_details')
        .exec()
        .then(docs => {
            docs.map(data => {
                var contacts = data.existing_contacts
                contacts.map(dex => {
                    var userdetails = dex.contact_details
                    var userid = userdetails._id
                    var category = userdetails.category_type
                    contactsModel.updateMany({ 'existing_contacts.contact_details': userid }, { $set: { 'existing_contacts.$.user_category': category } })
                        .exec()
                        .then(dot => {
                            //  console.log(dot)

                        })
                })

            })
            console.log("done with contact category sync")
        }).catch(err => {
            var spliterror = err.message.split(":")
            res.status(500).json({
                status: 'Failed',
                message: spliterror[0]
            });
        });
})

router.get("/user_contacts_cronjob", (req, res, next) => {
    User.find({})
        .exec()
        .then(docs => {
            docs.forEach(function(data) {
                contactsModel.aggregate([{ $match: { userid: ObjectId(data._id) } },
                        {
                            $project: {
                                blocked: '$blocked',
                                existing_contacts: '$existing_contacts.contact_details'
                            }
                        }
                    ])
                    .exec()
                    .then(dex => {

                        var no_contacts = 0
                        if (dex.length > 0) {

                            userDetails.find({ $and: [{ userid: { $nin: dex[0].blocked } }, { _id: { $in: dex[0].existing_contacts } }] })
                                .exec()
                                .then(rec => {

                                    no_contacts = rec.length

                                    userDetails.findOneAndUpdate({ userid: ObjectId(data._id) }, { $set: { no_contacts: no_contacts } })
                                        .exec()
                                })

                        }

                    }).catch(err => {
                        var spliterror = err.message.split(":")
                        res.status(500).json({
                            status: 'Failed',
                            message: spliterror[0]
                        });
                    });

            })
            console.log("done with contact sync")
        }).catch(err => {
            var spliterror = err.message.split(":")
            res.status(500).json({
                status: 'Failed',
                message: spliterror[0]
            });
        });
})

router.get("/update_contacts_server", (req, res, next) => {

    User.find({})
        .exec()
        .then(data => {

            data.map(dex => {
                contactsModel.find({ userid: ObjectId(dex._id) }, {
                        'new_contacts': 1,
                        'existing_contacts': 1,
                        'userid': 1
                    })
                    .exec()
                    .then(docs => {
                        if (docs.length > 0) {
                            docs.map(doc => {
                                var userid = doc.userid
                                var contacts = doc.new_contacts
                                var contact_list = []
                                var exe_contacts = doc.existing_contacts

                                contacts.map(data => {
                                    //console.log()
                                    contact_mobile = String(data.mobile).replace(/\s/g, "")
                                    contact_mobile = contact_mobile.replace(/-/g, "")
                                    contact_mobile = contact_mobile.replace(/ /g, "")
                                    contact_mobile = contact_mobile.replace(/[`~!@#$%^&*()_|\-=?;:'",.<>\{\}\[\]\\\/]/gi, '')
                                    if (contact_mobile.length > 10) {

                                        if (contact_mobile.substring(0, 1) === '0') {
                                            contact_mobile = contact_mobile.substring(1)
                                            //console.log(contact_mobile)
                                        } else if (contact_mobile.substring(0, 1) === '+') {

                                            contact_mobile = contact_mobile.substring(3)
                                            //console.log(contact_mobile)
                                        } else {

                                            if (contact_mobile.substring(0, 2) === '91') {

                                                contact_mobile = contact_mobile.substring(2)
                                                //console.log(contact_mobile)
                                            }
                                        }
                                    }
                                    contact_list.push(contact_mobile)
                                })


                                if (doc.new_contacts.length > 0) {

                                    User.find({ mobile: { $in: contact_list } })
                                        .exec()
                                        .then(dex => {
                                            var existing_contacts = []
                                            var delete_contacts = []
                                            if (dex.length > 0) {
                                                //console.log(dex)
                                                dex.map(dog => {
                                                    //  console.log(dog.username + " "+dog._id )
                                                    existing_contacts.push(ObjectId(dog._id))
                                                    delete_contacts.push(dog.mobile)
                                                })

                                                userDetails.find({ userid: { $in: existing_contacts } })
                                                    .exec()
                                                    .then(result => {
                                                        if (result.length > 0) {

                                                            var fig = []

                                                            result.map(fox => {

                                                                var found = exe_contacts.find(o => String(o.contact) === String(fox.userid))

                                                                //console.log(found)

                                                                if (typeof found === 'undefined' && String(fox.userid) != String(userid)) {
                                                                    //console.log(found)
                                                                    var fur = {
                                                                        'contact': ObjectId(fox.userid),
                                                                        'contact_details': ObjectId(fox._id),
                                                                        'user_category': fox.category_type,
                                                                        'status': "",
                                                                        'contact_id': fox.contact_id
                                                                    }
                                                                    fig.push(fur)
                                                                }
                                                            })

                                                            //console.log(fig)
                                                            contactsModel.findOneAndUpdate({ userid: ObjectId(dex._id) }, {
                                                                    $push: { existing_contacts: { $each: fig } }
                                                                })
                                                                .exec()
                                                        }
                                                    }).catch(err => {
                                                        console.log(err)
                                                    });
                                            }
                                        }).catch(err => {
                                            //  console.log(err)
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

            authModel.find({ iv_token: req.body.iv_token })
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
                            }, { talent_points: 1, view_points: 1, userid: 1 })
                            .populate('userid')
                            .exec()
                            .then(user_result => {

                                if (user_result[0].userid.mobile_verified == 'true') {

                                    feeds.find({
                                            _id: ObjectId(req.body.feed_id)
                                        }, { _id: 1, iv_acountid: 1, feed_desc: 1, feed_type: 1 })
                                        .populate('iv_acountid')
                                        .exec()
                                        .then(feed_result => {
                                            var remaining_points = 0;
                                            var amount = 1
                                            var talent_points = user_result[0].talent_points;
                                            var view_points = user_result[0].view_points;
                                            var enough_coins = true;
                                            var user_condition = "";
                                            var mode = ""
                                            var username = user_result[0].userid.username;
                                            var membername = feed_result[0].iv_acountid.username
                                            var feed_desc = "";
                                            var msgbody = username + " gifted a point for your post"
                                            var profileimage = user_result[0].userid.profileimage;

                                            if (talent_points >= amount) {
                                                user_condition = { $inc: { talent_points: -amount } }
                                                mode = "talent"
                                            } else if (view_points >= amount) {
                                                user_condition = { $inc: { view_points: -amount } }
                                                mode = "view"
                                            } else {
                                                enough_coins = false
                                            }

                                            if (enough_coins === false) {
                                                return res.status(200).json({
                                                    status: "Failed",
                                                    message: "Insufficient points in your account to donate."
                                                });
                                            } else {
                                                userDetails.findOneAndUpdate({ userid: ObjectId(req.body.userid) }, user_condition, { new: true })
                                                    .exec()
                                                    .then(decremented_user_doc => {

                                                        var day = new Date()
                                                        day = day.toISOString()
                                                        day = String(day).split("T")
                                                        day = day[0].replace(/-/g, "")
                                                        const transaction_id = day + Math.floor(10000000000 + Math.random() * 90000000000);

                                                        userTransactions.findOneAndUpdate({ userid: ObjectId(req.body.userid) }, {
                                                                $push: {
                                                                    transactions: {
                                                                        date_of_transaction: Date.now(),
                                                                        amount: amount,
                                                                        mode: mode,
                                                                        transaction_type: "debit",
                                                                        action: "gift_points",
                                                                        message: "You have gifted a " + mode + " point to " + membername,
                                                                        transaction_id: transaction_id
                                                                    }
                                                                }
                                                            }, { upsert: true })
                                                            .exec()
                                                            .then(dex => {


                                                                userDetails.findOneAndUpdate({ userid: ObjectId(feed_result[0].iv_acountid._id) }, { $inc: { talent_points: amount } }, { new: true })
                                                                    .exec()
                                                                    .then(incremented_user_doc => {

                                                                        userTransactions.findOneAndUpdate({ userid: ObjectId(feed_result[0].iv_acountid._id) }, {
                                                                                $push: {
                                                                                    transactions: {
                                                                                        date_of_transaction: Date.now(),
                                                                                        amount: amount,
                                                                                        mode: "talent_points",
                                                                                        transaction_type: "credit",
                                                                                        action: "gift_points",
                                                                                        message: username + " gifted a talent point for your post",
                                                                                        transaction_id: transaction_id
                                                                                    }
                                                                                }
                                                                            }, { upsert: true })
                                                                            .exec()
                                                                            .then(dexs => {
                                                                                if (profileimage === null) {
                                                                                    profileimage = 'uploads/userimage.png'
                                                                                }
                                                                                const note_no = Math.floor(10000000000 + Math.random() * 90000000000);
                                                                                notificationModel.findOneAndUpdate({ userid: ObjectId(feed_result[0].iv_acountid._id) }, {
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
                                                                                            // return res.status(200).json({
                                                                                            //     status: "Failed",
                                                                                            //     message: "Please provide correct member_id."
                                                                                            // });
                                                                                        } else {
                                                                                            fcmModel.find({ userid: feed_result[0].iv_acountid._id })
                                                                                                .exec()
                                                                                                .then(user => {
                                                                                                    //console.log(user)
                                                                                                    if (user.length < 1) {
                                                                                                        // return res.status(200).json({
                                                                                                        //     status: "Failed",
                                                                                                        //     message: "Please provide correct member_id."
                                                                                                        // });
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
                                                                                                        fcm.send(message, function(err, response) {

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

                                                                    }).catch(err => {
                                                                        console.log("ch1", err);
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
                                            }
                                        }).catch(err => { // var spliterror = err.message.split("_")
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
                                } else {
                                    res.status(200).json({
                                        status: 'Verification',
                                        message: "Please verify your mobile number for donations."
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


router.post("/get_wallet_activity", (req, res, next) => {

    var keyArray = ["userid", "iv_token", "clientid", "page_no"];
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
                        var perPage = 20;
                        var page = req.body.page_no;

                        if (isEmpty(page)) {
                            page = 1
                        }
                        var skip = (perPage * page) - perPage;
                        var limit = skip + perPage;

                        userDetails.find({ userid: ObjectId(req.body.userid) })
                            .exec()
                            .then(dex => {

                                var view_points = dex[0].view_points
                                var talent_points = dex[0].talent_points

                                userTransactions.find({ userid: ObjectId(req.body.userid) })
                                  //  .sort({'transactions.date_of_transaction'})
                                    .exec()
                                    .then(data => {
                                        if (data.length > 0) {

                                            var test = []
                                            var transactions = data[0].transactions
                                            const count = transactions.length

                                            transactions.sort(function(a, b) {
                                                return new Date(b.date_of_transaction) - new Date(a.date_of_transaction);
                                            });

                                          //  if (transactions.length > perPage) {
                                               
                                                transactions =transactions.slice(skip, limit);
                                                 console.log("transaction_length------ "+transactions.length)
                                        //    }



                                            transactions.map(doc => {

                                                var transaction_type = 0

                                                if (doc.transaction_type === 'credit') {
                                                    transaction_type = 1
                                                } else {
                                                    transaction_type = 0
                                                }

                                                var date_redeem = new Date(doc.date_of_transaction)
                                                var redeem_date = date_redeem.getDate()
                                                var redeem_month = date_redeem.getMonth() + 1
                                                var redeem_year = date_redeem.getFullYear()


                                                if (parseInt(redeem_date) < 10) {
                                                    redeem_date = "0" + redeem_date
                                                }
                                                if (parseInt(redeem_month) < 10) {
                                                    redeem_month = "0" + redeem_month
                                                }

                                                var redeem = redeem_date + "/" + redeem_month + "/" + redeem_year

                                                var foe = {
                                                    'amount': doc.amount,
                                                    'transaction_type': transaction_type,
                                                    'message': doc.message + " on " + redeem
                                                }

                                                test.push(foe)
                                            })

                                            console.log(talent_points)
                                            console.log(view_points)

                                            res.status(200).json({
                                                status: 'Ok',
                                                message: "Wallet activity.",
                                                total_pages: Math.ceil(count / perPage),
                                                current_page: page,
                                                total_activities: count,
                                                view_points: view_points,
                                                talent_points: talent_points,
                                                wallet_activities: test
                                            });
                                        } else {
                                            res.status(200).json({
                                                status: 'Ok',
                                                message: "No activity yet !!",
                                                total_pages: 1,
                                                current_page: page,
                                                total_activities: 0,
                                                view_points: view_points,
                                                talent_points: talent_points,
                                                wallet_activities: []
                                            });
                                        }
                                    }).catch(err => {
                                        var spliterror = err.message.split(":")
                                        res.status(500).json({
                                            status: 'Failed',
                                            message: spliterror[0]
                                        });
                                    });
                            }).catch(err => {
                                var spliterror = err.message.split(":")
                                res.status(500).json({
                                    status: 'Failed',
                                    message: spliterror[0]
                                });
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


router.post("/get_app_data_dynamic", (req, res, next) => {

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

                        userDetails.find({ userid: ObjectId(req.body.userid) })
                            .populate('offer_details.offer offer_details.primary_offer offers_history.offer offers_history.primary_offer bus_id userid')
                            .sort({'contests_won.contest_date':-1})
                            .exec()
                            .then(data => {

                                            var offer_history = data[0].offers_history
                                            var contest_data = data[0].contests_won
                                            var contest_seen_on = data[0].contest_seen_on
                                            var contest_date_query = ""
                                            var contest = []

                                            if(contest_data.length > 0){
                                                if(contest_seen_on === null){
                                                    contest.push(contest_data[0])
                                                }
                                                else{
                                                    var con_seen = new Date(data[0].contest_seen_on)
                                                    var con_filter = contest_data.filter(o => o.contest_date >= con_seen)

                                                    con_filter.sort(function(a, b){return b.contest_date - a.contest_date});

                                                    if(con_filter.length > 0 && con_filter[0].has_contest_seen === false){
                                                        contest.push(con_filter[0])
                                                    }
                                                    
                                                }
                                            }

                                            var active_offers_user = data[0].offer_details
                                            var lotter_offer = []
                                            var user_details = []
                                            var offer_details = []
                                            var category_type = data[0].category_type;
                                            var has_shown_offer = data[0].has_shown_offer;
                                            var offer_seen = data[0].offer_seen
                                            var required_app_update = false;
                                            var announcement_details = {}
                                            var notification_count = 0
                                            var signup_video_url = "" //constants.APIBASEURL+"uploads/fvmegearad1.mp4"
                                            var app_usage_video_url = "" //constants.APIBASEURL+"uploads/fvmegearad2.mp4"
                                            var emailcheck = "";
                                            var has_email_verified = false
                                            var email = data[0].userid.email_verified
                                            var has_primary_offer = false
                                            console.log("email " + email)

                                            if (email === 0) {
                                                has_email_verified = false
                                            } else {
                                                has_email_verified = true
                                            }

                                            var primary_found = active_offers_user.find(o => o.is_primary_offer === true)

                                            if (typeof primary_found != 'undefined') {
                                                has_primary_offer = true
                                            }

                                            console.log("Primary offer selected ----- " + has_primary_offer)

                                            var challenge_details_screen = data[0].showcase_details.challenge_details
                                            var profile_screen = data[0].showcase_details.profile
                                            var offer_details_screen = data[0].showcase_details.offer_details
                                            var full_video_screen = data[0].showcase_details.feed_details
                                            var challenge_list_activites_screen = data[0].showcase_details.challenge_tab
                                            var active_offers_tab_screen = data[0].showcase_details.offers
                                            var fab_menu_screen = data[0].showcase_details.fab
                                            var feed_list_screen = data[0].showcase_details.home


                                            console.log("email verified " + has_email_verified)


                                            if (data[0].userid.mobile_verified === 'true') {

                                                emailcheck = true;
                                            } else {
                                                emailcheck = false
                                            }

                                            var announcement_seen_on = data[0].announcement_seen_on
                                            var Query = ""

                                            if (announcement_seen_on === null) {
                                                Query = {}
                                            } else {
                                                announcement_seen_on = new Date(announcement_seen_on)
                                                Query = { created_at: { $gte: announcement_seen_on } }
                                            }

                                            // notificationModel.update(
                                            // {$and: [{$and: [{ "notifications.notification_type": 'feed_details' }, {
                                            //                    "notifications.notification_data": {
                                            //                             $regex: "new feed",
                                            //                             '$options': 'i'
                                            //                         }
                                            //         }]}, {userid: ObjectId(req.body.userid)}]},
                                            // {"$set": {"notifications.$[elem].view_status": true}},
                                            // {
                                            //     "arrayFilters": [{$and: [{'elem.notification_type': 'feed_details'}, {
                                            //                    "elem.notification_data": {
                                            //                             $regex: "new feed",
                                            //                             '$options': 'i'
                                            //                         }
                                            //         }]}],
                                            //     "multi": true
                                            // })
                                            // .exec()
                                            // .then(dax =>{
                                            //     console.log("nptificatiob changes"+dax)
                                            // })

                                            announcements.find(Query)
                                                .sort({ created_at: -1 })
                                                .exec()
                                                .then(dex => {

                                                    var announcement_count = dex.length
                                                    var has_shown_announcements = true

                                                    if (announcement_count > 0) {
                                                        userDetails.findOneAndUpdate({ userid: ObjectId(req.body.userid) }, { $set: { has_shown_announcements: false } })
                                                            .exec()
                                                        has_shown_announcements = false
                                                    } else {
                                                        has_shown_announcements = true
                                                    }

                                                    if (has_shown_announcements === true) {
                                                        announcement_count = 0
                                                    }

                                                    if (dex.length > 0) {
                                                        announcement_details = {
                                                            text: dex[0].ann_text,
                                                            slug: "announcements_tab",
                                                        }
                                                    } else {
                                                        announcement_details = {}
                                                    }

                                                    var offers_notifications = []

                                                    notificationModel.aggregate([
                                                            { $match: { userid: ObjectId(req.body.userid) } },
                                                            { $unwind: "$notifications" },
                                                            {
                                                                $match: {
                                                                    $and: [{ $or: [{ "notifications.notification_type": 'OfferGroup' }, { "notifications.notification_type": 'CreateOfferGroup' }] },
                                                                        { "notifications.view_status": false }
                                                                    ]
                                                                }
                                                            },
                                                            {
                                                                $group: {
                                                                    _id: "$userid",
                                                                    notifications: { $addToSet: "$notifications" },
                                                                    count: { $sum: 1 }
                                                                }
                                                            }
                                                        ])
                                                        .exec()
                                                        .then(datas => {

                                                            if (datas.length < 1) {

                                                            } else {
                                                                var notes = datas[0].notifications;
                                                                var test_offer = [];
                                                                notificationModel.populate(datas, { path: 'notifications.profileimage notifications.member_profile' }, function(err, notifis) {

                                                                    if (err) {
                                                                        test_offer = []
                                                                    } else {

                                                                        var notify = notifis[0].notifications;

                                                                        notify.sort(function(a, b) {
                                                                            return new Date(b.created_at) - new Date(a.created_at);
                                                                        });

                                                                        var count = notify.length
                                                                        var notifix = notify.slice(0, 5);

                                                                        notifix.map(doc => {
                                                                            var date = new Date()
                                                                            var date1 = date.setTime(date.getTime());
                                                                            var dateNow = new Date(date1).toISOString();
                                                                            var time = Date.parse(dateNow) - Date.parse(doc.created_at);
                                                                            var seconds1 = Math.floor((time / 1000) % 60);
                                                                            var minutes1 = Math.floor((time / 1000 / 60) % 60);
                                                                            var hours1 = Math.floor((time / (1000 * 60 * 60)) % 24);
                                                                            var days1 = Math.floor(time / (1000 * 60 * 60 * 24));
                                                                            var calculatetime = ''

                                                                            if (seconds1 >= 1 && seconds1 < 60 && minutes1 === 0 && hours1 === 0 && days1 === 0) {
                                                                                if (seconds1 === 1) {
                                                                                    calculatetime = seconds1 + ' second ago';
                                                                                } else {
                                                                                    calculatetime = seconds1 + ' seconds ago';
                                                                                }
                                                                            } else if (minutes1 >= 1 && minutes1 < 60 && hours1 === 0 && days1 === 0) {
                                                                                if (minutes1 === 1) {
                                                                                    calculatetime = minutes1 + ' minute ago';
                                                                                } else {
                                                                                    calculatetime = minutes1 + ' minutes ago';
                                                                                }
                                                                            } else if (hours1 >= 1 && hours1 < 24 && days1 === 0) {
                                                                                if (hours1 === 1) {

                                                                                    calculatetime = hours1 + ' hour ago';
                                                                                } else {
                                                                                    calculatetime = hours1 + ' hours ago';
                                                                                }
                                                                            } else {
                                                                                if (days1 === 1) {
                                                                                    calculatetime = days1 + ' day ago'
                                                                                } else if (days1 <= 7) {
                                                                                    calculatetime = days1 + ' days ago'
                                                                                } else {
                                                                                    calculatetime = String(doc.created_at).substring(0, 10)
                                                                                }

                                                                            }
                                                                            var profileimage = doc.profileimage

                                                                            if (typeof profileimage === 'undefined') {
                                                                                profileimage = constants.APIBASEURL + 'uploads/userimage.png'
                                                                            } else {
                                                                                if (profileimage === null) {
                                                                                    profileimage = constants.APIBASEURL + "uploads/announce.png"
                                                                                } else {
                                                                                    if (profileimage.profileimage === null) {
                                                                                        profileimage = constants.APIBASEURL + 'uploads/userimage.png'
                                                                                    } else {
                                                                                        profileimage = constants.APIBASEURL + profileimage.profileimage
                                                                                    }
                                                                                }

                                                                            }


                                                                            var member_profile = doc.member_profile

                                                                            if (typeof member_profile === 'undefined') {
                                                                                member_profile = constants.APIBASEURL + 'uploads/userimage.png'
                                                                            } else {
                                                                                if (member_profile.profileimage === null) {
                                                                                    member_profile = constants.APIBASEURL + 'uploads/userimage.png'
                                                                                } else {
                                                                                    member_profile = constants.APIBASEURL + member_profile.profileimage
                                                                                }
                                                                            }

                                                                            var amount = 0;
                                                                            if (typeof doc.additional_details.challenge_amount != 'undefined') {
                                                                                var chall_amount = doc.additional_details.challenge_amount
                                                                                if (chall_amount > 0) {
                                                                                    amount = chall_amount
                                                                                }
                                                                            }

                                                                            var sender = ""
                                                                            var message = ""
                                                                            var title = ""
                                                                            var msg_id = ""
                                                                            var msg_created_at = Date.now()
                                                                            if (typeof doc.sender != 'undefined') {
                                                                                sender = doc.sender
                                                                            }

                                                                            if (typeof doc.message != 'undefined') {
                                                                                message = doc.message
                                                                            }

                                                                            if (typeof msg_created_at != 'undefined') {
                                                                                msg_created_at = doc.msg_created_at
                                                                            }

                                                                            if (typeof title != 'undefined') {
                                                                                title = doc.title
                                                                            }

                                                                            if (typeof msg_id != 'undefined') {
                                                                                msg_id = doc.msg_id
                                                                            }

                                                                            var foe = {
                                                                                'message': doc.notification_data,
                                                                                'item_id': String(doc.item_id),
                                                                                'notification_id': doc.notification_number,
                                                                                'created_at': calculatetime,
                                                                                'profileimage': profileimage,
                                                                                'additional_details': {
                                                                                    userid: doc.additional_details.userid,
                                                                                    feed_id: doc.additional_details.feed_id,
                                                                                    member_feed_id: doc.additional_details.member_feed_id,
                                                                                    member_id: doc.additional_details.member_id,
                                                                                    'member_url': profileimage,
                                                                                    'member_name': doc.username,
                                                                                    'url': member_profile,
                                                                                    'username': doc.member_name,
                                                                                    user_preview_url: doc.additional_details.user_preview_url,
                                                                                    member_preview_url: doc.additional_details.member_preview_url,
                                                                                    challenge_amount: String(amount)
                                                                                },
                                                                                'sender': sender,
                                                                                'msg': message,
                                                                                'title': title,
                                                                                'msg_id': msg_id,
                                                                                'msg_created_at': msg_created_at,
                                                                                'notification_slug': doc.notification_type,
                                                                                'feed_type': doc.feed_type,
                                                                                'view_status': doc.view_status
                                                                            }
                                                                            test_offer.push(foe)
                                                                        })
                                                                        offers_notifications = test_offer
                                                                    }

                                                                })
                                                            }
                                                            var day = new Date()
                                                            day = day.setDate(day.getDate() + 1)
                                                            day = new Date(day).setHours(0, 0, 0, 0)
                                                            var last_wk = new Date()
                                                            var last_week = last_wk.setDate(last_wk.getDate() - 6)
                                                            last_week = new Date(last_week).setHours(0, 0, 0, 0)


                                                            notificationModel.aggregate([
                                                                    { $match: { userid: ObjectId(req.body.userid) } },
                                                                    { $unwind: "$notifications" },
                                                                    {
                                                                        $match: {
                                                                            $and: [{
                                                                                    "notifications.created_at": {
                                                                                        $gte: new Date(last_week),
                                                                                        $lte: new Date(day)
                                                                                    }
                                                                                },
                                                                                { "notifications.view_status": false }
                                                                            ]
                                                                        }
                                                                    },
                                                                    {
                                                                        $group: {
                                                                            _id: "$userid",
                                                                            notifications: { $addToSet: "$notifications" },
                                                                            count: { $sum: 1 }
                                                                        }
                                                                    }
                                                                ])
                                                                .exec()
                                                                .then(docs => {
                                                                    var notifications = 0
                                                                    if (docs.length > 0) {
                                                                        notifications = docs[0].count;
                                                                        if (notifications < 1) {
                                                                            notification_count = 0
                                                                        } else {

                                                                            notification_count = docs[0].count;

                                                                        }
                                                                    }

                                                                    var lottery = {};
                                                                    var offer_popup_details = {};
                                                                    var active = data[0].offer_details;
                                                                    var active_offers = [];
                                                                    var redeem_offers = [];
                                                                    var redeem = data[0].offers_history;
                                                                    var wish = data[0].wishlist_offers
                                                                    var wish_offers = [];

                                                                    if (wish.length > 0) {
                                                                        wish.forEach(function(dex) {
                                                                            wish_offers.push(ObjectId(dex.offer))
                                                                        })
                                                                    }
                                                                    //for active offers
                                                                    if (active.length > 0) {
                                                                        active.forEach(function(element) {
                                                                            if (element.is_primary_offer === true) {
                                                                                active_offers.push(ObjectId(element.primary_offer._id))
                                                                            } else {
                                                                                active_offers.push(ObjectId(element.offer._id))
                                                                            }
                                                                        })
                                                                    }

                                                                    //for history redeemed offers
                                                                    if (redeem.length > 0) {
                                                                        redeem.forEach(function(element) {
                                                                            if (element.is_primary_offer === true) {
                                                                                active_offers.push(ObjectId(element.primary_offer._id))
                                                                            } else {
                                                                                active_offers.push(ObjectId(element.offer._id))
                                                                            }
                                                                        })
                                                                    }

                                                                    if (offer_history.length > 0 || contest.length > 0) {
                                                                        var found = offer_history.find(o => o.is_primary_offer === true && o.is_lottery_showed === false)
                                                                        console.log(found)

                                                                        if (typeof found != 'undefined') {
                                                                            lotter_offer.push(found)
                                                                            lotter_offer.map(doc => {
                                                                                var profileimage = data[0].userid.profileimage

                                                                                if (data[0].userid.profileimage === null) {
                                                                                    profileimage = constants.APIBASEURL + "uploads/userimage.png"
                                                                                }

                                                                                var foe = {
                                                                                    'username': data[0].userid.username,
                                                                                    'userid': data[0].userid._id,
                                                                                    'profileimage': profileimage
                                                                                }

                                                                                user_details.push(foe)

                                                                                var fog = {
                                                                                    "offer_id": doc.primary_offer._id,
                                                                                    "offer_name": doc.primary_offer.business_post_name,
                                                                                    "offer_desc": doc.primary_offer.business_post_desc,
                                                                                    "offer_img_url": constants.APIBASEURL + doc.primary_offer.business_post_logo,
                                                                                }

                                                                                offer_details.push(fog)
                                                                            })

                                                                            res.status(200).json({
                                                                                status: "Ok",
                                                                                message: "App data dynamics",
                                                                                app_data_details: {
                                                                                    notificationcount: notification_count,
                                                                                    announcement_count: announcement_count,
                                                                                    show_adds: false,
                                                                                    show_google_ads: true,
                                                                                    required_app_version: 33, //29,
                                                                                    signup_video_url: signup_video_url,
                                                                                    app_usage_video_url: app_usage_video_url,
                                                                                    is_user_verified: emailcheck,
                                                                                    enable_gift_feature: true,
                                                                                    required_app_update: required_app_update,
                                                                                    lottery_details: {
                                                                                        lottery_message: "Hey!! " + user_details[0].username + "\n\n" + "Congratulations" + "\n" + "You have won the primary offer lottery.",
                                                                                        user_details: user_details[0],
                                                                                        offer_details: offer_details[0]
                                                                                    },
                                                                                    offers_notifications: offers_notifications,
                                                                                    offer_popup_details: {},
                                                                                    announcement_details: announcement_details,
                                                                                    show_offer_popup: false,
                                                                                    offer_donate_amount: 50,
                                                                                    has_email_verified: has_email_verified,
                                                                                    has_primary_offer: has_primary_offer,
                                                                                    showcase_details: {
                                                                                        fab_menu_screen: fab_menu_screen,
                                                                                        feed_list_screen: feed_list_screen,
                                                                                        active_offers_tab_screen: active_offers_tab_screen,
                                                                                        challenge_list_activites_screen: challenge_list_activites_screen,
                                                                                        full_video_screen: full_video_screen,
                                                                                        offer_details_screen: offer_details_screen,
                                                                                        profile_screen: profile_screen,
                                                                                        challenge_details_screen: challenge_details_screen,
                                                                                    }
                                                                                }
                                                                            })
                                                                        } else {
                                                                            var founds = []

                                                                           // console.log(contest[0])
                                                                            
                                                                           // founds = contest.filter(o => o.has_contest_seen === false)

                                                                           // console.log("contest length "+founds.length)
                                                                            
                                                                            if(contest.length > 0 ){

                                                                               // lotter_offer.push(contest)
                                                                                contest.map(doc => {
                                                                                    var profileimage = data[0].userid.profileimage

                                                                                    if (data[0].userid.profileimage === null) {
                                                                                        profileimage = constants.APIBASEURL + "uploads/userimage.png"
                                                                                    }
                                                                                    else{
                                                                                        profileimage = constants.APIBASEURL + data[0].userid.profileimage
                                                                                    }

                                                                                    var foe = {
                                                                                        'username': data[0].userid.username,
                                                                                        'userid': data[0].userid._id,
                                                                                        'profileimage': profileimage
                                                                                    }

                                                                                    user_details.push(foe)

                                                                                    var fog = {
                                                                                        "offer_id": doc.contest_id,
                                                                                        "offer_name":"",
                                                                                        "offer_desc": "",
                                                                                        "offer_img_url": profileimage,
                                                                                    }
                                                                                    offer_details.push(fog)
                                                                                })

                                                                                res.status(200).json({
                                                                                    status: "Ok",
                                                                                    message: "App data dynamics",
                                                                                    app_data_details: {
                                                                                        notificationcount: notification_count,
                                                                                        announcement_count: announcement_count,
                                                                                        show_adds: false,
                                                                                        show_google_ads: true,
                                                                                        required_app_version: 33, //29,
                                                                                        signup_video_url: signup_video_url,
                                                                                        app_usage_video_url: app_usage_video_url,
                                                                                        is_user_verified: emailcheck,
                                                                                        enable_gift_feature: true,
                                                                                        required_app_update: required_app_update,
                                                                                        lottery_details: {
                                                                                            lottery_message: "Hey!! " + user_details[0].username + "\n\n" + "Congratulations" + "\n" + "You have won the Challenge contest.",
                                                                                            user_details: user_details[0],
                                                                                            offer_details:offer_details[0]
                                                                                        },
                                                                                        offers_notifications: offers_notifications,
                                                                                        offer_popup_details: {},
                                                                                        announcement_details: announcement_details,
                                                                                        show_offer_popup: false,
                                                                                        offer_donate_amount: 50,
                                                                                        has_email_verified: has_email_verified,
                                                                                        has_primary_offer: has_primary_offer,
                                                                                        showcase_details: {
                                                                                            fab_menu_screen: fab_menu_screen,
                                                                                            feed_list_screen: feed_list_screen,
                                                                                            active_offers_tab_screen: active_offers_tab_screen,
                                                                                            challenge_list_activites_screen: challenge_list_activites_screen,
                                                                                            full_video_screen: full_video_screen,
                                                                                            offer_details_screen: offer_details_screen,
                                                                                            profile_screen: profile_screen,
                                                                                            challenge_details_screen: challenge_details_screen,
                                                                                        }
                                                                                    }
                                                                                })
                                                                            }
                                                                            else{

                                                                                if (!required_app_update && has_shown_offer) {
                                                                                    bsOffers.find({ $and: [{ _id: { $nin: redeem_offers } }, { _id: { $nin: active_offers } }, { is_expired: false }, { offer_category: category_type }, { 'no_of_items': { $ne: '0' } }] })
                                                                                        .populate('bus_id')
                                                                                        .sort({ business_post_startdate: -1 })
                                                                                        .exec()
                                                                                        .then(docs => {
                                                                                            wishlistOffers.find({ _id: { $nin: wish_offers } })
                                                                                                .exec()
                                                                                                .then(dex => {

                                                                                                    var test = [];
                                                                                                    var likes = 0;

                                                                                                    docs.map(doc => {

                                                                                                        if (doc.no_likes > 0) {
                                                                                                            likes = doc.no_likes
                                                                                                        }
                                                                                                        var is_liked = false;
                                                                                                        var testlike = doc.likes;
                                                                                                        if (typeof testlike === 'undefined') {
                                                                                                            is_liked = false;
                                                                                                        } else {
                                                                                                            testlike.every(function(newlike) {
                                                                                                                if (String(newlike) === String(req.body.userid)) {
                                                                                                                    is_liked = true;
                                                                                                                    return false
                                                                                                                } else {
                                                                                                                    return true
                                                                                                                }
                                                                                                            })
                                                                                                        }
                                                                                                        var price = doc.business_post_price
                                                                                                        var discount = 0

                                                                                                        if (Math.floor(price) <= 10) {
                                                                                                            discount = 100
                                                                                                        } else if (Math.floor(price) >= 11 && Math.floor(price) <= 99) {
                                                                                                            discount = 80
                                                                                                        } else if (Math.floor(price) >= 100 && Math.floor(price) <= 499) {
                                                                                                            discount = 70
                                                                                                        } else if (Math.floor(price) >= 500 && Math.floor(price) <= 1499) {
                                                                                                            discount = 75
                                                                                                        } else if (Math.floor(price) >= 1500 && Math.floor(price) <= 2499) {
                                                                                                            discount = 60
                                                                                                        } else if (Math.floor(price) >= 2500 && Math.floor(price) <= 5000) {
                                                                                                            discount = 45
                                                                                                        } else {
                                                                                                            discount = 0
                                                                                                        }

                                                                                                        var date = new Date()
                                                                                                        var dates1 = date.setTime(date.getTime());
                                                                                                        var dateNow1 = new Date(dates1).toISOString();
                                                                                                        var current_date = String(dateNow1).split('T')
                                                                                                        var expiry_day = doc.business_post_enddate
                                                                                                        var expiry_array = expiry_day.split('/')
                                                                                                        var current_day = current_date[0].split('-')
                                                                                                        var expiry = expiry_array[1] + "-" + expiry_array[0] + "-" + expiry_array[2] + " 00:00:00"
                                                                                                        var current = current_day[1] + "-" + current_day[2] + "-" + current_day[0] + " 00:00:00"
                                                                                                        var today = new Date(current)
                                                                                                        var offer_expiry = new Date(expiry)
                                                                                                        var timeDiff = Math.abs(offer_expiry.getTime() - today.getTime());
                                                                                                        var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                                                                                        var stock = doc.no_of_items
                                                                                                        var in_stock = false
                                                                                                        if (parseInt(stock) === 0) {
                                                                                                            in_stock = true
                                                                                                        }
                                                                                                        var finals = price * (discount / 100)
                                                                                                        var final = finals * 10
                                                                                                        var final_total = price - finals

                                                                                                        var testss = {
                                                                                                            "offer_id": doc._id,
                                                                                                            "offer_name": doc.business_post_desc,
                                                                                                            "offer_desc": doc.business_post_desc,
                                                                                                            "offer_rating": doc.offer_rating,
                                                                                                            "no_used": 0,
                                                                                                            "no_likes": doc.likes.length,
                                                                                                            "expiry_time": "Expires in " + diffDays + " days",
                                                                                                            "offer_validity": 0,
                                                                                                            "no_comments": doc.no_comments,
                                                                                                            "offer_price": parseFloat(doc.business_post_price),
                                                                                                            "offer_img_url": constants.APIBASEBIZURL + doc.business_post_logo,
                                                                                                            // "offer_category": doc.business_catetgory_type,
                                                                                                            "no_of_items_remaining": parseInt(doc.no_of_items),
                                                                                                            "out_of_stock": in_stock,
                                                                                                            "offer_vendor": doc.bus_id.bus_name,
                                                                                                            "is_liked": is_liked,
                                                                                                            "menu": "",
                                                                                                            "is_custom": false,
                                                                                                            "discount": discount + "% OFF.",
                                                                                                            "offer_category": doc.offer_category,
                                                                                                            "is_coming_soon": false,
                                                                                                            "is_delivery_required": doc.is_delivery_required,
                                                                                                            "no_used": doc.redeem.length,
                                                                                                            "payable_amount": parseFloat(final_total).toFixed(2)
                                                                                                        }
                                                                                                        if (String(doc._id) != String(offer_seen)) {
                                                                                                            test.push(testss)
                                                                                                        }

                                                                                                    })

                                                                                                    var testapi = []

                                                                                                    dex.map(exe => {

                                                                                                        if (exe.no_likes > 0) {
                                                                                                            likes = exe.no_likes
                                                                                                        }
                                                                                                        var is_liked = false;
                                                                                                        var testlike = exe.likes;
                                                                                                        if (typeof testlike === 'undefined') {
                                                                                                            is_liked = false;
                                                                                                        } else {
                                                                                                            testlike.every(function(newlike) {
                                                                                                                if (String(newlike) === String(req.body.userid)) {
                                                                                                                    is_liked = true;
                                                                                                                    return false
                                                                                                                } else {
                                                                                                                    return true
                                                                                                                }
                                                                                                            })
                                                                                                        }

                                                                                                        var price1 = exe.business_post_price
                                                                                                        var discount1 = 0

                                                                                                        if (Math.floor(price1) <= 10) {
                                                                                                            discount1 = 100
                                                                                                        } else if (Math.floor(price1) >= 11 && Math.floor(price1) <= 99) {
                                                                                                            discount1 = 80
                                                                                                        } else if (Math.floor(price1) >= 100 && Math.floor(price1) <= 499) {
                                                                                                            discount1 = 70
                                                                                                        } else if (Math.floor(price1) >= 500 && Math.floor(price1) <= 1499) {
                                                                                                            discount1 = 75
                                                                                                        } else if (Math.floor(price1) >= 1500 && Math.floor(price1) <= 2499) {
                                                                                                            discount1 = 60
                                                                                                        } else if (Math.floor(price1) >= 2500 && Math.floor(price1) <= 5000) {
                                                                                                            discount1 = 45
                                                                                                        } else {
                                                                                                            discount1 = 0
                                                                                                        }

                                                                                                        var finals_interested = price1 * (discount1 / 100)
                                                                                                        var final_interested = finals_interested * 10
                                                                                                        var final_total_interested = price1 - finals_interested

                                                                                                        var wishlist = {
                                                                                                            "offer_id": exe._id,
                                                                                                            "offer_name": exe.business_post_name,
                                                                                                            "offer_desc": exe.business_post_desc,
                                                                                                            "offer_rating": exe.offer_rating,
                                                                                                            "no_used": 0,
                                                                                                            "no_likes": exe.likes.length,
                                                                                                            "expiry_time": "",
                                                                                                            "offer_validity": 0,
                                                                                                            "no_comments": exe.no_comments,
                                                                                                            "offer_price": parseFloat(exe.business_post_price),
                                                                                                            "offer_img_url": constants.APIBASEURL + exe.business_post_logo,
                                                                                                            // "offer_category": exe.business_catetgory_type,
                                                                                                            "no_of_items_remaining": 10000,
                                                                                                            "out_of_stock": false,
                                                                                                            "offer_vendor": "Fvmegear",
                                                                                                            "is_liked": is_liked,
                                                                                                            "menu": "",
                                                                                                            "is_custom": false,
                                                                                                            "discount": discount1 + "% OFF.",
                                                                                                            "offer_category": "Stellar",
                                                                                                            "is_coming_soon": true,
                                                                                                            "is_delivery_required": false,
                                                                                                            "no_used": exe.used.length,
                                                                                                            "payable_amount": parseFloat(final_total_interested).toFixed(2)
                                                                                                        }
                                                                                                        if (String(exe._id) != String(offer_seen)) {
                                                                                                            testapi.push(wishlist)
                                                                                                        }

                                                                                                    })

                                                                                                    var total_offers = test.length + testapi.length

                                                                                                    test = testapi.concat(test)

                                                                                                    var offer_item = test[Math.floor(Math.random() * test.length)];

                                                                                                    offer_popup_details = offer_item;


                                                                                                    res.status(200).json({
                                                                                                        status: "Ok",
                                                                                                        message: "App data dynamics",
                                                                                                        app_data_details: {
                                                                                                            notificationcount: notification_count,
                                                                                                            announcement_count: announcement_count,
                                                                                                            show_adds: false,
                                                                                                            show_google_ads: true,
                                                                                                            enable_gift_feature: true,
                                                                                                            required_app_version: 33,
                                                                                                            required_app_update: required_app_update,
                                                                                                            signup_video_url: signup_video_url,
                                                                                                            app_usage_video_url: app_usage_video_url,
                                                                                                            is_user_verified: emailcheck,
                                                                                                            lottery_details: {},
                                                                                                            offers_notifications: offers_notifications,
                                                                                                            offer_popup_details: offer_popup_details,
                                                                                                            announcement_details: announcement_details,
                                                                                                            show_offer_popup: has_shown_offer,
                                                                                                            offer_donate_amount: 50,
                                                                                                            has_email_verified: has_email_verified,
                                                                                                            has_primary_offer: has_primary_offer,
                                                                                                            showcase_details: {
                                                                                                                fab_menu_screen: fab_menu_screen,
                                                                                                                feed_list_screen: feed_list_screen,
                                                                                                                active_offers_tab_screen: active_offers_tab_screen,
                                                                                                                challenge_list_activites_screen: challenge_list_activites_screen,
                                                                                                                full_video_screen: full_video_screen,
                                                                                                                offer_details_screen: offer_details_screen,
                                                                                                                profile_screen: profile_screen,
                                                                                                                challenge_details_screen: challenge_details_screen,
                                                                                                            }
                                                                                                        }
                                                                                                    })

                                                                                                }).catch(err => {
                                                                                                    var spliterror = err.message.split(":")
                                                                                                    res.status(500).json({
                                                                                                        status: 'Failed',
                                                                                                        message: spliterror[0]
                                                                                                    });
                                                                                                });
                                                                                        }).catch(err => {
                                                                                            var spliterror = err.message.split(":")
                                                                                            res.status(500).json({
                                                                                                status: 'Failed',
                                                                                                message: spliterror[0]
                                                                                            });
                                                                                        });

                                                                                } else {
                                                                                    res.status(200).json({
                                                                                        status: "Ok",
                                                                                        message: "App data dynamics",
                                                                                        app_data_details: {
                                                                                            notificationcount: notification_count,
                                                                                            announcement_count: announcement_count,
                                                                                            show_adds: false,
                                                                                            show_google_ads: true,
                                                                                            enable_gift_feature: true,
                                                                                            required_app_version: 33,
                                                                                            required_app_update: required_app_update,
                                                                                            signup_video_url: signup_video_url,
                                                                                            app_usage_video_url: app_usage_video_url,
                                                                                            is_user_verified: emailcheck,
                                                                                            lottery_details: {},
                                                                                            offers_notifications: offers_notifications,
                                                                                            offer_popup_details: offer_popup_details,
                                                                                            announcement_details: announcement_details,
                                                                                            show_offer_popup: false,
                                                                                            offer_donate_amount: 50,
                                                                                            has_email_verified: has_email_verified,
                                                                                            has_primary_offer: has_primary_offer,
                                                                                            showcase_details: {
                                                                                                fab_menu_screen: fab_menu_screen,
                                                                                                feed_list_screen: feed_list_screen,
                                                                                                active_offers_tab_screen: active_offers_tab_screen,
                                                                                                challenge_list_activites_screen: challenge_list_activites_screen,
                                                                                                full_video_screen: full_video_screen,
                                                                                                offer_details_screen: offer_details_screen,
                                                                                                profile_screen: profile_screen,
                                                                                                challenge_details_screen: challenge_details_screen,
                                                                                            }
                                                                                        }
                                                                                    })

                                                                                }
                                                                            }
                                                                        }

                                                                    } else {

                                                                        if (!required_app_update && has_shown_offer) {
                                                                            bsOffers.find({ $and: [{ _id: { $nin: redeem_offers } }, { _id: { $nin: active_offers } }, { is_expired: false }, { offer_category: category_type }, { 'no_of_items': { $ne: '0' } }] })
                                                                                .populate('bus_id')
                                                                                .sort({ business_post_startdate: -1 })
                                                                                .exec()
                                                                                .then(docs => {
                                                                                    wishlistOffers.find({ _id: { $nin: wish_offers } })
                                                                                        .exec()
                                                                                        .then(dex => {

                                                                                            var test = [];
                                                                                            var likes = 0;

                                                                                            docs.map(doc => {

                                                                                                if (doc.no_likes > 0) {
                                                                                                    likes = doc.no_likes
                                                                                                }
                                                                                                var is_liked = false;
                                                                                                var testlike = doc.likes;
                                                                                                if (typeof testlike === 'undefined') {
                                                                                                    is_liked = false;
                                                                                                } else {
                                                                                                    testlike.every(function(newlike) {
                                                                                                        if (String(newlike) === String(req.body.userid)) {
                                                                                                            is_liked = true;
                                                                                                            return false
                                                                                                        } else {
                                                                                                            return true
                                                                                                        }
                                                                                                    })
                                                                                                }
                                                                                                var price = doc.business_post_price
                                                                                                var discount = 0

                                                                                                if (Math.floor(price) <= 10) {
                                                                                                    discount = 100
                                                                                                } else if (Math.floor(price) >= 11 && Math.floor(price) <= 99) {
                                                                                                    discount = 80
                                                                                                } else if (Math.floor(price) >= 100 && Math.floor(price) <= 499) {
                                                                                                    discount = 70
                                                                                                } else if (Math.floor(price) >= 500 && Math.floor(price) <= 1499) {
                                                                                                    discount = 75
                                                                                                } else if (Math.floor(price) >= 1500 && Math.floor(price) <= 2499) {
                                                                                                    discount = 60
                                                                                                } else if (Math.floor(price) >= 2500 && Math.floor(price) <= 5000) {
                                                                                                    discount = 45
                                                                                                } else {
                                                                                                    discount = 0
                                                                                                }

                                                                                                var date = new Date()
                                                                                                var dates1 = date.setTime(date.getTime());
                                                                                                var dateNow1 = new Date(dates1).toISOString();
                                                                                                var current_date = String(dateNow1).split('T')
                                                                                                var expiry_day = doc.business_post_enddate
                                                                                                var expiry_array = expiry_day.split('/')
                                                                                                var current_day = current_date[0].split('-')
                                                                                                var expiry = expiry_array[1] + "-" + expiry_array[0] + "-" + expiry_array[2] + " 00:00:00"
                                                                                                var current = current_day[1] + "-" + current_day[2] + "-" + current_day[0] + " 00:00:00"
                                                                                                var today = new Date(current)
                                                                                                var offer_expiry = new Date(expiry)
                                                                                                var timeDiff = Math.abs(offer_expiry.getTime() - today.getTime());
                                                                                                var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                                                                                var stock = doc.no_of_items
                                                                                                var in_stock = false
                                                                                                if (parseInt(stock) === 0) {
                                                                                                    in_stock = true
                                                                                                }
                                                                                                var finals = price * (discount / 100)
                                                                                                var final = finals * 10
                                                                                                var final_total = price - finals

                                                                                                var testss = {
                                                                                                    "offer_id": doc._id,
                                                                                                    "offer_name": doc.business_post_desc,
                                                                                                    "offer_desc": doc.business_post_desc,
                                                                                                    "offer_rating": doc.offer_rating,
                                                                                                    "no_used": 0,
                                                                                                    "no_likes": doc.likes.length,
                                                                                                    "expiry_time": "Expires in " + diffDays + " days",
                                                                                                    "offer_validity": 0,
                                                                                                    "no_comments": doc.no_comments,
                                                                                                    "offer_price": parseFloat(doc.business_post_price),
                                                                                                    "offer_img_url": constants.APIBASEBIZURL + doc.business_post_logo,
                                                                                                    // "offer_category": doc.business_catetgory_type,
                                                                                                    "no_of_items_remaining": parseInt(doc.no_of_items),
                                                                                                    "out_of_stock": in_stock,
                                                                                                    "offer_vendor": doc.bus_id.bus_name,
                                                                                                    "is_liked": is_liked,
                                                                                                    "menu": "",
                                                                                                    "is_custom": false,
                                                                                                    "discount": discount + "% OFF.",
                                                                                                    "offer_category": doc.offer_category,
                                                                                                    "is_coming_soon": false,
                                                                                                    "is_delivery_required": doc.is_delivery_required,
                                                                                                    "no_used": doc.redeem.length,
                                                                                                    "payable_amount": parseFloat(final_total).toFixed(2)
                                                                                                }

                                                                                                if (String(doc._id) != String(offer_seen)) {
                                                                                                    test.push(testss)
                                                                                                }
                                                                                            })

                                                                                            var testapi = []

                                                                                            dex.map(exe => {

                                                                                                if (exe.no_likes > 0) {
                                                                                                    likes = exe.no_likes
                                                                                                }
                                                                                                var is_liked = false;
                                                                                                var testlike = exe.likes;
                                                                                                if (typeof testlike === 'undefined') {
                                                                                                    is_liked = false;
                                                                                                } else {
                                                                                                    testlike.every(function(newlike) {
                                                                                                        if (String(newlike) === String(req.body.userid)) {
                                                                                                            is_liked = true;
                                                                                                            return false
                                                                                                        } else {
                                                                                                            return true
                                                                                                        }
                                                                                                    })
                                                                                                }

                                                                                                var price1 = exe.business_post_price
                                                                                                var discount1 = 0

                                                                                                if (Math.floor(price1) <= 10) {
                                                                                                    discount1 = 100
                                                                                                } else if (Math.floor(price1) >= 11 && Math.floor(price1) <= 99) {
                                                                                                    discount1 = 80
                                                                                                } else if (Math.floor(price1) >= 100 && Math.floor(price1) <= 499) {
                                                                                                    discount1 = 70
                                                                                                } else if (Math.floor(price1) >= 500 && Math.floor(price1) <= 1499) {
                                                                                                    discount1 = 75
                                                                                                } else if (Math.floor(price1) >= 1500 && Math.floor(price1) <= 2499) {
                                                                                                    discount1 = 60
                                                                                                } else if (Math.floor(price1) >= 2500 && Math.floor(price1) <= 5000) {
                                                                                                    discount1 = 45
                                                                                                } else {
                                                                                                    discount1 = 0
                                                                                                }

                                                                                                var finals_interested = price1 * (discount1 / 100)
                                                                                                var final_interested = finals_interested * 10
                                                                                                var final_total_interested = price1 - finals_interested

                                                                                                var wishlist = {
                                                                                                    "offer_id": exe._id,
                                                                                                    "offer_name": exe.business_post_name,
                                                                                                    "offer_desc": exe.business_post_desc,
                                                                                                    "offer_rating": exe.offer_rating,
                                                                                                    "no_used": 0,
                                                                                                    "no_likes": exe.likes.length,
                                                                                                    "expiry_time": "",
                                                                                                    "offer_validity": 0,
                                                                                                    "no_comments": exe.no_comments,
                                                                                                    "offer_price": parseFloat(exe.business_post_price),
                                                                                                    "offer_img_url": constants.APIBASEURL + exe.business_post_logo,
                                                                                                    // "offer_category": exe.business_catetgory_type,
                                                                                                    "no_of_items_remaining": 10000,
                                                                                                    "out_of_stock": false,
                                                                                                    "offer_vendor": "Fvmegear",
                                                                                                    "is_liked": is_liked,
                                                                                                    "menu": "",
                                                                                                    "is_custom": false,
                                                                                                    "discount": discount1 + "% OFF.",
                                                                                                    "offer_category": "Stellar",
                                                                                                    "is_coming_soon": true,
                                                                                                    "is_delivery_required": false,
                                                                                                    "no_used": exe.used.length,
                                                                                                    "payable_amount": parseFloat(final_total_interested).toFixed(2)
                                                                                                }
                                                                                                if (String(exe._id) != String(offer_seen)) {
                                                                                                    testapi.push(wishlist)
                                                                                                }
                                                                                            })

                                                                                            var total_offers = test.length + testapi.length

                                                                                            test = testapi.concat(test)

                                                                                            console.log(test.length)

                                                                                            var offer_item = test[Math.floor(Math.random() * test.length)];

                                                                                            offer_popup_details = offer_item;
                                                                                            res.status(200).json({
                                                                                                status: "Ok",
                                                                                                message: "App data dynamics",
                                                                                                app_data_details: {
                                                                                                    notificationcount: notification_count,
                                                                                                    announcement_count: announcement_count,
                                                                                                    show_adds: false,
                                                                                                    show_google_ads: true,
                                                                                                    enable_gift_feature: true,
                                                                                                    required_app_version: 33,
                                                                                                    required_app_update: required_app_update,
                                                                                                    signup_video_url: signup_video_url,
                                                                                                    app_usage_video_url: app_usage_video_url,
                                                                                                    is_user_verified: emailcheck,
                                                                                                    lottery_details: {},
                                                                                                    offers_notifications: offers_notifications,
                                                                                                    offer_popup_details: offer_popup_details,
                                                                                                    announcement_details: announcement_details,
                                                                                                    show_offer_popup: has_shown_offer,
                                                                                                    offer_donate_amount: 50,
                                                                                                    has_email_verified: has_email_verified,
                                                                                                    has_primary_offer: has_primary_offer,
                                                                                                    showcase_details: {
                                                                                                        fab_menu_screen: fab_menu_screen,
                                                                                                        feed_list_screen: feed_list_screen,
                                                                                                        active_offers_tab_screen: active_offers_tab_screen,
                                                                                                        challenge_list_activites_screen: challenge_list_activites_screen,
                                                                                                        full_video_screen: full_video_screen,
                                                                                                        offer_details_screen: offer_details_screen,
                                                                                                        profile_screen: profile_screen,
                                                                                                        challenge_details_screen: challenge_details_screen,
                                                                                                    }
                                                                                                }

                                                                                            })

                                                                                        }).catch(err => {
                                                                                            var spliterror = err.message.split(":")
                                                                                            res.status(500).json({
                                                                                                status: 'Failed',
                                                                                                message: spliterror[0]
                                                                                            });
                                                                                        });
                                                                                }).catch(err => {
                                                                                    var spliterror = err.message.split(":")
                                                                                    res.status(500).json({
                                                                                        status: 'Failed',
                                                                                        message: spliterror[0]
                                                                                    });
                                                                                });
                                                                        } else {
                                                                            res.status(200).json({
                                                                                status: "Ok",
                                                                                message: "App data dynamics",
                                                                                app_data_details: {
                                                                                    notificationcount: notification_count,
                                                                                    announcement_count: announcement_count,
                                                                                    show_adds: false,
                                                                                    show_google_ads: true,
                                                                                    enable_gift_feature: true,
                                                                                    required_app_version: 33,
                                                                                    required_app_update: required_app_update,
                                                                                    signup_video_url: signup_video_url,
                                                                                    app_usage_video_url: app_usage_video_url,
                                                                                    is_user_verified: emailcheck,
                                                                                    lottery_details: {},
                                                                                    offers_notifications: offers_notifications,
                                                                                    offer_popup_details: offer_popup_details,
                                                                                    announcement_details: announcement_details,
                                                                                    show_offer_popup: false,
                                                                                    offer_donate_amount: 50,
                                                                                    has_email_verified: has_email_verified,
                                                                                    has_primary_offer: has_primary_offer,
                                                                                    showcase_details: {
                                                                                        fab_menu_screen: fab_menu_screen,
                                                                                        feed_list_screen: feed_list_screen,
                                                                                        active_offers_tab_screen: active_offers_tab_screen,
                                                                                        challenge_list_activites_screen: challenge_list_activites_screen,
                                                                                        full_video_screen: full_video_screen,
                                                                                        offer_details_screen: offer_details_screen,
                                                                                        profile_screen: profile_screen,
                                                                                        challenge_details_screen: challenge_details_screen,
                                                                                    }
                                                                                }

                                                                            })
                                                                        }
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
                                                            console.log(err)
                                                            // var spliterror = err.message.split("_")
                                                            // if (spliterror[1].indexOf("id") >= 0) {
                                                            //     res.status(200).json({
                                                            //         status: 'Failed',
                                                            //         message: "Please provide correct userid"
                                                            //     });
                                                            // } else {
                                                            //     res.status(500).json({
                                                            //         status: 'Failed',
                                                            //         message: err.message
                                                            //     });
                                                            // }
                                                        })

                                                }).catch(err => {
                                                    var spliterror = err.message.split(":")
                                                    res.status(500).json({
                                                        status: 'Failed',
                                                        message: spliterror[0]
                                                    });
                                                });
                                    


                            }).catch(err => {
                                console.log(err)
                                // var spliterror = err.message.split("_")
                                // if (spliterror[1].indexOf("id") >= 0) {
                                //     res.status(200).json({
                                //         status: 'Failed',
                                //         message: "Please provide correct userid"
                                //     });
                                // } else {
                                //     res.status(500).json({
                                //         status: 'Failed',
                                //         message: err.message
                                //     });
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


router.get("/feed_count", (req, res, next) => {

    iv_feeds.aggregate([{
                $match: {
                    $and: [{ 'feed_type': "video" },
                        { 'privacy_mode': 1 },
                        { 'feed_expiry_status': 0 }, { is_static_feed: true }
                        // {iv_acountid: ObjectId('5cb4932dfaf7ca15e014a4d0')}
                    ]
                }
            },
            {
                $group: {
                    _id: "$iv_acountid",
                    feeds: {
                        $addToSet: {
                            _id: '$_id',
                            iv_acountid: '$iv_acountid',
                            feed_post_create: '$feed_post_create',
                            video_duration: '$video_duration',
                            no_views: '$no_views',
                            feed_desc: '$feed_desc'
                        }
                    },
                    count: { $sum: 1 }
                }
            }
        ]).exec()
        .then(userwise_feeds_data => {
            // console.log(datas)
            // return res.send("completed");
            async.each(userwise_feeds_data, function(item, mainCallback) {
                    var datas = item.feeds;
                    var above_30 = []
                    var below_30 = []
                    var dateNow = new Date()
                    var date_today = new Date()
                    date_today.toISOString()
                    date_today.setHours(0, 0, 0, 0)
                    if (datas.length > 0) {
                        datas.map(docs => {

                            var duration = parseInt(docs.video_duration)
                            console.log(duration);
                            var indiaTime = docs.feed_post_create
                            var time = Date.parse(dateNow) - Date.parse(indiaTime);
                            console.log("today date" + dateNow)
                            console.log("created date" + indiaTime)
                            console.log("time diff " + time)
                            var minutes = Math.floor((time / (1000 * 60)) % 60)
                            console.log("minutes " + minutes)
                            if (duration >= 30 && minutes >= 2) {
                                above_30.push(docs)
                            } else if (duration < 30 && minutes >= 2) {
                                below_30.push(docs)
                            } else {}

                        })


                        //above 30 secs adding talent points code

                        above_30 = above_30.sort(function() {
                            return 0.5 - Math.random()
                        });
                        var rand = above_30[Math.floor(Math.random() * above_30.length)];

                        above_30.slice(0, rand)

                        var divSeven = above_30.filter(x => x % 7 === 0);
                        var div11 = above_30.filter(x => x % 11 === 0);
                        var div4 = above_30.filter(x => x % 4 === 0);

                        above_30 = above_30.filter(f => !divSeven.includes(f));
                        above_30 = above_30.filter(f => !div11.includes(f));
                        above_30 = above_30.filter(f => !div4.includes(f));
                        var counter = 0
                        var tasks = [
                            function above30_fun(cb_serial) {
                                console.log('above30', above_30)
                                if (above_30.length > 0) {
                                    async.eachSeries(above_30, function(data, callback) {
                                            console.log("above 30 data", data);
                                            var Useriv_acountid = data.iv_acountid
                                            var user_random = Math.floor(Math.random() * 3) + 1
                                            var user_random1 = Math.floor(Math.random() * 9) + 1
                                            var random_views = Math.floor(Math.random() * 600) + 270
                                            var duration = parseInt(data.video_duration)
                                            var time = Date.parse(dateNow) - Date.parse(data.feed_post_create);
                                            var hours1 = Math.floor((time / (1000 * 60 * 60)) % 24);
                                            var minutes = Math.floor((time / (1000 * 60)) % 60)

                                            if (data.no_views < random_views && (hours1 > 1 && hours1 < 2 || hours1 > 7 && hours1 < 24)) {
                                                console.log("ch1 entered")
                                                iv_feeds.findOneAndUpdate({ _id: ObjectId(data._id) }, { $inc: { no_views: user_random } })
                                                    .exec()
                                                    .then(dex => {

                                                        userDetails.findOneAndUpdate({ userid: Useriv_acountid }, { $inc: { t_views: user_random } })
                                                            .exec();

                                                        userDetails.find({ userid: Useriv_acountid })
                                                            .exec()
                                                            .then(docsFetch => {

                                                                var fetchView = docsFetch[0].t_views;
                                                                var dividedByView = []
                                                                var addTalentPoint = 0
                                                                var remainViewPoint = 0

                                                                if (fetchView >= 10) {

                                                                    var dividedByView1 = fetchView / 10
                                                                    console.log(dividedByView1);
                                                                    dividedByView.push(dividedByView1);

                                                                    if (String(dividedByView1).indexOf('.') != -1) {

                                                                        var splitViews = String(dividedByView1).split('.');
                                                                        addTalentPoint = parseInt(splitViews[0]);
                                                                        remainViewPoint = parseInt(fetchView) - parseInt(addTalentPoint) * 10;
                                                                    } else {

                                                                        if (dividedByView1 === 1) {
                                                                            var addTalentPoint = 1;
                                                                            remainViewPoint = 0;
                                                                        }

                                                                    }

                                                                    if (remainViewPoint === null) {
                                                                        remainViewPoint = 0
                                                                    }


                                                                    userDetails.findOneAndUpdate({ userid: Useriv_acountid }, {
                                                                            $inc: { talent_points: addTalentPoint },
                                                                            $set: { t_views: remainViewPoint }
                                                                        })
                                                                        .exec()
                                                                    var day = new Date()
                                                                    day = day.toISOString()
                                                                    day = String(day).split("T")
                                                                    day = day[0].replace(/-/g, "")
                                                                    var amount = parseInt(addTalentPoint)
                                                                    var mode = "talent"
                                                                    var transaction_id = day + Math.floor(10000000000 + Math.random() * 90000000000);

                                                                    if (amount > 0) {
                                                                        userTransactions.aggregate([
                                                                                { $match: { userid: ObjectId(Useriv_acountid) } },
                                                                                { $unwind: "$transactions" },
                                                                                {
                                                                                    $match: {
                                                                                        $and: [{ "transactions.mode": "talent" },
                                                                                            { "transactions.action": "record_view" }
                                                                                        ]
                                                                                    }
                                                                                },
                                                                                {
                                                                                    $group: {
                                                                                        _id: "$userid",
                                                                                        transactions: { $addToSet: "$transactions" },
                                                                                        count: { $sum: 1 }
                                                                                    }
                                                                                }
                                                                            ])
                                                                            .exec()
                                                                            .then(orange => {
                                                                                console.log('orange', orange)
                                                                                if (orange.length > 0) {
                                                                                    var transactions = orange[0].transactions
                                                                                    console.log("transactions length " + transactions.length)
                                                                                    console.log("orange length greater than 0");
                                                                                    if (transactions.length > 0) {
                                                                                        console.log("transaction length greater than 0");
                                                                                        var test = []
                                                                                        var final_amount = 0
                                                                                        var transaction_id = ""
                                                                                        console.log('transactions', transactions);
                                                                                        transactions.map(notify => {
                                                                                            var transaction_date = notify.date_of_transaction
                                                                                            var transaction_dates = transaction_date.setHours(0, 0, 0, 0)

                                                                                            console.log('date of transaction ' + transaction_dates)
                                                                                            console.log('date of today ' + Date.parse(date_today))

                                                                                            if (transaction_dates == Date.parse(date_today)) {
                                                                                                test.push(ObjectId(notify._id))
                                                                                                final_amount = parseInt(final_amount) + parseInt(notify.amount)

                                                                                            }
                                                                                        })

                                                                                        console.log('total ids ' + test)

                                                                                        userTransactions.findOneAndUpdate({ userid: ObjectId(Useriv_acountid) }, {
                                                                                            $pull: {
                                                                                                transactions: { _id: { $in: test } }
                                                                                            }
                                                                                        }).exec().then(x => {
                                                                                            userTransactions.findOneAndUpdate({ userid: ObjectId(Useriv_acountid) }, {
                                                                                                    $push: {
                                                                                                        transactions: {
                                                                                                            date_of_transaction: Date.now(),
                                                                                                            amount: parseInt(final_amount) + parseInt(amount),
                                                                                                            mode: mode,
                                                                                                            transaction_type: "credit",
                                                                                                            action: "record_view",
                                                                                                            message: "Talent points credited to your account",
                                                                                                            transaction_id: transaction_id
                                                                                                        }
                                                                                                    }
                                                                                                })
                                                                                                .exec().then(x => {
                                                                                                    callback();
                                                                                                }).catch(err => {
                                                                                                    console.log(err);
                                                                                                })
                                                                                        }).catch(err => {
                                                                                            console.log(err);
                                                                                        })
                                                                                    } else {
                                                                                        console.log("orange length less than 0");
                                                                                        callback();
                                                                                        // userTransactions.findOneAndUpdate({userid: ObjectId(Useriv_acountid)},
                                                                                        //     {
                                                                                        //         $push: {
                                                                                        //             transactions: {
                                                                                        //                 date_of_transaction: Date.now(),
                                                                                        //                 amount: parseInt(amount),
                                                                                        //                 mode: mode,
                                                                                        //                 transaction_type: "credit",
                                                                                        //                 action: "record_view",
                                                                                        //                 message: "Talent points credited to your account",
                                                                                        //                 transaction_id: transaction_id
                                                                                        //             }
                                                                                        //         }
                                                                                        //     })
                                                                                        //     .exec()
                                                                                    }
                                                                                } else {
                                                                                    userTransactions.findOneAndUpdate({ userid: ObjectId(Useriv_acountid) }, {
                                                                                            $push: {
                                                                                                transactions: {
                                                                                                    date_of_transaction: Date.now(),
                                                                                                    amount: parseInt(amount),
                                                                                                    mode: mode,
                                                                                                    transaction_type: "credit",
                                                                                                    action: "record_view",
                                                                                                    message: "Talent points credited to your account",
                                                                                                    transaction_id: transaction_id
                                                                                                }
                                                                                            }
                                                                                        }, { upsert: true })
                                                                                        .exec().then(x => {
                                                                                            callback();
                                                                                        })
                                                                                }

                                                                            }).catch(err => {
                                                                                console.log(err)
                                                                                // var spliterror = err.message.split(":")
                                                                                // res.status(500).json({
                                                                                //     status: 'Failed',
                                                                                //     message: spliterror[0]
                                                                                // });
                                                                            });
                                                                    }


                                                                }

                                                            })

                                                    })
                                            } else {
                                                console.log("ch2 entered")
                                                if (data.no_views < random_views) {
                                                    iv_feeds.findOneAndUpdate({ _id: ObjectId(data._id) }, { $inc: { no_views: user_random1 } })
                                                        .exec()
                                                        .then(dex => {

                                                            userDetails.findOneAndUpdate({ userid: Useriv_acountid }, { $inc: { t_views: user_random1 } })
                                                                .exec().then(updatedata => {
                                                                    userDetails.find({ userid: Useriv_acountid })
                                                                        .exec()
                                                                        .then(docsFetch => {
                                                                            var fetchView = docsFetch[0].t_views;
                                                                            var dividedByView = []
                                                                            var addTalentPoint = 0
                                                                            var remainViewPoint = 0

                                                                            if (fetchView >= 10) {


                                                                                var dividedByView1 = fetchView / 10
                                                                                console.log(dividedByView1);
                                                                                dividedByView.push(dividedByView1);

                                                                                if (String(dividedByView1).indexOf('.') != -1) {

                                                                                    var splitViews = String(dividedByView1).split('.');
                                                                                    addTalentPoint = parseInt(splitViews[0]);
                                                                                    remainViewPoint = parseInt(fetchView) - parseInt(addTalentPoint) * 10;
                                                                                } else {

                                                                                    if (dividedByView1 === 1) {
                                                                                        var addTalentPoint = 1;
                                                                                        remainViewPoint = 0;
                                                                                    }

                                                                                }
                                                                                if (remainViewPoint === null) {
                                                                                    remainViewPoint = 0
                                                                                }

                                                                                userDetails.findOneAndUpdate({ userid: Useriv_acountid }, {
                                                                                        $inc: { talent_points: addTalentPoint },
                                                                                        $set: { t_views: remainViewPoint }
                                                                                    })
                                                                                    .exec()
                                                                                var day = new Date()
                                                                                day = day.toISOString()
                                                                                day = String(day).split("T")
                                                                                day = day[0].replace(/-/g, "")
                                                                                var amount = parseInt(addTalentPoint)
                                                                                var mode = "talent"
                                                                                var transaction_id = day + Math.floor(10000000000 + Math.random() * 90000000000);

                                                                                if (amount > 0) {
                                                                                    console.log('amount greater than 0');
                                                                                    userTransactions.aggregate([
                                                                                            { $match: { userid: ObjectId(Useriv_acountid) } },
                                                                                            { $unwind: "$transactions" },
                                                                                            {
                                                                                                $match: {
                                                                                                    $and: [{ "transactions.mode": "talent" },
                                                                                                        { "transactions.action": "record_view" }
                                                                                                    ]
                                                                                                }
                                                                                            },
                                                                                            {
                                                                                                $group: {
                                                                                                    _id: "$userid",
                                                                                                    transactions: { $addToSet: "$transactions" },
                                                                                                    count: { $sum: 1 }
                                                                                                }
                                                                                            }
                                                                                        ])
                                                                                        .exec()
                                                                                        .then(orange => {
                                                                                            console.log('orange in else', orange);

                                                                                            if (orange.length > 0) {
                                                                                                var transactions = orange[0].transactions
                                                                                                console.log("transactions length " + transactions.length)
                                                                                                if (transactions.length > 0) {

                                                                                                    var test = []
                                                                                                    var final_amount = 0
                                                                                                    var transaction_id = ""

                                                                                                    transactions.map(notify => {
                                                                                                        var transaction_date = notify.date_of_transaction
                                                                                                        var transaction_dates = transaction_date.setHours(0, 0, 0, 0)

                                                                                                        console.log('date of transaction ' + transaction_dates)
                                                                                                        console.log('date of today ' + Date.parse(date_today))

                                                                                                        if (transaction_dates == Date.parse(date_today)) {
                                                                                                            test.push(ObjectId(notify._id))
                                                                                                            final_amount = parseInt(final_amount) + parseInt(notify.amount)

                                                                                                        }
                                                                                                    })

                                                                                                    console.log('total ids ' + test)

                                                                                                    userTransactions.findOneAndUpdate({ userid: ObjectId(Useriv_acountid) }, {
                                                                                                        $pull: {
                                                                                                            transactions: { _id: { $in: test } }
                                                                                                        }
                                                                                                    }).exec().then(d => {
                                                                                                        userTransactions.findOneAndUpdate({ userid: ObjectId(Useriv_acountid) }, {
                                                                                                                $push: {
                                                                                                                    transactions: {
                                                                                                                        date_of_transaction: Date.now(),
                                                                                                                        amount: parseInt(final_amount) + parseInt(amount),
                                                                                                                        mode: mode,
                                                                                                                        transaction_type: "credit",
                                                                                                                        action: "record_view",
                                                                                                                        message: "Talent points credited to your account",
                                                                                                                        transaction_id: transaction_id
                                                                                                                    }
                                                                                                                }
                                                                                                            })
                                                                                                            .exec().then(x => {
                                                                                                                callback();
                                                                                                            }).catch(err => {

                                                                                                            })
                                                                                                    }).catch(err => {
                                                                                                        console.log(err);
                                                                                                    })


                                                                                                } else {
                                                                                                    callback();
                                                                                                    // userTransactions.findOneAndUpdate({userid: ObjectId(Useriv_acountid)},
                                                                                                    //     {
                                                                                                    //         $push: {
                                                                                                    //             transactions: {
                                                                                                    //                 date_of_transaction: Date.now(),
                                                                                                    //                 amount: parseInt(amount),
                                                                                                    //                 mode: mode,
                                                                                                    //                 transaction_type: "credit",
                                                                                                    //                 action: "record_view",
                                                                                                    //                 message: "Talent points credited to your account",
                                                                                                    //                 transaction_id: transaction_id
                                                                                                    //             }
                                                                                                    //         }
                                                                                                    //     })
                                                                                                    //  .exec()


                                                                                                }
                                                                                            } else {
                                                                                                console.log("counter value", counter++);
                                                                                                userTransactions.findOneAndUpdate({ userid: ObjectId(Useriv_acountid) }, {
                                                                                                        $push: {
                                                                                                            transactions: {
                                                                                                                date_of_transaction: Date.now(),
                                                                                                                amount: parseInt(amount),
                                                                                                                mode: mode,
                                                                                                                transaction_type: "credit",
                                                                                                                action: "record_view",
                                                                                                                message: "Talent points credited to your account",
                                                                                                                transaction_id: transaction_id
                                                                                                            }
                                                                                                        }
                                                                                                    }, { upsert: true })
                                                                                                    .exec().then(x => {
                                                                                                        console.log('callback entered');
                                                                                                        callback();
                                                                                                    })
                                                                                            }

                                                                                        }).catch(err => {
                                                                                            console.log(err)
                                                                                            // var spliterror = err.message.split(":")
                                                                                            // res.status(500).json({
                                                                                            //     status: 'Failed',
                                                                                            //     message: spliterror[0]
                                                                                            // });
                                                                                        });
                                                                                } else {
                                                                                    callback();
                                                                                }


                                                                            } else {
                                                                                callback();
                                                                            }

                                                                        })
                                                                }).catch(err => {
                                                                    console.log(err);
                                                                })
                                                        }).catch(err => {
                                                            console.log(err);
                                                        })
                                                } else {
                                                    callback();
                                                }
                                            }
                                        },
                                        function(err) {
                                            console.log('above_30 done!!!');
                                            cb_serial(null, "above30");
                                        });
                                } else {
                                    cb_serial(null, "above30");
                                }

                            },

                            function div11_fun(cb_serial) {
                                console.log('div11', div11)
                                if (div11.length > 0) {
                                    async.eachSeries(div11, function(data, callback) {
                                            console.log("div11 data", data);
                                            var Useriv_acountid = data.iv_acountid
                                            var user_random = Math.floor(Math.random() * 9) + 3
                                            var random_views = Math.floor(Math.random() * 600) + 270
                                            if (data.no_views < random_views) {
                                                iv_feeds.findOneAndUpdate({ _id: ObjectId(data._id) }, { $inc: { no_views: user_random1 } })
                                                    .exec()
                                                    .then(dex => {

                                                        userDetails.findOneAndUpdate({ userid: Useriv_acountid }, { $inc: { t_views: user_random1 } })
                                                            .exec().then(updatedata => {
                                                                userDetails.find({ userid: Useriv_acountid })
                                                                    .exec()
                                                                    .then(docsFetch => {
                                                                        var fetchView = docsFetch[0].t_views;
                                                                        var dividedByView = []
                                                                        var addTalentPoint = 0
                                                                        var remainViewPoint = 0

                                                                        if (fetchView >= 10) {


                                                                            var dividedByView1 = fetchView / 10
                                                                            console.log(dividedByView1);
                                                                            dividedByView.push(dividedByView1);

                                                                            if (String(dividedByView1).indexOf('.') != -1) {

                                                                                var splitViews = String(dividedByView1).split('.');
                                                                                addTalentPoint = parseInt(splitViews[0]);
                                                                                remainViewPoint = parseInt(fetchView) - parseInt(addTalentPoint) * 10;
                                                                            } else {

                                                                                if (dividedByView1 === 1) {
                                                                                    var addTalentPoint = 1;
                                                                                    remainViewPoint = 0;
                                                                                }

                                                                            }
                                                                            if (remainViewPoint === null) {
                                                                                remainViewPoint = 0
                                                                            }

                                                                            userDetails.findOneAndUpdate({ userid: Useriv_acountid }, {
                                                                                    $inc: { talent_points: addTalentPoint },
                                                                                    $set: { t_views: remainViewPoint }
                                                                                })
                                                                                .exec()
                                                                            var day = new Date()
                                                                            day = day.toISOString()
                                                                            day = String(day).split("T")
                                                                            day = day[0].replace(/-/g, "")
                                                                            var amount = parseInt(addTalentPoint)
                                                                            var mode = "talent"
                                                                            var transaction_id = day + Math.floor(10000000000 + Math.random() * 90000000000);

                                                                            if (amount > 0) {
                                                                                console.log('amount greater than 0');
                                                                                userTransactions.aggregate([
                                                                                        { $match: { userid: ObjectId(Useriv_acountid) } },
                                                                                        { $unwind: "$transactions" },
                                                                                        {
                                                                                            $match: {
                                                                                                $and: [{ "transactions.mode": "talent" },
                                                                                                    { "transactions.action": "record_view" }
                                                                                                ]
                                                                                            }
                                                                                        },
                                                                                        {
                                                                                            $group: {
                                                                                                _id: "$userid",
                                                                                                transactions: { $addToSet: "$transactions" },
                                                                                                count: { $sum: 1 }
                                                                                            }
                                                                                        }
                                                                                    ])
                                                                                    .exec()
                                                                                    .then(orange => {
                                                                                        console.log('orange in else', orange);

                                                                                        if (orange.length > 0) {
                                                                                            var transactions = orange[0].transactions
                                                                                            console.log("transactions length " + transactions.length)
                                                                                            if (transactions.length > 0) {

                                                                                                var test = []
                                                                                                var final_amount = 0
                                                                                                var transaction_id = ""

                                                                                                transactions.map(notify => {
                                                                                                    var transaction_date = notify.date_of_transaction
                                                                                                    var transaction_dates = transaction_date.setHours(0, 0, 0, 0)

                                                                                                    console.log('date of transaction ' + transaction_dates)
                                                                                                    console.log('date of today ' + Date.parse(date_today))

                                                                                                    if (transaction_dates == Date.parse(date_today)) {
                                                                                                        test.push(ObjectId(notify._id))
                                                                                                        final_amount = parseInt(final_amount) + parseInt(notify.amount)

                                                                                                    }
                                                                                                })

                                                                                                console.log('total ids ' + test)

                                                                                                userTransactions.findOneAndUpdate({ userid: ObjectId(Useriv_acountid) }, {
                                                                                                    $pull: {
                                                                                                        transactions: { _id: { $in: test } }
                                                                                                    }
                                                                                                }).exec().then(d => {
                                                                                                    userTransactions.findOneAndUpdate({ userid: ObjectId(Useriv_acountid) }, {
                                                                                                            $push: {
                                                                                                                transactions: {
                                                                                                                    date_of_transaction: Date.now(),
                                                                                                                    amount: parseInt(final_amount) + parseInt(amount),
                                                                                                                    mode: mode,
                                                                                                                    transaction_type: "credit",
                                                                                                                    action: "record_view",
                                                                                                                    message: "Talent points credited to your account",
                                                                                                                    transaction_id: transaction_id
                                                                                                                }
                                                                                                            }
                                                                                                        })
                                                                                                        .exec().then(x => {
                                                                                                            callback();
                                                                                                        }).catch(err => {

                                                                                                        })
                                                                                                }).catch(err => {
                                                                                                    console.log(err);
                                                                                                })


                                                                                            } else {
                                                                                                callback();
                                                                                                // userTransactions.findOneAndUpdate({userid: ObjectId(Useriv_acountid)},
                                                                                                //     {
                                                                                                //         $push: {
                                                                                                //             transactions: {
                                                                                                //                 date_of_transaction: Date.now(),
                                                                                                //                 amount: parseInt(amount),
                                                                                                //                 mode: mode,
                                                                                                //                 transaction_type: "credit",
                                                                                                //                 action: "record_view",
                                                                                                //                 message: "Talent points credited to your account",
                                                                                                //                 transaction_id: transaction_id
                                                                                                //             }
                                                                                                //         }
                                                                                                //     })
                                                                                                //  .exec()


                                                                                            }
                                                                                        } else {
                                                                                            console.log("counter value", counter++);
                                                                                            userTransactions.findOneAndUpdate({ userid: ObjectId(Useriv_acountid) }, {
                                                                                                    $push: {
                                                                                                        transactions: {
                                                                                                            date_of_transaction: Date.now(),
                                                                                                            amount: parseInt(amount),
                                                                                                            mode: mode,
                                                                                                            transaction_type: "credit",
                                                                                                            action: "record_view",
                                                                                                            message: "Talent points credited to your account",
                                                                                                            transaction_id: transaction_id
                                                                                                        }
                                                                                                    }
                                                                                                }, { upsert: true })
                                                                                                .exec().then(x => {
                                                                                                    console.log('callback entered');
                                                                                                    callback();
                                                                                                })
                                                                                        }

                                                                                    }).catch(err => {
                                                                                        console.log(err)
                                                                                        // var spliterror = err.message.split(":")
                                                                                        // res.status(500).json({
                                                                                        //     status: 'Failed',
                                                                                        //     message: spliterror[0]
                                                                                        // });
                                                                                    });
                                                                            } else {
                                                                                callback();
                                                                            }


                                                                        } else {
                                                                            callback();
                                                                        }

                                                                    })
                                                            }).catch(err => {
                                                                console.log(err);
                                                            })
                                                    }).catch(err => {
                                                        console.log(err);
                                                    })
                                            } else {
                                                callback();
                                            }
                                        },
                                        function(err) {
                                            console.log('div11 done!!!');
                                            cb_serial(null, "div11");
                                        });
                                } else {
                                    cb_serial(null, "div11");
                                }

                            },

                            function divSeven_fun(cb_serial) {
                                console.log('divSeven', divSeven)
                                if (divSeven.length > 0) {
                                    async.eachSeries(divSeven, function(data, callback) {
                                            console.log("divSeven data", data);
                                            var Useriv_acountid = data.iv_acountid
                                            var user_random = Math.floor(Math.random() * 4) + 1
                                            var random_views = Math.floor(Math.random() * 600) + 270
                                            if (data.no_views < random_views) {
                                                iv_feeds.findOneAndUpdate({ _id: ObjectId(data._id) }, { $inc: { no_views: user_random1 } })
                                                    .exec()
                                                    .then(dex => {

                                                        userDetails.findOneAndUpdate({ userid: Useriv_acountid }, { $inc: { t_views: user_random1 } })
                                                            .exec().then(updatedata => {
                                                                userDetails.find({ userid: Useriv_acountid })
                                                                    .exec()
                                                                    .then(docsFetch => {
                                                                        var fetchView = docsFetch[0].t_views;
                                                                        var dividedByView = []
                                                                        var addTalentPoint = 0
                                                                        var remainViewPoint = 0

                                                                        if (fetchView >= 10) {


                                                                            var dividedByView1 = fetchView / 10
                                                                            console.log(dividedByView1);
                                                                            dividedByView.push(dividedByView1);

                                                                            if (String(dividedByView1).indexOf('.') != -1) {

                                                                                var splitViews = String(dividedByView1).split('.');
                                                                                addTalentPoint = parseInt(splitViews[0]);
                                                                                remainViewPoint = parseInt(fetchView) - parseInt(addTalentPoint) * 10;
                                                                            } else {

                                                                                if (dividedByView1 === 1) {
                                                                                    var addTalentPoint = 1;
                                                                                    remainViewPoint = 0;
                                                                                }

                                                                            }
                                                                            if (remainViewPoint === null) {
                                                                                remainViewPoint = 0
                                                                            }

                                                                            userDetails.findOneAndUpdate({ userid: Useriv_acountid }, {
                                                                                    $inc: { talent_points: addTalentPoint },
                                                                                    $set: { t_views: remainViewPoint }
                                                                                })
                                                                                .exec()
                                                                            var day = new Date()
                                                                            day = day.toISOString()
                                                                            day = String(day).split("T")
                                                                            day = day[0].replace(/-/g, "")
                                                                            var amount = parseInt(addTalentPoint)
                                                                            var mode = "talent"
                                                                            var transaction_id = day + Math.floor(10000000000 + Math.random() * 90000000000);

                                                                            if (amount > 0) {
                                                                                console.log('amount greater than 0');
                                                                                userTransactions.aggregate([
                                                                                        { $match: { userid: ObjectId(Useriv_acountid) } },
                                                                                        { $unwind: "$transactions" },
                                                                                        {
                                                                                            $match: {
                                                                                                $and: [{ "transactions.mode": "talent" },
                                                                                                    { "transactions.action": "record_view" }
                                                                                                ]
                                                                                            }
                                                                                        },
                                                                                        {
                                                                                            $group: {
                                                                                                _id: "$userid",
                                                                                                transactions: { $addToSet: "$transactions" },
                                                                                                count: { $sum: 1 }
                                                                                            }
                                                                                        }
                                                                                    ])
                                                                                    .exec()
                                                                                    .then(orange => {
                                                                                        console.log('orange in else', orange);

                                                                                        if (orange.length > 0) {
                                                                                            var transactions = orange[0].transactions
                                                                                            console.log("transactions length " + transactions.length)
                                                                                            if (transactions.length > 0) {

                                                                                                var test = []
                                                                                                var final_amount = 0
                                                                                                var transaction_id = ""

                                                                                                transactions.map(notify => {
                                                                                                    var transaction_date = notify.date_of_transaction
                                                                                                    var transaction_dates = transaction_date.setHours(0, 0, 0, 0)

                                                                                                    console.log('date of transaction ' + transaction_dates)
                                                                                                    console.log('date of today ' + Date.parse(date_today))

                                                                                                    if (transaction_dates == Date.parse(date_today)) {
                                                                                                        test.push(ObjectId(notify._id))
                                                                                                        final_amount = parseInt(final_amount) + parseInt(notify.amount)

                                                                                                    }
                                                                                                })

                                                                                                console.log('total ids ' + test)

                                                                                                userTransactions.findOneAndUpdate({ userid: ObjectId(Useriv_acountid) }, {
                                                                                                    $pull: {
                                                                                                        transactions: { _id: { $in: test } }
                                                                                                    }
                                                                                                }).exec().then(d => {
                                                                                                    userTransactions.findOneAndUpdate({ userid: ObjectId(Useriv_acountid) }, {
                                                                                                            $push: {
                                                                                                                transactions: {
                                                                                                                    date_of_transaction: Date.now(),
                                                                                                                    amount: parseInt(final_amount) + parseInt(amount),
                                                                                                                    mode: mode,
                                                                                                                    transaction_type: "credit",
                                                                                                                    action: "record_view",
                                                                                                                    message: "Talent points credited to your account",
                                                                                                                    transaction_id: transaction_id
                                                                                                                }
                                                                                                            }
                                                                                                        })
                                                                                                        .exec().then(x => {
                                                                                                            callback();
                                                                                                        }).catch(err => {

                                                                                                        })
                                                                                                }).catch(err => {
                                                                                                    console.log(err);
                                                                                                })


                                                                                            } else {
                                                                                                callback();
                                                                                                // userTransactions.findOneAndUpdate({userid: ObjectId(Useriv_acountid)},
                                                                                                //     {
                                                                                                //         $push: {
                                                                                                //             transactions: {
                                                                                                //                 date_of_transaction: Date.now(),
                                                                                                //                 amount: parseInt(amount),
                                                                                                //                 mode: mode,
                                                                                                //                 transaction_type: "credit",
                                                                                                //                 action: "record_view",
                                                                                                //                 message: "Talent points credited to your account",
                                                                                                //                 transaction_id: transaction_id
                                                                                                //             }
                                                                                                //         }
                                                                                                //     })
                                                                                                //  .exec()


                                                                                            }
                                                                                        } else {
                                                                                            console.log("counter value", counter++);
                                                                                            userTransactions.findOneAndUpdate({ userid: ObjectId(Useriv_acountid) }, {
                                                                                                    $push: {
                                                                                                        transactions: {
                                                                                                            date_of_transaction: Date.now(),
                                                                                                            amount: parseInt(amount),
                                                                                                            mode: mode,
                                                                                                            transaction_type: "credit",
                                                                                                            action: "record_view",
                                                                                                            message: "Talent points credited to your account",
                                                                                                            transaction_id: transaction_id
                                                                                                        }
                                                                                                    }
                                                                                                }, { upsert: true })
                                                                                                .exec().then(x => {
                                                                                                    console.log('callback entered');
                                                                                                    callback();
                                                                                                })
                                                                                        }

                                                                                    }).catch(err => {
                                                                                        console.log(err)
                                                                                        // var spliterror = err.message.split(":")
                                                                                        // res.status(500).json({
                                                                                        //     status: 'Failed',
                                                                                        //     message: spliterror[0]
                                                                                        // });
                                                                                    });
                                                                            } else {
                                                                                callback();
                                                                            }


                                                                        } else {
                                                                            callback();
                                                                        }

                                                                    })
                                                            }).catch(err => {
                                                                console.log(err);
                                                            })
                                                    }).catch(err => {
                                                        console.log(err);
                                                    })
                                            } else {
                                                callback();
                                            }
                                        },
                                        function(err) {
                                            console.log('div7 done!!!');
                                            cb_serial(null, "div7");
                                        });
                                } else {
                                    cb_serial(null, "div7");
                                }

                            },

                            function div4_fun(cb_serial) {
                                console.log('div4', div4)
                                if (div4.length > 0) {
                                    async.eachSeries(div4, function(data, callback) {
                                            console.log("divSeven data", data);
                                            var Useriv_acountid = data.iv_acountid
                                            var user_random = Math.floor(Math.random() * 18) + 1
                                            var random_views = Math.floor(Math.random() * 600) + 270
                                            if (data.no_views < random_views) {
                                                iv_feeds.findOneAndUpdate({ _id: ObjectId(data._id) }, { $inc: { no_views: user_random1 } })
                                                    .exec()
                                                    .then(dex => {

                                                        userDetails.findOneAndUpdate({ userid: Useriv_acountid }, { $inc: { t_views: user_random1 } })
                                                            .exec().then(updatedata => {
                                                                userDetails.find({ userid: Useriv_acountid })
                                                                    .exec()
                                                                    .then(docsFetch => {
                                                                        var fetchView = docsFetch[0].t_views;
                                                                        var dividedByView = []
                                                                        var addTalentPoint = 0
                                                                        var remainViewPoint = 0

                                                                        if (fetchView >= 10) {


                                                                            var dividedByView1 = fetchView / 10
                                                                            console.log(dividedByView1);
                                                                            dividedByView.push(dividedByView1);

                                                                            if (String(dividedByView1).indexOf('.') != -1) {

                                                                                var splitViews = String(dividedByView1).split('.');
                                                                                addTalentPoint = parseInt(splitViews[0]);
                                                                                remainViewPoint = parseInt(fetchView) - parseInt(addTalentPoint) * 10;
                                                                            } else {

                                                                                if (dividedByView1 === 1) {
                                                                                    var addTalentPoint = 1;
                                                                                    remainViewPoint = 0;
                                                                                }

                                                                            }
                                                                            if (remainViewPoint === null) {
                                                                                remainViewPoint = 0
                                                                            }

                                                                            userDetails.findOneAndUpdate({ userid: Useriv_acountid }, {
                                                                                    $inc: { talent_points: addTalentPoint },
                                                                                    $set: { t_views: remainViewPoint }
                                                                                })
                                                                                .exec()
                                                                            var day = new Date()
                                                                            day = day.toISOString()
                                                                            day = String(day).split("T")
                                                                            day = day[0].replace(/-/g, "")
                                                                            var amount = parseInt(addTalentPoint)
                                                                            var mode = "talent"
                                                                            var transaction_id = day + Math.floor(10000000000 + Math.random() * 90000000000);

                                                                            if (amount > 0) {
                                                                                console.log('amount greater than 0');
                                                                                userTransactions.aggregate([
                                                                                        { $match: { userid: ObjectId(Useriv_acountid) } },
                                                                                        { $unwind: "$transactions" },
                                                                                        {
                                                                                            $match: {
                                                                                                $and: [{ "transactions.mode": "talent" },
                                                                                                    { "transactions.action": "record_view" }
                                                                                                ]
                                                                                            }
                                                                                        },
                                                                                        {
                                                                                            $group: {
                                                                                                _id: "$userid",
                                                                                                transactions: { $addToSet: "$transactions" },
                                                                                                count: { $sum: 1 }
                                                                                            }
                                                                                        }
                                                                                    ])
                                                                                    .exec()
                                                                                    .then(orange => {
                                                                                        console.log('orange in else', orange);

                                                                                        if (orange.length > 0) {
                                                                                            var transactions = orange[0].transactions
                                                                                            console.log("transactions length " + transactions.length)
                                                                                            if (transactions.length > 0) {

                                                                                                var test = []
                                                                                                var final_amount = 0
                                                                                                var transaction_id = ""

                                                                                                transactions.map(notify => {
                                                                                                    var transaction_date = notify.date_of_transaction
                                                                                                    var transaction_dates = transaction_date.setHours(0, 0, 0, 0)

                                                                                                    console.log('date of transaction ' + transaction_dates)
                                                                                                    console.log('date of today ' + Date.parse(date_today))

                                                                                                    if (transaction_dates == Date.parse(date_today)) {
                                                                                                        test.push(ObjectId(notify._id))
                                                                                                        final_amount = parseInt(final_amount) + parseInt(notify.amount)

                                                                                                    }
                                                                                                })

                                                                                                console.log('total ids ' + test)

                                                                                                userTransactions.findOneAndUpdate({ userid: ObjectId(Useriv_acountid) }, {
                                                                                                    $pull: {
                                                                                                        transactions: { _id: { $in: test } }
                                                                                                    }
                                                                                                }).exec().then(d => {
                                                                                                    userTransactions.findOneAndUpdate({ userid: ObjectId(Useriv_acountid) }, {
                                                                                                            $push: {
                                                                                                                transactions: {
                                                                                                                    date_of_transaction: Date.now(),
                                                                                                                    amount: parseInt(final_amount) + parseInt(amount),
                                                                                                                    mode: mode,
                                                                                                                    transaction_type: "credit",
                                                                                                                    action: "record_view",
                                                                                                                    message: "Talent points credited to your account",
                                                                                                                    transaction_id: transaction_id
                                                                                                                }
                                                                                                            }
                                                                                                        })
                                                                                                        .exec().then(x => {
                                                                                                            callback();
                                                                                                        }).catch(err => {

                                                                                                        })
                                                                                                }).catch(err => {
                                                                                                    console.log(err);
                                                                                                })


                                                                                            } else {
                                                                                                callback();
                                                                                                // userTransactions.findOneAndUpdate({userid: ObjectId(Useriv_acountid)},
                                                                                                //     {
                                                                                                //         $push: {
                                                                                                //             transactions: {
                                                                                                //                 date_of_transaction: Date.now(),
                                                                                                //                 amount: parseInt(amount),
                                                                                                //                 mode: mode,
                                                                                                //                 transaction_type: "credit",
                                                                                                //                 action: "record_view",
                                                                                                //                 message: "Talent points credited to your account",
                                                                                                //                 transaction_id: transaction_id
                                                                                                //             }
                                                                                                //         }
                                                                                                //     })
                                                                                                //  .exec()


                                                                                            }
                                                                                        } else {
                                                                                            console.log("counter value", counter++);
                                                                                            userTransactions.findOneAndUpdate({ userid: ObjectId(Useriv_acountid) }, {
                                                                                                    $push: {
                                                                                                        transactions: {
                                                                                                            date_of_transaction: Date.now(),
                                                                                                            amount: parseInt(amount),
                                                                                                            mode: mode,
                                                                                                            transaction_type: "credit",
                                                                                                            action: "record_view",
                                                                                                            message: "Talent points credited to your account",
                                                                                                            transaction_id: transaction_id
                                                                                                        }
                                                                                                    }
                                                                                                }, { upsert: true })
                                                                                                .exec().then(x => {
                                                                                                    console.log('callback entered');
                                                                                                    callback();
                                                                                                })
                                                                                        }

                                                                                    }).catch(err => {
                                                                                        console.log(err)
                                                                                        // var spliterror = err.message.split(":")
                                                                                        // res.status(500).json({
                                                                                        //     status: 'Failed',
                                                                                        //     message: spliterror[0]
                                                                                        // });
                                                                                    });
                                                                            } else {
                                                                                callback();
                                                                            }


                                                                        } else {
                                                                            callback();
                                                                        }

                                                                    })
                                                            }).catch(err => {
                                                                console.log(err);
                                                            })
                                                    }).catch(err => {
                                                        console.log(err);
                                                    })
                                            } else {
                                                callback();
                                            }
                                        },
                                        function(err) {
                                            console.log('div4 done!!!');
                                            cb_serial(null, "div4");
                                        });
                                } else {
                                    cb_serial(null, "div4");
                                }
                            }
                        ];

                        async.series(tasks,
                            function(err, cb_serial_results) {
                                console.log("cb_serial_results", cb_serial_results);
                                mainCallback();
                            });


                        // Below 30 feeds
                        below_30 = below_30.sort(function() {
                            return 0.5 - Math.random()
                        });
                        var rands = below_30[Math.floor(Math.random() * below_30.length)];

                        below_30.slice(0, rands)

                        var divSeven_below = below_30.filter(x => x % 5 === 0);
                        var div11_below = below_30.filter(x => x % 13 === 0);
                        var div4_below = below_30.filter(x => x % 8 === 0);

                        below_30 = below_30.filter(f => !divSeven_below.includes(f));
                        below_30 = below_30.filter(f => !div11_below.includes(f));
                        below_30 = below_30.filter(f => !div4_below.includes(f));
                        console.log("below 30", below_30, "divSeven_below", divSeven_below, "div11_below", div11_below, "div4_below", div4_below);
                        below_30.map(data => {
                            var Useriv_acountid = data.iv_acountid
                            var user_random = Math.floor(Math.random() * 15) + 1
                            var user_random1 = Math.floor(Math.random() * 6) + 1
                            var random_views = Math.floor(Math.random() * 600) + 270
                            var duration = parseInt(data.video_duration)
                            var time = Date.parse(dateNow) - Date.parse(data.feed_post_create);
                            var hours1 = Math.floor((time / (1000 * 60 * 60)) % 24);
                            var minutes = Math.floor((time / (1000 * 60)) % 60)

                            if (data.no_views < random_views && (hours1 > 1 && hours1 < 2 || hours1 > 7 && hours1 < 24)) {
                                iv_feeds.findOneAndUpdate({ _id: ObjectId(data._id) }, { $inc: { no_views: user_random } })
                                    .exec()
                                    .then(dex => {

                                        userDetails.findOneAndUpdate({ userid: Useriv_acountid }, { $inc: { t_views: user_random1 } })
                                            .exec();
                                    })
                            } else {
                                if (data.no_views < random_views) {
                                    iv_feeds.findOneAndUpdate({ _id: ObjectId(data._id) }, { $inc: { no_views: user_random1 } })
                                        .exec()
                                        .then(dex => {

                                            userDetails.findOneAndUpdate({ userid: Useriv_acountid }, { $inc: { t_views: user_random } })
                                                .exec();
                                        })
                                }

                            }
                        })

                        div11_below.map(data => {

                            console.log('777')
                            var Useriv_acountid = data.iv_acountid
                            var user_random = Math.floor(Math.random() * 2) + 1
                            var random_views = Math.floor(Math.random() * 600) + 270

                            if (data.no_views < random_views) {
                                iv_feeds.findOneAndUpdate({ _id: ObjectId(data._id) }, { $inc: { no_views: user_random } })
                                    .exec()
                                    .then(dex => {

                                        userDetails.findOneAndUpdate({ userid: Useriv_acountid }, { $inc: { t_views: user_random } })
                                            .exec();
                                    })
                            }
                        })

                        divSeven_below.map(data => {
                            console.log('8888')
                            var Useriv_acountid = data.iv_acountid
                            var user_random = Math.floor(Math.random() * 8) + 12
                            var random_views = Math.floor(Math.random() * 600) + 270

                            if (data.no_views < random_views) {
                                iv_feeds.findOneAndUpdate({ _id: ObjectId(data._id) }, { $inc: { no_views: user_random } })
                                    .exec()
                                    .then(dex => {

                                        userDetails.findOneAndUpdate({ userid: Useriv_acountid }, { $inc: { t_views: user_random } })
                                            .exec();

                                    })
                            }
                        })

                        div4_below.map(data => {
                            console.log('9999')
                            var Useriv_acountid = data.iv_acountid
                            var user_random = Math.floor(Math.random() * 4) + 1
                            var random_views = Math.floor(Math.random() * 600) + 270


                            if (data.no_views < random_views) {

                                iv_feeds.findOneAndUpdate({ _id: ObjectId(data._id) }, { $inc: { no_views: user_random } })
                                    .exec()
                                    .then(dex => {
                                        userDetails.findOneAndUpdate({ userid: Useriv_acountid }, { $inc: { t_views: user_random } })
                                            .exec();
                                    })
                            }
                        })

                    } else {
                        mainCallback()
                    }
                },
                function(err) {
                    console.log('Main done!!!');
                });

        }).catch(err => {
            console.log(err)
        })
});


router.get("/feed_count_static", (req, res, next) => {

    iv_feeds.aggregate([{
                $match: {
                    $and: [{ 'feed_type': "video" },
                        { 'privacy_mode': 1 },
                        { 'feed_expiry_status': '0' }, { 'is_static_feed': true }
                        // {iv_acountid: ObjectId('5cb4932dfaf7ca15e014a4d0')}
                    ]
                }
            },
            {
                $group: {
                    _id: "$iv_acountid",
                    feeds: {
                        $addToSet: {
                            _id: '$_id',
                            iv_acountid: '$iv_acountid',
                            feed_post_create: '$feed_post_create',
                            video_duration: '$video_duration',
                            no_views: '$no_views',
                            feed_desc: '$feed_desc'
                        }
                    },
                    count: { $sum: 1 }
                }
            }
        ]).exec()
        .then(userwise_feeds_data => {
            // console.log(userwise_feeds_data)
            // return res.send("completed");
            async.each(userwise_feeds_data, function(item, mainCallback) {
                    var datas = item.feeds;
                    var above_30 = []
                    var below_30 = []
                    var dateNow = new Date()
                    var date_today = new Date()
                    date_today.toISOString()
                    date_today.setHours(0, 0, 0, 0)
                    if (datas.length > 0) {
                        datas.map(docs => {

                            var duration = parseInt(docs.video_duration)
                            //console.log(duration);
                            var indiaTime = docs.feed_post_create
                            var time = Date.parse(dateNow) - Date.parse(indiaTime);
                            //console.log("today date" + dateNow)
                           // console.log("created date" + indiaTime)
                           // console.log("time diff " + time)
                            var minutes = Math.floor((time / (1000 * 60)) % 60)
                            console.log("minutes " + minutes)
                            if (minutes >= 2) {
                                below_30.push(docs)
                            } else {}

                        })

                        // console.log("above 30 length "+above_30.length)
                        // console.log("below 30 length "+below_30.length)


                        // Below 30 feeds
                        below_30 = below_30.sort(function() {
                            return 0.5 - Math.random()
                        });
                        var rands = below_30[Math.floor(Math.random() * below_30.length)];

                        below_30.slice(0, rands)

                        var divSeven_below = below_30.filter(x => x % 5 === 0);
                        var div11_below = below_30.filter(x => x % 13 === 0);
                        var div4_below = below_30.filter(x => x % 8 === 0);

                        below_30 = below_30.filter(f => !divSeven_below.includes(f));
                        below_30 = below_30.filter(f => !div11_below.includes(f));
                        below_30 = below_30.filter(f => !div4_below.includes(f));
                       // console.log("below 30", below_30, "divSeven_below", divSeven_below, "div11_below", div11_below, "div4_below", div4_below);
                        below_30.map(data => {
                            var Useriv_acountid = data.iv_acountid
                            var user_random = Math.floor(Math.random() * 4) + 1
                            var user_random1 = Math.floor(Math.random() * 15) + 1
                            var random_views = Math.floor(Math.random() * 600) + 270
                            var duration = parseInt(data.video_duration)
                            var time = Date.parse(dateNow) - Date.parse(data.feed_post_create);
                            var hours1 = Math.floor((time / (1000 * 60 * 60)) % 24);
                            var minutes = Math.floor((time / (1000 * 60)) % 60)

                            if (data.no_views < random_views && (hours1 > 1 && hours1 < 2 || hours1 > 7 && hours1 < 24)) {
                                iv_feeds.findOneAndUpdate({ _id: ObjectId(data._id) }, { $inc: { no_views: user_random } })
                                    .exec()
                                    .then(dex => {

                                        userDetails.findOneAndUpdate({ userid: Useriv_acountid }, { $inc: { t_views: user_random } })
                                            .exec();
                                    })
                            }
                        })

                        div11_below.map(data => {

                            console.log('777')
                            var Useriv_acountid = data.iv_acountid
                            var user_random = Math.floor(Math.random() * 2) + 1
                            var random_views = Math.floor(Math.random() * 600) + 270

                            if (data.no_views < random_views) {
                                iv_feeds.findOneAndUpdate({ _id: ObjectId(data._id) }, { $inc: { no_views: user_random } })
                                    .exec()
                                    .then(dex => {

                                        userDetails.findOneAndUpdate({ userid: Useriv_acountid }, { $inc: { t_views: user_random } })
                                            .exec();
                                    })
                            }
                        })

                        divSeven_below.map(data => {
                            console.log('8888')
                            var Useriv_acountid = data.iv_acountid
                            var user_random = Math.floor(Math.random() * 8) + 12
                            var random_views = Math.floor(Math.random() * 600) + 270

                            if (data.no_views < random_views) {
                                iv_feeds.findOneAndUpdate({ _id: ObjectId(data._id) }, { $inc: { no_views: user_random } })
                                    .exec()
                                    .then(dex => {

                                        userDetails.findOneAndUpdate({ userid: Useriv_acountid }, { $inc: { t_views: user_random } })
                                            .exec();

                                    })
                            }
                        })

                        div4_below.map(data => {
                            console.log('9999')
                            var Useriv_acountid = data.iv_acountid
                            var user_random = Math.floor(Math.random() * 4) + 1
                            var random_views = Math.floor(Math.random() * 600) + 270


                            if (data.no_views < random_views) {

                                iv_feeds.findOneAndUpdate({ _id: ObjectId(data._id) }, { $inc: { no_views: user_random } })
                                    .exec()
                                    .then(dex => {
                                        userDetails.findOneAndUpdate({ userid: Useriv_acountid }, { $inc: { t_views: user_random } })
                                            .exec();
                                    })
                            }
                        })

                    } else {
                        mainCallback()
                    }
                },
                function(err) {
                    console.log('Main done!!!');
                });

        }).catch(err => {
            console.log(err)
        })
});


router.post("/update_lottery_details", (req, res, next) => {

    var keyArray = ["userid", "iv_token", "clientid", "offer_id"];
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
                        console.log("offer id " + req.body.offer_id)

                        userDetails.find({
                                userid: ObjectId(req.body.userid),
                                'offers_history.primary_offer': ObjectId(req.body.offer_id)
                            }, { 'offers_history.$': 1 , contests_won:1,contest_seen_on:1})
                            .exec()
                            .then(data => {
                                if (data.length > 0) {
                                    var offer_history = data[0].offers_history
                                    // userDetails.update({
                                    //         userid: ObjectId(req.body.userid),
                                    //         'offers_history.primary_offer': ObjectId(req.body.offer_id)
                                    //     }, { $set: { 'offers_history.$[].is_lottery_showed': true } }, { multi: true })

                                    userDetails.update(
                                        {$and: [ {userid: ObjectId(req.body.userid)},{'offers_history.primary_offer': ObjectId(req.body.offer_id)}]},
                                        {"$set": {"offers_history.$[elem].is_lottery_showed": true}},
                                        {
                                            "arrayFilters": [{'elem.primary_offer': ObjectId(req.body.offer_id)}],
                                            "multi": true
                                        })
                                        .exec()
                                        .then(docs => {
                                            if (docs === null) {
                                                res.status(200).json({
                                                    status: 'Failed',
                                                    message: "Please provide correct offer_id"
                                                });
                                            } else {
                                                res.status(200).json({
                                                    status: 'Ok',
                                                    message: "successfully updated lottery details."
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
                                else{
                                    userDetails.find({
                                        userid: ObjectId(req.body.userid),
                                        'contests_won.contest_id':req.body.offer_id
                                    }, { 'contests_won.$': 1 })
                                    .exec()
                                    .then(dex => {
                                        if (dex.length > 0) {
                                            var offer_history = dex[0].contests_won
                                            userDetails.update({
                                                    userid: ObjectId(req.body.userid),
                                                    'contests_won.contest_id': req.body.offer_id
                                                }, { $set: { 'contests_won.$.has_contest_seen': true , contest_seen_on:new Date() } }, { multi: true })
                                                .exec()
                                                .then(docs => {
                                                    if (docs === null) {
                                                        res.status(200).json({
                                                            status: 'Failed',
                                                            message: "Please provide correct contest_id"
                                                        });
                                                    } else {
                                                        res.status(200).json({
                                                            status: 'Ok',
                                                            message: "successfully updated lottery details."
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
                                        else{
                                            res.status(200).json({
                                                            status: 'Failed',
                                                            message: "Please provide correct id"
                                                        });
                                        }
                                    }).catch(err => {
                                        console.log(err)
                                        // var spliterror = err.message.split("_")
                                        // if (spliterror[1].indexOf("id") >= 0) {
                                        //     res.status(200).json({
                                        //         status: 'Failed',
                                        //         message: "Please provide correct userid"
                                        //     });
                                        // } else {
                                        //     res.status(500).json({
                                        //         status: 'Failed',
                                        //         message: err.message
                                        //     });
                                        // }
                                    });
                                }
                            }).catch(err => {
                                console.log(err)
                                // var spliterror = err.message.split("_")
                                // if (spliterror[1].indexOf("id") >= 0) {
                                //     res.status(200).json({
                                //         status: 'Failed',
                                //         message: "Please provide correct userid"
                                //     });
                                // } else {
                                //     res.status(500).json({
                                //         status: 'Failed',
                                //         message: err.message
                                //     });
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

router.get("/primary_offer_lottery", (req, res, next) => {

    var day = new Date()
    day = day.setDate(day.getDate() + 1)
    day = new Date(day).setHours(0, 0, 0, 0)
    var last_wk = new Date()
    var last_week = last_wk.setDate(last_wk.getDate() - 14)
    last_week = new Date(last_week).setHours(0, 0, 0, 0)

    primaryOfferLottery.find({ contest_date: { $gte: new Date(last_week), $lte: new Date(day) } })
        .exec()
        .then(dex => {

            var existing_users =[]

            if(dex.length > 0){
                dex.map(data =>{
                    var users = data.details
                    if(users.length > 0){
                        users.map(det =>{
                            existing_users.push(ObjectId(det.userid))
                        })
                    }
                })
            }

            //console.log(existing_users)

            userDetails.find({userid:{$nin:existing_users}, 'offer_details.is_primary_offer': true }, { 'offer_details.$': 1, userid: 1 })
                .exec()
                .then(docs => {
                    if (docs.length > 0) {
                        var users_arr = [];
                        docs.map((item) => {
                            var arr = [];
                            var test = [];
                            if (item.offer_details[0].contributions.length >= 1) {
                                for (var i = 0; i < item.offer_details[0].contributions.length; i++) {
                                    test.push(item.offer_details[0].contributions[i].cont_date.toISOString().split('T')[0]);
                                }
                                test.reduce((acc, date) => {
                                    const group = acc[acc.length - 1];
                                  //  if (moment(date).diff(moment(group[group.length - 2] || group[group.length - 1]), 'days') > 1) {
                                        acc.push([date])
                                    // } else {
                                    //     group.push(date);
                                    // }
                                    arr = acc
                                    return acc;
                                }, [
                                    []
                                ])
                                for (var i = 0; i < arr.length; i++) {
                                    console.log(arr[i]);
                                    if (arr[i].length >= 1) {

                                        var userid = ObjectId(item.userid)
                                        var primary_offer = ObjectId(item.offer_details[0].primary_offer);
                                        // console.log("userid", userid, "offer", primary_offer);
                                        var obj = {
                                            primary_offer: ObjectId(primary_offer),
                                            userid: ObjectId(userid)
                                        }
                                        users_arr.push(obj);
                                        break;
                                    }
                                }
                            }
                        });


                        if (users_arr.length > 0) {

                            // Shuffle array
                            var shuffled = users_arr.sort(() => 0.5 - Math.random());

                            // Get sub-array of first n elements after shuffled
                            var selected = shuffled.slice(0, 10);

                            async.each(selected, function(item, callback) {
                                    userDetails.findOneAndUpdate({ userid: item.userid }, {
                                            $push: {
                                                offers_history: {
                                                    primary_offer:item.primary_offer,
                                                    redeemed_on: Date.now(),
                                                    is_primary_offer: true,
                                                    pay_status: "completed",
                                                }
                                            },
                                            $pull: { offer_details: { primary_offer: item.primary_offer } }
                                        }, { new: true })
                                        .exec()
                                        .then(data => {
                                            callback();
                                        }).catch(err => {
                                            console.log(err)
                                        });
                                },
                                function(err) {
                                    if (err) {
                                        console.log(err);
                                        return;
                                    }
                                    
                                    var winners = new primaryOfferLottery({
                                        _id: new mongoose.Types.ObjectId(),
                                        contest_name:"Primary offer lottery",
                                        contest_date:new Date(),
                                        details:selected
                                    })

                                    winners.save()

                                    var announcement_text = new announcements({
                                            _id: new mongoose.Types.ObjectId(),
                                            ann_text: 'Winners of todays lottery are:',
                                            created_at:new Date(),
                                            ann_type:"primary_lottery"
                                    }) 

                                    announcement_text.save()

                                    res.json({
                                        status: 'OK',
                                        message: 'primary offer done'
                                    })
                                });
                        } else {
                            res.json({
                                status: 'OK',
                                message: 'no primary offer redeemed user...its done'
                            })
                        }

                    }
                }).catch(err => {
                    console.log(err)
                });
        })
        .catch(err => {
            console.log(err)
        })


});

router.get("/lottery_winners", (req, res, next) => {

    primaryOfferLottery.find({})
                        .populate('details.userid')
                        .sort({contest_date:-1})
                        .exec()
                        .then(docs =>{
                            if(docs.length > 0){

                                var data = docs[0]

                                var list = data.details
                                var final_list =[]
                                var myHTML = ""

                                list.map(dex =>{
                                    final_list.push(dex.userid.username)
                                    myHTML += dex.userid.username + "\n"
                                })

                                res.send(`<!DOCTYPE html>
                                                <html>
                                                <body>

                                                <h2>JavaScript For Loop</h2>

                                                <li>${myHTML}</li>

                                                </body>
                                                </html>`)
                            }
                        })
});

// router.get("/primary_offer_lottery_bak", (req, res, next) => {
//     // userDetails.find({'offer_details.is_primary_offer': true},
//     userDetails.find({'offer_details.is_primary_offer': true},
//         {'offer_details.$': 1})
//         .exec()
//         .then(docs => {
//             if (docs.length > 0) {
//                 var offer_details = docs[0].offer_details
//
//                 if (offer_details.length > 0) {
//
//                     var offer = offer_details[0].primary_offer
//
//                     userDetails.findOneAndUpdate({userid: ObjectId('5cb4932dfaf7ca15e014a4d0')},
//                         {
//                             $push: {
//                                 offers_history: {
//                                     primary_offer: ObjectId(offer),
//                                     redeemed_on: Date.now(),
//                                     is_primary_offer: true,
//                                     pay_status: "completed",
//                                 }
//                             }, $pull: {offer_details: {primary_offer: offer}}
//                         }, {new: true})
//                         .exec()
//                         .then(data => {
//                             console.log("primary offer done.")
//                         }).catch(err => {
//                         console.log(err)
//                     });
//                 }
//             }
//         }).catch(err => {
//         console.log(err)
//     });
//
// });

router.post("/consumeAnnouncement", (req, res, next) => {

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

                        userDetails.findOneAndUpdate({ userid: ObjectId(req.body.userid) }, { $set: { 'has_shown_announcements': true, announcement_seen_on: Date.now() } })
                            .exec()
                            .then(docs => {
                                if (docs === null) {
                                    res.status(200).json({
                                        status: 'Failed',
                                        message: "Please provide correct userid"
                                    });
                                } else {
                                    res.status(200).json({
                                        status: 'Ok',
                                        message: "successfully updated announcement details."
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


router.post("/consume_offer_announcement", (req, res, next) => {

    var keyArray = ["userid", "iv_token", "clientid", "offer_id"];
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

                        userDetails.findOneAndUpdate({ userid: ObjectId(req.body.userid) }, {
                                $set: {
                                    has_shown_offer: false, //false for production
                                    offer_seen_on: Date.now(),
                                    offer_seen: req.body.offer_id
                                }
                            })
                            .exec()
                            .then(docs => {
                                if (docs === null) {
                                    res.status(200).json({
                                        status: 'Failed',
                                        message: "Please provide correct userid"
                                    });
                                } else {
                                    res.status(200).json({
                                        status: 'Ok',
                                        message: "successfully updated Offer details."
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


router.post("/consume_showcase_view", (req, res, next) => {

    var keyArray = ["userid", "iv_token", "clientid", "screentype"];
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


                        if (req.body.screentype === 'feed_list_screen') {
                            userDetails.findOneAndUpdate({ userid: ObjectId(req.body.userid) }, { $set: { 'showcase_details.home': true } })
                                .exec()
                                .then(docs => {
                                    res.status(200).json({
                                        status: 'Ok',
                                        message: "successfully updated showcase details."
                                    });

                                }).catch(err => {
                                    var spliterror = err.message.split(":")
                                    res.status(500).json({
                                        status: 'Failed',
                                        message: spliterror[0]
                                    });
                                });
                        } else if (req.body.screentype === 'profile_screen') {
                            userDetails.findOneAndUpdate({ userid: ObjectId(req.body.userid) }, { $set: { 'showcase_details.profile': true } })
                                .exec()
                                .then(docs => {
                                    res.status(200).json({
                                        status: 'Ok',
                                        message: "successfully updated showcase details."
                                    });

                                }).catch(err => {
                                    var spliterror = err.message.split(":")
                                    res.status(500).json({
                                        status: 'Failed',
                                        message: spliterror[0]
                                    });
                                });
                        } else if (req.body.screentype === 'active_offers_tab_screen') {
                            userDetails.findOneAndUpdate({ userid: ObjectId(req.body.userid) }, { $set: { 'showcase_details.offers': true } })
                                .exec()
                                .then(docs => {
                                    res.status(200).json({
                                        status: 'Ok',
                                        message: "successfully updated showcase details."
                                    });

                                }).catch(err => {
                                    var spliterror = err.message.split(":")
                                    res.status(500).json({
                                        status: 'Failed',
                                        message: spliterror[0]
                                    });
                                });
                        } else if (req.body.screentype === 'fab_menu_screen') {
                            userDetails.findOneAndUpdate({ userid: ObjectId(req.body.userid) }, { $set: { 'showcase_details.fab': true } })
                                .exec()
                                .then(docs => {
                                    res.status(200).json({
                                        status: 'Ok',
                                        message: "successfully updated showcase details."
                                    });

                                }).catch(err => {
                                    var spliterror = err.message.split(":")
                                    res.status(500).json({
                                        status: 'Failed',
                                        message: spliterror[0]
                                    });
                                });
                        } else if (req.body.screentype === 'challenge_details_screen') {
                            userDetails.findOneAndUpdate({ userid: ObjectId(req.body.userid) }, { $set: { 'showcase_details.challenge_details': true } })
                                .exec()
                                .then(docs => {
                                    res.status(200).json({
                                        status: 'Ok',
                                        message: "successfully updated showcase details."
                                    });

                                }).catch(err => {
                                    var spliterror = err.message.split(":")
                                    res.status(500).json({
                                        status: 'Failed',
                                        message: spliterror[0]
                                    });
                                });
                        } else if (req.body.screentype === 'full_video_screen') {
                            userDetails.findOneAndUpdate({ userid: ObjectId(req.body.userid) }, { $set: { 'showcase_details.feed_details': true } })
                                .exec()
                                .then(docs => {
                                    res.status(200).json({
                                        status: 'Ok',
                                        message: "successfully updated showcase details."
                                    });

                                }).catch(err => {
                                    var spliterror = err.message.split(":")
                                    res.status(500).json({
                                        status: 'Failed',
                                        message: spliterror[0]
                                    });
                                });
                        } else if (req.body.screentype === 'challenge_list_activites_screen') {
                            userDetails.findOneAndUpdate({ userid: ObjectId(req.body.userid) }, { $set: { 'showcase_details.challenge_tab': true } })
                                .exec()
                                .then(docs => {
                                    res.status(200).json({
                                        status: 'Ok',
                                        message: "successfully updated showcase details."
                                    });

                                }).catch(err => {
                                    var spliterror = err.message.split(":")
                                    res.status(500).json({
                                        status: 'Failed',
                                        message: spliterror[0]
                                    });
                                });
                        } else if (req.body.screentype === 'offer_details_screen') {
                            userDetails.findOneAndUpdate({ userid: ObjectId(req.body.userid) }, { $set: { 'showcase_details.offer_details': true } })
                                .exec()
                                .then(docs => {
                                    res.status(200).json({
                                        status: 'Ok',
                                        message: "successfully updated showcase details."
                                    });
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
                                message: 'This screentype does not exist.'
                            });
                        }

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


router.post("/get_user_tags", (req, res, next) => {

    var keyArray = ["userid", "iv_token", "clientid", "tag"];
    var key = Object.keys(req.body);

    if (keyArray.length == key.length && keyArray.every((v) => key.indexOf(v) >= 0)) {

        if (constants.AndriodClientId === req.body.clientid) {

            authModel.find({ iv_token: req.body.iv_token })
                .exec()
                .then(user => {
                    if (user.length < 1) {
                        return res.status(200).json({
                            status: "Logout",
                            message: "You are logged in other device."
                        });
                    } else {
                        var tag = String(req.body.tag).replace(/@/g, "")

                        User.find({ username: { $regex: '^' + tag, $options: 'i' } })
                            .exec()
                            .then(docs => {

                                var feedTag_name = [];
                                docs.map(doc => {

                                    var profileimage = doc.profileimage

                                    if (doc.profileimage === null) {
                                        profileimage = constants.APIBASEURL + "uploads/userimage.png"
                                    }

                                    feedTag_name.push({
                                        'username': doc.username,
                                        'fullname': doc.fullname,
                                        'profileimage': profileimage
                                    })

                                })

                                res.status(200).json({
                                    status: "Ok",
                                    message: "List of tags.",
                                    users: feedTag_name
                                });

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
                message: 'Bad Request. Please provide correct clientid.'
            });
        }
    } else {
        res.status(200).json({
            status: 'Failed',
            message: 'Bad Request. Please check your input parameters.'
        });
    }

});


router.get("/get_daily_transactions", (req, res, next) => {

    User.find({})
        .populate('userid')
        .exec()
        .then(datas => {
            tests = []
            datas.map(dot => {
                tests.push(ObjectId(dot._id))
            })

            userTransactions.find({ userid: { $in: tests } })
                .populate('userid')
                .exec()
                .then(data => {
                    if (data.length > 0) {
                        data.map(dex => {
                            var day = new Date()
                            day.setDate(day.getDate() - 1)
                            var username = dex.userid.username
                            var transaction = dex.transactions
                            var credits_talents = 0
                            var credits_views = 0
                            var debits = 0
                            var total = 0
                            var test = []

                            if (transaction.length > 0) {
                                var found = transaction.filter(o => (o.date_of_transaction).setHours(0, 0, 0, 0) === day.setHours(0, 0, 0, 0))

                                if (found.length > 0) {

                                    total = found.length

                                    found.map(doc => {
                                        if (doc.transaction_type === 'credit') {

                                            if (doc.mode === 'talent') {
                                                credits_talents = credits_talents + doc.amount
                                            } else {
                                                credits_views = credits_views + doc.amount
                                            }
                                        } else {
                                            debits = debits + doc.amount
                                        }
                                    })

                                }
                            }

                            if (credits_talents > 0 || credits_views > 0 || debits > 0) {

                                var msgbody = ""

                                if (credits_talents > 0 && credits_views > 0 && debits > 0) {
                                    msgbody = "Hey " + username + " !! You have got " + credits_talents + " talent points, " + credits_views + " view points yesterday and also you have used " + debits + " points.\nKeep posting keep earning !!"
                                } else if (credits_talents > 0 && credits_views > 0) {
                                    msgbody = "Hey " + username + " !! You have got " + credits_talents + " talent points and " + credits_views + " view points yesterday.\nKeep posting keep earning !!"
                                } else if (credits_talents > 0 && debits > 0) {
                                    msgbody = "Hey " + username + " !! You have got " + credits_talents + " talent points and used " + debits + " points yesterday.\nKeep posting keep earning !!"
                                } else if (credits_views > 0 && debits > 0) {
                                    msgbody = "Hey " + username + " !! You have got " + credits_views + " view points and used " + debits + " points yesterday.\nKeep posting keep earning !!"
                                } else {

                                    if (debits > 0) {
                                        msgbody = "Hey " + username + " !! You have used " + debits + " points yesterday.\nKeep posting keep earning !!"
                                    } else if (credits_talents > 0) {
                                        msgbody = "Hey " + username + " !! You have got " + credits_talents + " talent points yesterday.\nKeep posting keep earning !!"
                                    } else {
                                        msgbody = "Hey " + username + " !! You have got " + credits_views + " view points yesterday.\nKeep posting keep earning !!"
                                    }

                                }

                                const note_no = Math.floor(10000000000 + Math.random() * 90000000000);
                                notificationModel.findOneAndUpdate({ userid: ObjectId(dex.userid._id) }, {
                                        $push: {
                                            notifications: {
                                                notification_data: msgbody,
                                                member_id: "",
                                                notification_type: 'wallet_activity',
                                                notification_number: note_no,
                                                username: "",
                                                item_id: "",
                                                profileimage: ObjectId(null),
                                                created_at: Date.now()
                                            }
                                        }
                                    })
                                    .exec()
                                    .then(dosy => {
                                        if (dosy === null) {

                                        } else {
                                            fcmModel.find({ userid: dex.userid._id })
                                                .exec()
                                                .then(user => {
                                                    if (user.length < 1) {

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
                                                                notification_slug: 'wallet_activity',
                                                                url: "",
                                                                username: "",
                                                                item_id: "",

                                                                userid: "",
                                                                feed_id: "",
                                                                member_feed_id: "",
                                                                member_id: "",
                                                                is_from_push: true
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
                                                        var is_err = false
                                                        fcm.send(message, function(err, response) {
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

                        console.log("sent message !!")
                    }
                }).catch(err => {
                    console.log(err)
                })

        }).catch(err => {
            console.log(err)
        })

});

router.get("/bulk_notification_morning", (req, res, next) => {
    User.find({})
        .then(docs => {
            if (docs.length > 0) {

                var userid = []
                var objectuserid = []
                var contact = []

                docs.map(doc => {
                    userid.push(doc._id)
                    objectuserid.push(ObjectId(doc._id))
                })

                var msgbody = "Hurry!! Flat 75% discount on Amazon, KFC, McDonalds, etc gifts cards of worth 500/-. Post or Watch videos to get the offers."
                const note_no = Math.floor(10000000000 + Math.random() * 90000000000);
                notificationModel.updateMany({ userid: { $in: objectuserid } }, {
                        $push: {
                            notifications: {
                                notification_data: msgbody,
                                member_id: "",
                                notification_type: 'announcements_tab',
                                notification_number: note_no,
                                username: "",
                                item_id: "",
                                profileimage: ObjectId(null),
                                created_at: Date.now()
                            }
                        }
                    })
                    .exec()
                    .then(dosy => {
                        if (dosy === null) {
                            return res.status(200).json({
                                status: "Failed",
                                message: "Please provide correct userid."
                            });
                        } else {
                            fcmModel.find({ userid: { $in: userid } })
                                .exec()
                                .then(user => {
                                    console.log(user)
                                    if (user.length < 1) {
                                        return res.status(200).json({
                                            status: "Failed",
                                            message: "Please provide correct member_id."
                                        });
                                    } else {
                                        var serverKey = constants.FCMServerKey;
                                        var fcm = new FCM(serverKey);

                                        var user_fcm = [];
                                        user.forEach(function(ele) {
                                            user_fcm.push(ele.fcmtoken)
                                        })

                                        var message = {
                                            registration_ids: user_fcm,
                                            collapse_key: 'exit',

                                            notification: {
                                                title: 'FvmeGear',
                                                body: msgbody,
                                            },
                                            data: {
                                                notification_id: note_no,
                                                message: msgbody,
                                                notification_slug: 'announcements_tab',
                                                url: "",
                                                username: "",
                                                item_id: "",

                                                userid: "",
                                                feed_id: "",
                                                member_feed_id: "",
                                                member_id: "",
                                                is_from_push: true
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
                                        var is_err = false
                                        fcm.send(message, function(err, response) {
                                            console.log(response)

                                        });
                                        //          res.status(200).json({
                                        //  status: 'Ok',
                                        //  message: "Sent successfully"
                                        // });
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
                console.log("message sent.")

            }
        }).catch(err => {
            console.log(err)
        });
})


router.get("/bulk_notification_afternun", (req, res, next) => {
    User.find({})
        .then(docs => {
            if (docs.length > 0) {

                var userid = []
                var objectuserid = []
                var contact = []

                docs.map(doc => {
                    userid.push(doc._id)
                    objectuserid.push(ObjectId(doc._id))
                })

                var msgbody = "Discount on DISCOUNTS! Yup! you heard us right. Buy a product for 50% OFF or above and get Rs.100/- as reward. Buy more to earn more! Winners get Rs.1000/- gift vouchers."
                const note_no = Math.floor(10000000000 + Math.random() * 90000000000);
                notificationModel.updateMany({ userid: { $in: objectuserid } }, {
                        $push: {
                            notifications: {
                                notification_data: msgbody,
                                member_id: "",
                                notification_type: 'announcements_tab',
                                notification_number: note_no,
                                username: "",
                                item_id: "",
                                profileimage: ObjectId(null),
                                created_at: Date.now()
                            }
                        }
                    })
                    .exec()
                    .then(dosy => {
                        if (dosy === null) {
                            return res.status(200).json({
                                status: "Failed",
                                message: "Please provide correct userid."
                            });
                        } else {
                            fcmModel.find({ userid: { $in: userid } })
                                .exec()
                                .then(user => {
                                    console.log(user)
                                    if (user.length < 1) {
                                        return res.status(200).json({
                                            status: "Failed",
                                            message: "Please provide correct member_id."
                                        });
                                    } else {
                                        var serverKey = constants.FCMServerKey;
                                        var fcm = new FCM(serverKey);

                                        var user_fcm = [];
                                        user.forEach(function(ele) {
                                            user_fcm.push(ele.fcmtoken)
                                        })

                                        var message = {
                                            registration_ids: user_fcm,
                                            collapse_key: 'exit',

                                            notification: {
                                                title: 'FvmeGear',
                                                body: msgbody,
                                            },
                                            data: {
                                                notification_id: note_no,
                                                message: msgbody,
                                                notification_slug: 'announcements_tab',
                                                url: "",
                                                username: "",
                                                item_id: "",

                                                userid: "",
                                                feed_id: "",
                                                member_feed_id: "",
                                                member_id: "",
                                                is_from_push: true
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
                                        var is_err = false
                                        fcm.send(message, function(err, response) {
                                            console.log(response)

                                        });
                                        //          res.status(200).json({
                                        //  status: 'Ok',
                                        //  message: "Sent successfully"
                                        // });
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
                console.log("message sent.")

            }
        }).catch(err => {
            console.log(err)
        });
})


router.get("/bulk_notification_night", (req, res, next) => {
    User.find({})
        .then(docs => {
            if (docs.length > 0) {

                var userid = []
                var objectuserid = []
                var contact = []

                docs.map(doc => {
                    userid.push(doc._id)
                    objectuserid.push(ObjectId(doc._id))
                })

                var msgbody = "Rs 20000/- gift cards free every week.\nRefer your friends and family members and win a chance to get 20000/- worth gift cards."
                const note_no = Math.floor(10000000000 + Math.random() * 90000000000);
                notificationModel.updateMany({ userid: { $in: objectuserid } }, {
                        $push: {
                            notifications: {
                                notification_data: msgbody,
                                member_id: "",
                                notification_type: 'announcements_tab',
                                notification_number: note_no,
                                username: "",
                                item_id: "",
                                profileimage: ObjectId(null),
                                created_at: Date.now()
                            }
                        }
                    })
                    .exec()
                    .then(dosy => {
                        if (dosy === null) {
                            return res.status(200).json({
                                status: "Failed",
                                message: "Please provide correct userid."
                            });
                        } else {
                            fcmModel.find({ userid: { $in: userid } })
                                .exec()
                                .then(user => {
                                    console.log(user)
                                    if (user.length < 1) {
                                        return res.status(200).json({
                                            status: "Failed",
                                            message: "Please provide correct member_id."
                                        });
                                    } else {
                                        var serverKey = constants.FCMServerKey;
                                        var fcm = new FCM(serverKey);

                                        var user_fcm = [];
                                        user.forEach(function(ele) {
                                            user_fcm.push(ele.fcmtoken)
                                        })

                                        var message = {
                                            registration_ids: user_fcm,
                                            collapse_key: 'exit',

                                            notification: {
                                                title: 'FvmeGear',
                                                body: msgbody,
                                            },
                                            data: {
                                                notification_id: note_no,
                                                message: msgbody,
                                                notification_slug: 'announcements_tab',
                                                url: "",
                                                username: "",
                                                item_id: "",

                                                userid: "",
                                                feed_id: "",
                                                member_feed_id: "",
                                                member_id: "",
                                                is_from_push: true
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
                                        var is_err = false
                                        fcm.send(message, function(err, response) {
                                            console.log(response)

                                        });
                                        //          res.status(200).json({
                                        //  status: 'Ok',
                                        //  message: "Sent successfully"
                                        // });
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
                console.log("message sent.")

            }
        }).catch(err => {
            console.log(err)
        });
})


router.get("/user_activity_progress", (req, res, next) => {

    User.find({})
        .exec()
        .then(datas => {
            tests = []
            datas.map(dot => {
                tests.push(ObjectId(dot._id))
            })

            userTransactions.find({ userid: { $in: tests } })
                .exec()
                .then(data => {
                    if (data.length > 0) {
                        data.map(dex => {
                            var day = new Date()
                            var transaction = dex.transactions
                            var userid = dex.userid
                            var amountt = 0
                            var total = 0
                            var user_activity = false

                            if (transaction.length > 0) {
                                var found = transaction.filter(o => (o.date_of_transaction).setHours(0, 0, 0, 0) === day.setHours(0, 0, 0, 0))

                                if (found.length > 0) {

                                    total = found.length

                                    found.map(doc => {
                                        if (doc.transaction_type === 'credit' && doc.action === 'challenge_result' || doc.action === 'drop_challenge' || doc.action === 'record_view' || doc.action === 'gift_points') {

                                            amountt = parseInt(amountt) + parseInt(doc.amount);

                                        }
                                    })
                                }
                            }
                            console.log(amountt)
                            if (parseInt(amountt) >= 20) {
                                console.log("true in activity status")
                                user_activity = true;
                            }

                            userDetails.findOneAndUpdate({ userid: ObjectId(userid) }, {
                                    $set: {
                                        has_user_activity: user_activity,
                                        coins_collected_today: amountt
                                    }
                                })
                                .exec()
                                .then(dex => {})
                                .catch(err => {
                                    console.log(err)
                                })

                        })
                        console.log("done with the activity status")
                    }
                }).catch(err => {
                    console.log(err)
                })

        }).catch(err => {
            console.log(err)
        })

});


router.get('/update_has_shown_offer_all_users', (req, res, next) => {
    userDetails.update({}, { $set: { has_shown_offer: true } }, { multi: true }).then(err => {
        console.log(err);
    }).catch(err => {
        console.log(err);
    })
})


router.get("/email_verify_notification", (req, res, next) => {
    User.find({ 'email_verified': 0 })
        .then(docs => {
            if (docs.length > 0) {

                var userid = []
                var objectuserid = []
                var contact = []

                docs.map(doc => {
                    userid.push(doc._id)
                    objectuserid.push(ObjectId(doc._id))
                })

                var msgbody = "Your gift card is waiting!! Please verify your email to get the gift card."
                const note_no = Math.floor(10000000000 + Math.random() * 90000000000);
                notificationModel.updateMany({ userid: { $in: objectuserid } }, {
                        $push: {
                            notifications: {
                                notification_data: msgbody,
                                member_id: "",
                                notification_type: 'home',
                                notification_number: note_no,
                                username: "",
                                item_id: "",
                                profileimage: ObjectId(null),
                                created_at: Date.now()
                            }
                        }
                    })
                    .exec()
                    .then(dosy => {
                        if (dosy === null) {
                            return res.status(200).json({
                                status: "Failed",
                                message: "Please provide correct userid."
                            });
                        } else {
                            fcmModel.find({ userid: { $in: userid } })
                                .exec()
                                .then(user => {
                                    console.log(user)
                                    if (user.length < 1) {
                                        return res.status(200).json({
                                            status: "Failed",
                                            message: "Please provide correct member_id."
                                        });
                                    } else {
                                        var serverKey = constants.FCMServerKey;
                                        var fcm = new FCM(serverKey);

                                        var user_fcm = [];
                                        user.forEach(function(ele) {
                                            user_fcm.push(ele.fcmtoken)
                                        })

                                        var message = {
                                            registration_ids: user_fcm,
                                            collapse_key: 'exit',

                                            notification: {
                                                title: 'FvmeGear',
                                                body: msgbody,
                                            },
                                            data: {
                                                notification_id: note_no,
                                                message: msgbody,
                                                notification_slug: 'home',
                                                url: "",
                                                username: "",
                                                item_id: "",

                                                userid: "",
                                                feed_id: "",
                                                member_feed_id: "",
                                                member_id: "",
                                                is_from_push: true
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
                                        var is_err = false
                                        fcm.send(message, function(err, response) {

                                        });
                                        //          res.status(200).json({
                                        //  status: 'Ok',
                                        //  message: "Sent successfully"
                                        // });
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
                console.log("message sent for email Verification.")

            }
        }).catch(err => {
            console.log(err)
        });
})


router.get("/bulk_notification_update", (req, res, next) => {
    User.find({})
        .then(docs => {
            if (docs.length > 0) {

                var userid = []
                var objectuserid = []
                var contact = []

                docs.map(doc => {
                    userid.push(doc._id)
                    objectuserid.push(ObjectId(doc._id))
                })

                var msgbody = "A new version of App is available on Play Store, Please update to take advantage of latest features."
                const note_no = Math.floor(10000000000 + Math.random() * 90000000000);
                notificationModel.updateMany({ userid: { $in: objectuserid } }, {
                        $push: {
                            notifications: {
                                notification_data: msgbody,
                                member_id: "",
                                notification_type: 'update_app',
                                notification_number: note_no,
                                username: "",
                                item_id: "",
                                profileimage: ObjectId(null),
                                created_at: Date.now()
                            }
                        }
                    })
                    .exec()
                    .then(dosy => {
                        if (dosy === null) {
                            return res.status(200).json({
                                status: "Failed",
                                message: "Please provide correct userid."
                            });
                        } else {
                            fcmModel.find({ userid: { $in: userid } })
                                .exec()
                                .then(user => {
                                    console.log(user)
                                    if (user.length < 1) {
                                        return res.status(200).json({
                                            status: "Failed",
                                            message: "Please provide correct member_id."
                                        });
                                    } else {
                                        var serverKey = constants.FCMServerKey;
                                        var fcm = new FCM(serverKey);

                                        var user_fcm = [];
                                        user.forEach(function(ele) {
                                            user_fcm.push(ele.fcmtoken)
                                        })

                                        var message = {
                                            registration_ids: user_fcm,
                                            collapse_key: 'exit',

                                            notification: {
                                                title: 'FvmeGear',
                                                body: msgbody,
                                            },
                                            data: {
                                                notification_id: note_no,
                                                message: msgbody,
                                                notification_slug: 'update_app',
                                                url: "",
                                                username: "",
                                                item_id: "",

                                                userid: "",
                                                feed_id: "",
                                                member_feed_id: "",
                                                member_id: "",
                                                is_from_push: true
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
                                        var is_err = false
                                        fcm.send(message, function(err, response) {
                                            console.log(response)

                                        });
                                        //          res.status(200).json({
                                        //  status: 'Ok',
                                        //  message: "Sent successfully"
                                        // });
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
                console.log("message sent.")

            }
        }).catch(err => {
            console.log(err)
        });
})

router.get("/bulk_notifications_contest", (req, res, next) => {
    User.find({})
        .then(docs => {
            if (docs.length > 0) {

                var userid = []
                var objectuserid = []
                var contact = []

                docs.map(doc => {
                    userid.push(doc._id)
                    objectuserid.push(ObjectId(doc._id))
                })

                var msgbody = "Challenge contest is running please check it out.."
                const note_no = Math.floor(10000000000 + Math.random() * 90000000000);
                notificationModel.updateMany({ userid: { $in: objectuserid } }, {
                        $push: {
                            notifications: {
                                notification_data: msgbody,
                                member_id: "",
                                notification_type: 'Trending',
                                notification_number: note_no,
                                username: "",
                                item_id: "",
                                profileimage: ObjectId(null),
                                created_at: Date.now()
                            }
                        }
                    })
                    .exec()
                    .then(dosy => {
                        if (dosy === null) {
                            return res.status(200).json({
                                status: "Failed",
                                message: "Please provide correct userid."
                            });
                        } else {
                            fcmModel.find({ userid: { $in: userid } })
                                .exec()
                                .then(user => {
                                    console.log(user)
                                    if (user.length < 1) {
                                        return res.status(200).json({
                                            status: "Failed",
                                            message: "Please provide correct member_id."
                                        });
                                    } else {
                                        var serverKey = constants.FCMServerKey;
                                        var fcm = new FCM(serverKey);

                                        var user_fcm = [];
                                        user.forEach(function(ele) {
                                            user_fcm.push(ele.fcmtoken)
                                        })

                                        var message = {
                                            registration_ids: user_fcm,
                                            collapse_key: 'exit',

                                            notification: {
                                                title: 'FvmeGear',
                                                body: msgbody,
                                            },
                                            data: {
                                                notification_id: note_no,
                                                message: msgbody,
                                                notification_slug: 'Trending',
                                                url: "",
                                                username: "",
                                                item_id: "",

                                                userid: "",
                                                feed_id: "",
                                                member_feed_id: "",
                                                member_id: "",
                                                is_from_push: true
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
                                        var is_err = false
                                        fcm.send(message, function(err, response) {
                                            console.log(response)

                                        });
                                        //          res.status(200).json({
                                        //  status: 'Ok',
                                        //  message: "Sent successfully"
                                        // });
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
                console.log("message sent.")

            }
        }).catch(err => {
            console.log(err)
        });
})


router.get("/individual_msg_notification", (req, res, next) => {
    User.find({})
        .exec()
        .then(docs => {
            var names = []
            var count = 0
            if (docs.length > 0) {
                docs.map(doc => {
                    count = count + 1
                    console.log(count)
                    var message = ""
                    var msg = ""

                    msg = utf8.encode("Hi, fvmegear users, we are back from maintenance. Now you can watch, post videos and get offers as you used to. Sorry for the inconvenience created.Thank you.");

                    message = "Hi, fvmegear users, we are back from maintenance. Now you can watch, post videos and get offers as you used to. Sorry for the inconvenience created.Thank you."

                    if (message != "") {
                        // var msg =utf8.encode("You have won the lottery for having more no. of connections.");
                        var toNumber = doc.mobile
                        var username = 'contact@ivicatechnologies.com';
                        var hash = '835f8a083d146a9935e829083781420627bd9477cd6afd23ebf858d4e224e9a8';
                        var sender = 'FvmeGr';

                        var data = 'username=' + username + '&hash=' + hash + '&sender=' + sender + '&numbers=' + toNumber + '&message=' + msg;
                        var options = 'http://api.textlocal.in/send?' + data;

                        callback = function(response) {
                            var str = '';
                            response.on('data', function(chunk) {
                                str += chunk;
                            });
                            response.on('end', function() {
                                console.log(str);
                            });
                        }

                        http.request(options, callback).end();

                        var msgbody = message
                        const note_no = Math.floor(10000000000 + Math.random() * 90000000000);
                        notificationModel.findOneAndUpdate({ userid: ObjectId(doc._id) }, {
                                $push: {
                                    notifications: {
                                        notification_data: msgbody,
                                        member_id: "",
                                        notification_type: 'announcements_tab',
                                        notification_number: note_no,
                                        username: "",
                                        item_id: "",
                                        profileimage: ObjectId(null),
                                        created_at: Date.now()
                                    }
                                }
                            })
                            .exec()
                            .then(dosy => {
                                if (dosy === null) {

                                } else {
                                    fcmModel.find({ userid: doc._id })
                                        .exec()
                                        .then(user => {
                                            console.log(user)
                                            if (user.length < 1) {

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
                                                        notification_slug: 'announcements_tab',
                                                        url: "",
                                                        username: "",
                                                        item_id: "",

                                                        userid: "",
                                                        feed_id: "",
                                                        member_feed_id: "",
                                                        member_id: "",
                                                        is_from_push: true
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
                                                var is_err = false
                                                fcm.send(message, function(err, response) {
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
        }).catch(err => {
            console.log(err)
        })
});


router.get("/bulk_msgs_notifications", (req, res, next) => {
    User.find({})
        .then(docs => {
            if (docs.length > 0) {

                var userid = []
                var objectuserid = []
                var contact = []

                docs.map(doc => {
                    userid.push(doc._id)
                    objectuserid.push(ObjectId(doc._id))
                    contact.push(doc.mobile)
                })

                var msg = ""

                msg = utf8.encode("Hi, fvmegear users, we are back from maintenance. Now you can watch, post videos and get offers as you used to. Sorry for the inconvenience created.Thank you.");

                var toNumber = contact
                var username = 'contact@ivicatechnologies.com';
                var hash = '835f8a083d146a9935e829083781420627bd9477cd6afd23ebf858d4e224e9a8';
                var sender = 'FvmeGr';

                var data = 'username=' + username + '&hash=' + hash + '&sender=' + sender + '&numbers=' + toNumber + '&message=' + msg;
                var options = 'http://api.textlocal.in/send?' + data;

                callback = function(response) {
                    var str = '';
                    response.on('data', function(chunk) {
                        str += chunk;
                    });
                    response.on('end', function() {
                        console.log(str);
                    });
                }

                http.request(options, callback).end();

                var msgbody = "Hurry!! Amazon, KFC, McDonalds, etc gifts cards of worth 500/- on flat 75% discount. Post or Watch videos to get the special discounts."
                const note_no = Math.floor(10000000000 + Math.random() * 90000000000);
                notificationModel.updateMany({ userid: { $in: objectuserid } }, {
                        $push: {
                            notifications: {
                                notification_data: msgbody,
                                member_id: "",
                                notification_type: 'announcements_tab',
                                notification_number: note_no,
                                username: "",
                                item_id: "",
                                profileimage: ObjectId(null),
                                created_at: Date.now()
                            }
                        }
                    })
                    .exec()
                    .then(dosy => {
                        if (dosy === null) {
                            return res.status(200).json({
                                status: "Failed",
                                message: "Please provide correct userid."
                            });
                        } else {
                            fcmModel.find({ userid: { $in: userid } })
                                .exec()
                                .then(user => {
                                    console.log(user)
                                    if (user.length < 1) {
                                        return res.status(200).json({
                                            status: "Failed",
                                            message: "Please provide correct member_id."
                                        });
                                    } else {
                                        var serverKey = constants.FCMServerKey;
                                        var fcm = new FCM(serverKey);

                                        var user_fcm = [];
                                        user.forEach(function(ele) {
                                            user_fcm.push(ele.fcmtoken)
                                        })

                                        var message = {
                                            registration_ids: user_fcm,
                                            collapse_key: 'exit',

                                            notification: {
                                                title: 'FvmeGear',
                                                body: msgbody,
                                            },
                                            data: {
                                                notification_id: note_no,
                                                message: msgbody,
                                                notification_slug: 'announcements_tab',
                                                url: "",
                                                username: "",
                                                item_id: "",

                                                userid: "",
                                                feed_id: "",
                                                member_feed_id: "",
                                                member_id: "",
                                                is_from_push: true
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
                                        var is_err = false
                                        fcm.send(message, function(err, response) {
                                            console.log(response)

                                        });
                                        //          res.status(200).json({
                                        //  status: 'Ok',
                                        //  message: "Sent successfully"
                                        // });
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
                console.log("message sent.")

            }
        }).catch(err => {
            console.log(err)
        });
})

router.get("/get_current_offers", (req, res, next) => {
    userDetails.find({
            "offer_details.is_primary_offer": false,
            "offer_details.total_contributions": {
                $gt: 0
            }
        })
        .populate('userid offer_details.contributions.userid')
        .exec()
        .then(docs => {
            if (docs.length > 0) {
                var test = []
                docs.map(doc => {
                    test.push(doc)
                })


                res.status(200).json({
                    status: 'Ok',
                    details: test
                });
            }
        }).catch(err => {
            console.log(err)
        })
});

router.get("/get_current_users", (req, res, next) => {
    User.find({})
        .exec()
        .then(docs => {
            if (docs.length > 0) {
                var test = []
                docs.map(doc => {
                    test.push(doc._id)
                })

                trend.find({})
                    .exec()
                    .then(data => {
                        var dexs = data[0].details
                        var dex = []

                        dexs.map(ele => {
                            var found = test.find(o => String(o._id) === String(ele.userid))
                            if (typeof found === 'undefined') {
                                dex.push(ele)
                            }
                        })

                        res.status(200).json({
                            status: 'Ok',
                            details: dex
                        });


                    }).catch(err => {
                        console.log(err)
                    })
            }
        }).catch(err => {
            console.log(err)
        })
});

router.get("/profileimages", (req, res, next) => {
    User.find({ profileimage: null })
        .exec()
        .then(docs => {
            if (docs.length > 0) {
                var test = []
                docs.map(doc => {
                    var name = doc.username
                    var username = (name.charAt(0)).toLowerCase();
                    var profileimage = ""

                    if (username === 'a') {
                        profileimage = "uploads/A.png"
                    } else if (username === 'b') {
                        profileimage = "uploads/B.png"
                    } else if (username === 'c') {
                        profileimage = "uploads/C.png"

                    } else if (username === 'd') {
                        profileimage = "uploads/D.png"

                    } else if (username === 'e') {
                        profileimage = "uploads/E.png"

                    } else if (username === 'f') {
                        profileimage = "uploads/F.png"

                    } else if (username === 'g') {
                        profileimage = "uploads/G.png"

                    } else if (username === 'h') {
                        profileimage = "uploads/H.png"

                    } else if (username === 'i') {
                        profileimage = "uploads/I.png"

                    } else if (username === 'j') {
                        profileimage = "uploads/J.png"

                    } else if (username === 'k') {
                        profileimage = "uploads/K.png"

                    } else if (username === 'l') {
                        profileimage = "uploads/L.png"

                    } else if (username === 'm') {
                        profileimage = "uploads/M.png"

                    } else if (username === 'n') {
                        profileimage = "uploads/N.png"

                    } else if (username === 'o') {
                        profileimage = "uploads/O.png"

                    } else if (username === 'p') {
                        profileimage = "uploads/P.png"

                    } else if (username === 'q') {
                        profileimage = "uploads/Q.png"

                    } else if (username === 'r') {
                        profileimage = "uploads/R.png"

                    } else if (username === 's') {
                        profileimage = "uploads/S.png"

                    } else if (username === 't') {
                        profileimage = "uploads/T.png"

                    } else if (username === 'u') {
                        profileimage = "uploads/U.png"

                    } else if (username === 'v') {
                        profileimage = "uploads/V.png"

                    } else if (username === 'w') {
                        profileimage = "uploads/W.png"

                    } else if (username === 'x') {
                        profileimage = "uploads/X.png"

                    } else if (username === 'y') {
                        profileimage = "uploads/Y.png"

                    } else if (username === 'z') {
                        profileimage = "uploads/Z.png"

                    } else {
                        profileimage = "uploads/userimage.png"
                    }

                    User.findOneAndUpdate({ _id: ObjectId(doc._id) }, { $set: { profileimage: profileimage } })
                        .exec()

                })

                console.log("Done with profile image")

            }
        }).catch(err => {
            console.log(err)
        })
});

module.exports = router;