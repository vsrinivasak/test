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
const fcmModel = require("../models/fcmtoken");
const FCM = require('fcm-node');
const isodate = require("isodate");
const moment = require("moment");
const userTransactions = require("../models/user_transactions")

router.post("/my_videos", (req, res, next) => {

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
                        var perPage = 20
                        var page = req.body.page_no

                        if (isEmpty(page)) {
                            page = 1
                        }
                        var skip = (perPage * page) - perPage;
                        var limit = skip + perPage;

                        iv_feeds.find({ profile_url: ObjectId(req.body.userid), feed_type: 'video', has_sensitive_content: false, feed_expiry_status: 0, old_feed_id: [] }) //, screen_directory_status:0
                            .populate('profile_url')
                            .skip(skip)
                            .limit(limit)
                            .sort({ feed_post_create: -1 })
                            .exec()
                            .then(docs => {
                                if (docs.length < 1) {
                                    res.status(200).json({
                                        status: 'Ok',
                                        message: 'No feeds to display.',
                                        feeds: []
                                    });
                                } else {
                                    iv_feeds.find({ profile_url: ObjectId(req.body.userid), feed_type: 'video', has_sensitive_content: false, feed_expiry_status: 0, old_feed_id: [] }).count().exec(function(err, count) {
                                        if (err) {
                                            res.status(500).json({
                                                status: 'Failed',
                                                message: 'Please provide correct userid'
                                            });
                                        } else {
                                            var test = [];
                                            docs.map(doc => {

                                                var is_challengable = false;
                                                var is_time_extendable = false;
                                                var dur = Math.round(doc.video_duration)

                                                console.log(dur)

                                                if (doc.privacy_mode === 1 && doc.no_rating >= 0 && doc.no_views >= 0 && dur >= 60) {
                                                    is_challengable = true
                                                }

                                                var date = new Date()
                                                var date1 = date.setTime(date.getTime());
                                                var dateNow = new Date(date1).toISOString();
                                                var t = Date.parse(doc.feeds_expiry_time_) - Date.parse(dateNow);
                                                var seconds1 = Math.floor((t / 1000) % 60);
                                                var minutes1 = Math.floor((t / 1000 / 60) % 60);
                                                var hours1 = Math.floor((t / (1000 * 60 * 60)) % 24);
                                                var days1 = Math.floor(t / (1000 * 60 * 60 * 24));

                                                if (seconds1 < 0) {
                                                    seconds1 = '00';
                                                }
                                                if (minutes1 < 0) {
                                                    minutes1 = '00';
                                                }
                                                if (hours1 < 0) {
                                                    hours1 = '00';
                                                }
                                                if (days1 < 0) {
                                                    days1 = '00';
                                                }

                                                var calculatetime = hours1 + ':' + minutes1 + ':' + seconds1;
                                                var duration = Date.parse(doc.feeds_expiry_time_);

                                                var profileimage = doc.profile_url.profileimage
                                                if (profileimage === null) {
                                                    profileimage = 'uploads/userimage.png'
                                                }

                                                if (doc.feed_expiry_status == 0) {
                                                    is_time_extendable = true
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

                                                var hashtags = doc.feeds_hash_tags
                                                var hashs = [];
                                                if (hashtags.length > 0) {
                                                    hashtags.forEach(function(ele) {
                                                        var tag = "#" + ele
                                                        hashs.push(tag)
                                                    })
                                                }

                                                var preview_url = constants.APIBASEURL + doc.preview_url

                                                if (preview_url === null) {
                                                    preview_url = constants.APIBASEURL + 'uploads/video.jpeg'
                                                }

                                                var going = 0
                                                if (doc.no_likes <= 0) {
                                                    going = 0
                                                } else {
                                                    going = doc.no_likes
                                                }

                                                var video_dur = doc.video_duration
                                                var video_duration = ""
                                                var video = video_dur * 1000

                                                var minutes = Math.floor(video / 60000);
                                                var seconds = ((video % 60000) / 1000).toFixed(0);
                                                minutes = minutes.toString()
                                                seconds = seconds.toString()
                                                var video_duration = minutes + ":" + seconds



                                                if (minutes.length === 1 && seconds.length === 1) {
                                                    video_duration = "0" + minutes + ":" + "0" + seconds

                                                } else if (minutes.length === 1) {

                                                    if (seconds === '60') {
                                                        video_duration = "01:00"
                                                    } else {
                                                        video_duration = "0" + minutes + ":" + seconds
                                                    }

                                                    if (seconds.length === 1) {
                                                        video_duration = "0" + minutes + ":" + "0" + seconds
                                                    }
                                                } else {
                                                    if (seconds.length === 1) {

                                                        video_duration = minutes + ":" + "0" + seconds
                                                    }
                                                    if (minutes.length === 1) {
                                                        video_duration = "0" + minutes + ":" + "0" + seconds
                                                    }
                                                }



                                                feedinfo = {

                                                    "feed_id": doc._id,
                                                    "feed_desc": doc.feed_desc,
                                                    "feeds_tags": hashs,
                                                    "feed_type": doc.feed_type,
                                                    "userid": doc.profile_url._id,
                                                    "username": doc.profile_url.username,
                                                    "expiry_time": duration,
                                                    "rating": parseFloat(doc.feed_rating),
                                                    "no_shares": doc.no_shares,
                                                    "no_likes": going,
                                                    "no_comments": doc.no_comments,
                                                    "is_liked": is_liked,
                                                    "no_views": doc.no_views,
                                                    "profile_url": constants.APIBASEURL + profileimage,
                                                    "can_show_ad": false,
                                                    "allow_comments": false,
                                                    "privacy_mode": doc.privacy_mode,
                                                    "preview_url": preview_url,
                                                    "has_sensitive_content": false,
                                                    "is_under_challenge": doc.is_under_challenge,
                                                    "is_challengeable": is_challengable,
                                                    "is_time_extendable": is_time_extendable,
                                                    "video_duration": video_duration,
                                                    "challenge_details": {
                                                        "member_id": "",
                                                        "member_user_name": "",
                                                        "member_url": "",
                                                        "member_feed_id": "",
                                                        "challenge_desc": "",
                                                        "challenge_number": '0',

                                                    },
                                                    "is_self_feed": true,
                                                    "ad_details": {
                                                        "ad_type": "",
                                                        "ad_files": []
                                                    },
                                                    "comment_privacy": doc.comments_privacy,
                                                    "repost_details": {
                                                        "original_userid": "",
                                                        "original_feed_id": "",
                                                        "original_user_img_url": ""
                                                    }
                                                }
                                                test.push(feedinfo)
                                            })
                                            res.status(200).json({
                                                status: 'Ok',
                                                message: 'List of Feeds',
                                                userid: req.body.userid,
                                                total_pages: Math.ceil(count / perPage),
                                                current_page: page,
                                                total_feeds: count,
                                                feeds: test
                                            });
                                        }
                                    })
                                }
                            }).catch(err => {
                                var spliterror = err.message.split("_")
                                if (spliterror[1].indexOf("acountid") >= 0) {
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


router.post("/challenge_video", (req, res, next) => {

    var keyArray = ["userid", "iv_token", "clientid", "feed_id", "member_feed_id", "member_id", "amount"];
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

                        iv_feeds.find({ _id: { $in: [ObjectId(req.body.feed_id), ObjectId(req.body.member_feed_id)] } })
                            .exec()
                            .then(dex => {
                                if (dex.length > 0) {
                                    var feed_userid = ""
                                    var user_feedid = req.body.feed_id
                                    var member_feedid = req.body.member_feed_id
                                    var feed_memberid = ""
                                    var user_preview_url = ""
                                    var other_preview_url = ""
                                    var is_repost = false
                                    var is_same = false

                                    if (String(dex[0]._id) === String(user_feedid)) {
                                        user_preview_url = constants.APIBASEURL + dex[0].preview_url
                                        other_preview_url = constants.APIBASEURL + dex[1].preview_url
                                        feed_userid = dex[0].iv_acountid
                                        feed_memberid = dex[1].iv_acountid
                                        if (dex[0].old_feed_id.length > 0) {
                                            is_repost = true
                                        }
                                        if (dex[1].old_feed_id.length > 0) {
                                            member_feedid = dex[1].old_feed_id[0]
                                        }

                                        if (String(user_feedid) === String(member_feedid)) {
                                            is_same = true
                                        }
                                    } else {
                                        user_preview_url = constants.APIBASEURL + dex[1].preview_url
                                        other_preview_url = constants.APIBASEURL + dex[0].preview_url
                                        feed_userid = dex[1].iv_acountid
                                        feed_memberid = dex[0].iv_acountid
                                        if (dex[1].old_feed_id.length > 0) {
                                            is_repost = true
                                        }
                                        if (dex[0].old_feed_id.length > 0) {
                                            member_feedid = dex[0].old_feed_id[0]
                                        }
                                        if (String(user_feedid) === String(member_feedid)) {
                                            is_same = true
                                        }
                                    }

                                    if (is_same === false) {
                                        if (is_repost === false) {
                                            userDetails.find({ userid: { $in: [ObjectId(feed_userid), ObjectId(feed_memberid)] } })
                                                .populate('userid')
                                                .exec()
                                                .then(docs => {
                                                    if (docs.length > 0) {

                                                        var userid = "";
                                                        var username = "";
                                                        var member_name = ""
                                                        var challenge_userid = "";
                                                        var profileimage = "";
                                                        var member_profile = ""
                                                        var talent_points = 0
                                                        var view_points = 0
                                                        var mobile_verified = ''

                                                        if (String(docs[0].userid._id) === String(feed_userid)) {
                                                            userid = ObjectId(docs[0]._id)
                                                            username = docs[0].userid.username
                                                            mobile_verified = docs[0].userid.mobile_verified
                                                            profileimage = docs[0].userid.profileimage;
                                                            if (docs[0].userid.profileimage === null) {
                                                                profileimage = "uploads/userimage.png"
                                                            }
                                                            talent_points = docs[0].talent_points
                                                            view_points = docs[0].view_points
                                                            challenge_userid = ObjectId(docs[1]._id)
                                                            member_name = docs[1].userid.username
                                                            member_profile = docs[1].userid.profileimage;
                                                            if (docs[1].userid.profileimage === null) {
                                                                member_profile = "uploads/userimage.png"
                                                            }
                                                        } else {
                                                            userid = ObjectId(docs[1]._id)
                                                            username = docs[1].userid.username
                                                            mobile_verified = docs[1].userid.mobile_verified
                                                            profileimage = docs[1].userid.profileimage;
                                                            if (docs[1].userid.profileimage === null) {
                                                                profileimage = "uploads/userimage.png"
                                                            }
                                                            talent_points = docs[1].talent_points
                                                            view_points = docs[1].view_points
                                                            challenge_userid = ObjectId(docs[0]._id)
                                                            member_name = docs[0].userid.username
                                                            member_profile = docs[0].userid.profileimage;
                                                            if (docs[0].userid.profileimage === null) {
                                                                member_profile = "uploads/userimage.png"
                                                            }
                                                        }

                                                        if (mobile_verified == 'true') {
                                                            var user_condition = ""
                                                            var user_query = ""
                                                            var remaining_points = 0;
                                                            var enough_coins = true;
                                                            var mode = ""
                                                            var final_mode = ""
                                                            if (talent_points >= req.body.amount) {
                                                                user_query = { userid: ObjectId(feed_userid) }
                                                                user_condition = { $inc: { talent_points: -req.body.amount } }
                                                                mode = "talent"
                                                            } else if (view_points >= req.body.amount) {
                                                                user_query = { userid: ObjectId(feed_userid) }
                                                                user_condition = { $inc: { view_points: -req.body.amount } }
                                                                mode = "view"
                                                            } else if (view_points + talent_points >= req.body.amount) {
                                                                remaining_points = req.body.amount - talent_points
                                                                user_query = { userid: ObjectId(feed_userid) }
                                                                user_condition = { $inc: { view_points: -remaining_points }, $set: { talent_points: 0 } }
                                                                mode = "both"
                                                            } else {
                                                                enough_coins = false
                                                            }

                                                            if (enough_coins === false) {
                                                                return res.status(200).json({
                                                                    status: "Failed",
                                                                    message: "Insufficient points in your account to challenge a video."
                                                                });
                                                            } else {

                                                                var msgbody = username + " challenged you. Show them you are the best than anyone else! Accept the challenge!"
                                                                const note_no = Math.floor(10000000000 + Math.random() * 90000000000);

                                                                challenges.find({ userid: { $in: [feed_userid, feed_memberid] } })
                                                                    .exec()
                                                                    .then(data => {
                                                                        console.log(data)
                                                                        const challenge_value = Math.floor(100000 + Math.random() * 900000);
                                                                        if (data.length < 1) {
                                                                            //challenge for user
                                                                            var newChallenge = new challenges({
                                                                                _id: new mongoose.Types.ObjectId(),
                                                                                userid: feed_userid,
                                                                                challenged: {
                                                                                    my_feed_id: user_feedid,
                                                                                    my_userid: userid,
                                                                                    challenge_userid: challenge_userid,
                                                                                    challenge_feed_id: member_feedid,
                                                                                    amount: req.body.amount,
                                                                                    challenge_number: challenge_value,
                                                                                    created_at: Date.now()
                                                                                }
                                                                            })
                                                                            //challenge for challenged user
                                                                            var newChallenged = new challenges({
                                                                                _id: new mongoose.Types.ObjectId(),
                                                                                userid: feed_memberid,
                                                                                challenges: {
                                                                                    my_feed_id: member_feedid,
                                                                                    my_userid: challenge_userid,
                                                                                    challenge_userid: userid,
                                                                                    challenge_feed_id: user_feedid,
                                                                                    amount: req.body.amount,
                                                                                    challenge_number: challenge_value,
                                                                                    created_at: Date.now()
                                                                                }
                                                                            })

                                                                            newChallenge.save()
                                                                                .then(del => {
                                                                                    newChallenged.save()
                                                                                        .then(dels => {
                                                                                            userDetails.findOneAndUpdate(user_query, user_condition)
                                                                                                .exec()
                                                                                                .then(fixs => {

                                                                                                    var day = new Date()
                                                                                                    day = day.toISOString()
                                                                                                    day = String(day).split("T")
                                                                                                    day = day[0].replace(/-/g, "")

                                                                                                    if (mode === "both") {
                                                                                                        final_mode = ""
                                                                                                    } else {
                                                                                                        final_mode = " " + mode
                                                                                                    }
                                                                                                    const transaction_id = day + Math.floor(10000000000 + Math.random() * 90000000000);
                                                                                                    userTransactions.findOneAndUpdate(user_query, {
                                                                                                        $push: {
                                                                                                            transactions: {
                                                                                                                date_of_transaction: Date.now(),
                                                                                                                amount: req.body.amount,
                                                                                                                mode: mode,
                                                                                                                transaction_type: "debit",
                                                                                                                action: "challenge_video",
                                                                                                                message: "You have challenged " + member_name + " with your" + final_mode + " points",
                                                                                                                transaction_id: transaction_id
                                                                                                            }
                                                                                                        }
                                                                                                    }, { upsert: true }).exec()


                                                                                                    notificationModel.findOneAndUpdate({ userid: ObjectId(feed_memberid) }, {
                                                                                                            $push: {
                                                                                                                notifications: {
                                                                                                                    notification_data: msgbody,
                                                                                                                    member_id: feed_userid,
                                                                                                                    'additional_details.member_id': feed_userid,
                                                                                                                    'additional_details.feed_id': member_feedid,
                                                                                                                    'additional_details.member_feed_id': user_feedid,
                                                                                                                    'additional_details.userid': feed_memberid,
                                                                                                                    'additional_details.user_preview_url': other_preview_url,
                                                                                                                    'additional_details.member_preview_url': user_preview_url,
                                                                                                                    item_id: challenge_value,
                                                                                                                    notification_type: "challenge_create",
                                                                                                                    notification_number: note_no,
                                                                                                                    username: username,
                                                                                                                    profileimage: ObjectId(feed_userid),
                                                                                                                    member_name: member_name,
                                                                                                                    member_profile: ObjectId(feed_memberid),
                                                                                                                    'additional_details.challenge_amount': req.body.amount,
                                                                                                                    created_at: Date.now()
                                                                                                                }
                                                                                                            }
                                                                                                        })
                                                                                                        .exec()
                                                                                                        .then(dasy => {
                                                                                                            fcmModel.find({ userid: feed_memberid })
                                                                                                                .exec()
                                                                                                                .then(user => {
                                                                                                                    if (user.length < 1) {
                                                                                                                        return res.status(200).json({
                                                                                                                            status: "Failed",
                                                                                                                            message: "Please provide correct userid."
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
                                                                                                                                notification_slug: 'challenge_create',
                                                                                                                                url: constants.APIBASEURL + member_profile,
                                                                                                                                username: member_name,
                                                                                                                                item_id: challenge_value,
                                                                                                                                member_name: username,
                                                                                                                                member_url: constants.APIBASEURL + profileimage,
                                                                                                                                userid: feed_memberid,
                                                                                                                                feed_id: member_feedid,
                                                                                                                                member_feed_id: user_feedid,
                                                                                                                                member_id: feed_userid,
                                                                                                                                user_preview_url: other_preview_url,
                                                                                                                                member_preview_url: user_preview_url,
                                                                                                                                challenge_amount: req.body.amount,
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

                                                                                                                        fcm.send(message, function(err, response) {});

                                                                                                                        // Expire the challenge after 3 hrs if the user did not accept it.
                                                                                                                        var time = setTimeout(function() {
                                                                                                                            challenges.findOneAndUpdate({
                                                                                                                                    $and: [{ userid: feed_userid },
                                                                                                                                        { 'challenged.challenge_number': challenge_value }
                                                                                                                                    ]
                                                                                                                                }, {
                                                                                                                                    $pull: { challenged: { challenge_number: challenge_value } },
                                                                                                                                    $push: {
                                                                                                                                        expired_challenges: {
                                                                                                                                            my_feed_id: user_feedid,
                                                                                                                                            my_userid: userid,
                                                                                                                                            challenge_userid: challenge_userid,
                                                                                                                                            challenge_feed_id: member_feedid,
                                                                                                                                            amount: req.body.amount,
                                                                                                                                            challenge_number: challenge_value,
                                                                                                                                            created_at: Date.now()
                                                                                                                                        }
                                                                                                                                    }
                                                                                                                                })
                                                                                                                                .exec()
                                                                                                                                .then(data => {
                                                                                                                                    challenges.findOneAndUpdate({
                                                                                                                                            $and: [{ userid: feed_memberid },
                                                                                                                                                { 'challenges.challenge_number': challenge_value }
                                                                                                                                            ]
                                                                                                                                        }, {
                                                                                                                                            $pull: { challenges: { challenge_number: challenge_value } },
                                                                                                                                            $push: {
                                                                                                                                                expired_challenges: {
                                                                                                                                                    my_feed_id: member_feedid,
                                                                                                                                                    my_userid: challenge_userid,
                                                                                                                                                    challenge_userid: userid,
                                                                                                                                                    challenge_feed_id: user_feedid,
                                                                                                                                                    amount: req.body.amount,
                                                                                                                                                    challenge_number: challenge_value,
                                                                                                                                                    created_at: Date.now()
                                                                                                                                                }
                                                                                                                                            }
                                                                                                                                        })
                                                                                                                                        .exec()
                                                                                                                                        .then(datas => {
                                                                                                                                            userDetails.findOneAndUpdate({ userid: ObjectId(feed_userid) }, { $inc: { talent_points: req.body.amount } })
                                                                                                                                                .exec()
                                                                                                                                                .then(dess => {
                                                                                                                                                    var days1 = new Date()
                                                                                                                                                    days1 = days1.toISOString()
                                                                                                                                                    days1 = String(days1).split("T")
                                                                                                                                                    days1 = days1[0].replace(/-/g, "")
                                                                                                                                                    var modes1 = "talent"

                                                                                                                                                    const transaction_id1 = days1 + Math.floor(10000000000 + Math.random() * 90000000000);
                                                                                                                                                    userTransactions.findOneAndUpdate({ userid: ObjectId(feed_userid) }, {
                                                                                                                                                        $push: {
                                                                                                                                                            transactions: {
                                                                                                                                                                date_of_transaction: Date.now(),
                                                                                                                                                                amount: req.body.amount,
                                                                                                                                                                mode: modes1,
                                                                                                                                                                transaction_type: "credit",
                                                                                                                                                                action: "challenge_expiry",
                                                                                                                                                                message: "You have got talent points as your challenge request to " + member_name + " has expired",
                                                                                                                                                                transaction_id: transaction_id1
                                                                                                                                                            }
                                                                                                                                                        }
                                                                                                                                                    }, { upsert: true }).exec()
                                                                                                                                                    clearTimeout(time);
                                                                                                                                                }).catch(err => {
                                                                                                                                                    var spliterror = err.message.split(":")
                                                                                                                                                    res.status(500).json({
                                                                                                                                                        status: 'Failed',
                                                                                                                                                        message: spliterror[0] + spliterror[1]
                                                                                                                                                    });
                                                                                                                                                });
                                                                                                                                        }).catch(err => {
                                                                                                                                            var spliterror = err.message.split(":")
                                                                                                                                            res.status(500).json({
                                                                                                                                                status: 'Failed',
                                                                                                                                                message: spliterror[0] + spliterror[1]
                                                                                                                                            });
                                                                                                                                        });
                                                                                                                                }).catch(err => {
                                                                                                                                    var spliterror = err.message.split(":")
                                                                                                                                    res.status(500).json({
                                                                                                                                        status: 'Failed',
                                                                                                                                        message: spliterror[0] + spliterror[1]
                                                                                                                                    });
                                                                                                                                });
                                                                                                                        }, 10800000);
                                                                                                                        res.status(200).json({
                                                                                                                            status: 'Ok',
                                                                                                                            message: 'Challenged video successfully.'
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
                                                                                                                message: spliterror[0] + spliterror[1]
                                                                                                            });
                                                                                                        });

                                                                                                }).catch(err => {
                                                                                                    var spliterror = err.message.split(":")
                                                                                                    res.status(500).json({
                                                                                                        status: 'Failed',
                                                                                                        message: spliterror[0] + spliterror[1]
                                                                                                    });
                                                                                                });

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
                                                                        }
                                                                        //when we have userid
                                                                        else if (data.length === 1 && String(data[0].userid) === String(feed_userid)) {

                                                                            var total_challenged = data[0].challenged;
                                                                            var total_history = data[0].challenges_history;
                                                                            var count = 0;
                                                                            var is_challenged = false;
                                                                            var history_count = 0;

                                                                            if (total_history.length > 0) {
                                                                                total_history.forEach(function(efex) {
                                                                                    var date = new Date()
                                                                                    var date1 = date.setTime(date.getTime());
                                                                                    var dateNow = new Date(date1).toISOString();
                                                                                    var current_day = String(dateNow).substring(0, 10)
                                                                                    var history_date = String(efex.challenge_completed_at).substring(0, 10)
                                                                                    if (String(efex.my_feed_id) === String(user_feedid) && current_day === history_date) {
                                                                                        history_count += 1;
                                                                                    } else {
                                                                                        history_count = 0
                                                                                    }
                                                                                })
                                                                            }

                                                                            total_challenged.forEach(function(ele) {
                                                                                var date = new Date()
                                                                                var date1 = date.setTime(date.getTime());
                                                                                var dateNow = new Date(date1).toISOString();
                                                                                var current_day = String(dateNow).split('T')
                                                                                var hist = (ele.created_at).toISOString();
                                                                                var history_date = String(hist).split('T')
                                                                                if (String(ele.my_feed_id) === String(user_feedid) && current_day[0] === history_date[0]) {
                                                                                    count += 1;
                                                                                }
                                                                                if (String(ele.my_feed_id) === String(user_feedid) && String(ele.challenge_feed_id) === String(member_feedid)) {
                                                                                    is_challenged = true;
                                                                                }
                                                                            })

                                                                            if (is_challenged === true || history_count >= 3) {
                                                                                if (is_challenged === true) {
                                                                                    res.status(200).json({
                                                                                        status: 'Failed',
                                                                                        message: 'Already a challenge exists with these videos.'
                                                                                    });
                                                                                } else {
                                                                                    res.status(200).json({
                                                                                        status: 'Failed',
                                                                                        message: 'You have crossed your limit to participate in a challenge on this video.'
                                                                                    });
                                                                                }

                                                                            } else {

                                                                                if (count < 3) { // count should be less than 3

                                                                                    challenges.findOneAndUpdate({ userid: feed_userid }, {
                                                                                            $push: {
                                                                                                challenged: {
                                                                                                    my_feed_id: user_feedid,
                                                                                                    my_userid: userid,
                                                                                                    challenge_userid: challenge_userid,
                                                                                                    challenge_feed_id: member_feedid,
                                                                                                    amount: req.body.amount,
                                                                                                    challenge_number: challenge_value,
                                                                                                    created_at: Date.now()
                                                                                                }
                                                                                            }
                                                                                        })
                                                                                        .exec()
                                                                                        .then(foe => {
                                                                                            if (foe === null) {
                                                                                                res.status(200).json({
                                                                                                    status: 'Failed',
                                                                                                    message: 'please provide correct userid'
                                                                                                });
                                                                                            } else {
                                                                                                var newChallenged = new challenges({
                                                                                                    _id: new mongoose.Types.ObjectId(),
                                                                                                    userid: feed_memberid,
                                                                                                    challenges: {
                                                                                                        my_feed_id: member_feedid,
                                                                                                        my_userid: challenge_userid,
                                                                                                        challenge_userid: userid,
                                                                                                        challenge_feed_id: user_feedid,
                                                                                                        amount: req.body.amount,
                                                                                                        challenge_number: challenge_value,
                                                                                                        created_at: Date.now()
                                                                                                    }
                                                                                                })
                                                                                                newChallenged.save()
                                                                                                    .then(dels => {
                                                                                                        userDetails.findOneAndUpdate(user_query, user_condition)
                                                                                                            .exec()
                                                                                                            .then(fixs => {

                                                                                                                var day = new Date()
                                                                                                                day = day.toISOString()
                                                                                                                day = String(day).split("T")
                                                                                                                day = day[0].replace(/-/g, "")

                                                                                                                if (mode === "both") {
                                                                                                                    final_mode = ""
                                                                                                                } else {
                                                                                                                    final_mode = " " + mode
                                                                                                                }
                                                                                                                const transaction_id = day + Math.floor(10000000000 + Math.random() * 90000000000);
                                                                                                                userTransactions.findOneAndUpdate(user_query, {
                                                                                                                    $push: {
                                                                                                                        transactions: {
                                                                                                                            date_of_transaction: Date.now(),
                                                                                                                            amount: req.body.amount,
                                                                                                                            mode: mode,
                                                                                                                            transaction_type: "debit",
                                                                                                                            action: "challenge_video",
                                                                                                                            message: "You have challenged " + member_name + " with your" + final_mode + " points",
                                                                                                                            transaction_id: transaction_id
                                                                                                                        }
                                                                                                                    }
                                                                                                                }, { upsert: true }).exec()
                                                                                                                notificationModel.findOneAndUpdate({ userid: ObjectId(feed_memberid) }, {
                                                                                                                        $push: {
                                                                                                                            notifications: {
                                                                                                                                notification_data: msgbody,
                                                                                                                                member_id: feed_userid,
                                                                                                                                'additional_details.member_id': feed_userid,
                                                                                                                                'additional_details.feed_id': member_feedid,
                                                                                                                                'additional_details.member_feed_id': user_feedid,
                                                                                                                                'additional_details.userid': feed_memberid,
                                                                                                                                'additional_details.user_preview_url': other_preview_url,
                                                                                                                                'additional_details.member_preview_url': user_preview_url,
                                                                                                                                item_id: challenge_value,
                                                                                                                                notification_type: "challenge_create",
                                                                                                                                notification_number: note_no,
                                                                                                                                username: username,
                                                                                                                                profileimage: ObjectId(feed_userid),
                                                                                                                                member_name: member_name,
                                                                                                                                member_profile: ObjectId(feed_memberid),
                                                                                                                                'additional_details.challenge_amount': req.body.amount,
                                                                                                                                created_at: Date.now()
                                                                                                                            }
                                                                                                                        }
                                                                                                                    })
                                                                                                                    .exec()
                                                                                                                    .then(dasy => {
                                                                                                                        fcmModel.find({ userid: feed_memberid })
                                                                                                                            .exec()
                                                                                                                            .then(user => {
                                                                                                                                if (user.length < 1) {
                                                                                                                                    return res.status(200).json({
                                                                                                                                        status: "Failed",
                                                                                                                                        message: "Please provide correct userid."
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
                                                                                                                                            notification_slug: 'challenge_create',
                                                                                                                                            url: constants.APIBASEURL + member_profile,
                                                                                                                                            username: member_name,
                                                                                                                                            item_id: challenge_value,
                                                                                                                                            member_name: username,
                                                                                                                                            member_url: constants.APIBASEURL + profileimage,
                                                                                                                                            userid: feed_memberid,
                                                                                                                                            feed_id: member_feedid,
                                                                                                                                            member_feed_id: user_feedid,
                                                                                                                                            member_id: feed_userid,
                                                                                                                                            challenge_amount: req.body.amount,
                                                                                                                                            user_preview_url: other_preview_url,
                                                                                                                                            member_preview_url: user_preview_url,
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

                                                                                                                                    fcm.send(message, function(err, response) {});

                                                                                                                                    // Expire the challenge after 3 hrs if the user did not accept it.
                                                                                                                                    var time = setTimeout(function() {
                                                                                                                                        challenges.findOneAndUpdate({
                                                                                                                                                $and: [{ userid: feed_userid },
                                                                                                                                                    { 'challenged.challenge_number': challenge_value }
                                                                                                                                                ]
                                                                                                                                            }, {
                                                                                                                                                $pull: { challenged: { challenge_number: challenge_value } },
                                                                                                                                                $push: {
                                                                                                                                                    expired_challenges: {
                                                                                                                                                        my_feed_id: user_feedid,
                                                                                                                                                        my_userid: userid,
                                                                                                                                                        challenge_userid: challenge_userid,
                                                                                                                                                        challenge_feed_id: member_feedid,
                                                                                                                                                        amount: req.body.amount,
                                                                                                                                                        challenge_number: challenge_value,
                                                                                                                                                        created_at: Date.now()
                                                                                                                                                    }
                                                                                                                                                }
                                                                                                                                            })
                                                                                                                                            .exec()
                                                                                                                                            .then(data => {
                                                                                                                                                challenges.findOneAndUpdate({
                                                                                                                                                        $and: [{ userid: feed_memberid },
                                                                                                                                                            { 'challenges.challenge_number': challenge_value }
                                                                                                                                                        ]
                                                                                                                                                    }, {
                                                                                                                                                        $pull: { challenges: { challenge_number: challenge_value } },
                                                                                                                                                        $push: {
                                                                                                                                                            expired_challenges: {
                                                                                                                                                                my_feed_id: member_feedid,
                                                                                                                                                                my_userid: challenge_userid,
                                                                                                                                                                challenge_userid: userid,
                                                                                                                                                                challenge_feed_id: user_feedid,
                                                                                                                                                                amount: req.body.amount,
                                                                                                                                                                challenge_number: challenge_value,
                                                                                                                                                                created_at: Date.now()
                                                                                                                                                            }
                                                                                                                                                        }
                                                                                                                                                    })
                                                                                                                                                    .exec()
                                                                                                                                                    .then(datas => {
                                                                                                                                                        userDetails.findOneAndUpdate({ userid: ObjectId(feed_userid) }, { $inc: { talent_points: req.body.amount } })
                                                                                                                                                            .exec()
                                                                                                                                                            .then(dess => {
                                                                                                                                                                var days1 = new Date()
                                                                                                                                                                days1 = days1.toISOString()
                                                                                                                                                                days1 = String(days1).split("T")
                                                                                                                                                                days1 = days1[0].replace(/-/g, "")
                                                                                                                                                                var modes1 = "talent"

                                                                                                                                                                const transaction_id1 = days1 + Math.floor(10000000000 + Math.random() * 90000000000);
                                                                                                                                                                userTransactions.findOneAndUpdate({ userid: ObjectId(feed_userid) }, {
                                                                                                                                                                    $push: {
                                                                                                                                                                        transactions: {
                                                                                                                                                                            date_of_transaction: Date.now(),
                                                                                                                                                                            amount: req.body.amount,
                                                                                                                                                                            mode: modes1,
                                                                                                                                                                            transaction_type: "credit",
                                                                                                                                                                            action: "challenge_expiry",
                                                                                                                                                                            message: "You have got talent points as your challenge request to " + member_name + " has expired",
                                                                                                                                                                            transaction_id: transaction_id1
                                                                                                                                                                        }
                                                                                                                                                                    }
                                                                                                                                                                }, { upsert: true }).exec()

                                                                                                                                                                clearTimeout(time);
                                                                                                                                                            }).catch(err => {
                                                                                                                                                                var spliterror = err.message.split(":")
                                                                                                                                                                res.status(500).json({
                                                                                                                                                                    status: 'Failed',
                                                                                                                                                                    message: spliterror[0] + spliterror[1]
                                                                                                                                                                });
                                                                                                                                                            });
                                                                                                                                                    }).catch(err => {
                                                                                                                                                        var spliterror = err.message.split(":")
                                                                                                                                                        res.status(500).json({
                                                                                                                                                            status: 'Failed',
                                                                                                                                                            message: spliterror[0] + spliterror[1]
                                                                                                                                                        });
                                                                                                                                                    });
                                                                                                                                            }).catch(err => {
                                                                                                                                                var spliterror = err.message.split(":")
                                                                                                                                                res.status(500).json({
                                                                                                                                                    status: 'Failed',
                                                                                                                                                    message: spliterror[0] + spliterror[1]
                                                                                                                                                });
                                                                                                                                            });
                                                                                                                                    }, 10800000);
                                                                                                                                    res.status(200).json({
                                                                                                                                        status: 'Ok',
                                                                                                                                        message: 'Challenged video successfully.'
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
                                                                                                                            message: spliterror[0] + spliterror[1]
                                                                                                                        });
                                                                                                                    });
                                                                                                            }).catch(err => {
                                                                                                                var spliterror = err.message.split(":")
                                                                                                                res.status(500).json({
                                                                                                                    status: 'Failed',
                                                                                                                    message: spliterror[0] + spliterror[1]
                                                                                                                });
                                                                                                            });

                                                                                                    }).catch(err => {
                                                                                                        var spliterror = err.message.split(":")
                                                                                                        res.status(500).json({
                                                                                                            status: 'Failed',
                                                                                                            message: spliterror[0]
                                                                                                        });
                                                                                                    });;
                                                                                            }
                                                                                        })
                                                                                } else {
                                                                                    res.status(200).json({
                                                                                        status: 'Failed',
                                                                                        message: 'You have crossed your Challenge limit for this feed.'
                                                                                    });
                                                                                }
                                                                            }
                                                                        }
                                                                        //when we have challenging userid
                                                                        else if (data.length === 1 && String(data[0].userid) === String(feed_memberid)) {

                                                                            var total_challenges = data[0].challenges;
                                                                            var count = 0;
                                                                            var is_challenged = false;

                                                                            total_challenges.forEach(function(ele) {
                                                                                if (String(ele.my_feed_id) === String(member_feedid)) {
                                                                                    count += 1;
                                                                                }
                                                                                if (String(ele.my_feed_id) === String(member_feedid) && String(ele.challenge_feed_id) === String(user_feedid)) {
                                                                                    is_challenged = true;
                                                                                }
                                                                            })

                                                                            if (is_challenged === true) {
                                                                                res.status(200).json({
                                                                                    status: 'Failed',
                                                                                    message: 'Already a challenge exists with these videos.'
                                                                                });
                                                                            } else {
                                                                                if (count < 10) { // count should be less than 10

                                                                                    challenges.findOneAndUpdate({ userid: feed_memberid }, {
                                                                                            $push: {
                                                                                                challenges: {
                                                                                                    my_feed_id: member_feedid,
                                                                                                    my_userid: challenge_userid,
                                                                                                    challenge_userid: userid,
                                                                                                    challenge_feed_id: user_feedid,
                                                                                                    amount: req.body.amount,
                                                                                                    challenge_number: challenge_value,
                                                                                                    created_at: Date.now()
                                                                                                }
                                                                                            }
                                                                                        })
                                                                                        .exec()
                                                                                        .then(foe => {
                                                                                            if (foe === null) {
                                                                                                res.status(200).json({
                                                                                                    status: 'Failed',
                                                                                                    message: 'please provide correct member_id'
                                                                                                });
                                                                                            } else {
                                                                                                var newChallenge = new challenges({
                                                                                                    _id: new mongoose.Types.ObjectId(),
                                                                                                    userid: feed_userid,
                                                                                                    challenged: {
                                                                                                        my_feed_id: user_feedid,
                                                                                                        my_userid: userid,
                                                                                                        challenge_userid: challenge_userid,
                                                                                                        challenge_feed_id: member_feedid,
                                                                                                        amount: req.body.amount,
                                                                                                        challenge_number: challenge_value,
                                                                                                        created_at: Date.now()
                                                                                                    }
                                                                                                })
                                                                                                newChallenge.save()
                                                                                                    .then(del => {
                                                                                                        userDetails.findOneAndUpdate(user_query, user_condition)
                                                                                                            .exec()
                                                                                                            .then(fixs => {
                                                                                                                var day = new Date()
                                                                                                                day = day.toISOString()
                                                                                                                day = String(day).split("T")
                                                                                                                day = day[0].replace(/-/g, "")

                                                                                                                if (mode === "both") {
                                                                                                                    final_mode = ""
                                                                                                                } else {
                                                                                                                    final_mode = " " + mode
                                                                                                                }
                                                                                                                const transaction_id = day + Math.floor(10000000000 + Math.random() * 90000000000);
                                                                                                                userTransactions.findOneAndUpdate(user_query, {
                                                                                                                    $push: {
                                                                                                                        transactions: {
                                                                                                                            date_of_transaction: Date.now(),
                                                                                                                            amount: req.body.amount,
                                                                                                                            mode: mode,
                                                                                                                            transaction_type: "debit",
                                                                                                                            action: "challenge_video",
                                                                                                                            message: "You have challenged " + member_name + " with your" + final_mode + " points",
                                                                                                                            transaction_id: transaction_id
                                                                                                                        }
                                                                                                                    }
                                                                                                                }, { upsert: true }).exec()
                                                                                                                notificationModel.findOneAndUpdate({ userid: ObjectId(feed_memberid) }, {
                                                                                                                        $push: {
                                                                                                                            notifications: {
                                                                                                                                notification_data: msgbody,
                                                                                                                                member_id: feed_userid,
                                                                                                                                'additional_details.member_id': feed_userid,
                                                                                                                                'additional_details.feed_id': member_feedid,
                                                                                                                                'additional_details.member_feed_id': user_feedid,
                                                                                                                                'additional_details.userid': feed_memberid,
                                                                                                                                'additional_details.user_preview_url': other_preview_url,
                                                                                                                                'additional_details.member_preview_url': user_preview_url,
                                                                                                                                item_id: challenge_value,
                                                                                                                                notification_type: "challenge_create",
                                                                                                                                notification_number: note_no,
                                                                                                                                username: username,
                                                                                                                                profileimage: ObjectId(feed_userid),
                                                                                                                                member_name: member_name,
                                                                                                                                member_profile: ObjectId(feed_memberid),
                                                                                                                                'additional_details.challenge_amount': req.body.amount,
                                                                                                                                created_at: Date.now()
                                                                                                                            }
                                                                                                                        }
                                                                                                                    })
                                                                                                                    .exec()
                                                                                                                    .then(dasy => {
                                                                                                                        fcmModel.find({ userid: feed_memberid })
                                                                                                                            .exec()
                                                                                                                            .then(user => {
                                                                                                                                if (user.length < 1) {
                                                                                                                                    return res.status(200).json({
                                                                                                                                        status: "Failed",
                                                                                                                                        message: "Please provide correct userid."
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
                                                                                                                                            notification_slug: 'challenge_create',
                                                                                                                                            url: constants.APIBASEURL + member_profile,
                                                                                                                                            username: member_name,
                                                                                                                                            item_id: challenge_value,
                                                                                                                                            member_name: username,
                                                                                                                                            member_url: constants.APIBASEURL + profileimage,
                                                                                                                                            userid: feed_memberid,
                                                                                                                                            feed_id: member_feedid,
                                                                                                                                            member_feed_id: user_feedid,
                                                                                                                                            member_id: feed_userid,
                                                                                                                                            user_preview_url: other_preview_url,
                                                                                                                                            member_preview_url: user_preview_url,
                                                                                                                                            challenge_amount: req.body.amount,
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

                                                                                                                                    fcm.send(message, function(err, response) {});

                                                                                                                                    // Expire the challenge after 3 hrs if the user did not accept it.
                                                                                                                                    var time = setTimeout(function() {
                                                                                                                                        challenges.findOneAndUpdate({
                                                                                                                                                $and: [{ userid: feed_userid },
                                                                                                                                                    { 'challenged.challenge_number': challenge_value }
                                                                                                                                                ]
                                                                                                                                            }, {
                                                                                                                                                $pull: { challenged: { challenge_number: challenge_value } },
                                                                                                                                                $push: {
                                                                                                                                                    expired_challenges: {
                                                                                                                                                        my_feed_id: user_feedid,
                                                                                                                                                        my_userid: userid,
                                                                                                                                                        challenge_userid: challenge_userid,
                                                                                                                                                        challenge_feed_id: member_feedid,
                                                                                                                                                        amount: req.body.amount,
                                                                                                                                                        challenge_number: challenge_value,
                                                                                                                                                        created_at: Date.now()
                                                                                                                                                    }
                                                                                                                                                }
                                                                                                                                            })
                                                                                                                                            .exec()
                                                                                                                                            .then(data => {
                                                                                                                                                challenges.findOneAndUpdate({
                                                                                                                                                        $and: [{ userid: feed_memberid },
                                                                                                                                                            { 'challenges.challenge_number': challenge_value }
                                                                                                                                                        ]
                                                                                                                                                    }, {
                                                                                                                                                        $pull: { challenges: { challenge_number: challenge_value } },
                                                                                                                                                        $push: {
                                                                                                                                                            expired_challenges: {
                                                                                                                                                                my_feed_id: member_feedid,
                                                                                                                                                                my_userid: challenge_userid,
                                                                                                                                                                challenge_userid: userid,
                                                                                                                                                                challenge_feed_id: user_feedid,
                                                                                                                                                                amount: req.body.amount,
                                                                                                                                                                challenge_number: challenge_value,
                                                                                                                                                                created_at: Date.now()
                                                                                                                                                            }
                                                                                                                                                        }
                                                                                                                                                    })
                                                                                                                                                    .exec()
                                                                                                                                                    .then(datas => {
                                                                                                                                                        userDetails.findOneAndUpdate({ userid: ObjectId(feed_userid) }, { $inc: { talent_points: req.body.amount } })
                                                                                                                                                            .exec()
                                                                                                                                                            .then(dess => {
                                                                                                                                                                var days1 = new Date()
                                                                                                                                                                days1 = days1.toISOString()
                                                                                                                                                                days1 = String(days1).split("T")
                                                                                                                                                                days1 = days1[0].replace(/-/g, "")
                                                                                                                                                                var modes1 = "talent"

                                                                                                                                                                const transaction_id1 = days1 + Math.floor(10000000000 + Math.random() * 90000000000);
                                                                                                                                                                userTransactions.findOneAndUpdate({ userid: ObjectId(feed_userid) }, {
                                                                                                                                                                    $push: {
                                                                                                                                                                        transactions: {
                                                                                                                                                                            date_of_transaction: Date.now(),
                                                                                                                                                                            amount: req.body.amount,
                                                                                                                                                                            mode: modes1,
                                                                                                                                                                            transaction_type: "credit",
                                                                                                                                                                            action: "challenge_expiry",
                                                                                                                                                                            message: "You have got talent points as your challenge request to " + member_name + " has expired",
                                                                                                                                                                            transaction_id: transaction_id1
                                                                                                                                                                        }
                                                                                                                                                                    }
                                                                                                                                                                }, { upsert: true }).exec()

                                                                                                                                                                clearTimeout(time);
                                                                                                                                                            }).catch(err => {
                                                                                                                                                                var spliterror = err.message.split(":")
                                                                                                                                                                res.status(500).json({
                                                                                                                                                                    status: 'Failed',
                                                                                                                                                                    message: spliterror[0] + spliterror[1]
                                                                                                                                                                });
                                                                                                                                                            });
                                                                                                                                                    }).catch(err => {
                                                                                                                                                        var spliterror = err.message.split(":")
                                                                                                                                                        res.status(500).json({
                                                                                                                                                            status: 'Failed',
                                                                                                                                                            message: spliterror[0] + spliterror[1]
                                                                                                                                                        });
                                                                                                                                                    });
                                                                                                                                            }).catch(err => {
                                                                                                                                                var spliterror = err.message.split(":")
                                                                                                                                                res.status(500).json({
                                                                                                                                                    status: 'Failed',
                                                                                                                                                    message: spliterror[0] + spliterror[1]
                                                                                                                                                });
                                                                                                                                            });
                                                                                                                                    }, 10800000);
                                                                                                                                    res.status(200).json({
                                                                                                                                        status: 'Ok',
                                                                                                                                        message: 'Challenged video successfully.'
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
                                                                                                                            message: spliterror[0] + spliterror[1]
                                                                                                                        });
                                                                                                                    });

                                                                                                            }).catch(err => {
                                                                                                                var spliterror = err.message.split(":")
                                                                                                                res.status(500).json({
                                                                                                                    status: 'Failed',
                                                                                                                    message: spliterror[0] + spliterror[1]
                                                                                                                });
                                                                                                            });
                                                                                                    }).catch(err => {
                                                                                                        var spliterror = err.message.split(":")
                                                                                                        res.status(500).json({
                                                                                                            status: 'Failed',
                                                                                                            message: spliterror[0]
                                                                                                        });
                                                                                                    });
                                                                                            }
                                                                                        })
                                                                                } else {
                                                                                    res.status(200).json({
                                                                                        status: 'Failed',
                                                                                        message: 'The user has crossed the limit to recieve challenges on his feed for today.'
                                                                                    });
                                                                                }
                                                                            }
                                                                        }
                                                                        // when we have both challenging userid and userid
                                                                        else {

                                                                            var is_challenged = false;

                                                                            if (data[0].userid === feed_userid) {
                                                                                var total_challenged = data[0].challenged;
                                                                                var total_history = data[0].challenges_history
                                                                                var total_user_challenges = data[0].challenges;
                                                                                var challenged_count = 0;
                                                                                var history_count = 0;

                                                                                if (total_history.length > 0) {
                                                                                    total_history.forEach(function(efex) {
                                                                                        var date = new Date()
                                                                                        var date1 = date.setTime(date.getTime());
                                                                                        var dateNow = new Date(date1).toISOString();
                                                                                        var current_day = String(dateNow).split('T')
                                                                                        var hist = (efex.challenge_completed_at).toISOString();
                                                                                        var history_date = String(hist).split('T')
                                                                                        if (String(efex.my_feed_id) === String(user_feedid) && current_day[0] === history_date[0]) {

                                                                                            history_count += 1;
                                                                                        } else {
                                                                                            history_count = 0
                                                                                        }
                                                                                    })
                                                                                }

                                                                                if (total_challenged.length > 0) {
                                                                                    total_challenged.forEach(function(ele) {
                                                                                        var date = new Date()
                                                                                        var date1 = date.setTime(date.getTime());
                                                                                        var dateNow = new Date(date1).toISOString();
                                                                                        var current_day = String(dateNow).split('T')
                                                                                        var hist = (ele.created_at).toISOString();
                                                                                        var history_date = String(hist).split('T')
                                                                                        if (String(ele.my_feed_id) === String(user_feedid) && current_day[0] === history_date[0]) {
                                                                                            challenged_count += 1;
                                                                                        }
                                                                                        if (String(ele.my_feed_id) === String(user_feedid) && String(ele.challenge_feed_id) === String(member_feedid)) {
                                                                                            is_challenged = true;
                                                                                        }
                                                                                    })
                                                                                }
                                                                                var total_challenges = data[1].challenges;
                                                                                var challenges_count = 0;
                                                                                if (total_challenges.length > 0) {
                                                                                    total_challenges.forEach(function(elex) {
                                                                                        if (String(elex.my_feed_id) === String(member_feedid)) {
                                                                                            challenges_count += 1;
                                                                                        }
                                                                                        if (String(elex.my_feed_id) === String(member_feedid) && String(elex.challenge_feed_id) === String(user_feedid)) {
                                                                                            is_challenged = true;
                                                                                        }
                                                                                    })
                                                                                }
                                                                            } else {
                                                                                var total_challenges = data[0].challenges;
                                                                                var challenges_count = 0;
                                                                                if (total_challenges.length > 0) {
                                                                                    total_challenges.forEach(function(elem) {
                                                                                        if (String(elem.my_feed_id) === String(member_feedid)) {
                                                                                            challenges_count += 1;
                                                                                        }
                                                                                        if (String(elem.my_feed_id) === String(member_feedid) && String(elem.challenge_feed_id) === String(user_feedid)) {
                                                                                            is_challenged = true;
                                                                                        }
                                                                                    })
                                                                                }
                                                                                var total_challenged = data[1].challenged;
                                                                                var challenged_count = 0;
                                                                                if (total_challenged.length > 0) {
                                                                                    total_challenged.forEach(function(eles) {
                                                                                        var date = new Date()
                                                                                        var date1 = date.setTime(date.getTime());
                                                                                        var dateNow = new Date(date1).toISOString();
                                                                                        var current_day = String(dateNow).split('T')
                                                                                        var hist = (eles.created_at).toISOString();
                                                                                        var history_date = String(hist).split('T')
                                                                                        if (String(eles.my_feed_id) === String(user_feedid) && current_day[0] === history_date[0]) {
                                                                                            challenged_count += 1;
                                                                                        }
                                                                                        if (String(eles.my_feed_id) === String(user_feedid) && String(eles.challenge_feed_id) === String(member_feedid)) {
                                                                                            is_challenged = true;
                                                                                        }
                                                                                    })
                                                                                }
                                                                                var total_history = data[1].challenges_history
                                                                                var history_count = 0;
                                                                                if (total_history.length > 0) {
                                                                                    total_history.forEach(function(efex) {
                                                                                        var date = new Date()
                                                                                        var date1 = date.setTime(date.getTime());
                                                                                        var dateNow = new Date(date1).toISOString();
                                                                                        var current_day = String(dateNow).split('T')
                                                                                        var hist = (efex.challenge_completed_at).toISOString();
                                                                                        var history_date = String(hist).split('T')
                                                                                        if (String(efex.my_feed_id) === String(user_feedid) && current_day[0] === history_date[0]) {

                                                                                            history_count += 1;
                                                                                        } else {
                                                                                            history_count = 0
                                                                                        }
                                                                                    })
                                                                                }
                                                                            }
                                                                            if (is_challenged === true) {
                                                                                res.status(200).json({
                                                                                    status: 'Failed',
                                                                                    message: 'Already a challenge exists with these videos.'
                                                                                });
                                                                            } else {

                                                                                if (history_count >= 3) {
                                                                                    res.status(200).json({
                                                                                        status: 'Failed',
                                                                                        message: 'You have crossed your limit for today to send challenges on this video.'
                                                                                    });
                                                                                } else {
                                                                                    if (challenged_count < 3 && challenges_count < 10) {
                                                                                        challenges.findOneAndUpdate({ userid: feed_userid }, {
                                                                                                $push: {
                                                                                                    challenged: {
                                                                                                        my_feed_id: user_feedid,
                                                                                                        my_userid: userid,
                                                                                                        challenge_userid: challenge_userid,
                                                                                                        challenge_feed_id: member_feedid,
                                                                                                        amount: req.body.amount,
                                                                                                        challenge_number: challenge_value,
                                                                                                        created_at: Date.now()
                                                                                                    }
                                                                                                }
                                                                                            })
                                                                                            .exec()
                                                                                            .then(foe => {
                                                                                                if (foe === null) {
                                                                                                    res.status(200).json({
                                                                                                        status: 'Failed',
                                                                                                        message: 'please provide correct userid'
                                                                                                    });
                                                                                                } else {
                                                                                                    challenges.findOneAndUpdate({ userid: feed_memberid }, {
                                                                                                            $push: {
                                                                                                                challenges: {
                                                                                                                    my_feed_id: member_feedid,
                                                                                                                    my_userid: challenge_userid,
                                                                                                                    challenge_userid: userid,
                                                                                                                    challenge_feed_id: user_feedid,
                                                                                                                    amount: req.body.amount,
                                                                                                                    challenge_number: challenge_value,
                                                                                                                    created_at: Date.now()
                                                                                                                }
                                                                                                            }
                                                                                                        })
                                                                                                        .exec()
                                                                                                        .then(foe => {
                                                                                                            if (foe === null) {
                                                                                                                res.status(200).json({
                                                                                                                    status: 'Failed',
                                                                                                                    message: 'please provide correct challenging_userid'
                                                                                                                });
                                                                                                            } else {
                                                                                                                userDetails.findOneAndUpdate(user_query, user_condition)
                                                                                                                    .exec()
                                                                                                                    .then(fixs => {
                                                                                                                        var day = new Date()
                                                                                                                        day = day.toISOString()
                                                                                                                        day = String(day).split("T")
                                                                                                                        day = day[0].replace(/-/g, "")

                                                                                                                        if (mode === "both") {
                                                                                                                            final_mode = ""
                                                                                                                        } else {
                                                                                                                            final_mode = " " + mode
                                                                                                                        }
                                                                                                                        const transaction_id = day + Math.floor(10000000000 + Math.random() * 90000000000);
                                                                                                                        userTransactions.findOneAndUpdate(user_query, {
                                                                                                                            $push: {
                                                                                                                                transactions: {
                                                                                                                                    date_of_transaction: Date.now(),
                                                                                                                                    amount: req.body.amount,
                                                                                                                                    mode: mode,
                                                                                                                                    transaction_type: "debit",
                                                                                                                                    action: "challenge_video",
                                                                                                                                    message: "You have challenged " + member_name + " with your" + final_mode + " points",
                                                                                                                                    transaction_id: transaction_id
                                                                                                                                }
                                                                                                                            }
                                                                                                                        }, { upsert: true }).exec()
                                                                                                                        notificationModel.findOneAndUpdate({ userid: ObjectId(feed_memberid) }, {
                                                                                                                                $push: {
                                                                                                                                    notifications: {
                                                                                                                                        notification_data: msgbody,
                                                                                                                                        member_id: feed_userid,
                                                                                                                                        'additional_details.member_id': feed_userid,
                                                                                                                                        'additional_details.feed_id': member_feedid,
                                                                                                                                        'additional_details.member_feed_id': user_feedid,
                                                                                                                                        'additional_details.userid': feed_memberid,
                                                                                                                                        'additional_details.user_preview_url': other_preview_url,
                                                                                                                                        'additional_details.member_preview_url': user_preview_url,
                                                                                                                                        item_id: challenge_value,
                                                                                                                                        notification_type: "challenge_create",
                                                                                                                                        notification_number: note_no,
                                                                                                                                        username: username,
                                                                                                                                        profileimage: ObjectId(feed_userid),
                                                                                                                                        member_name: member_name,
                                                                                                                                        member_profile: ObjectId(feed_memberid),
                                                                                                                                        'additional_details.challenge_amount': req.body.amount,
                                                                                                                                        created_at: Date.now()
                                                                                                                                    }
                                                                                                                                }
                                                                                                                            })
                                                                                                                            .exec()
                                                                                                                            .then(dasy => {
                                                                                                                                fcmModel.find({ userid: feed_memberid })
                                                                                                                                    .exec()
                                                                                                                                    .then(user => {
                                                                                                                                        if (user.length < 1) {
                                                                                                                                            return res.status(200).json({
                                                                                                                                                status: "Failed",
                                                                                                                                                message: "Please provide correct userid."
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
                                                                                                                                                    notification_slug: 'challenge_create',
                                                                                                                                                    url: constants.APIBASEURL + member_profile,
                                                                                                                                                    username: member_name,
                                                                                                                                                    item_id: challenge_value,
                                                                                                                                                    member_name: username,
                                                                                                                                                    member_url: constants.APIBASEURL + profileimage,
                                                                                                                                                    userid: feed_memberid,
                                                                                                                                                    feed_id: member_feedid,
                                                                                                                                                    member_feed_id: user_feedid,
                                                                                                                                                    member_id: feed_userid,
                                                                                                                                                    user_preview_url: other_preview_url,
                                                                                                                                                    member_preview_url: user_preview_url,
                                                                                                                                                    challenge_amount: req.body.amount,
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

                                                                                                                                            fcm.send(message, function(err, response) {});

                                                                                                                                            // Expire the challenge after 3 hrs if the user did not accept it.
                                                                                                                                            var time = setTimeout(function() {
                                                                                                                                                challenges.findOneAndUpdate({
                                                                                                                                                        $and: [{ userid: feed_userid },
                                                                                                                                                            { 'challenged.challenge_number': challenge_value }
                                                                                                                                                        ]
                                                                                                                                                    }, {
                                                                                                                                                        $pull: { challenged: { challenge_number: challenge_value } },
                                                                                                                                                        $push: {
                                                                                                                                                            expired_challenges: {
                                                                                                                                                                my_feed_id: user_feedid,
                                                                                                                                                                my_userid: userid,
                                                                                                                                                                challenge_userid: challenge_userid,
                                                                                                                                                                challenge_feed_id: member_feedid,
                                                                                                                                                                amount: req.body.amount,
                                                                                                                                                                challenge_number: challenge_value,
                                                                                                                                                                created_at: Date.now()
                                                                                                                                                            }
                                                                                                                                                        }
                                                                                                                                                    })
                                                                                                                                                    .exec()
                                                                                                                                                    .then(data => {
                                                                                                                                                        challenges.findOneAndUpdate({
                                                                                                                                                                $and: [{ userid: feed_memberid },
                                                                                                                                                                    { 'challenges.challenge_number': challenge_value }
                                                                                                                                                                ]
                                                                                                                                                            }, {
                                                                                                                                                                $pull: { challenges: { challenge_number: challenge_value } },
                                                                                                                                                                $push: {
                                                                                                                                                                    expired_challenges: {
                                                                                                                                                                        my_feed_id: member_feedid,
                                                                                                                                                                        my_userid: challenge_userid,
                                                                                                                                                                        challenge_userid: userid,
                                                                                                                                                                        challenge_feed_id: user_feedid,
                                                                                                                                                                        amount: req.body.amount,
                                                                                                                                                                        challenge_number: challenge_value,
                                                                                                                                                                        created_at: Date.now()
                                                                                                                                                                    }
                                                                                                                                                                }
                                                                                                                                                            })
                                                                                                                                                            .exec()
                                                                                                                                                            .then(datas => {
                                                                                                                                                                userDetails.findOneAndUpdate({ userid: ObjectId(feed_userid) }, { $inc: { talent_points: req.body.amount } })
                                                                                                                                                                    .exec()
                                                                                                                                                                    .then(dess => {

                                                                                                                                                                        var days1 = new Date()
                                                                                                                                                                        days1 = days1.toISOString()
                                                                                                                                                                        days1 = String(days1).split("T")
                                                                                                                                                                        days1 = days1[0].replace(/-/g, "")
                                                                                                                                                                        var modes1 = "talent"

                                                                                                                                                                        const transaction_id1 = days1 + Math.floor(10000000000 + Math.random() * 90000000000);
                                                                                                                                                                        userTransactions.findOneAndUpdate({ userid: ObjectId(feed_userid) }, {
                                                                                                                                                                            $push: {
                                                                                                                                                                                transactions: {
                                                                                                                                                                                    date_of_transaction: Date.now(),
                                                                                                                                                                                    amount: req.body.amount,
                                                                                                                                                                                    mode: modes1,
                                                                                                                                                                                    transaction_type: "credit",
                                                                                                                                                                                    action: "challenge_expiry",
                                                                                                                                                                                    message: "You have got talent points as your challenge request to " + member_name + " has expired",
                                                                                                                                                                                    transaction_id: transaction_id1
                                                                                                                                                                                }
                                                                                                                                                                            }
                                                                                                                                                                        }, { upsert: true }).exec()

                                                                                                                                                                        clearTimeout(time);
                                                                                                                                                                    }).catch(err => {
                                                                                                                                                                        var spliterror = err.message.split(":")
                                                                                                                                                                        res.status(500).json({
                                                                                                                                                                            status: 'Failed',
                                                                                                                                                                            message: spliterror[0] + spliterror[1]
                                                                                                                                                                        });
                                                                                                                                                                    });
                                                                                                                                                            }).catch(err => {
                                                                                                                                                                var spliterror = err.message.split(":")
                                                                                                                                                                res.status(500).json({
                                                                                                                                                                    status: 'Failed',
                                                                                                                                                                    message: spliterror[0] + spliterror[1]
                                                                                                                                                                });
                                                                                                                                                            });
                                                                                                                                                    }).catch(err => {
                                                                                                                                                        var spliterror = err.message.split(":")
                                                                                                                                                        res.status(500).json({
                                                                                                                                                            status: 'Failed',
                                                                                                                                                            message: spliterror[0] + spliterror[1]
                                                                                                                                                        });
                                                                                                                                                    });
                                                                                                                                            }, 10800000); //10800000
                                                                                                                                            res.status(200).json({
                                                                                                                                                status: 'Ok',
                                                                                                                                                message: 'Challenged video successfully.'
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
                                                                                                                                    message: spliterror[0] + spliterror[1]
                                                                                                                                });
                                                                                                                            });
                                                                                                                    }).catch(err => {
                                                                                                                        var spliterror = err.message.split(":")
                                                                                                                        res.status(500).json({
                                                                                                                            status: 'Failed',
                                                                                                                            message: spliterror[0] + spliterror[1]
                                                                                                                        });
                                                                                                                    });
                                                                                                            }
                                                                                                        })
                                                                                                }
                                                                                            })
                                                                                    } else {
                                                                                        if (challenged_count >= 3) {
                                                                                            res.status(200).json({
                                                                                                status: 'Failed',
                                                                                                message: 'You have crossed your Challenge limit for this feed.'
                                                                                            });
                                                                                        } else {
                                                                                            res.status(200).json({
                                                                                                status: 'Failed',
                                                                                                message: 'The user has crossed the limit to get challenges for the feed for today.'
                                                                                            });
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }
                                                                        }
                                                                    })
                                                            }
                                                        } else {
                                                            res.status(200).json({
                                                                status: 'Verification',
                                                                message: "Please verify your mobile number for donations."
                                                            });
                                                        }

                                                    } else {
                                                        res.status(200).json({
                                                            status: 'Failed',
                                                            message: "Please provide correct userid and member_id"
                                                        });
                                                    }
                                                }).catch(err => { //catch for offer_id find.
                                                    var spliterror = err.message.split("_")
                                                    if (spliterror[1].indexOf("member_id") >= 0) {
                                                        res.status(200).json({
                                                            status: 'Failed',
                                                            message: "Please provide correct member_id"
                                                        });
                                                    } else if (spliterror[1].indexOf("userid") >= 0) {
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
                                            return res.status(200).json({
                                                status: "Failed",
                                                message: "You cannot challenge a video with reposted video."
                                            });
                                        }
                                    } else {
                                        return res.status(200).json({
                                            status: "Failed",
                                            message: "You cannot challenge your own video."
                                        });
                                    }
                                } else {
                                    return res.status(200).json({
                                        status: "Failed",
                                        message: "Please provide correct feed_id and member_feed_id."
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


router.post("/accept_challenge", (req, res, next) => {

    var keyArray = ["userid", "iv_token", "clientid", "feed_id", "member_feed_id", "member_id"];
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

                        iv_feeds.find({ _id: { $in: [ObjectId(req.body.feed_id), ObjectId(req.body.member_feed_id)] }, feed_expiry_status: 0 })
                            .exec()
                            .then(fex => {
                                if (fex.length < 2) {
                                    console.log(req.body.feed_id)
                                    console.log(req.body.member_feed_id)
                                    return res.status(200).json({
                                        status: "Failed",
                                        message: "Oops!! Cannot accept the challenge since the feed is expired or may be a challenge is running on it."
                                    });
                                } else {
                                    console.log(req.body.member_feed_id)
                                    challenges.find({ userid: req.body.userid }, { 'challenges': 1, challenges_history: 1, on_going_challenges: 1 })
                                        .populate({ path: 'challenges.my_feed_id challenges.challenge_feed_id challenges.my_userid challenges.challenge_userid', populate: { path: 'userid' } })
                                        .exec()
                                        .then(docs => {

                                            if (docs.length < 1) {


                                                return res.status(200).json({
                                                    status: "Failed",
                                                    message: "Oops!! Cannot accept the challenge since the feed is expired or may be a challenge is running on it."
                                                });
                                            } else {

                                                var initial_challenges = docs[0].challenges;


                                                var user_challenges = []
                                                if (initial_challenges.length > 1) {
                                                    var found = initial_challenges.find(o => String(o.my_feed_id._id) === String(req.body.feed_id) && String(o.challenge_feed_id._id) === String(req.body.member_feed_id))
                                                    if (typeof found != 'undefined') {
                                                        user_challenges.push(found)
                                                    } else {
                                                        user_challenges = docs[0].challenges
                                                    }
                                                } else {
                                                    console.log("in else")
                                                    user_challenges = docs[0].challenges
                                                }

                                                if (user_challenges.length < 1) {
                                                    return res.status(200).json({
                                                        status: "Failed",
                                                        message: "The challenge might have expired."
                                                    });
                                                } else if (user_challenges[0].status === 1) {
                                                    return res.status(200).json({
                                                        status: "Failed",
                                                        message: "You have rejected this challenge previously."
                                                    });
                                                } else {

                                                    var current_user_views = 0
                                                    var current_member_views = 0

                                                    //console.log(user_challenges[0])

                                                    current_user_views = user_challenges[0].my_feed_id.no_views
                                                    current_member_views = user_challenges[0].challenge_feed_id.no_views

                                                    //  console.log("user "+current_user_views)
                                                    //  console.log("member "+current_member_views)
                                                    var date = new Date()
                                                    var date1 = date.setTime(date.getTime());
                                                    var dateNow = new Date(date1).toISOString();
                                                    var t1_my_feed = Date.parse(user_challenges[0].my_feed_id.feeds_expiry_time_) - Date.parse(dateNow);
                                                    var hours1 = Math.floor(t1_my_feed / (1000 * 60 * 60));
                                                    var t2_other_feed = Date.parse(user_challenges[0].challenge_feed_id.feeds_expiry_time_) - Date.parse(dateNow);
                                                    var hours2 = Math.floor(t2_other_feed / (1000 * 60 * 60));

                                                    var username = user_challenges[0].my_userid.userid.username;
                                                    var msgbody = username + " accepted your challenge."
                                                    var profileimage = user_challenges[0].my_userid.userid.profileimage;
                                                    if (user_challenges[0].my_userid.userid.profileimage === null) {
                                                        profileimage = "uploads/userimage.png"
                                                    }

                                                    var member_name = user_challenges[0].challenge_userid.userid.username;
                                                    var member_profile = user_challenges[0].challenge_userid.userid.profileimage;
                                                    if (user_challenges[0].challenge_userid.userid.profileimage === null) {
                                                        member_profile = "uploads/userimage.png"
                                                    }

                                                    userDetails.find({
                                                            userid: {
                                                                $in: [ObjectId(user_challenges[0].my_userid.userid._id),
                                                                    ObjectId(user_challenges[0].challenge_userid.userid._id)
                                                                ]
                                                            }
                                                        })
                                                        .populate('followers')
                                                        .exec()
                                                        .then(dex => {

                                                            var main_user = ""
                                                            var member_user = ""
                                                            var main_followers = []
                                                            var main_object_followers = []
                                                            var member_followers = []
                                                            var member_object_followers = []
                                                            var main_contacts = []
                                                            var main_object_contacts = []
                                                            var member_contacts = []
                                                            var member_object_contacts = []
                                                            var follow = []
                                                            var member_follow = []
                                                            var mobile_verified = ''

                                                            if (String(dex[0].userid === String(user_challenges[0].my_userid.userid._id))) {
                                                                main_user = dex[0].userid
                                                                member_user = dex[1].userid
                                                                follow = dex[0].followers
                                                                member_follow = dex[1].followers
                                                                mobile_verified = user_challenges[0].my_userid.userid.mobile_verified
                                                            } else {
                                                                main_user = dex[1].userid
                                                                member_user = dex[0].userid
                                                                follow = dex[1].followers
                                                                member_follow = dex[0].followers
                                                                mobile_verified = user_challenges[0].challenge_userid.userid.mobile_verified
                                                            }

                                                            if (mobile_verified == 'true') {
                                                                if (follow.length > 0) {
                                                                    follow.forEach(function(dog) {
                                                                        main_followers.push(dog.userid)
                                                                        main_object_followers.push(ObjectId(dog.userid))
                                                                    })
                                                                }
                                                                if (member_follow.length > 0) {
                                                                    member_follow.forEach(function(dogs) {
                                                                        member_followers.push(dogs.userid)
                                                                        member_object_followers.push(ObjectId(dogs.userid))
                                                                    })
                                                                }

                                                                contactsModel.distinct("existing_contacts.contact", { userid: ObjectId(req.body.userid) })
                                                                    .exec()
                                                                    .then(dot => {
                                                                        contactsModel.distinct("existing_contacts.contact", { userid: ObjectId(req.body.member_id) })
                                                                            .exec()
                                                                            .then(dots => {


                                                                                if (dot.length > 0) {

                                                                                    dot.forEach(function(con) {
                                                                                        var found = dots.find(o => String(o) === String(con))

                                                                                        if (typeof found === 'undefined' && String(con) != String(req.body.member_id)) {
                                                                                            main_object_contacts.push(ObjectId(con))
                                                                                            main_contacts.push(con)
                                                                                        }

                                                                                    })
                                                                                }
                                                                                if (dots.length > 0) {

                                                                                    dots.forEach(function(cons) {

                                                                                        if (String(cons) != String(req.body.userid)) {
                                                                                            member_object_contacts.push(ObjectId(cons))
                                                                                            member_contacts.push(cons)
                                                                                        }

                                                                                    })
                                                                                }

                                                                                main_contacts = main_contacts.concat(main_followers)
                                                                                main_object_contacts = main_object_contacts.concat(main_object_followers)
                                                                                member_contacts = member_contacts.concat(member_followers)
                                                                                member_object_contacts = member_object_contacts.concat(member_object_followers)

                                                                                //  console.log("main contacts"+main_object_contacts)

                                                                                if (hours1 > 0 && hours2 > 0) { //2 and 2
                                                                                    var total_history = docs[0].challenges_history
                                                                                    var history_count = 0;
                                                                                    if (total_history.length > 0) {
                                                                                        total_history.forEach(function(efex) {
                                                                                            var dates = new Date()
                                                                                            var dates1 = date.setTime(dates.getTime());
                                                                                            var dateNow = new Date(dates1).toISOString();
                                                                                            var current_day = String(dateNow).split('T')
                                                                                            var hist = (efex.challenge_completed_at).toISOString()
                                                                                            var history_date = String(hist).split('T')
                                                                                            if (String(efex.my_feed_id) === String(req.body.feed_id) && current_day[0] === history_date[0]) {
                                                                                                history_count += 1;
                                                                                            } else {
                                                                                                history_count = 0
                                                                                            }
                                                                                        })
                                                                                    }
                                                                                    if (history_count >= 3) {
                                                                                        res.status(200).json({
                                                                                            status: 'Failed',
                                                                                            message: 'Your video is exhausted for today! Let it rest!!'
                                                                                        });
                                                                                    } else {
                                                                                        var ongoing = docs[0].on_going_challenges;
                                                                                        var history = docs[0].challenges_history;

                                                                                        var is_ongoing = false;
                                                                                        var in_history = false;
                                                                                        var is_challenged = false;
                                                                                        var already_winner = "";
                                                                                        var history_count = 0;
                                                                                        ongoing.every(function(ele) {
                                                                                            if (String(ele.my_feed_id) === String(req.body.feed_id)) {
                                                                                                is_ongoing = true
                                                                                                return false
                                                                                            } else {
                                                                                                return true
                                                                                            }
                                                                                        })

                                                                                        history.every(function(ele) {
                                                                                            if (String(ele.my_feed_id) === String(req.body.feed_id)) {
                                                                                                if (String(ele.challenge_feed_id) === String(req.body.member_feed_id)) {
                                                                                                    is_challenged = true
                                                                                                    already_winner = ele.winner
                                                                                                    return false
                                                                                                } else {
                                                                                                    var timeleft = Date.parse(dateNow) - Date.parse(ele.challenge_completed_at);
                                                                                                    var hoursleft = Math.floor(timeleft / (1000 * 60 * 60));
                                                                                                    if (hoursleft < 2) {
                                                                                                        in_history = true;
                                                                                                        return false
                                                                                                    } else {
                                                                                                        return true
                                                                                                    }
                                                                                                }
                                                                                            } else {
                                                                                                return true
                                                                                            }
                                                                                        })

                                                                                        if (is_ongoing === true) {
                                                                                            return res.status(200).json({
                                                                                                status: "Failed",
                                                                                                message: "You have a challenge ongoing on this feed."
                                                                                            });
                                                                                        } else {

                                                                                            if (in_history === true) {
                                                                                                return res.status(200).json({
                                                                                                    status: "Failed",
                                                                                                    message: "This video is in cooling period!"
                                                                                                });
                                                                                            } else {
                                                                                                challenges.find({ userid: req.body.member_id, 'challenged.challenge_number': user_challenges[0].challenge_number }, { 'challenged.$': 1, challenges_history: 1, on_going_challenges: 1 })
                                                                                                    .exec()
                                                                                                    .then(data => {

                                                                                                        if (data.length < 1) {
                                                                                                            return res.status(200).json({
                                                                                                                status: "Failed",
                                                                                                                message: "Oops!! Cannot accept the challenge since the feed is expired or may be a challenge is running on it."
                                                                                                            });
                                                                                                        } else {
                                                                                                            var ongoing_feed = data[0].on_going_challenges;
                                                                                                            var member_challenges = data[0].challenged

                                                                                                            var initial_member_challenges = data[0].challenged

                                                                                                            var is_ongoing_member = false

                                                                                                            console.log(member_challenges)

                                                                                                            if (user_challenges[0].challenge_number == member_challenges[0].challenge_number) {

                                                                                                                ongoing_feed.every(function(ele) {
                                                                                                                    if (String(ele.my_feed_id) === String(req.body.member_feed_id)) {
                                                                                                                        is_ongoing_member = true
                                                                                                                        return false
                                                                                                                    } else {
                                                                                                                        return true
                                                                                                                    }
                                                                                                                })
                                                                                                                if (is_ongoing_member === true) {
                                                                                                                    return res.status(200).json({
                                                                                                                        status: "Failed",
                                                                                                                        message: "User has a challenge ongoing on this feed. Please try again later."
                                                                                                                    });
                                                                                                                } else {
                                                                                                                    userDetails.find({ userid: ObjectId(req.body.userid) })
                                                                                                                        .exec()
                                                                                                                        .then(foos => {
                                                                                                                            var user_condition = ""
                                                                                                                            var user_query = ""
                                                                                                                            var remaining_points = 0;
                                                                                                                            var talent_points = foos[0].talent_points;
                                                                                                                            var view_points = foos[0].view_points;
                                                                                                                            var enough_coins = true;
                                                                                                                            var mode = ""
                                                                                                                            var final_mode = ""
                                                                                                                            if (talent_points >= member_challenges[0].amount) {
                                                                                                                                user_query = { userid: ObjectId(req.body.userid) }
                                                                                                                                user_condition = { $inc: { talent_points: -member_challenges[0].amount } }
                                                                                                                                mode = "talent"
                                                                                                                            } else if (view_points >= member_challenges[0].amount) {
                                                                                                                                user_query = { userid: ObjectId(req.body.userid) }
                                                                                                                                user_condition = { $inc: { view_points: -member_challenges[0].amount } }
                                                                                                                                mode = "view"
                                                                                                                            } else if (view_points + talent_points >= member_challenges[0].amount) {
                                                                                                                                remaining_points = member_challenges[0].amount - talent_points
                                                                                                                                user_query = { userid: ObjectId(req.body.userid) }
                                                                                                                                user_condition = { $inc: { view_points: -remaining_points }, $set: { talent_points: 0 } }
                                                                                                                                mode = "both"
                                                                                                                            } else {
                                                                                                                                enough_coins = false
                                                                                                                            }

                                                                                                                            if (enough_coins === false) {
                                                                                                                                return res.status(200).json({
                                                                                                                                    status: "Failed",
                                                                                                                                    message: "Insufficient points in your account to accept the challenge."
                                                                                                                                });
                                                                                                                            } else {
                                                                                                                                userDetails.findOneAndUpdate(user_query, user_condition)
                                                                                                                                    .exec()
                                                                                                                                    .then(puf => {
                                                                                                                                        var day = new Date()
                                                                                                                                        day = day.toISOString()
                                                                                                                                        day = String(day).split("T")
                                                                                                                                        day = day[0].replace(/-/g, "")

                                                                                                                                        if (mode === "both") {
                                                                                                                                            final_mode = ""
                                                                                                                                        } else {
                                                                                                                                            final_mode = " " + mode
                                                                                                                                        }
                                                                                                                                        const transaction_id = day + Math.floor(10000000000 + Math.random() * 90000000000);
                                                                                                                                        userTransactions.findOneAndUpdate(user_query, {
                                                                                                                                            $push: {
                                                                                                                                                transactions: {
                                                                                                                                                    date_of_transaction: Date.now(),
                                                                                                                                                    amount: member_challenges[0].amount,
                                                                                                                                                    mode: mode,
                                                                                                                                                    transaction_type: "debit",
                                                                                                                                                    action: "challenge_video",
                                                                                                                                                    message: "You have accepted " + member_name + "'s challenge with your" + final_mode + " points",
                                                                                                                                                    transaction_id: transaction_id
                                                                                                                                                }
                                                                                                                                            }
                                                                                                                                        }, { upsert: true }).exec()

                                                                                                                                        //  user_challenges[0].user_views = current_user_views
                                                                                                                                        //  user_challenges[0].member_views = current_member_views
                                                                                                                                        //  member_challenges[0].user_views = current_member_views
                                                                                                                                        //  member_challenges[0].member_views = current_user_views
                                                                                                                                        user_challenges[0].created_at = Date.now()
                                                                                                                                        member_challenges[0].created_at = Date.now()

                                                                                                                                        challenges.findOneAndUpdate({ userid: req.body.userid, 'challenges.challenge_number': user_challenges[0].challenge_number }, {
                                                                                                                                                $pull: { challenges: { challenge_number: user_challenges[0].challenge_number } },
                                                                                                                                                $push: { on_going_challenges: user_challenges[0] }
                                                                                                                                            })
                                                                                                                                            .exec()
                                                                                                                                            .then(col => {
                                                                                                                                                challenges.findOneAndUpdate({ userid: req.body.member_id, 'challenged.challenge_number': member_challenges[0].challenge_number }, {
                                                                                                                                                        $pull: { challenged: { challenge_number: member_challenges[0].challenge_number } },
                                                                                                                                                        $push: { on_going_challenges: member_challenges[0] }
                                                                                                                                                    })
                                                                                                                                                    .exec()
                                                                                                                                                    .then(cons => {
                                                                                                                                                        iv_feeds.updateMany({ _id: { $in: [ObjectId(req.body.feed_id), ObjectId(req.body.member_feed_id)] } }, { $set: { is_under_challenge: true, challenge_number: member_challenges[0].challenge_number } })
                                                                                                                                                            .exec()
                                                                                                                                                            .then(fixs => {
                                                                                                                                                                const note_no = Math.floor(10000000000 + Math.random() * 90000000000);
                                                                                                                                                                notificationModel.findOneAndUpdate({ userid: ObjectId(req.body.member_id) }, {
                                                                                                                                                                        $push: {
                                                                                                                                                                            notifications: {
                                                                                                                                                                                notification_data: msgbody,
                                                                                                                                                                                member_id: req.body.userid,
                                                                                                                                                                                notification_type: 'ChallengeDetails',
                                                                                                                                                                                item_id: String(user_challenges[0].challenge_number),
                                                                                                                                                                                notification_number: note_no,
                                                                                                                                                                                username: username,
                                                                                                                                                                                profileimage: ObjectId(req.body.userid),
                                                                                                                                                                                member_name: member_name,
                                                                                                                                                                                member_profile: ObjectId(req.body.member_id),
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
                                                                                                                                                                            notificationModel.update({
                                                                                                                                                                                    $and: [{ "notifications.notification_type": 'challenge_create' }, { userid: ObjectId(req.body.userid) },
                                                                                                                                                                                        { "notifications.item_id": String(user_challenges[0].challenge_number) }
                                                                                                                                                                                    ]
                                                                                                                                                                                }, { "$set": { "notifications.$[elem].is_action_done": true } }, {
                                                                                                                                                                                    "arrayFilters": [{ $and: [{ "elem.notification_type": 'challenge_create' }, { 'elem.item_id': String(user_challenges[0].challenge_number) }] }],
                                                                                                                                                                                    "multi": true
                                                                                                                                                                                })
                                                                                                                                                                                .exec()
                                                                                                                                                                                .then(notify_action => {
                                                                                                                                                                                    if (notify_action === null) {
                                                                                                                                                                                        return res.status(200).json({
                                                                                                                                                                                            status: "Failed",
                                                                                                                                                                                            message: "Please provide correct userid."
                                                                                                                                                                                        });
                                                                                                                                                                                    } else {
                                                                                                                                                                                        fcmModel.find({ userid: req.body.member_id })
                                                                                                                                                                                            .exec()
                                                                                                                                                                                            .then(user => {
                                                                                                                                                                                                if (user.length < 1) {
                                                                                                                                                                                                    console.log("no contacts")
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
                                                                                                                                                                                                            notification_slug: 'ChallengeDetails',
                                                                                                                                                                                                            url: constants.APIBASEURL + profileimage,
                                                                                                                                                                                                            username: username,
                                                                                                                                                                                                            item_id: String(user_challenges[0].challenge_number),
                                                                                                                                                                                                            member_name: member_name,
                                                                                                                                                                                                            member_url: constants.APIBASEURL + member_profile,
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

                                                                                                                                                                                                    fcm.send(message, function(err, response) {

                                                                                                                                                                                                    });

                                                                                                                                                                                                    const note_nos = Math.floor(10000000000 + Math.random() * 90000000000);
                                                                                                                                                                                                    var msgbody_new = username + " is in a challenge. Help your friend to win!!"
                                                                                                                                                                                                    notificationModel.updateMany({ userid: { $in: main_object_contacts } }, {
                                                                                                                                                                                                            $push: {
                                                                                                                                                                                                                notifications: {
                                                                                                                                                                                                                    notification_data: msgbody_new,
                                                                                                                                                                                                                    member_id: req.body.userid,
                                                                                                                                                                                                                    notification_type: 'ChallengeDetails',
                                                                                                                                                                                                                    item_id: String(user_challenges[0].challenge_number),
                                                                                                                                                                                                                    notification_number: note_nos,
                                                                                                                                                                                                                    username: username,
                                                                                                                                                                                                                    profileimage: ObjectId(req.body.userid),
                                                                                                                                                                                                                    member_name: member_name,
                                                                                                                                                                                                                    member_profile: ObjectId(req.body.member_id),
                                                                                                                                                                                                                    created_at: Date.now()
                                                                                                                                                                                                                }
                                                                                                                                                                                                            }
                                                                                                                                                                                                        })
                                                                                                                                                                                                        .exec()
                                                                                                                                                                                                        .then(dosy => {
                                                                                                                                                                                                            if (dosy === null) {

                                                                                                                                                                                                            } else {
                                                                                                                                                                                                                fcmModel.find({ userid: { $in: main_contacts } })
                                                                                                                                                                                                                    .exec()
                                                                                                                                                                                                                    .then(user => {
                                                                                                                                                                                                                        if (user.length < 1) {
                                                                                                                                                                                                                            console.log("no contacts")
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
                                                                                                                                                                                                                                    body: msgbody_new,
                                                                                                                                                                                                                                },
                                                                                                                                                                                                                                data: {
                                                                                                                                                                                                                                    notification_id: note_nos,
                                                                                                                                                                                                                                    message: msgbody_new,
                                                                                                                                                                                                                                    notification_slug: 'ChallengeDetails',
                                                                                                                                                                                                                                    url: constants.APIBASEURL + profileimage,
                                                                                                                                                                                                                                    username: username,
                                                                                                                                                                                                                                    item_id: String(user_challenges[0].challenge_number),
                                                                                                                                                                                                                                    member_name: member_name,
                                                                                                                                                                                                                                    member_url: constants.APIBASEURL + member_profile,
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

                                                                                                                                                                                                    const notes_nos = Math.floor(10000000000 + Math.random() * 90000000000);
                                                                                                                                                                                                    var msgbody_news = member_name + " is in a challenge. Help your friend to win!!"
                                                                                                                                                                                                    notificationModel.updateMany({ userid: { $in: member_object_contacts } }, {
                                                                                                                                                                                                            $push: {
                                                                                                                                                                                                                notifications: {
                                                                                                                                                                                                                    notification_data: msgbody_news,
                                                                                                                                                                                                                    member_id: req.body.userid,
                                                                                                                                                                                                                    notification_type: 'ChallengeDetails',
                                                                                                                                                                                                                    item_id: String(user_challenges[0].challenge_number),
                                                                                                                                                                                                                    notification_number: notes_nos,
                                                                                                                                                                                                                    username: member_name,
                                                                                                                                                                                                                    profileimage: ObjectId(req.body.member_id),
                                                                                                                                                                                                                    member_name: username,
                                                                                                                                                                                                                    member_profile: ObjectId(req.body.userid),
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
                                                                                                                                                                                                                fcmModel.find({ userid: { $in: member_contacts } })
                                                                                                                                                                                                                    .exec()
                                                                                                                                                                                                                    .then(user => {
                                                                                                                                                                                                                        if (user.length < 1) {
                                                                                                                                                                                                                            console.log("no contacts")
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
                                                                                                                                                                                                                                    body: msgbody_news,
                                                                                                                                                                                                                                },
                                                                                                                                                                                                                                data: {
                                                                                                                                                                                                                                    notification_id: notes_nos,
                                                                                                                                                                                                                                    message: msgbody_news,
                                                                                                                                                                                                                                    notification_slug: 'ChallengeDetails',
                                                                                                                                                                                                                                    url: constants.APIBASEURL + member_profile,
                                                                                                                                                                                                                                    username: member_name,
                                                                                                                                                                                                                                    item_id: String(user_challenges[0].challenge_number),
                                                                                                                                                                                                                                    member_name: username,
                                                                                                                                                                                                                                    member_url: constants.APIBASEURL + profileimage,
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
                                                                                                                                                                                                                        //  var spliterror=err.message.split(":")
                                                                                                                                                                                                                        //  res.status(500).json({ 
                                                                                                                                                                                                                        //      status: 'Failed',
                                                                                                                                                                                                                        //      message: spliterror[0]
                                                                                                                                                                                                                        // });
                                                                                                                                                                                                                    });
                                                                                                                                                                                                            }
                                                                                                                                                                                                        }).catch(err => {
                                                                                                                                                                                                            console.log(err)
                                                                                                                                                                                                            //  var spliterror=err.message.split(":")
                                                                                                                                                                                                            //  res.status(500).json({ 
                                                                                                                                                                                                            //      status: 'Failed',
                                                                                                                                                                                                            //      message: spliterror[0]
                                                                                                                                                                                                            //  });
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
                                                                                                                                                                        }
                                                                                                                                                                    }).catch(err => {
                                                                                                                                                                        var spliterror = err.message.split(":")
                                                                                                                                                                        res.status(500).json({
                                                                                                                                                                            status: 'Failed',
                                                                                                                                                                            message: spliterror[0]
                                                                                                                                                                        });
                                                                                                                                                                    });

                                                                                                                                                                var msgbody_new = "Your challenge is started with " + member_name + "."
                                                                                                                                                                const noty = Math.floor(10000000000 + Math.random() * 90000000000);
                                                                                                                                                                notificationModel.findOneAndUpdate({ userid: ObjectId(req.body.userid) }, {
                                                                                                                                                                        $push: {
                                                                                                                                                                            notifications: {
                                                                                                                                                                                notification_data: msgbody_new,
                                                                                                                                                                                member_id: req.body.userid,
                                                                                                                                                                                notification_type: 'ChallengeDetails',
                                                                                                                                                                                item_id: String(user_challenges[0].challenge_number),
                                                                                                                                                                                notification_number: noty,
                                                                                                                                                                                username: member_name,
                                                                                                                                                                                profileimage: ObjectId(req.body.member_id),
                                                                                                                                                                                member_name: username,
                                                                                                                                                                                member_profile: ObjectId(req.body.userid),
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
                                                                                                                                                                            fcmModel.find({ userid: req.body.userid })
                                                                                                                                                                                .exec()
                                                                                                                                                                                .then(user => {
                                                                                                                                                                                    if (user.length < 1) {
                                                                                                                                                                                        console.log("no contacts")
                                                                                                                                                                                    } else {
                                                                                                                                                                                        var serverKey = constants.FCMServerKey;
                                                                                                                                                                                        var fcm = new FCM(serverKey);

                                                                                                                                                                                        var message = {
                                                                                                                                                                                            to: user[0].fcmtoken,
                                                                                                                                                                                            collapse_key: 'exit',

                                                                                                                                                                                            notification: {
                                                                                                                                                                                                title: 'FvmeGear',
                                                                                                                                                                                                body: msgbody_new,
                                                                                                                                                                                            },
                                                                                                                                                                                            data: {
                                                                                                                                                                                                notification_id: noty,
                                                                                                                                                                                                message: msgbody_new,
                                                                                                                                                                                                notification_slug: 'ChallengeDetails',
                                                                                                                                                                                                url: constants.APIBASEURL + member_profile,
                                                                                                                                                                                                username: member_name,
                                                                                                                                                                                                item_id: String(user_challenges[0].challenge_number),
                                                                                                                                                                                                member_name: username,
                                                                                                                                                                                                member_url: constants.APIBASEURL + profileimage,
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



                                                                                                                                                                var time = setTimeout(function() {

                                                                                                                                                                    challenges.find({ userid: req.body.userid, 'on_going_challenges.challenge_number': user_challenges[0].challenge_number }, { 'on_going_challenges.$': 1 })
                                                                                                                                                                        .populate({ path: 'on_going_challenges.my_feed_id on_going_challenges.challenge_feed_id on_going_challenges.challenge_userid on_going_challenges.my_userid', populate: { path: 'userid' } })
                                                                                                                                                                        .exec()
                                                                                                                                                                        .then(foe => {
                                                                                                                                                                            if (foe.length > 0) {

                                                                                                                                                                                var going = foe[0].on_going_challenges;
                                                                                                                                                                                var user_feed_views = going[0].my_feed_id.no_views
                                                                                                                                                                                var member_feed_views = going[0].challenge_feed_id.no_views
                                                                                                                                                                                var user_views = going[0].user_views;
                                                                                                                                                                                var member_views = going[0].member_views
                                                                                                                                                                                var user_winner_query = ""
                                                                                                                                                                                var user_winner_condition = ""
                                                                                                                                                                                var winner = ""
                                                                                                                                                                                var winnermsg = ""
                                                                                                                                                                                var query = "";
                                                                                                                                                                                var condition = "";
                                                                                                                                                                                var remaining_points = 0;
                                                                                                                                                                                var loser_amount = 0;
                                                                                                                                                                                var loser_views_percent = 0;
                                                                                                                                                                                var user_amount = 0
                                                                                                                                                                                var member_amount = 0
                                                                                                                                                                                var in_draw = false
                                                                                                                                                                                var final_winner_type = ""

                                                                                                                                                                                if (user_views > member_views) {
                                                                                                                                                                                    winner = going[0].my_userid.userid.username
                                                                                                                                                                                    winnermsg = going[0].my_userid.userid.username + " won the challenge. Check out the points you got."

                                                                                                                                                                                    user_winner_query = { userid: ObjectId(req.body.userid) };
                                                                                                                                                                                    user_winner_condition = { $inc: { talent_points: going[0].amount + going[0].amount } }


                                                                                                                                                                                    loser_views_percent = Math.floor(going[0].amount * 4 / 5)

                                                                                                                                                                                    if (member_views >= loser_views_percent) {
                                                                                                                                                                                        loser_amount = Math.floor(going[0].amount) //*4/5--- giving full amount for now
                                                                                                                                                                                        query = { userid: ObjectId(req.body.member_id) }
                                                                                                                                                                                        condition = { $inc: { talent_points: loser_amount } }
                                                                                                                                                                                    }

                                                                                                                                                                                } else if (user_views < member_views) {
                                                                                                                                                                                    winner = going[0].challenge_userid.userid.username
                                                                                                                                                                                    winnermsg = going[0].challenge_userid.userid.username + " won the challenge. Check out the points you got."

                                                                                                                                                                                    user_winner_query = { userid: ObjectId(req.body.member_id) }
                                                                                                                                                                                    user_winner_condition = { $inc: { talent_points: going[0].amount + going[0].amount } }


                                                                                                                                                                                    loser_views_percent = Math.floor(going[0].amount * 4 / 5)



                                                                                                                                                                                    if (user_views >= loser_views_percent) {
                                                                                                                                                                                        loser_amount = Math.floor(going[0].amount) //*4/5--- giving full amount for now
                                                                                                                                                                                        query = { userid: ObjectId(req.body.userid) }
                                                                                                                                                                                        condition = { $inc: { talent_points: loser_amount } }
                                                                                                                                                                                    }
                                                                                                                                                                                } else {

                                                                                                                                                                                    winner = ""
                                                                                                                                                                                    in_draw = true
                                                                                                                                                                                    winnermsg = "Your challenge is a draw. Check out the points you got."
                                                                                                                                                                                    query = { userid: { $in: [ObjectId(req.body.userid), ObjectId(req.body.member_id)] } }
                                                                                                                                                                                    condition = { $inc: { talent_points: going[0].amount } }
                                                                                                                                                                                }

                                                                                                                                                                                if (String(winner) === String(going[0].my_userid.userid.username)) {
                                                                                                                                                                                    user_amount = going[0].amount + going[0].amount
                                                                                                                                                                                    member_amount = loser_amount
                                                                                                                                                                                    final_winner_type = "user"
                                                                                                                                                                                } else if (String(winner) === String(going[0].challenge_userid.userid.username)) {
                                                                                                                                                                                    member_amount = going[0].amount + going[0].amount
                                                                                                                                                                                    user_amount = loser_amount
                                                                                                                                                                                    final_winner_type = "member"
                                                                                                                                                                                } else {
                                                                                                                                                                                    member_amount = going[0].amount
                                                                                                                                                                                    user_amount = going[0].amount
                                                                                                                                                                                }

                                                                                                                                                                                if (query != "" && condition != "") {
                                                                                                                                                                                    if (in_draw === true) {
                                                                                                                                                                                        console.log("In draw")
                                                                                                                                                                                        userDetails.updateMany(query, condition, { new: true })
                                                                                                                                                                                            .exec()
                                                                                                                                                                                            .then(doose => {
                                                                                                                                                                                                var days = new Date()
                                                                                                                                                                                                days = days.toISOString()
                                                                                                                                                                                                days = String(days).split("T")
                                                                                                                                                                                                days = days[0].replace(/-/g, "")
                                                                                                                                                                                                var modes = "talent"

                                                                                                                                                                                                const transaction_id1 = days + Math.floor(10000000000 + Math.random() * 90000000000);
                                                                                                                                                                                                userTransactions.findOneAndUpdate({ userid: ObjectId(req.body.userid) }, {
                                                                                                                                                                                                    $push: {
                                                                                                                                                                                                        transactions: {
                                                                                                                                                                                                            date_of_transaction: Date.now(),
                                                                                                                                                                                                            amount: going[0].amount,
                                                                                                                                                                                                            mode: modes,
                                                                                                                                                                                                            transaction_type: "credit",
                                                                                                                                                                                                            action: "challenge_result",
                                                                                                                                                                                                            message: "You have got talent points as your challenge with " + member_name + " is a draw",
                                                                                                                                                                                                            transaction_id: transaction_id1
                                                                                                                                                                                                        }
                                                                                                                                                                                                    }
                                                                                                                                                                                                }, { upsert: true }).exec()

                                                                                                                                                                                                const transaction_id2 = days + Math.floor(10000000000 + Math.random() * 90000000000);
                                                                                                                                                                                                userTransactions.findOneAndUpdate({ userid: ObjectId(req.body.member_id) }, {
                                                                                                                                                                                                    $push: {
                                                                                                                                                                                                        transactions: {
                                                                                                                                                                                                            date_of_transaction: Date.now(),
                                                                                                                                                                                                            amount: going[0].amount,
                                                                                                                                                                                                            mode: modes,
                                                                                                                                                                                                            transaction_type: "credit",
                                                                                                                                                                                                            action: "challenge_result",
                                                                                                                                                                                                            message: "You have got talent points as your challenge with " + username + " is a draw.",
                                                                                                                                                                                                            transaction_id: transaction_id2
                                                                                                                                                                                                        }
                                                                                                                                                                                                    }
                                                                                                                                                                                                }, { upsert: true }).exec()
                                                                                                                                                                                            }).catch(err => {
                                                                                                                                                                                                var spliterror = err.message.split(":")
                                                                                                                                                                                                res.status(500).json({
                                                                                                                                                                                                    status: 'Failed',
                                                                                                                                                                                                    message: spliterror[0]
                                                                                                                                                                                                });
                                                                                                                                                                                            });
                                                                                                                                                                                    } else {

                                                                                                                                                                                        var transact_user = ""

                                                                                                                                                                                        if (final_winner_type === "user") {
                                                                                                                                                                                            transact_user = member_name
                                                                                                                                                                                        } else {
                                                                                                                                                                                            transact_user = username
                                                                                                                                                                                        }

                                                                                                                                                                                        userDetails.findOneAndUpdate(query, condition, { new: true })
                                                                                                                                                                                            .exec()
                                                                                                                                                                                            .then(doose => {
                                                                                                                                                                                                var days = new Date()
                                                                                                                                                                                                days = days.toISOString()
                                                                                                                                                                                                days = String(days).split("T")
                                                                                                                                                                                                days = days[0].replace(/-/g, "")
                                                                                                                                                                                                var modes = "talent"

                                                                                                                                                                                                const transaction_id1 = days + Math.floor(10000000000 + Math.random() * 90000000000);
                                                                                                                                                                                                userTransactions.findOneAndUpdate(query, {
                                                                                                                                                                                                    $push: {
                                                                                                                                                                                                        transactions: {
                                                                                                                                                                                                            date_of_transaction: Date.now(),
                                                                                                                                                                                                            amount: loser_amount,
                                                                                                                                                                                                            mode: modes,
                                                                                                                                                                                                            transaction_type: "credit",
                                                                                                                                                                                                            action: "challenge_result",
                                                                                                                                                                                                            message: "You have got talent points as appreciation token for your challenge with " + transact_user,
                                                                                                                                                                                                            transaction_id: transaction_id1
                                                                                                                                                                                                        }
                                                                                                                                                                                                    }
                                                                                                                                                                                                }, { upsert: true }).exec()
                                                                                                                                                                                            }).catch(err => {
                                                                                                                                                                                                var spliterror = err.message.split(":")
                                                                                                                                                                                                res.status(500).json({
                                                                                                                                                                                                    status: 'Failed',
                                                                                                                                                                                                    message: spliterror[0]
                                                                                                                                                                                                });
                                                                                                                                                                                            });
                                                                                                                                                                                    }

                                                                                                                                                                                }

                                                                                                                                                                                userDetails.findOneAndUpdate(user_winner_query, user_winner_condition)
                                                                                                                                                                                    .exec()
                                                                                                                                                                                    .then(doos => {

                                                                                                                                                                                        if (user_winner_query != "" && user_winner_condition != "") {
                                                                                                                                                                                            var transact_user = ""

                                                                                                                                                                                            if (final_winner_type === "user") {
                                                                                                                                                                                                transact_user = member_name
                                                                                                                                                                                            } else {
                                                                                                                                                                                                transact_user = username
                                                                                                                                                                                            }

                                                                                                                                                                                            var days1 = new Date()
                                                                                                                                                                                            days1 = days1.toISOString()
                                                                                                                                                                                            days1 = String(days1).split("T")
                                                                                                                                                                                            days1 = days1[0].replace(/-/g, "")
                                                                                                                                                                                            var modes1 = "talent"

                                                                                                                                                                                            const transaction_id1 = days1 + Math.floor(10000000000 + Math.random() * 90000000000);
                                                                                                                                                                                            userTransactions.findOneAndUpdate(user_winner_query, {
                                                                                                                                                                                                $push: {
                                                                                                                                                                                                    transactions: {
                                                                                                                                                                                                        date_of_transaction: Date.now(),
                                                                                                                                                                                                        amount: going[0].amount + going[0].amount,
                                                                                                                                                                                                        mode: modes1,
                                                                                                                                                                                                        transaction_type: "credit",
                                                                                                                                                                                                        action: "challenge_result",
                                                                                                                                                                                                        message: "You have got talent points as you won the challenge with " + transact_user,
                                                                                                                                                                                                        transaction_id: transaction_id1
                                                                                                                                                                                                    }
                                                                                                                                                                                                }
                                                                                                                                                                                            }, { upsert: true }).exec()
                                                                                                                                                                                        }


                                                                                                                                                                                        challenges.findOneAndUpdate({ userid: req.body.userid }, {
                                                                                                                                                                                                $pull: { on_going_challenges: { challenge_number: going[0].challenge_number } },
                                                                                                                                                                                                $push: {
                                                                                                                                                                                                    challenges_history: {
                                                                                                                                                                                                        my_feed_id: user_challenges[0].my_feed_id,
                                                                                                                                                                                                        my_userid: user_challenges[0].my_userid,
                                                                                                                                                                                                        challenge_userid: user_challenges[0].challenge_userid,
                                                                                                                                                                                                        challenge_feed_id: user_challenges[0].challenge_feed_id,
                                                                                                                                                                                                        challenge_completed_at: Date.now(),
                                                                                                                                                                                                        amount: user_challenges[0].amount,
                                                                                                                                                                                                        winner: winnermsg,
                                                                                                                                                                                                        challenge_number: user_challenges[0].challenge_number,
                                                                                                                                                                                                        user_views: user_views,
                                                                                                                                                                                                        member_views: member_views,
                                                                                                                                                                                                        won_amount: user_amount
                                                                                                                                                                                                    }
                                                                                                                                                                                                }
                                                                                                                                                                                            })
                                                                                                                                                                                            .exec()
                                                                                                                                                                                            .then(docse => {
                                                                                                                                                                                                console.log(member_challenges[0].my_userid)

                                                                                                                                                                                                challenges.findOneAndUpdate({ userid: req.body.member_id }, {
                                                                                                                                                                                                        $pull: { on_going_challenges: { challenge_number: going[0].challenge_number } },
                                                                                                                                                                                                        $push: {
                                                                                                                                                                                                            challenges_history: {
                                                                                                                                                                                                                my_feed_id: member_challenges[0].my_feed_id,
                                                                                                                                                                                                                my_userid: member_challenges[0].my_userid,
                                                                                                                                                                                                                challenge_userid: member_challenges[0].challenge_userid,
                                                                                                                                                                                                                challenge_feed_id: member_challenges[0].challenge_feed_id,
                                                                                                                                                                                                                challenge_completed_at: Date.now(),
                                                                                                                                                                                                                amount: member_challenges[0].amount,
                                                                                                                                                                                                                winner: winnermsg,
                                                                                                                                                                                                                challenge_number: member_challenges[0].challenge_number,
                                                                                                                                                                                                                user_views: member_views,
                                                                                                                                                                                                                member_views: user_views,
                                                                                                                                                                                                                won_amount: member_amount
                                                                                                                                                                                                            }
                                                                                                                                                                                                        }
                                                                                                                                                                                                    })
                                                                                                                                                                                                    .exec()
                                                                                                                                                                                                    .then(docses => {
                                                                                                                                                                                                        iv_feeds.updateMany({ _id: { $in: [ObjectId(req.body.feed_id), ObjectId(req.body.member_feed_id)] } }, { $set: { is_under_challenge: false, challenge_number: 0 } })
                                                                                                                                                                                                            .exec()
                                                                                                                                                                                                            .then(fixse => {

                                                                                                                                                                                                                const note_nos = Math.floor(10000000000 + Math.random() * 90000000000);
                                                                                                                                                                                                                notificationModel.updateMany({ userid: { $in: [ObjectId(req.body.member_id), ObjectId(req.body.userid)] } }, {
                                                                                                                                                                                                                        $push: {
                                                                                                                                                                                                                            notifications: {
                                                                                                                                                                                                                                notification_data: winnermsg,
                                                                                                                                                                                                                                notification_type: 'ChallengeDetails',
                                                                                                                                                                                                                                notification_number: note_nos,
                                                                                                                                                                                                                                item_id: String(member_challenges[0].challenge_number),
                                                                                                                                                                                                                                username: username,
                                                                                                                                                                                                                                profileimage: ObjectId(req.body.userid),
                                                                                                                                                                                                                                member_name: member_name,
                                                                                                                                                                                                                                member_profile: ObjectId(member_user),
                                                                                                                                                                                                                                created_at: Date.now()
                                                                                                                                                                                                                            }
                                                                                                                                                                                                                        }
                                                                                                                                                                                                                    })
                                                                                                                                                                                                                    .exec()
                                                                                                                                                                                                                    .then(dosys => {
                                                                                                                                                                                                                        if (dosys === null) {
                                                                                                                                                                                                                            return res.status(200).json({
                                                                                                                                                                                                                                status: "Failed",
                                                                                                                                                                                                                                message: "Please provide correct userid & member_id."
                                                                                                                                                                                                                            });
                                                                                                                                                                                                                        } else {

                                                                                                                                                                                                                            notificationModel.updateMany({
                                                                                                                                                                                                                                    $and: [{ "notifications.notification_type": 'ChallengeDetails' }, { userid: { $in: [ObjectId(req.body.member_id), ObjectId(req.body.userid)] } },
                                                                                                                                                                                                                                        { "notifications.item_id": String(user_challenges[0].challenge_number) }
                                                                                                                                                                                                                                    ]
                                                                                                                                                                                                                                }, { "$set": { "notifications.$[elem].is_action_done": true } }, {
                                                                                                                                                                                                                                    "arrayFilters": [{ $and: [{ "elem.notification_type": 'ChallengeDetails' }, { 'elem.item_id': String(user_challenges[0].challenge_number) }] }],
                                                                                                                                                                                                                                    "multi": true
                                                                                                                                                                                                                                })
                                                                                                                                                                                                                                .exec()
                                                                                                                                                                                                                                .then(not_action => {

                                                                                                                                                                                                                                    if (not_action === null) {
                                                                                                                                                                                                                                        return res.status(200).json({
                                                                                                                                                                                                                                            status: "Failed",
                                                                                                                                                                                                                                            message: "Please provide correct userid & member_id."
                                                                                                                                                                                                                                        });
                                                                                                                                                                                                                                    } else {

                                                                                                                                                                                                                                        fcmModel.find({ userid: { $in: [req.body.member_id, req.body.userid] } })
                                                                                                                                                                                                                                            .select('fcmtoken')
                                                                                                                                                                                                                                            .exec()
                                                                                                                                                                                                                                            .then(user => {
                                                                                                                                                                                                                                                if (user.length < 1) {
                                                                                                                                                                                                                                                    return res.status(200).json({
                                                                                                                                                                                                                                                        status: "Failed",
                                                                                                                                                                                                                                                        message: "Please provide correct userid."
                                                                                                                                                                                                                                                    });
                                                                                                                                                                                                                                                } else {
                                                                                                                                                                                                                                                    var user_fcm = [];
                                                                                                                                                                                                                                                    user.forEach(function(ele) {
                                                                                                                                                                                                                                                        user_fcm.push(ele.fcmtoken)
                                                                                                                                                                                                                                                    })
                                                                                                                                                                                                                                                    var serverKey = constants.FCMServerKey;
                                                                                                                                                                                                                                                    var fcm = new FCM(serverKey);

                                                                                                                                                                                                                                                    var message = {
                                                                                                                                                                                                                                                        registration_ids: user_fcm,
                                                                                                                                                                                                                                                        collapse_key: 'exit',

                                                                                                                                                                                                                                                        notification: {
                                                                                                                                                                                                                                                            title: 'FvmeGear',
                                                                                                                                                                                                                                                            body: winnermsg,
                                                                                                                                                                                                                                                        },
                                                                                                                                                                                                                                                        data: {
                                                                                                                                                                                                                                                            notification_id: note_nos,
                                                                                                                                                                                                                                                            message: winnermsg,
                                                                                                                                                                                                                                                            notification_slug: 'ChallengeDetails',
                                                                                                                                                                                                                                                            url: constants.APIBASEURL + profileimage,
                                                                                                                                                                                                                                                            username: username,
                                                                                                                                                                                                                                                            item_id: String(member_challenges[0].challenge_number),
                                                                                                                                                                                                                                                            member_name: member_name,
                                                                                                                                                                                                                                                            member_url: constants.APIBASEURL + member_profile,
                                                                                                                                                                                                                                                            userid: "",
                                                                                                                                                                                                                                                            feed_id: "",
                                                                                                                                                                                                                                                            member_feed_id: "",
                                                                                                                                                                                                                                                            member_id: "",
                                                                                                                                                                                                                                                            is_from_push: true,
                                                                                                                                                                                                                                                            is_action_done: true
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
                                                                                                                                                                                                                                                    clearTimeout(time);
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
                                                                                                                                                                                                            });
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
                                                                                                                                                                                    }).catch(err => {
                                                                                                                                                                                        var spliterror = err.message.split(":")
                                                                                                                                                                                        res.status(500).json({
                                                                                                                                                                                            status: 'Failed',
                                                                                                                                                                                            message: spliterror[0]
                                                                                                                                                                                        });
                                                                                                                                                                                    });
                                                                                                                                                                            } else {
                                                                                                                                                                                clearTimeout(time);
                                                                                                                                                                            }

                                                                                                                                                                        }).catch(err => {
                                                                                                                                                                            var spliterror = err.message.split(":")
                                                                                                                                                                            res.status(500).json({
                                                                                                                                                                                status: 'Failed',
                                                                                                                                                                                message: spliterror[0]
                                                                                                                                                                            });
                                                                                                                                                                        });
                                                                                                                                                                }, 7200000); //2 hrs for challenge 7200000
                                                                                                                                                                return res.status(200).json({
                                                                                                                                                                    status: "Ok",
                                                                                                                                                                    message: "Your challenge has been accepted.",
                                                                                                                                                                    challenge_number: String(member_challenges[0].challenge_number)
                                                                                                                                                                });
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
                                                                                                                                            }).catch(err => {
                                                                                                                                                var spliterror = err.message.split(":")
                                                                                                                                                res.status(500).json({
                                                                                                                                                    status: 'Failed',
                                                                                                                                                    message: spliterror[0]
                                                                                                                                                });
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
                                                                                                                }
                                                                                                            } else {
                                                                                                                return res.status(200).json({
                                                                                                                    status: "Failed",
                                                                                                                    message: "Error accepting challenge."
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
                                                                                            }

                                                                                        }
                                                                                    }
                                                                                } else {
                                                                                    if (hours1 < 3) {
                                                                                        return res.status(200).json({
                                                                                            status: "Failed",
                                                                                            message: "Your Feed is about to expire. Cannot accept a challenge now."
                                                                                        });
                                                                                    } else {
                                                                                        return res.status(200).json({
                                                                                            status: "Failed",
                                                                                            message: "User Feed is about to expire. Cannot accept a challenge now."
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
                                                                    }).catch(err => {
                                                                        var spliterror = err.message.split(":")
                                                                        res.status(500).json({
                                                                            status: 'Failed',
                                                                            message: spliterror[0]
                                                                        });
                                                                    });
                                                            } else {
                                                                res.status(200).json({
                                                                    status: 'Verification',
                                                                    message: "Please verify your mobile number for donations."
                                                                });
                                                            }

                                                        }).catch(err => {
                                                            console.log(err)
                                                            // var spliterror=err.message.split(":")
                                                            //              res.status(500).json({ 
                                                            //             status: 'Failed',
                                                            //             message: spliterror[0]
                                                            //  });
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
                                }
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


router.post("/on_going_challenges", (req, res, next) => {

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
                        challenges.find({ userid: req.body.userid })
                            .populate({ path: 'on_going_challenges.my_feed_id on_going_challenges.my_userid on_going_challenges.challenge_userid on_going_challenges.challenge_feed_id', populate: { path: 'userid' } })
                            .exec()
                            .then(docs => {
                                var test = [];
                                if (docs.length < 1) {
                                    res.status(200).json({
                                        status: 'Ok',
                                        message: 'No ongoing challenges.',
                                        feeds: test
                                    });
                                } else {
                                    var ongoing = docs[0].on_going_challenges
                                    var count = 0

                                    if (ongoing.length < 1) {
                                        res.status(200).json({
                                            status: 'Ok',
                                            message: 'No ongoing challenges.',
                                            feeds: test
                                        });
                                    } else {
                                        var perPage = 20
                                        var page = req.body.page_no

                                        if (isEmpty(page)) {
                                            page = 1
                                        }
                                        var skip = (perPage * page) - perPage;
                                        var limit = skip + perPage;

                                        ongoing = docs[0].on_going_challenges
                                        ongoing.map(doc => {
                                            var is_null = false;
                                            if (doc.my_feed_id === null) {
                                                is_null = true
                                            } else if (doc.challenge_feed_id === null) {
                                                is_null = true
                                            } else {
                                                if (doc.my_feed_id.feed_expiry_status === 1 || doc.challenge_feed_id.feed_expiry_status === 1) {
                                                    is_null = true
                                                } else {
                                                    is_null = false
                                                }
                                            }
                                            if (is_null === false) {
                                                var date = new Date(doc.created_at);
                                                date.setHours(date.getHours() + 2);
                                                var isoDate = date.toISOString();

                                                var timer = Date.parse(isoDate);


                                                const date1 = new Date()
                                                var end_date = doc.challenge_started_at
                                                var end_date = end_date.setHours(end_date.getHours() + 2)

                                                var final_date = end_date - date1


                                                var timers = final_date

                                                var profileimage = doc.my_userid.userid.profileimage
                                                if (profileimage === null) {
                                                    profileimage = 'uploads/userimage.png'
                                                }

                                                var other_profileimage = doc.challenge_userid.userid.profileimage
                                                if (other_profileimage === null) {
                                                    other_profileimage = 'uploads/userimage.png'
                                                }

                                                var is_liked = false;
                                                var testlike = doc.my_feed_id.likes;
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
                                                var user_views = doc.user_views;
                                                var member_views = doc.member_views;

                                                if (String(doc.my_userid.userid._id) === String(req.body.userid)) {
                                                    if (user_views > member_views) {
                                                        var views = user_views - member_views
                                                        if (user_views === 1) {
                                                            winner = "You are Leading by " + views + " view on " + doc.challenge_userid.userid.username + "."
                                                        } else {
                                                            winner = "You are Leading by " + views + " views on " + doc.challenge_userid.userid.username + "."
                                                        }

                                                    } else if (member_views > user_views) {
                                                        var views = member_views - user_views
                                                        if (member_views === 1) {
                                                            winner = doc.challenge_userid.userid.username + " is Leading by " + views + " view on you."
                                                        } else {
                                                            winner = doc.challenge_userid.userid.username + " is Leading by " + views + " views on you."
                                                        }

                                                    } else {
                                                        winner = doc.challenge_userid.userid.username + " and you are having the same views."
                                                    }
                                                } else {
                                                    if (user_views > member_views) {
                                                        var views = user_views - member_views
                                                        if (user_views === 1) {
                                                            winner = doc.my_userid.userid.username + " is Leading by " + views + " view on " + doc.challenge_userid.userid.username + "."
                                                        } else {
                                                            winner = doc.my_userid.userid.username + " is Leading by " + views + " views on " + doc.challenge_userid.userid.username + "."
                                                        }

                                                    } else if (member_views > user_views) {
                                                        var views = member_views - user_views
                                                        if (member_views === 1) {
                                                            winner = doc.challenge_userid.userid.username + " is Leading by " + views + " view on " + doc.my_userid.userid.username + "."
                                                        } else {
                                                            winner = doc.challenge_userid.userid.username + " is Leading by " + views + " views on " + doc.my_userid.userid.username + "."
                                                        }

                                                    } else {
                                                        winner = doc.challenge_userid.userid.username + " and " + doc.my_userid.userid.username + " are having the same views."
                                                    }
                                                }

                                                is_time_extendable = false;

                                                if (doc.my_feed_id.feed_expiry_status == 0) {
                                                    is_time_extendable = true
                                                }
                                                var hashtags = doc.my_feed_id.feeds_hash_tags
                                                var hashs = [];
                                                if (hashtags.length > 0) {
                                                    hashtags.forEach(function(ele) {
                                                        var tag = "#" + ele
                                                        hashs.push(tag)
                                                    })
                                                }
                                                var no_likes = doc.my_feed_id.no_likes
                                                if (no_likes <= 0) {
                                                    no_likes = 0
                                                } else {
                                                    no_likes = doc.my_feed_id.no_likes
                                                }

                                                var video_dur_my_feed_id = doc.my_feed_id.video_duration
                                                var video_duration = ""
                                                var video = video_dur_my_feed_id * 1000

                                                var minutes = Math.floor(video / 60000);
                                                var seconds = ((video % 60000) / 1000).toFixed(0);
                                                minutes = minutes.toString()
                                                seconds = seconds.toString()
                                                var video_duration = minutes + ":" + seconds

                                                if (minutes.length === 1 && seconds.length === 1) {
                                                    video_duration = "0" + minutes + ":" + "0" + seconds

                                                } else if (minutes.length === 1) {
                                                    if (seconds === '60') {
                                                        video_duration = "01:00"
                                                    } else {
                                                        video_duration = "0" + minutes + ":" + seconds
                                                    }
                                                    if (seconds.length === 1) {
                                                        video_duration = "0" + minutes + ":" + "0" + seconds
                                                    }
                                                } else {
                                                    if (seconds.length === 1) {
                                                        video_duration = minutes + ":" + "0" + seconds
                                                    }
                                                    if (minutes.length === 1) {
                                                        video_duration = "0" + minutes + ":" + "0" + seconds
                                                    }
                                                }

                                                var video_dur_challenge_feed_id = doc.challenge_feed_id.video_duration
                                                var video_duration_member = ""
                                                var videos = video_dur_challenge_feed_id * 1000

                                                var minutes1 = Math.floor(videos / 60000);
                                                var seconds1 = ((videos % 60000) / 1000).toFixed(0);
                                                minutes1 = minutes1.toString()
                                                seconds1 = seconds1.toString()
                                                var video_duration_member = minutes1 + ":" + seconds1

                                                if (minutes1.length === 1 && seconds1.length === 1) {
                                                    video_duration_member = "0" + minutes1 + ":" + seconds1 + "0"

                                                } else if (minutes1.length === 1) {
                                                    if (seconds === '60') {
                                                        video_duration_member = "01:00"
                                                    } else {
                                                        video_duration_member = "0" + minutes + ":" + seconds
                                                    }
                                                    if (seconds1.length === 1) {
                                                        video_duration_member = "0" + minutes1 + ":" + seconds1 + "0"
                                                    }
                                                } else {
                                                    if (seconds1.length === 1) {
                                                        video_duration_member = minutes1 + ":" + seconds1 + "0"
                                                    }
                                                    if (minutes1.length === 1) {
                                                        video_duration_member = "0" + minutes1 + ":" + seconds1 + "0"
                                                    }
                                                }

                                                feedinfo = {

                                                    "feed_id": doc.my_feed_id._id,
                                                    "feed_desc": doc.my_feed_id.feed_desc,
                                                    "feeds_tags": hashs,
                                                    "feed_type": doc.my_feed_id.feed_type,
                                                    "userid": doc.my_userid.userid._id,
                                                    "username": doc.my_userid.userid.username,
                                                    "expiry_time": timer,
                                                    "expiry_time_new": timers,
                                                    "rating": parseFloat(doc.my_feed_id.feed_rating),
                                                    "no_shares": doc.my_feed_id.no_shares,
                                                    "no_likes": no_likes,
                                                    "no_comments": doc.my_feed_id.no_comments,
                                                    "privacy_mode": doc.my_feed_id.privacy_mode,
                                                    "is_liked": is_liked,
                                                    "no_views": user_views,
                                                    "profile_url": constants.APIBASEURL + profileimage,
                                                    "can_show_ad": false,
                                                    "allow_comments": false,
                                                    "preview_url": constants.APIBASEURL + doc.my_feed_id.preview_url,
                                                    "has_sensitive_content": false,
                                                    "is_under_challenge": doc.my_feed_id.is_under_challenge,
                                                    "is_challengeable": true,
                                                    "is_time_extendable": is_time_extendable,
                                                    "video_duration": video_duration,
                                                    "challenge_details": {
                                                        "member_id": doc.challenge_userid.userid._id,
                                                        "member_user_name": doc.challenge_userid.userid.username,
                                                        "member_url": constants.APIBASEURL + other_profileimage,
                                                        "member_feed_id": doc.challenge_feed_id._id,
                                                        "challenge_desc": winner,
                                                        "challenge_number": String(doc.challenge_number),
                                                        "member_preview_url": constants.APIBASEURL + doc.challenge_feed_id.preview_url,
                                                        "no_mem_views": member_views,
                                                        "video_duration_mem": video_duration_member
                                                    },
                                                    "is_self_feed": true,
                                                    "ad_details": {
                                                        "ad_type": "",
                                                        "ad_files": []
                                                    },
                                                    "comment_privacy": 0,
                                                    "repost_details": {
                                                        "original_userid": "",
                                                        "original_feed_id": "",
                                                        "original_user_img_url": ""
                                                    }
                                                }
                                                test.push(feedinfo)
                                            }

                                        })

                                        count = test.length
                                        var total_pages = 0
                                        if (count === 0) {
                                            total_pages = 1
                                        } else {
                                            total_pages = Math.ceil(count / perPage)
                                        }
                                        test = test.slice(skip, limit)
                                        test.reverse()

                                        res.status(200).json({
                                            status: 'Ok',
                                            message: 'List of ongoing challenges',
                                            userid: req.body.userid,
                                            total_pages: total_pages,
                                            current_page: page,
                                            total_feeds: count,
                                            feeds: test
                                        });
                                    }
                                }

                            }).catch(err => {
                                console.log(err)
                                // var spliterror=err.message.split(":")
                                //     res.status(500).json({ 
                                //         status: 'Failed',
                                //         message: spliterror[0]
                                //     });
                            });
                    }
                }).catch(err => {
                    console.log(err)
                    // var spliterror=err.message.split(":")
                    //   res.status(500).json({ 
                    //     status: 'Failed',
                    //     message: spliterror[0]
                    //   });
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


router.post("/challenge_history", (req, res, next) => {

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
                        challenges.find({ userid: req.body.userid })
                            .populate({ path: 'challenges_history.my_feed_id challenges_history.my_userid challenges_history.challenge_userid challenges_history.challenge_feed_id', populate: { path: 'userid iv_acountid' } })
                            .exec()
                            .then(docs => {
                                var test = [];
                                if (docs.length < 1) {
                                    res.status(200).json({
                                        status: 'Ok',
                                        message: 'No Challenges History',
                                        feeds: test
                                    });
                                } else {
                                    var perPage = 20
                                    var page = req.body.page_no

                                    if (isEmpty(page)) {
                                        page = 1
                                    }
                                    var skip = (perPage * page) - perPage;
                                    var limit = skip + perPage;
                                    var count = 0;
                                    if (docs[0].challenges_history.length > 0) {

                                        var ongoing = docs[0].challenges_history

                                        var is_null = false

                                        ongoing.map(doc => {

                                            if (doc.my_feed_id === null) {
                                                is_null = true
                                            } else if (doc.challenge_feed_id === null) {
                                                is_null = true
                                            } else {
                                                console.log(doc.my_feed_id.feed_expiry_status)
                                                console.log(doc.challenge_feed_id.feed_expiry_status)
                                                if (doc.my_feed_id.feed_expiry_status === 1 || doc.challenge_feed_id.feed_expiry_status === 1) {
                                                    is_null = true
                                                } else {
                                                    is_null = false
                                                }
                                            }

                                            if (is_null === false) {
                                                var date = new Date()
                                                var date1 = date.setTime(date.getTime());
                                                var dateNow = new Date(date1).toISOString();
                                                var t = Date.parse(doc.my_feed_id.feeds_expiry_time_) - Date.parse(dateNow);
                                                var seconds1 = Math.floor((t / 1000) % 60);
                                                var minutes1 = Math.floor((t / 1000 / 60) % 60);
                                                var hours1 = Math.floor((t / (1000 * 60 * 60)) % 24);
                                                var days1 = Math.floor(t / (1000 * 60 * 60 * 24));

                                                if (seconds1 < 0) {
                                                    seconds1 = '00';
                                                }
                                                if (minutes1 < 0) {
                                                    minutes1 = '00';
                                                }
                                                if (hours1 < 0) {
                                                    hours1 = '00';
                                                }
                                                if (days1 < 0) {
                                                    days1 = '00';
                                                }

                                                var calculatetime = hours1 + ':' + minutes1 + ':' + seconds1;
                                                var duration = Date.parse(doc.my_feed_id.feeds_expiry_time_);

                                                var profileimage = doc.my_feed_id.iv_acountid.profileimage
                                                if (profileimage === null) {
                                                    profileimage = 'uploads/userimage.png'
                                                }

                                                var other_profileimage = doc.challenge_feed_id.iv_acountid.profileimage
                                                if (other_profileimage === null) {
                                                    other_profileimage = 'uploads/userimage.png'
                                                }

                                                var is_liked = false;
                                                var testlike = doc.my_feed_id.likes;
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
                                                var user_views = doc.user_views;
                                                var member_views = doc.member_views;
                                                var win = String(doc.winner)
                                                var db_winner = String(doc.winner).split(" dropped")
                                                var winner = db_winner[0];
                                                var winny = db_winner[0]
                                                var winnermsg = ""


                                                if (String(doc.my_feed_id.iv_acountid._id) === String(req.body.userid)) {
                                                    if (win.indexOf('both') !== -1 || win.indexOf("draw") !== -1) {
                                                        winner = "Challenge is a draw!!"
                                                    } else {
                                                        if (doc.user_views > doc.member_views) {
                                                            if (user_views === 1) {
                                                                winner = "You won the challenge."
                                                            } else {
                                                                winner = "You won the challenge."
                                                            }

                                                        } else if (doc.member_views > doc.user_views) {
                                                            if (member_views === 1) {
                                                                winner = doc.challenge_feed_id.iv_acountid.username + " won the challenge."
                                                            } else {
                                                                winner = doc.challenge_feed_id.iv_acountid.username + " won the challenge."
                                                            }

                                                        } else {
                                                            winner = "Challenge is a draw!!"
                                                        }
                                                    }

                                                } else {
                                                    if (win.indexOf('both') !== -1 || win.indexOf("draw") !== -1) {
                                                        winner = "Challenge is a draw!!"
                                                    } else {
                                                        if (doc.user_views > doc.member_views) {
                                                            if (user_views === 1) {
                                                                winner = doc.my_feed_id.iv_acountid.username + " won the challenge."
                                                            } else {
                                                                winner = doc.my_feed_id.iv_acountid.username + " won the challenge."
                                                            }

                                                        } else if (doc.member_views > doc.user_views) {
                                                            if (member_views === 1) {
                                                                winner = doc.challenge_feed_id.iv_acountid.username + " won the challenge."
                                                            } else {
                                                                winner = doc.challenge_feed_id.iv_acountid.username + " won the challenge."
                                                            }

                                                        } else {
                                                            winner = "Challenge is a draw!!"
                                                        }
                                                    }

                                                }
                                                if (win.indexOf("dropped") != -1) {
                                                    winner = ""
                                                    winner = winny + " dropped from challenge."
                                                }


                                                winnermsg = "Points: " + doc.amount + "\n" + "Result: " + winner + "\n" + "Appreciation token: " + doc.won_amount




                                                is_time_extendable = false;

                                                if (doc.my_feed_id.feed_expiry_status == 0) {
                                                    is_time_extendable = true
                                                }

                                                var hashtags = doc.my_feed_id.feeds_hash_tags
                                                var hashs = [];
                                                if (hashtags.length > 0) {
                                                    hashtags.forEach(function(ele) {
                                                        var tag = "#" + ele
                                                        hashs.push(tag)
                                                    })
                                                }
                                                var video_dur_my_feed_id = doc.my_feed_id.video_duration
                                                var video_duration = ""
                                                var video = video_dur_my_feed_id * 1000

                                                var minutes = Math.floor(video / 60000);
                                                var seconds = ((video % 60000) / 1000).toFixed(0);
                                                minutes = minutes.toString()
                                                seconds = seconds.toString()
                                                var video_duration = minutes + ":" + seconds

                                                if (minutes.length === 1 && seconds.length === 1) {
                                                    video_duration = "0" + minutes + ":" + "0" + seconds

                                                } else if (minutes.length === 1) {
                                                    if (seconds === '60') {
                                                        video_duration = "01:00"
                                                    } else {
                                                        video_duration = "0" + minutes + ":" + seconds
                                                    }
                                                    if (seconds.length === 1) {
                                                        video_duration = "0" + minutes + ":" + "0" + seconds
                                                    }
                                                } else {
                                                    if (seconds.length === 1) {
                                                        video_duration = minutes + ":" + "0" + seconds
                                                    }
                                                    if (minutes.length === 1) {
                                                        video_duration = "0" + minutes + ":" + "0" + seconds
                                                    }
                                                }

                                                var video_dur_challenge_feed_id = doc.challenge_feed_id.video_duration
                                                var video_duration_member = ""
                                                var video1 = video_dur_challenge_feed_id * 1000

                                                var minutes1 = Math.floor(video1 / 60000);
                                                var seconds1 = ((video1 % 60000) / 1000).toFixed(0);
                                                minutes1 = minutes1.toString()
                                                seconds1 = seconds1.toString()
                                                var video_duration_member = minutes1 + ":" + seconds1

                                                if (minutes1.length === 1 && seconds1.length === 1) {
                                                    video_duration_member = "0" + minutes1 + ":" + seconds1 + "0"

                                                } else if (minutes1.length === 1) {
                                                    if (seconds === '60') {
                                                        video_duration_member = "01:00"
                                                    } else {
                                                        video_duration_member = "0" + minutes + ":" + seconds
                                                    }
                                                    if (seconds1.length === 1) {
                                                        video_duration_member = "0" + minutes1 + ":" + seconds1 + "0"
                                                    }
                                                } else {
                                                    if (seconds1.length === 1) {
                                                        video_duration_member = minutes1 + ":" + seconds1 + "0"
                                                    }
                                                    if (minutes1.length === 1) {
                                                        video_duration_member = "0" + minutes1 + ":" + seconds1 + "0"
                                                    }
                                                }

                                                console.log(video_duration_member)
                                                console.log(video_duration)

                                                feedinfo = {

                                                    "feed_id": doc.my_feed_id._id,
                                                    "feed_desc": doc.my_feed_id.feed_desc,
                                                    "feeds_tags": hashs,
                                                    "feed_type": doc.my_feed_id.feed_type,
                                                    "userid": doc.my_feed_id.iv_acountid._id,
                                                    "username": doc.my_feed_id.iv_acountid.username,
                                                    "expiry_time": "",
                                                    "rating": parseFloat(doc.my_feed_id.feed_rating),
                                                    "no_shares": doc.my_feed_id.no_shares,
                                                    "no_likes": doc.my_feed_id.no_likes,
                                                    "no_comments": doc.my_feed_id.no_comments,
                                                    "privacy_mode": doc.my_feed_id.privacy_mode,
                                                    "is_liked": is_liked,
                                                    "no_views": user_views,
                                                    "profile_url": constants.APIBASEURL + profileimage,
                                                    "can_show_ad": false,
                                                    "allow_comments": false,
                                                    "preview_url": constants.APIBASEURL + doc.my_feed_id.preview_url,
                                                    "has_sensitive_content": false,
                                                    "is_under_challenge": doc.my_feed_id.is_under_challenge,
                                                    "is_challengeable": true,
                                                    'is_time_extendable': is_time_extendable,
                                                    "video_duration": video_duration,
                                                    "challenge_details": {
                                                        "member_id": doc.challenge_feed_id.iv_acountid._id,
                                                        "member_user_name": doc.challenge_feed_id.iv_acountid.username,
                                                        "member_url": constants.APIBASEURL + other_profileimage,
                                                        "member_feed_id": doc.challenge_feed_id._id,
                                                        "challenge_desc": winnermsg,
                                                        "challenge_number": String(doc.challenge_number),
                                                        "member_preview_url": constants.APIBASEURL + doc.challenge_feed_id.preview_url,
                                                        "no_mem_views": member_views,
                                                        "video_duration_mem": video_duration_member
                                                    },
                                                    "is_self_feed": true,
                                                    "ad_details": {
                                                        "ad_type": "",
                                                        "ad_files": []
                                                    },
                                                    "comment_privacy": 0,
                                                    "repost_details": {
                                                        "original_userid": "",
                                                        "original_feed_id": "",
                                                        "original_user_img_url": ""
                                                    }
                                                }
                                                test.push(feedinfo)

                                            }
                                        })
                                        count = test.length
                                        var total_pages = 0;
                                        if (count === 0) {
                                            total_pages = 1
                                        } else {
                                            total_pages = Math.ceil(count / perPage)
                                        }
                                        test = test.slice(skip, limit)

                                        test.reverse()

                                        res.status(200).json({
                                            status: 'Ok',
                                            message: 'Challenges History',
                                            userid: req.body.userid,
                                            total_pages: total_pages,
                                            current_page: page,
                                            total_feeds: count,
                                            feeds: test
                                        });
                                    } else {
                                        res.status(200).json({
                                            status: 'Ok',
                                            message: 'No Challenges History',
                                            feeds: test
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

router.post("/expired_challenges", (req, res, next) => {

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
                        challenges.find({ userid: req.body.userid })
                            .populate({ path: 'expired_challenges.my_feed_id expired_challenges.my_userid expired_challenges.challenge_userid expired_challenges.challenge_feed_id', populate: { path: 'userid' } })
                            .exec()
                            .then(docs => {
                                if (docs.length < 1) {
                                    res.status(200).json({
                                        status: 'Failed',
                                        message: 'Bad Request. Please provide userid.'
                                    });
                                } else {
                                    var perPage = 20
                                    var page = req.body.page_no

                                    if (isEmpty(page)) {
                                        page = 1
                                    }
                                    var skip = (perPage * page) - perPage;
                                    var limit = skip + perPage;

                                    var test = [];
                                    var ongoing = docs[0].expired_challenges(skip, limit)
                                    var count = doc[0].expired_challenges.length
                                    var test = [];

                                    ongoing.map(doc => {

                                        var date = new Date()
                                        var date1 = date.setTime(date.getTime());
                                        var dateNow = new Date(date1).toISOString();
                                        var t = Date.parse(doc.my_feed_id.feeds_expiry_time_) - Date.parse(dateNow);
                                        var seconds1 = Math.floor((t / 1000) % 60);
                                        var minutes1 = Math.floor((t / 1000 / 60) % 60);
                                        var hours1 = Math.floor((t / (1000 * 60 * 60)) % 24);
                                        var days1 = Math.floor(t / (1000 * 60 * 60 * 24));

                                        if (seconds1 < 0) {
                                            seconds1 = '00';
                                        }
                                        if (minutes1 < 0) {
                                            minutes1 = '00';
                                        }
                                        if (hours1 < 0) {
                                            hours1 = '00';
                                        }
                                        if (days1 < 0) {
                                            days1 = '00';
                                        }

                                        var calculatetime = hours1 + ':' + minutes1 + ':' + seconds1;
                                        var duration = Date.parse(doc.my_feed_id.feeds_expiry_time_);

                                        var profileimage = doc.my_userid.userid.profileimage
                                        if (profileimage === null) {
                                            profileimage = 'uploads/userimage.png'
                                        }

                                        var other_profileimage = doc.challenge_userid.userid.profileimage
                                        if (other_profileimage === null) {
                                            other_profileimage = 'uploads/userimage.png'
                                        }

                                        var is_liked = false;
                                        var testlike = doc.my_feed_id.likes;
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
                                        is_time_extendable = false;

                                        if (doc.my_feed_id.feed_expiry_status == 0) {
                                            is_time_extendable = true
                                        }
                                        var hashtags = doc.my_feed_id.feeds_hash_tags
                                        var hashs = [];
                                        if (hashtags.length > 0) {
                                            hashtags.forEach(function(ele) {
                                                var tag = "#" + ele
                                                hashs.push(tag)
                                            })
                                        }
                                        var no_likes = doc.my_feed_id.no_likes
                                        if (no_likes <= 0) {
                                            no_likes = 0
                                        } else {
                                            no_likes = doc.my_feed_id.no_likes
                                        }

                                        feedinfo = {

                                            "feed_id": doc.my_feed_id._id,
                                            "feed_desc": doc.my_feed_id.feed_desc,
                                            "feeds_tags": hashs,
                                            "feed_type": doc.my_feed_id.feed_type,
                                            "userid": doc.my_userid.userid._id,
                                            "username": doc.my_userid.userid.username,
                                            "expiry_time": duration,
                                            "rating": parseFloat(doc.my_feed_id.feed_rating),
                                            "no_shares": doc.my_feed_id.no_shares,
                                            "no_likes": no_likes,
                                            "no_comments": doc.my_feed_id.no_comments,
                                            "is_liked": is_liked,
                                            "no_views": doc.my_feed_id.no_views,
                                            "profile_url": constants.APIBASEURL + profileimage,
                                            "privacy_mode": doc.my_feed_id.privacy_mode,
                                            "can_show_ad": false,
                                            "allow_comments": false,
                                            "preview_url": constants.APIBASEURL + 'uploads/video.jpeg',
                                            "has_sensitive_content": false,
                                            "is_under_challenge": doc.my_feed_id.is_under_challenge,
                                            "is_challengeable": true,
                                            "is_time_extendable": is_time_extendable,
                                            "challenge_details": {
                                                "member_id": doc.challenge_userid.userid._id,
                                                "member_user_name": doc.challenge_userid.userid.username,
                                                "member_url": constants.APIBASEURL + other_profileimage,
                                                "member_feed_id": doc.challenge_feed_id._id,
                                                "challenge_desc": winner,
                                                "challenge_number": String(doc.challenge_number)
                                            },
                                            "is_self_feed": true,
                                            "ad_details": {
                                                "ad_type": "",
                                                "ad_files": []
                                            },
                                            "comment_privacy": 0,
                                            "repost_details": {
                                                "original_userid": "",
                                                "original_feed_id": "",
                                                "original_user_img_url": ""
                                            }
                                        }
                                        test.push(feedinfo)
                                    })
                                    res.status(200).json({
                                        status: 'Ok',
                                        message: 'Challenges History',
                                        userid: req.body.userid,
                                        total_pages: Math.ceil(count / perPage),
                                        current_page: page,
                                        total_feeds: count,
                                        feeds: test
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


router.post("/challenge_details", (req, res, next) => {

    var keyArray = ["userid", "iv_token", "clientid", "challenge_number"];
    var key = Object.keys(req.body);
    console.log(typeof req.body.challenge_number)
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
                        console.log("challenge number " + req.body.challenge_number)
                        challenges.find({ 'on_going_challenges.challenge_number': parseInt(req.body.challenge_number) }, { 'on_going_challenges.$': 1 })
                            .populate({ path: 'on_going_challenges.my_feed_id on_going_challenges.challenge_feed_id on_going_challenges.my_userid on_going_challenges.challenge_userid', populate: { path: 'userid iv_acountid' } })
                            .exec()
                            .then(docs => {
                                var ongoing = []
                                var winner = ""
                                var test = []
                                var is_ongoing = false
                                if (docs.length > 0) {
                                    ongoing.push(docs[0].on_going_challenges[0])
                                    is_ongoing = true
                                    ongoing.map(doc => {

                                        var feedinfo = ""
                                        if (typeof doc.my_feed_id.iv_acountid === 'undefined' || typeof doc.challenge_feed_id.iv_acountid === 'undefined' || doc.challenge_feed_id.feed_expiry_status === 1 || doc.my_feed_id.feed_expiry_status === 1) {
                                            var profileimage = doc.my_userid.userid.profileimage
                                            if (profileimage === null) {
                                                profileimage = 'uploads/userimage.png'
                                            }

                                            var other_profileimage = doc.challenge_userid.userid.profileimage
                                            if (other_profileimage === null) {
                                                other_profileimage = 'uploads/userimage.png'
                                            }
                                            var is_userfeed = false;

                                            if (String(doc.my_userid.userid._id) === String(req.body.userid)) {
                                                is_userfeed = true;
                                            } else if (String(doc.challenge_userid.userid._id) === String(req.body.userid)) {
                                                is_userfeed = true;
                                            } else {
                                                is_userfeed = false;
                                            }

                                            var challenge_desc = ""
                                            if (typeof doc.winner === 'undefined') {
                                                challenge_desc = "Feed is expired"
                                            } else {
                                                challenge_desc = doc.winner
                                            }
                                            var user_views = 0
                                            var member_views = 0
                                            if (typeof doc.user_views === 'undefined') {
                                                user_views = 0
                                            } else {
                                                user_views = doc.user_views
                                            }
                                            if (typeof doc.member_views === 'undefined') {
                                                member_views = 0
                                            } else {
                                                member_views = doc.member_views
                                            }
                                            var percentage = String(user_views)

                                            var per = percentage.split('0')
                                            if (per[0] === "") {
                                                per[0] = 0
                                            }
                                            var user_progress = parseInt(per[0])

                                            var member_percentage = String(member_views)
                                            var pers = member_percentage.split('0')
                                            if (pers[0] === "") {
                                                pers[0] = 0
                                            }
                                            var member_progress = parseInt(pers[0])


                                            const date1 = new Date()
                                            var end_date = doc.challenge_started_at
                                            var end_date = end_date.setHours(end_date.getHours() + 2)

                                            var final_date = end_date - date1


                                            var timers = final_date

                                            console.log("timer time " + final_date)

                                            var date = new Date(doc.created_at);
                                            date.setHours(date.getHours() + 2);
                                            var isoDate = date.toISOString();

                                            var timer = Date.parse(isoDate);

                                            //var timer = Date.parse(isoDate);

                                            var min_views = Math.floor(doc.amount * 4 / 5)

                                            if (String(doc.my_userid.userid._id) === String(req.body.userid)) {
                                                feedinfo = {
                                                    challenge_desc: challenge_desc,
                                                    challenge_amount: doc.amount,
                                                    is_self_feed: is_userfeed,
                                                    expiry_time: timer,
                                                    expiry_time_new: timers,
                                                    minimum_views: "Minimum views to get the appreciation token: " + min_views,
                                                    user: {
                                                        "userid": doc.my_userid.userid._id,
                                                        "username": doc.my_userid.userid.username,
                                                        "mobile": doc.my_userid.userid.mobile,
                                                        "url": constants.APIBASEURL + profileimage,
                                                        "feed_id": "",
                                                        "feed_desc": "",
                                                        "preview_url": "",
                                                        "no_views": user_views,
                                                        "rating": 0,
                                                        "user_progress": user_progress,
                                                        "video_duration": ""
                                                    },

                                                    member: {
                                                        "member_userid": doc.challenge_userid.userid._id,
                                                        "member_user_name": doc.challenge_userid.userid.username,
                                                        "member_mobile": doc.challenge_userid.userid.mobile,
                                                        "member_url": constants.APIBASEURL + other_profileimage,
                                                        "member_feed_id": "",
                                                        "member_feed_desc": "",
                                                        "member_preview_url": "",
                                                        "no_mem_views": member_views,
                                                        "member_rating": 0,
                                                        "member_progress": member_progress,
                                                        "video_duration_mem": ""
                                                    }
                                                }
                                            } else {
                                                feedinfo = {
                                                    challenge_desc: challenge_desc,
                                                    challenge_amount: doc.amount,
                                                    is_self_feed: is_userfeed,
                                                    expiry_time: timer,
                                                    expiry_time_new: timers,
                                                    minimum_views: "Minimum views to get the appreciation token: " + min_views,
                                                    user: {
                                                        "userid": doc.challenge_userid.userid._id,
                                                        "username": doc.challenge_userid.userid.username,
                                                        "mobile": doc.challenge_userid.userid.mobile,
                                                        "url": constants.APIBASEURL + other_profileimage,
                                                        "feed_id": "",
                                                        "feed_desc": "",
                                                        "preview_url": "",
                                                        "no_views": member_views,
                                                        "rating": 0,
                                                        "user_progress": member_progress,
                                                        "video_duration": ""
                                                    },

                                                    member: {
                                                        "member_userid": doc.my_userid.userid._id,
                                                        "member_user_name": doc.my_userid.userid.username,
                                                        "member_mobile": doc.my_userid.userid.mobile,
                                                        "member_url": constants.APIBASEURL + profileimage,
                                                        "member_feed_id": "",
                                                        "member_feed_desc": "",
                                                        "member_preview_url": "",
                                                        "no_mem_views": user_views,
                                                        "member_rating": 0,
                                                        "member_progress": user_progress,
                                                        "video_duration_mem": ""
                                                    }
                                                }
                                            }


                                        } else {
                                            var profileimage = doc.my_userid.userid.profileimage
                                            if (profileimage === null) {
                                                profileimage = 'uploads/userimage.png'
                                            }

                                            var other_profileimage = doc.challenge_userid.userid.profileimage
                                            if (other_profileimage === null) {
                                                other_profileimage = 'uploads/userimage.png'
                                            }

                                            var user_views = doc.user_views;
                                            var member_views = doc.member_views;

                                            if (user_views <= 0) {
                                                user_views = 0
                                            }
                                            if (member_views <= 0) {
                                                member_views = 0
                                            }

                                            if (is_ongoing === false) {

                                                winner = doc.winner;

                                                if (winner === doc.my_userid.userid.username) {
                                                    winner = doc.my_userid.userid.username + " won the challenge by " + user_views + " views on " + doc.challenge_userid.userid.username + "."
                                                } else if (winner === doc.challenge_userid.userid.username) {
                                                    winner = doc.challenge_userid.userid.username + " won the challenge by " + member_views + " views on " + doc.my_userid.userid.username
                                                } else {
                                                    winner = doc.challenge_userid.userid.username + " and you are having the same views."
                                                }
                                            } else {
                                                if (user_views > member_views) {
                                                    var views = user_views - member_views

                                                    if (views === 1) {
                                                        winner = doc.my_userid.userid.username + " is Leading by " + views + " view on " + doc.challenge_userid.userid.username + "."
                                                    } else {
                                                        winner = doc.my_userid.userid.username + " is Leading by " + views + " views on " + doc.challenge_userid.userid.username + "."
                                                    }

                                                } else if (member_views > user_views) {
                                                    var views = member_views - user_views

                                                    if (views === 1) {
                                                        winner = doc.challenge_userid.userid.username + " is Leading by " + views + " view on " + doc.my_userid.userid.username
                                                    } else {
                                                        winner = doc.challenge_userid.userid.username + " is Leading by " + views + " views on " + doc.my_userid.userid.username
                                                    }

                                                } else {
                                                    winner = doc.challenge_userid.userid.username + " and " + doc.my_userid.userid.username + " are having the same views."
                                                }
                                            }

                                            var is_userfeed = false;

                                            if (String(doc.my_userid.userid._id) === String(req.body.userid)) {
                                                is_userfeed = true;
                                            } else if (String(doc.challenge_userid.userid._id) === String(req.body.userid)) {
                                                is_userfeed = true;
                                            } else {
                                                is_userfeed = false;
                                            }

                                            var percentage = String(user_views)
                                            var per = percentage.split('0')
                                            if (per[0] === "") {
                                                per[0] = 0
                                            }
                                            var user_progress = parseInt(per[0])

                                            var member_percentage = String(member_views)
                                            var pers = member_percentage.split('0')
                                            if (pers[0] === "") {
                                                pers[0] = 0
                                            }
                                            var member_progress = parseInt(pers[0])

                                            const date1 = new Date()
                                            var end_date = doc.challenge_started_at
                                            var end_date = end_date.setHours(end_date.getHours() + 2)

                                            var final_date = end_date - date1


                                            var timers = final_date


                                            var date = new Date(doc.created_at);
                                            date.setHours(date.getHours() + 2);
                                            var isoDate = date.toISOString();

                                            var timer = Date.parse(isoDate);
                                            console.log("timer time " + new Date(end_date))
                                            console.log("timer time " + doc.challenge_started_at)


                                            var video_dur_my_feed_id = doc.my_feed_id.video_duration
                                            var video_duration_member = ""
                                            var video = video_dur_my_feed_id * 1000

                                            var minutes = Math.floor(video / 60000);
                                            var seconds = ((video % 60000) / 1000).toFixed(0);
                                            minutes = minutes.toString()
                                            seconds = seconds.toString()
                                            var video_duration = minutes + ":" + seconds

                                            if (minutes.length === 1 && seconds.length === 1) {
                                                video_duration = "0" + minutes + ":" + "0" + seconds

                                            } else if (minutes.length === 1) {
                                                if (seconds === '60') {
                                                    video_duration = "01:00"
                                                } else {
                                                    video_duration = "0" + minutes + ":" + seconds
                                                }
                                                if (seconds.length === 1) {
                                                    video_duration = "0" + minutes + ":" + "0" + seconds
                                                }
                                            } else {
                                                if (seconds.length === 1) {
                                                    video_duration = minutes + ":" + "0" + seconds
                                                }
                                                if (minutes.length === 1) {
                                                    video_duration = "0" + minutes + ":" + "0" + seconds
                                                }
                                            }

                                            var video_dur_challenge_feed_id = doc.challenge_feed_id.video_duration
                                            var video_duration_member = ""
                                            var video1 = video_dur_challenge_feed_id * 1000

                                            var minutes1 = Math.floor(video1 / 60000);
                                            var seconds1 = ((video1 % 60000) / 1000).toFixed(0);
                                            minutes1 = minutes1.toString()
                                            seconds1 = seconds1.toString()
                                            var video_duration_member = minutes1 + ":" + seconds1

                                            if (minutes1.length === 1 && seconds1.length === 1) {
                                                video_duration_member = "0" + minutes1 + ":" + seconds1 + "0"

                                            } else if (minutes1.length === 1) {
                                                if (seconds === '60') {
                                                    video_duration_member = "01:00"
                                                } else {
                                                    video_duration_member = "0" + minutes + ":" + seconds
                                                }
                                                if (seconds1.length === 1) {
                                                    video_duration_member = "0" + minutes1 + ":" + seconds1 + "0"
                                                }
                                            } else {
                                                if (seconds1.length === 1) {
                                                    video_duration_member = minutes1 + ":" + seconds1 + "0"
                                                }
                                                if (minutes1.length === 1) {
                                                    video_duration_member = "0" + minutes1 + ":" + seconds1 + "0"
                                                }
                                            }

                                            var min_views = Math.floor(doc.amount * 4 / 5)

                                            console.log(doc.my_userid.userid.username)

                                            if (String(doc.my_userid.userid._id) === String(req.body.userid)) {
                                                feedinfo = {
                                                    challenge_desc: winner,
                                                    challenge_amount: doc.amount,
                                                    is_self_feed: is_userfeed,
                                                    expiry_time: timer,
                                                    expiry_time_new: timers,
                                                    minimum_views: "Minimum views to get the appreciation token: " + min_views,
                                                    user: {
                                                        "userid": doc.my_userid.userid._id,
                                                        "username": doc.my_userid.userid.username,
                                                        "mobile": doc.my_userid.userid.mobile,
                                                        "url": constants.APIBASEURL + profileimage,
                                                        "feed_id": doc.my_feed_id._id,
                                                        "feed_desc": doc.my_feed_id.feed_desc,
                                                        "preview_url": constants.APIBASEURL + doc.my_feed_id.preview_url,
                                                        "no_views": user_views,
                                                        "rating": parseFloat(doc.my_feed_id.feed_rating),
                                                        "user_progress": user_progress,
                                                        "video_duration": video_duration
                                                    },

                                                    member: {
                                                        "member_userid": doc.challenge_userid.userid._id,
                                                        "member_user_name": doc.challenge_userid.userid.username,
                                                        "member_mobile": doc.challenge_userid.userid.mobile,
                                                        "member_url": constants.APIBASEURL + other_profileimage,
                                                        "member_feed_id": doc.challenge_feed_id._id,
                                                        "member_feed_desc": doc.challenge_feed_id.feed_desc,
                                                        "member_preview_url": constants.APIBASEURL + doc.challenge_feed_id.preview_url,
                                                        "no_mem_views": member_views,
                                                        "member_rating": parseFloat(doc.challenge_feed_id.feed_rating),
                                                        "member_progress": member_progress,
                                                        "video_duration_mem": video_duration_member
                                                    }
                                                }
                                            } else {
                                                feedinfo = {
                                                    challenge_desc: winner,
                                                    challenge_amount: doc.amount,
                                                    is_self_feed: is_userfeed,
                                                    expiry_time: timer,
                                                    expiry_time_new: timers,
                                                    minimum_views: "Minimum views to get the appreciation token: " + min_views,
                                                    user: {
                                                        "userid": doc.challenge_userid.userid._id,
                                                        "username": doc.challenge_userid.userid.username,
                                                        "mobile": doc.challenge_userid.userid.mobile,
                                                        "url": constants.APIBASEURL + other_profileimage,
                                                        "feed_id": doc.challenge_feed_id._id,
                                                        "feed_desc": doc.challenge_feed_id.feed_desc,
                                                        "preview_url": constants.APIBASEURL + doc.challenge_feed_id.preview_url,
                                                        "no_views": member_views,
                                                        "rating": parseFloat(doc.challenge_feed_id.feed_rating),
                                                        "user_progress": member_progress,
                                                        "video_duration": video_duration_member
                                                    },

                                                    member: {
                                                        "member_userid": doc.my_userid.userid._id,
                                                        "member_user_name": doc.my_userid.userid.username,
                                                        "member_mobile": doc.my_userid.userid.mobile,
                                                        "member_url": constants.APIBASEURL + profileimage,
                                                        "member_feed_id": doc.my_feed_id._id,
                                                        "member_feed_desc": doc.my_feed_id.feed_desc,
                                                        "member_preview_url": constants.APIBASEURL + doc.my_feed_id.preview_url,
                                                        "no_mem_views": user_views,
                                                        "member_rating": parseFloat(doc.my_feed_id.feed_rating),
                                                        "member_progress": user_progress,
                                                        "video_duration_mem": video_duration
                                                    }
                                                }
                                            }
                                        }

                                        test.push(feedinfo)
                                    })
                                    res.status(200).json({
                                        status: 'Ok',
                                        message: 'Challenge details',
                                        challenge_details: test[0]
                                    });
                                } else {
                                    console.log(req.body.challenge_number)
                                    challenges.find({ 'challenges_history.challenge_number': parseInt(req.body.challenge_number) }, { 'challenges_history.$': 1 })
                                        .populate({ path: 'challenges_history.my_feed_id challenges_history.challenge_feed_id challenges_history.my_userid challenges_history.challenge_userid', populate: { path: 'userid iv_acountid' } })
                                        .exec()
                                        .then(docsy => {

                                            if (docsy.length > 0) {
                                                var ongoing = []

                                                var winner = ""
                                                var winnermsg = ""
                                                var test = []
                                                if (docsy[0].challenges_history.length > 0) {
                                                    ongoing.push(docsy[0].challenges_history[0])
                                                    console.log(ongoing.length)
                                                    is_ongoing = false
                                                    ongoing.map(doc => {
                                                        var feedinfo = ""
                                                        if (doc.my_feed_id === null || doc.challenge_feed_id === null || doc.challenge_feed_id.feed_expiry_status === 1 || doc.my_feed_id.feed_expiry_status === 1) {

                                                            if (doc.my_userid === null || doc.challenge_userid === null) {
                                                                res.status(200).json({
                                                                    status: 'Failed',
                                                                    message: 'Challenge might have removed.'
                                                                });
                                                            } else {
                                                                var profileimage = doc.my_userid.userid.profileimage
                                                                if (profileimage === null) {
                                                                    profileimage = 'uploads/userimage.png'
                                                                }

                                                                var other_profileimage = doc.challenge_userid.userid.profileimage
                                                                if (other_profileimage === null) {
                                                                    other_profileimage = 'uploads/userimage.png'
                                                                }
                                                                var is_userfeed = false;

                                                                if (String(doc.my_userid.userid._id) === String(req.body.userid)) {
                                                                    is_userfeed = true;
                                                                } else if (String(doc.challenge_userid.userid._id) === String(req.body.userid)) {
                                                                    is_userfeed = true;
                                                                } else {
                                                                    is_userfeed = false;
                                                                }

                                                                var challenge_desc = ""
                                                                if (typeof doc.winner === 'undefined') {
                                                                    challenge_desc = "Feed is expired"
                                                                } else {
                                                                    var user_views = doc.user_views;
                                                                    var member_views = doc.member_views;
                                                                    var win = String(doc.winner)
                                                                    var db_winner = String(doc.winner).split(" dropped")
                                                                    var challenge_desc = db_winner[0]
                                                                    var winny = db_winner[0]

                                                                    if (win.indexOf('both') !== -1 || win.indexOf("draw") !== -1) {
                                                                        challenge_desc = db_winner[0] + " dropped from the challenge."
                                                                    }
                                                                    if (user_views > member_views) {
                                                                        challenge_desc = doc.my_feed_id.iv_acountid.username + " won the challenge."
                                                                    } else if (member_views > user_views) {
                                                                        challenge_desc = doc.challenge_feed_id.iv_acountid.username + " won the challenge."
                                                                    } else {
                                                                        challenge_desc = "Challenge is a draw!!"
                                                                    }

                                                                    if (win.indexOf("dropped") != -1) {
                                                                        challenge_desc = ""
                                                                        challenge_desc = winny + " dropped from challenge."
                                                                    }
                                                                }
                                                                var user_views = 0
                                                                var member_views = 0
                                                                if (typeof doc.user_views === 'undefined') {
                                                                    user_views = 0
                                                                } else {
                                                                    user_views = doc.user_views
                                                                }
                                                                if (typeof doc.member_views === 'undefined') {
                                                                    member_views = 0
                                                                } else {
                                                                    member_views = doc.member_views
                                                                }
                                                                var percentage = String(user_views)

                                                                var per = percentage.split('0')
                                                                if (per[0] === "") {
                                                                    per[0] = 0
                                                                }
                                                                var user_progress = parseInt(per[0])

                                                                var member_percentage = String(member_views)
                                                                var pers = member_percentage.split('0')
                                                                if (pers[0] === "") {
                                                                    pers[0] = 0
                                                                }
                                                                var member_progress = parseInt(pers[0])
                                                                var min_views = Math.floor(doc.amount * 4 / 5)

                                                                if (String(doc.my_userid.userid._id) === String(req.body.userid)) {
                                                                    feedinfo = {
                                                                        challenge_desc: challenge_desc,
                                                                        challenge_amount: doc.amount,
                                                                        is_self_feed: is_userfeed,
                                                                        expiry_time: "",
                                                                        expiry_time_new: 0,
                                                                        minimum_views: "Minimum views to get the appreciation token: " + min_views,
                                                                        user: {
                                                                            "userid": doc.my_userid.userid._id,
                                                                            "username": doc.my_userid.userid.username,
                                                                            "mobile": doc.my_userid.userid.mobile,
                                                                            "url": constants.APIBASEURL + profileimage,
                                                                            "feed_id": "",
                                                                            "feed_desc": "",
                                                                            "preview_url": "",
                                                                            "no_views": user_views,
                                                                            "rating": 0,
                                                                            "user_progress": user_progress,
                                                                            "video_duration": ""
                                                                        },

                                                                        member: {
                                                                            "member_userid": doc.challenge_userid.userid._id,
                                                                            "member_user_name": doc.challenge_userid.userid.username,
                                                                            "member_mobile": doc.challenge_userid.userid.mobile,
                                                                            "member_url": constants.APIBASEURL + other_profileimage,
                                                                            "member_feed_id": "",
                                                                            "member_feed_desc": "",
                                                                            "member_preview_url": "",
                                                                            "no_mem_views": member_views,
                                                                            "member_rating": 0,
                                                                            "member_progress": member_progress,
                                                                            "video_duration_mem": ""
                                                                        }
                                                                    }
                                                                } else {
                                                                    feedinfo = {
                                                                        challenge_desc: challenge_desc,
                                                                        challenge_amount: doc.amount,
                                                                        is_self_feed: is_userfeed,
                                                                        expiry_time: "",
                                                                        expiry_time_new: 0,
                                                                        minimum_views: "Minimum views to get the appreciation token: " + min_views,
                                                                        user: {
                                                                            "userid": doc.challenge_userid.userid._id,
                                                                            "username": doc.challenge_userid.userid.username,
                                                                            "mobile": doc.challenge_userid.userid.mobile,
                                                                            "url": constants.APIBASEURL + other_profileimage,
                                                                            "feed_id": "",
                                                                            "feed_desc": "",
                                                                            "preview_url": "",
                                                                            "no_views": member_views,
                                                                            "rating": 0,
                                                                            "user_progress": member_progress,
                                                                            "video_duration": ""
                                                                        },

                                                                        member: {
                                                                            "member_userid": doc.my_userid.userid._id,
                                                                            "member_user_name": doc.my_userid.userid.username,
                                                                            "member_mobile": doc.my_userid.userid.mobile,
                                                                            "member_url": constants.APIBASEURL + profileimage,
                                                                            "member_feed_id": "",
                                                                            "member_feed_desc": "",
                                                                            "member_preview_url": "",
                                                                            "no_mem_views": user_views,
                                                                            "member_rating": 0,
                                                                            "member_progress": user_progress,
                                                                            "video_duration_mem": ""
                                                                        }
                                                                    }
                                                                }

                                                            }

                                                        } else {
                                                            var profileimage = doc.my_feed_id.iv_acountid.profileimage
                                                            if (profileimage === null) {
                                                                profileimage = 'uploads/userimage.png'
                                                            }

                                                            var other_profileimage = doc.challenge_feed_id.iv_acountid.profileimage
                                                            if (other_profileimage === null) {
                                                                other_profileimage = 'uploads/userimage.png'
                                                            }

                                                            var user_views = doc.user_views;
                                                            var member_views = doc.member_views;
                                                            var win = String(doc.winner)
                                                            var db_winner = String(doc.winner).split(" dropped")
                                                            var winner = db_winner[0]
                                                            var winny = db_winner[0]

                                                            if (win.indexOf('both') !== -1 || win.indexOf("draw") !== -1) {
                                                                winner = db_winner[0] + " dropped from the challenge."
                                                            }
                                                            if (user_views > member_views) {
                                                                winner = doc.my_feed_id.iv_acountid.username + " won the challenge."
                                                            } else if (member_views > user_views) {
                                                                winner = doc.challenge_feed_id.iv_acountid.username + " won the challenge."
                                                            } else {
                                                                winner = "Challenge is a draw!!"
                                                            }

                                                            if (win.indexOf("dropped") != -1) {
                                                                winner = ""
                                                                winner = winny + " dropped from challenge."
                                                            }


                                                            if (String(req.body.userid) === doc.my_feed_id.iv_acountid.id || String(req.body.userid) === doc.challenge_feed_id.iv_acountid.id) {

                                                                if (String(req.body.userid) === docsy[0].challenges_history[0].my_feed_id.iv_acountid.id) {
                                                                    winnermsg = "Points: " + doc.amount + "\n" + "Result: " + winner + "\n" + "Appreciation token: " + docsy[0].challenges_history[0].won_amount
                                                                } else {
                                                                    winnermsg = "Points: " + doc.amount + "\n" + "Result: " + winner + "\n" + "Appreciation token: " + docsy[1].challenges_history[0].won_amount
                                                                }

                                                            } else {
                                                                winnermsg = "Points: " + doc.amount + "\n" + "Result: " + winner
                                                            }



                                                            var is_userfeed = false;

                                                            if (String(doc.my_feed_id.iv_acountid._id) === String(req.body.userid)) {
                                                                is_userfeed = true;
                                                            } else if (String(doc.challenge_feed_id.iv_acountid._id) === String(req.body.userid)) {
                                                                is_userfeed = true;
                                                            } else {
                                                                is_userfeed = false;
                                                            }

                                                            var percentage = String(user_views)
                                                            var per = percentage.split('0')
                                                            if (per[0] === "") {
                                                                per[0] = 0
                                                            }
                                                            var user_progress = parseInt(per[0])

                                                            var member_percentage = String(member_views)
                                                            var pers = member_percentage.split('0')
                                                            if (pers[0] === "") {
                                                                pers[0] = 0
                                                            }
                                                            var member_progress = parseInt(pers[0])

                                                            var video_dur_my_feed_id = doc.my_feed_id.video_duration
                                                            var video_duration = ""
                                                            var video = video_dur_my_feed_id * 1000

                                                            var minutes = Math.floor(video / 60000);
                                                            var seconds = ((video % 60000) / 1000).toFixed(0);
                                                            minutes = minutes.toString()
                                                            seconds = seconds.toString()
                                                            var video_duration = minutes + ":" + seconds

                                                            if (minutes.length === 1 && seconds.length === 1) {
                                                                video_duration = "0" + minutes + ":" + "0" + seconds

                                                            } else if (minutes.length === 1) {
                                                                if (seconds === '60') {
                                                                    video_duration = "01:00"
                                                                } else {
                                                                    video_duration = "0" + minutes + ":" + seconds
                                                                }
                                                                if (seconds.length === 1) {
                                                                    video_duration = "0" + minutes + ":" + "0" + seconds
                                                                }
                                                            } else {
                                                                if (seconds.length === 1) {
                                                                    video_duration = minutes + ":" + "0" + seconds
                                                                }
                                                                if (minutes.length === 1) {
                                                                    video_duration = "0" + minutes + ":" + "0" + seconds
                                                                }
                                                            }

                                                            var video_dur_challenge_feed_id = doc.challenge_feed_id.video_duration
                                                            var video_duration_member = ""
                                                            var video1 = video_dur_challenge_feed_id * 1000

                                                            var minutes1 = Math.floor(video1 / 60000);
                                                            var seconds1 = ((video1 % 60000) / 1000).toFixed(0);
                                                            minutes1 = minutes1.toString()
                                                            seconds1 = seconds1.toString()
                                                            var video_duration_member = minutes1 + ":" + seconds1

                                                            if (minutes1.length === 1 && seconds1.length === 1) {
                                                                video_duration_member = "0" + minutes1 + ":" + seconds1 + "0"

                                                            } else if (minutes1.length === 1) {
                                                                if (seconds === '60') {
                                                                    video_duration_member = "01:00"
                                                                } else {
                                                                    video_duration_member = "0" + minutes + ":" + seconds
                                                                }
                                                                if (seconds1.length === 1) {
                                                                    video_duration_member = "0" + minutes1 + ":" + seconds1 + "0"
                                                                }
                                                            } else {
                                                                if (seconds1.length === 1) {
                                                                    video_duration_member = minutes1 + ":" + seconds1 + "0"
                                                                }
                                                                if (minutes1.length === 1) {
                                                                    video_duration_member = "0" + minutes1 + ":" + seconds1 + "0"
                                                                }
                                                            }

                                                            var min_views = Math.floor(doc.amount * 4 / 5)

                                                            if (String(doc.my_userid.userid._id) === String(req.body.userid)) {
                                                                feedinfo = {
                                                                    challenge_desc: winnermsg,
                                                                    challenge_amount: doc.amount,
                                                                    is_self_feed: is_userfeed,
                                                                    expiry_time: "",
                                                                    expiry_time_new: 0,
                                                                    minimum_views: "Minimum views to get the appreciation token: " + min_views,
                                                                    user: {
                                                                        "userid": doc.my_feed_id.iv_acountid._id,
                                                                        "username": doc.my_feed_id.iv_acountid.username,
                                                                        "mobile": doc.my_feed_id.iv_acountid.mobile,
                                                                        "url": constants.APIBASEURL + profileimage,
                                                                        "feed_id": doc.my_feed_id._id,
                                                                        "feed_desc": doc.my_feed_id.feed_desc,
                                                                        "preview_url": constants.APIBASEURL + doc.my_feed_id.preview_url,
                                                                        "no_views": doc.user_views,
                                                                        "rating": parseFloat(doc.my_feed_id.feed_rating),
                                                                        "user_progress": user_progress,
                                                                        "video_duration": video_duration
                                                                    },

                                                                    member: {
                                                                        "member_userid": doc.challenge_feed_id.iv_acountid._id,
                                                                        "member_user_name": doc.challenge_feed_id.iv_acountid.username,
                                                                        "member_mobile": doc.challenge_feed_id.iv_acountid.mobile,
                                                                        "member_url": constants.APIBASEURL + other_profileimage,
                                                                        "member_feed_id": doc.challenge_feed_id._id,
                                                                        "member_feed_desc": doc.challenge_feed_id.feed_desc,
                                                                        "member_preview_url": constants.APIBASEURL + doc.challenge_feed_id.preview_url,
                                                                        "no_mem_views": doc.member_views,
                                                                        "member_rating": parseFloat(doc.challenge_feed_id.feed_rating),
                                                                        "member_progress": member_progress,
                                                                        "video_duration_mem": video_duration_member
                                                                    }
                                                                }
                                                            } else {
                                                                feedinfo = {
                                                                    challenge_desc: winnermsg,
                                                                    challenge_amount: doc.amount,
                                                                    is_self_feed: is_userfeed,
                                                                    expiry_time: "",
                                                                    expiry_time_new: 0,
                                                                    minimum_views: "Minimum views to get the appreciation token: " + min_views,
                                                                    user: {
                                                                        "userid": doc.challenge_feed_id.iv_acountid._id,
                                                                        "username": doc.challenge_feed_id.iv_acountid.username,
                                                                        "mobile": doc.challenge_feed_id.iv_acountid.mobile,
                                                                        "url": constants.APIBASEURL + other_profileimage,
                                                                        "feed_id": doc.challenge_feed_id._id,
                                                                        "feed_desc": doc.challenge_feed_id.feed_desc,
                                                                        "preview_url": constants.APIBASEURL + doc.challenge_feed_id.preview_url,
                                                                        "no_views": doc.member_views,
                                                                        "rating": parseFloat(doc.challenge_feed_id.feed_rating),
                                                                        "user_progress": member_progress,
                                                                        "video_duration": video_duration_member
                                                                    },

                                                                    member: {
                                                                        "member_userid": doc.my_feed_id.iv_acountid._id,
                                                                        "member_user_name": doc.my_feed_id.iv_acountid.username,
                                                                        "member_mobile": doc.my_feed_id.iv_acountid.mobile,
                                                                        "member_url": constants.APIBASEURL + profileimage,
                                                                        "member_feed_id": doc.my_feed_id._id,
                                                                        "member_feed_desc": doc.my_feed_id.feed_desc,
                                                                        "member_preview_url": constants.APIBASEURL + doc.my_feed_id.preview_url,
                                                                        "no_mem_views": doc.user_views,
                                                                        "member_rating": parseFloat(doc.my_feed_id.feed_rating),
                                                                        "member_progress": user_progress,
                                                                        "video_duration_mem": video_duration
                                                                    }
                                                                }
                                                            }

                                                        }

                                                        test.push(feedinfo)
                                                    })
                                                    res.status(200).json({
                                                        status: 'Ok',
                                                        message: 'Challenge details',
                                                        challenge_details: test[0]
                                                    });
                                                } else {
                                                    res.status(200).json({
                                                        status: 'Failed',
                                                        message: 'Challenge might have removed.'
                                                    });
                                                }
                                            } else {
                                                res.status(200).json({
                                                    status: 'Failed',
                                                    message: 'Challenge might have removed.'
                                                });
                                            }

                                        }).catch(err => {
                                            console.log(err)
                                            // var spliterror=err.message.split(":")
                                            //     res.status(500).json({ 
                                            //         status: 'Failed',
                                            //         message: spliterror[0]
                                            //     });
                                        });
                                }
                            }).catch(err => {
                                console.log(err)
                                // var spliterror=err.message.split(":")
                                //     res.status(500).json({ 
                                //         status: 'Failed',
                                //         message: spliterror[0]
                                //     });
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


router.post("/get_throws_on_feed", (req, res, next) => {

    var keyArray = ["userid", "iv_token", "clientid", "feed_id"];
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
                        challenges.aggregate([
                            { $match: { userid: req.body.userid } },
                            { $unwind: "$challenged" },
                            { $match: { "challenged.my_feed_id": ObjectId(req.body.feed_id) } },
                            {
                                $group: {
                                    _id: "$challenged.my_feed_id",
                                    users: { $addToSet: { userid: "$challenged.challenge_userid", user_feed: "$challenged.challenge_feed_id", amount: "$challenged.amount" } },
                                    count: { $sum: 1 }
                                }
                            }
                        ], function(err, data) {
                            if (err) {
                                res.status(200).json({
                                    status: 'Failed',
                                    message: 'Please provide correct feed_id.'
                                });
                            } else {
                                if (data.length > 0) {
                                    iv_feeds.populate(data, { path: 'users.user_feed', populate: { path: 'iv_acountid' } }, function(err, result) {

                                        var test = [];
                                        if (typeof result[0].users === 'undefined') {
                                            res.status(200).json({
                                                status: 'Ok',
                                                message: 'No throws on feed.',
                                                feed_id: req.body.feed_id,
                                                total_contacts: test.length,
                                                contacts: test
                                            });
                                        } else {
                                            var users = result[0].users
                                            users.map(doc => {
                                                if (typeof doc.user_feed.iv_acountid != 'undefined' || doc.user_feed.feed_expiry_status === 0) {
                                                    var other_profileimage = doc.user_feed.iv_acountid.profileimage
                                                    if (other_profileimage === null) {
                                                        other_profileimage = 'uploads/userimage.png'
                                                    }

                                                    var video_dur = doc.user_feed.video_duration
                                                    var video_duration = ""
                                                    var video = video_dur * 1000

                                                    var minutes = Math.floor(video / 60000);
                                                    var seconds = ((video % 60000) / 1000).toFixed(0);
                                                    minutes = minutes.toString()
                                                    seconds = seconds.toString()
                                                    var video_duration = minutes + ":" + seconds

                                                    if (minutes.length === 1 && seconds.length === 1) {
                                                        video_duration = "0" + minutes + ":" + "0" + seconds

                                                    } else if (minutes.length === 1) {
                                                        if (seconds === '60') {
                                                            video_duration = "01:00"
                                                        } else {
                                                            video_duration = "0" + minutes + ":" + seconds
                                                        }
                                                        if (seconds.length === 1) {
                                                            video_duration = "0" + minutes + ":" + "0" + seconds
                                                        }
                                                    } else {
                                                        if (seconds.length === 1) {
                                                            video_duration = minutes + ":" + "0" + seconds
                                                        }
                                                        if (minutes.length === 1) {
                                                            video_duration = "0" + minutes + ":" + "0" + seconds
                                                        }
                                                    }

                                                    var foe = {
                                                        "userid": doc.user_feed.iv_acountid._id,
                                                        "username": doc.user_feed.iv_acountid.username,
                                                        "mobile": doc.user_feed.iv_acountid.mobile,
                                                        "profileimage": constants.APIBASEURL + other_profileimage,
                                                        "member_feed_id": doc.user_feed._id,
                                                        "feed_desc": doc.user_feed.feed_desc,
                                                        "preview_url": constants.APIBASEURL + doc.user_feed.preview_url,
                                                        "no_views": doc.user_feed.no_views,
                                                        "rating": parseFloat(doc.user_feed.feed_rating),
                                                        "challenge_amount": doc.amount,
                                                        "status": doc.status,
                                                        "video_duration": video_duration
                                                    }
                                                    test.push(foe)
                                                }
                                            })
                                            res.status(200).json({
                                                status: 'Ok',
                                                message: 'List of throws.',
                                                feed_id: req.body.feed_id,
                                                total_contacts: test.length,
                                                contacts: test
                                            });
                                        }
                                    })
                                } else {
                                    test = []
                                    res.status(200).json({
                                        status: 'Ok',
                                        message: 'No throws on feed.',
                                        feed_id: req.body.feed_id,
                                        total_contacts: test.length,
                                        contacts: test
                                    });
                                }
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

router.post("/get_challenges_on_feed", (req, res, next) => {

    var keyArray = ["userid", "iv_token", "clientid", "feed_id"];
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
                        challenges.aggregate([
                            { $match: { userid: req.body.userid } },
                            { $unwind: "$challenges" },
                            { $match: { "challenges.my_feed_id": ObjectId(req.body.feed_id) } },
                            {
                                $group: {
                                    _id: "$challenges.my_feed_id",
                                    users: { $addToSet: { userid: "$challenges.challenge_userid", user_feed: "$challenges.challenge_feed_id", amount: "$challenges.amount" } },
                                    count: { $sum: 1 }
                                }
                            }
                        ], function(err, data) {

                            if (err) {
                                return res.status(200).json({
                                    status: "Failed",
                                    message: "Please provide correct feed_id."
                                });
                            } else {
                                if (data.length > 0) {
                                    iv_feeds.populate(data, { path: 'users.user_feed', populate: { path: 'iv_acountid' } }, function(err, result) {

                                        var test = [];
                                        if (typeof result[0].users === 'undefined') {
                                            res.status(200).json({
                                                status: 'Ok',
                                                message: 'No challenges on feed.',
                                                feed_id: req.body.feed_id,
                                                total_contacts: test.length,
                                                contacts: test
                                            });
                                        } else {
                                            var users = result[0].users
                                            users.map(doc => {

                                                if (typeof doc.user_feed.iv_acountid != 'undefined' || doc.user_feed.feed_expiry_status === 0) {
                                                    var other_profileimage = doc.user_feed.iv_acountid.profileimage
                                                    if (other_profileimage === null) {
                                                        other_profileimage = 'uploads/userimage.png'
                                                    }

                                                    var video_dur = doc.user_feed.video_duration
                                                    var video_duration = ""
                                                    var video = video_dur * 1000

                                                    var minutes = Math.floor(video / 60000);
                                                    var seconds = ((video % 60000) / 1000).toFixed(0);
                                                    minutes = minutes.toString()
                                                    seconds = seconds.toString()
                                                    var video_duration = minutes + ":" + seconds

                                                    if (minutes.length === 1 && seconds.length === 1) {
                                                        video_duration = "0" + minutes + ":" + "0" + seconds

                                                    } else if (minutes.length === 1) {
                                                        if (seconds === '60') {
                                                            video_duration = "01:00"
                                                        } else {
                                                            video_duration = "0" + minutes + ":" + seconds
                                                        }
                                                        if (seconds.length === 1) {
                                                            video_duration = "0" + minutes + ":" + "0" + seconds
                                                        }
                                                    } else {
                                                        if (seconds.length === 1) {
                                                            video_duration = minutes + ":" + "0" + seconds
                                                        }
                                                        if (minutes.length === 1) {
                                                            video_duration = "0" + minutes + ":" + "0" + seconds
                                                        }
                                                    }

                                                    console.log(doc.user_feed._id)

                                                    var foe = {
                                                        "userid": doc.user_feed.iv_acountid._id,
                                                        "username": doc.user_feed.iv_acountid.username,
                                                        "mobile": doc.user_feed.iv_acountid.mobile,
                                                        "profileimage": constants.APIBASEURL + other_profileimage,
                                                        "member_feed_id": doc.user_feed._id,
                                                        "feed_desc": doc.user_feed.feed_desc,
                                                        "preview_url": constants.APIBASEURL + doc.user_feed.preview_url,
                                                        "no_views": doc.user_feed.no_views,
                                                        "rating": parseFloat(doc.user_feed.feed_rating),
                                                        "challenge_amount": doc.amount,
                                                        "status": doc.status,
                                                        "video_duration": video_duration
                                                    }
                                                    test.push(foe)
                                                }
                                            })
                                            console.log(test)
                                            res.status(200).json({
                                                status: 'Ok',
                                                message: 'List of challenges.',
                                                feed_id: req.body.feed_id,
                                                total_contacts: test.length,
                                                contacts: test
                                            });
                                        }
                                    })
                                } else {
                                    test = []
                                    res.status(200).json({
                                        status: 'Ok',
                                        message: 'No challenges on feed.',
                                        feed_id: req.body.feed_id,
                                        total_contacts: test.length,
                                        contacts: test
                                    });
                                }
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


router.post("/get_invites", (req, res, next) => {

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
                        challenges.aggregate([
                            { $match: { userid: req.body.userid } },
                            { $unwind: "$challenges" },
                            {
                                $group: {
                                    _id: "$challenges.my_feed_id",
                                    users: { $addToSet: { userid: "$challenges.challenge_userid", user_feed: "$challenges.challenge_feed_id", amount: "$challenges.amount" } },
                                    count: { $sum: 1 }
                                }
                            }
                        ], function(err, docs) {
                            if (err) {
                                res.status(200).json({
                                    status: 'Failed',
                                    message: 'Please provide correct userid.'
                                });
                            } else {

                                challenges.aggregate([
                                    { $match: { userid: req.body.userid } },
                                    { $unwind: "$challenged" },
                                    {
                                        $group: {
                                            _id: "$challenged.my_feed_id",
                                            users: { $addToSet: { userid: "$challenged.challenge_userid", user_feed: "$challenged.challenge_feed_id", amount: "$challenged.amount" } },
                                            count: { $sum: 1 }
                                        }
                                    }
                                ], function(err, data) {
                                    if (err) {
                                        res.status(200).json({
                                            status: 'Failed',
                                            message: 'Please provide correct userid.'
                                        });
                                    } else {

                                        iv_feeds.populate(docs, { path: '_id users.user_feed', populate: { path: 'iv_acountid' } }, function(err, result) {
                                            if (err) {
                                                res.status(500).json({
                                                    status: 'Failed',
                                                    message: 'Error loading feeds.'
                                                });
                                            } else {

                                                iv_feeds.populate(data, { path: '_id users.user_feed', populate: { path: 'iv_acountid' } }, function(err, conns) {
                                                    if (err) {
                                                        res.status(500).json({
                                                            status: 'Failed',
                                                            message: 'Error loading feeds.'
                                                        });
                                                    } else {
                                                        challenges.find({ userid: req.body.userid })
                                                            .exec()
                                                            .then(hist => {
                                                                var perPage = 20
                                                                var page = req.body.page_no

                                                                if (isEmpty(page)) {
                                                                    page = 1
                                                                }
                                                                var skip = (perPage * page) - perPage;
                                                                var limit = skip + perPage;

                                                                var test = [];
                                                                var testapi = [];
                                                                var data_ele = false
                                                                var is_null = false

                                                                if (docs.length > 0 && data.length > 0) {
                                                                    docs.forEach(function(ele) {
                                                                        var is_ele = false;
                                                                        if (ele._id != null || ele.feed_expiry_status === 0) {
                                                                            data.forEach(function(drop) {
                                                                                if (drop._id != null || drop.feed_expiry_status === 0) {
                                                                                    if (String(ele._id) === String(drop._id)) {
                                                                                        var challenges_count = 0;
                                                                                        var challenged_count = 0;
                                                                                        challenges_count += ele.count
                                                                                        challenged_count += drop.count;
                                                                                        is_ele = true;

                                                                                        if (drop.users.length > 0) {
                                                                                            var users = drop.users
                                                                                            users.forEach(function(dog) {

                                                                                                if (typeof dog.user_feed.iv_acountid === 'undefined' || dog.user_feed.feed_expiry_status === 1) {
                                                                                                    challenged_count = challenged_count - 1
                                                                                                }
                                                                                            })
                                                                                        }

                                                                                        if (ele.users.length > 0) {
                                                                                            var users = ele.users
                                                                                            users.forEach(function(dog) {

                                                                                                if (typeof dog.user_feed.iv_acountid === 'undefined' || dog.user_feed.feed_expiry_status === 1) {
                                                                                                    challenges_count = challenges_count - 1
                                                                                                }
                                                                                            })
                                                                                        }

                                                                                        test.push({
                                                                                            "feed": drop._id,
                                                                                            "challenges": challenges_count,
                                                                                            "throws": challenged_count
                                                                                        })
                                                                                    } else {
                                                                                        var challenges_count = 0;
                                                                                        var challenged_count = 0;
                                                                                        challenges_count += ele.count
                                                                                        challenged_count += drop.count;
                                                                                        if (drop.users.length > 0) {
                                                                                            var users = drop.users
                                                                                            users.forEach(function(dog) {

                                                                                                if (typeof dog.user_feed.iv_acountid === 'undefined' || dog.user_feed.feed_expiry_status === 1) {
                                                                                                    challenged_count = challenged_count - 1
                                                                                                }
                                                                                            })
                                                                                        }

                                                                                        test.push({
                                                                                            "feed": drop._id,
                                                                                            "challenges": 0,
                                                                                            "throws": challenged_count
                                                                                        })
                                                                                    }
                                                                                }
                                                                            })
                                                                            if (is_ele != true) {
                                                                                console.log("in ele")
                                                                                var challenges_count = 0;
                                                                                var challenged_count = 0;
                                                                                challenges_count += ele.count;
                                                                                if (ele.users.length > 0) {
                                                                                    var users = ele.users
                                                                                    users.forEach(function(dog) {

                                                                                        if (typeof dog.user_feed.iv_acountid === 'undefined' || dog.user_feed.feed_expiry_status === 1) {
                                                                                            challenges_count = challenges_count - 1
                                                                                        }
                                                                                    })
                                                                                }
                                                                                test.push({
                                                                                    "feed": ele._id,
                                                                                    "challenges": challenges_count,
                                                                                    "throws": 0
                                                                                })
                                                                            }
                                                                        }
                                                                    })

                                                                    data.forEach(function(ele) {
                                                                        if (ele._id != null || ele.feed_expiry_status === 0) {
                                                                            test.forEach(function(drops) {
                                                                                if (String(ele._id) === String(drops.feed)) {
                                                                                    data_ele = true;
                                                                                }
                                                                            })
                                                                            console.log(data_ele)
                                                                            if (data_ele != true) {
                                                                                var challenges_count = 0;
                                                                                var challenged_count = 0;
                                                                                challenges_count += ele.count;
                                                                                if (ele.users.length > 0) {
                                                                                    var users = ele.users
                                                                                    users.forEach(function(dog) {
                                                                                        if (typeof dog.user_feed.iv_acountid === 'undefined' || dog.user_feed.feed_expiry_status === 1) {
                                                                                            console.log("in")
                                                                                            challenges_count = challenges_count - 1
                                                                                        }
                                                                                    })
                                                                                }
                                                                                test.push({
                                                                                    "feed": ele._id,
                                                                                    "challenges": 0,
                                                                                    "throws": challenges_count
                                                                                })
                                                                            }
                                                                        }
                                                                    })

                                                                } else if (docs.length < 1 && data.length > 0) {
                                                                    data.forEach(function(fox) {
                                                                        if (fox._id != null || fox.feed_expiry_status === 0) {
                                                                            var challenges_count = 0;
                                                                            var challenged_count = 0;
                                                                            challenged_count += fox.count;
                                                                            if (fox.users.length > 0) {
                                                                                var users = fox.users
                                                                                users.forEach(function(dog) {
                                                                                    if (typeof dog.user_feed.iv_acountid === 'undefined' || dog.user_feed.feed_expiry_status === 1) {
                                                                                        challenged_count = challenged_count - 1
                                                                                    }
                                                                                })
                                                                            }
                                                                            test.push({
                                                                                "feed": fox._id,
                                                                                "challenges": 0,
                                                                                "throws": challenged_count
                                                                            })

                                                                        }
                                                                    })
                                                                } else if (docs.length > 0 && data.length < 1) {
                                                                    docs.forEach(function(foxe) {
                                                                        if (foxe._id != null || foxe.feed_expiry_status === 0) {
                                                                            var challenges_count = 0;
                                                                            var challenged_count = 0;
                                                                            challenges_count += foxe.count;
                                                                            if (foxe.users.length > 0) {
                                                                                var users = foxe.users
                                                                                users.forEach(function(dog) {
                                                                                    if (typeof dog.user_feed.iv_acountid === 'undefined' || dog.user_feed.feed_expiry_status === 1) {
                                                                                        challenges_count = challenges_count - 1
                                                                                    }
                                                                                })
                                                                            }
                                                                            test.push({
                                                                                "feed": foxe._id,
                                                                                "challenges": challenges_count,
                                                                                "throws": 0
                                                                            })
                                                                        }
                                                                    })
                                                                } else {
                                                                    test = [];
                                                                }

                                                                test.map(doc => {
                                                                    if (doc.challenges != 0 || doc.throws != 0) {

                                                                        var availability = 3;
                                                                        if (hist[0].challenges_history.length > 0) {
                                                                            var history = hist[0].challenges_history
                                                                            var history_length = 0;
                                                                            history.every(function(elex) {
                                                                                if (history_length < 3) {
                                                                                    var date = new Date()
                                                                                    var dates1 = date.setTime(date.getTime());
                                                                                    var dateNow1 = new Date(dates1).toISOString();
                                                                                    var current_day = String(dateNow1).split('T')
                                                                                    var hists = (elex.challenge_completed_at).toISOString();
                                                                                    var history_date = String(hists).split('T')
                                                                                    if (String(elex.my_feed_id) === String(doc.feed._id) && current_day[0] === history_date[0]) {
                                                                                        history_length += 1;
                                                                                        availability -= 1
                                                                                    }
                                                                                    return true
                                                                                } else {
                                                                                    availability = 3;
                                                                                    return false
                                                                                }
                                                                            })
                                                                        } else {
                                                                            availability = 3;
                                                                        }

                                                                        var date = new Date()
                                                                        var date1 = date.setTime(date.getTime());
                                                                        var dateNow = new Date(date1).toISOString();
                                                                        var t = Date.parse(doc.feed.feeds_expiry_time_) - Date.parse(dateNow);
                                                                        var seconds1 = Math.floor((t / 1000) % 60);
                                                                        var minutes1 = Math.floor((t / 1000 / 60) % 60);
                                                                        var hours1 = Math.floor((t / (1000 * 60 * 60)) % 24);
                                                                        var days1 = Math.floor(t / (1000 * 60 * 60 * 24));

                                                                        if (seconds1 < 0) {
                                                                            seconds1 = '00';
                                                                        }
                                                                        if (minutes1 < 0) {
                                                                            minutes1 = '00';
                                                                        }
                                                                        if (hours1 < 0) {
                                                                            hours1 = '00';
                                                                        }
                                                                        if (days1 < 0) {
                                                                            days1 = '00';
                                                                        }

                                                                        var calculatetime = hours1 + ':' + minutes1 + ':' + seconds1;
                                                                        var duration = Date.parse(doc.feed.feeds_expiry_time_);

                                                                        var is_liked = false;
                                                                        var testlike = doc.feed.likes;
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

                                                                        is_time_extendable = false;

                                                                        if (doc.feed_expiry_status == 0) {
                                                                            is_time_extendable = true
                                                                        }
                                                                        var profile = doc.feed.iv_acountid.profileimage
                                                                        if (profile === null) {
                                                                            profile = 'uploads/userimage.png'
                                                                        }
                                                                        var hashtags = doc.feed.feeds_hash_tags
                                                                        var hashs = [];
                                                                        if (hashtags.length > 0) {
                                                                            hashtags.forEach(function(ele) {
                                                                                var tag = "#" + ele
                                                                                hashs.push(tag)
                                                                            })
                                                                        }

                                                                        var no_likes = doc.feed.no_likes
                                                                        if (no_likes <= 0) {
                                                                            no_likes = 0
                                                                        } else {
                                                                            no_likes = doc.feed.no_likes
                                                                        }

                                                                        var video_dur = doc.feed.video_duration
                                                                        var video_duration = ""
                                                                        var video = video_dur * 1000

                                                                        var minutes = Math.floor(video / 60000);
                                                                        var seconds = ((video % 60000) / 1000).toFixed(0);
                                                                        minutes = minutes.toString()
                                                                        seconds = seconds.toString()
                                                                        var video_duration = minutes + ":" + seconds

                                                                        if (minutes.length === 1 && seconds.length === 1) {
                                                                            video_duration = "0" + minutes + ":" + "0" + seconds

                                                                        } else if (minutes.length === 1) {
                                                                            if (seconds === '60') {
                                                                                video_duration = "01:00"
                                                                            } else {
                                                                                video_duration = "0" + minutes + ":" + seconds
                                                                            }
                                                                            if (seconds.length === 1) {
                                                                                video_duration = "0" + minutes + ":" + "0" + seconds
                                                                            }
                                                                        } else {
                                                                            if (seconds.length === 1) {
                                                                                video_duration = minutes + ":" + "0" + seconds
                                                                            }
                                                                            if (minutes.length === 1) {
                                                                                video_duration = "0" + minutes + ":" + "0" + seconds
                                                                            }
                                                                        }
                                                                        console.log(video_duration)

                                                                        var foe = {

                                                                            "no_throws": doc.throws,
                                                                            "no_challenges": doc.challenges,
                                                                            "availability": availability,
                                                                            "feed_id": doc.feed._id,
                                                                            "feed_desc": doc.feed.feed_desc,
                                                                            "feeds_tags": hashs,
                                                                            "feed_type": doc.feed.feed_type,
                                                                            "userid": doc.feed.iv_acountid._id,
                                                                            "username": doc.feed.iv_acountid.username,
                                                                            "expiry_time": duration,
                                                                            "rating": parseInt(doc.feed.feed_rating),
                                                                            "no_shares": doc.feed.no_shares,
                                                                            "no_likes": no_likes,
                                                                            "no_comments": doc.feed.no_comments,
                                                                            "no_activities": doc.feed.activity_count,
                                                                            "privacy_mode": doc.feed.privacy_mode,
                                                                            "is_liked": is_liked,
                                                                            "no_views": doc.feed.no_views,
                                                                            "profile_url": constants.APIBASEURL + profile,
                                                                            "can_show_ad": false,
                                                                            "allow_comments": false,
                                                                            "preview_url": constants.APIBASEURL + doc.feed.preview_url,
                                                                            "has_sensitive_content": false,
                                                                            "is_under_challenge": doc.feed.is_under_challenge,
                                                                            "is_challengeable": true,
                                                                            "is_time_extendable": is_time_extendable,
                                                                            "video_duration": video_duration,
                                                                            "challenge_details": {
                                                                                "member_id": "",
                                                                                "member_user_name": "",
                                                                                "member_url": "",
                                                                                "member_feed_id": "",
                                                                                "challenge_desc": "",
                                                                                "challenge_number": '0'
                                                                            },
                                                                            "is_self_feed": true,
                                                                            "ad_details": {
                                                                                "ad_type": "",
                                                                                "ad_files": []
                                                                            },
                                                                            "comment_privacy": 0,
                                                                            "repost_details": {
                                                                                "original_userid": "",
                                                                                "original_feed_id": "",
                                                                                "original_user_img_url": "",
                                                                            }
                                                                        }
                                                                        testapi.push(foe)
                                                                    }
                                                                })


                                                                var totalPages = 1;
                                                                const totalOffers = testapi.length;
                                                                if (testapi.length > perPage) {
                                                                    totalPages = Math.ceil((testapi.length) / perPage);
                                                                    testapi = testapi.slice(skip, limit);
                                                                } else {
                                                                    page = 1;
                                                                    totalPages = 1;
                                                                }

                                                                res.status(200).json({
                                                                    status: 'Ok',
                                                                    message: 'List of Invites',
                                                                    total_pages: totalPages,
                                                                    current_page: page,
                                                                    total_feeds: totalOffers,
                                                                    feeds: testapi
                                                                });
                                                            }).catch(err => {
                                                                var spliterror = err.message.split(":")
                                                                res.status(500).json({
                                                                    status: 'Failed',
                                                                    message: spliterror[0]
                                                                });
                                                            });
                                                    }
                                                })
                                            }
                                        })
                                    }
                                })
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


router.post("/reject_challenge", (req, res, next) => {

    var keyArray = ["userid", "iv_token", "clientid", "feed_id", "member_feed_id", "member_id"];
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
                        challenges.find({
                                userid: req.body.userid,
                                'challenges.my_feed_id': ObjectId(req.body.feed_id),
                                'challenges.challenge_feed_id': ObjectId(req.body.member_feed_id)
                            }, { 'challenges.$': 1 })
                            .exec()
                            .then(data => {
                                if (data.length > 0) {

                                    var challenges_db = data[0].challenges

                                    var challenge_number = challenges_db[0].challenge_number

                                    challenges.findOneAndUpdate({ userid: req.body.userid, 'challenges.challenge_number': parseInt(challenge_number) }, {
                                            $pull: { challenges: { challenge_number: parseInt(challenge_number) } },
                                            $push: {
                                                expired_challenges: {
                                                    my_feed_id: challenges_db[0].my_feed_id,
                                                    my_userid: challenges_db[0].my_userid,
                                                    challenge_userid: challenges_db[0].challenge_userid,
                                                    challenge_feed_id: challenges_db[0].challenge_feed_id,
                                                    amount: challenges_db[0].amount,
                                                    challenge_number: challenges_db[0].challenge_number,
                                                    created_at: Date.now()
                                                }
                                            }
                                        })
                                        .exec()
                                        .then(data => {

                                            if (data === null) {
                                                res.status(200).json({
                                                    status: 'Failed',
                                                    message: 'Challenge expired.'
                                                });
                                            } else {
                                                challenges.findOneAndUpdate({ userid: req.body.member_id, 'challenged.challenge_number': parseInt(challenge_number) }, {
                                                        $pull: { challenged: { challenge_number: parseInt(challenge_number) } },
                                                        $push: {
                                                            expired_challenges: {
                                                                my_feed_id: challenges_db[0].challenge_feed_id,
                                                                my_userid: challenges_db[0].challenge_userid,
                                                                challenge_userid: challenges_db[0].my_userid,
                                                                challenge_feed_id: challenges_db[0].my_feed_id,
                                                                amount: challenges_db[0].amount,
                                                                challenge_number: challenges_db[0].challenge_number,
                                                                created_at: Date.now()
                                                            }
                                                        }
                                                    })
                                                    .exec()
                                                    .then(docs => {
                                                        if (docs === null) {
                                                            res.status(200).json({
                                                                status: 'Failed',
                                                                message: 'Challenge expired.'
                                                            });
                                                        } else {
                                                            var found = ''
                                                            var amount = 0
                                                            if (docs.challenged.length > 0) {
                                                                var challenged = docs.challenged
                                                                found = challenged.find(o => String(o.my_feed_id) === String(req.body.member_feed_id) &&
                                                                    String(o.challenge_feed_id) === String(req.body.feed_id))

                                                                if (typeof found === 'undefined') {
                                                                    amount = 0
                                                                } else {
                                                                    amount = found.amount
                                                                }
                                                            }
                                                            console.log(amount)
                                                            userDetails.findOneAndUpdate({ userid: ObjectId(req.body.member_id) }, { $inc: { talent_points: amount } })
                                                                .exec()
                                                                .then(dex => {

                                                                    userDetails.find({ userid: { $in: [ObjectId(req.body.member_id), ObjectId(req.body.userid)] } })
                                                                        .populate('userid')
                                                                        .exec()
                                                                        .then(foe => {
                                                                            var profileimage = ""
                                                                            var username = ""
                                                                            var member_profile = ""
                                                                            var member_name = ""
                                                                            var msgbody = ""

                                                                            if (String(foe[0].userid._id) === String(ObjectId(req.body.userid))) {
                                                                                username = foe[0].userid.username
                                                                                profileimage = foe[0].userid.profileimage;
                                                                                if (foe[0].userid.profileimage === null) {
                                                                                    profileimage = constants.APIBASEURL + "uploads/userimage.png"
                                                                                }
                                                                                member_name = foe[1].userid.username
                                                                                member_profile = foe[1].userid.profileimage;
                                                                                if (foe[1].userid.profileimage === null) {
                                                                                    member_profile = constants.APIBASEURL + "uploads/userimage.png"
                                                                                }
                                                                                msgbody = username + " Rejected your challenge."
                                                                            } else {
                                                                                username = foe[1].userid.username
                                                                                profileimage = foe[1].userid.profileimage;
                                                                                if (foe[1].userid.profileimage === null) {
                                                                                    profileimage = constants.APIBASEURL + "uploads/userimage.png"
                                                                                }
                                                                                member_name = foe[0].userid.username
                                                                                member_profile = foe[0].userid.profileimage;
                                                                                if (foe[0].userid.profileimage === null) {
                                                                                    member_profile = constants.APIBASEURL + "uploads/userimage.png"
                                                                                }
                                                                                msgbody = username + " Rejected your challenge."
                                                                            }

                                                                            var day = new Date()
                                                                            day = day.toISOString()
                                                                            day = String(day).split("T")
                                                                            day = day[0].replace(/-/g, "")
                                                                            var mode = "talent"
                                                                            const transaction_id = day + Math.floor(10000000000 + Math.random() * 90000000000);
                                                                            userTransactions.findOneAndUpdate({ userid: ObjectId(req.body.member_id) }, {
                                                                                $push: {
                                                                                    transactions: {
                                                                                        date_of_transaction: Date.now(),
                                                                                        amount: amount,
                                                                                        mode: mode,
                                                                                        transaction_type: "credit",
                                                                                        action: "reject_challenge",
                                                                                        message: "You have got talent points as " + username + " rejected your challenge",
                                                                                        transaction_id: transaction_id
                                                                                    }
                                                                                }
                                                                            }, { upsert: true }).exec()



                                                                            const note_no = Math.floor(10000000000 + Math.random() * 90000000000);
                                                                            notificationModel.findOneAndUpdate({ userid: ObjectId(req.body.member_id) }, {
                                                                                    $push: {
                                                                                        notifications: {
                                                                                            notification_data: msgbody,
                                                                                            member_id: req.body.userid,
                                                                                            notification_type: 'challenge_reject',
                                                                                            notification_number: note_no,
                                                                                            item_id: "",
                                                                                            'additional_details.member_id': req.body.userid,
                                                                                            'additional_details.feed_id': req.body.member_feed_id,
                                                                                            'additional_details.member_feed_id': req.body.feed_id,
                                                                                            'additional_details.userid': req.body.member_id,

                                                                                            username: username,
                                                                                            profileimage: ObjectId(req.body.userid),
                                                                                            member_name: member_name,
                                                                                            member_profile: ObjectId(req.body.member_id),
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

                                                                                        notificationModel.update({
                                                                                                $and: [{ "notifications.notification_type": 'challenge_create' }, { userid: { $in: [ObjectId(req.body.userid)] } },
                                                                                                    { "notifications.item_id": String(challenge_number) }
                                                                                                ]
                                                                                            }, { "$set": { "notifications.$[elem].is_action_done": true } }, {
                                                                                                "arrayFilters": [{ $and: [{ "elem.notification_type": 'challenge_create' }, { 'elem.item_id': String(challenge_number) }] }],
                                                                                                "multi": true
                                                                                            })
                                                                                            .exec()
                                                                                            .then(notify => {
                                                                                                if (notify === null) {
                                                                                                    return res.status(200).json({
                                                                                                        status: "Failed",
                                                                                                        message: "Please provide correct userid."
                                                                                                    });
                                                                                                } else {

                                                                                                    fcmModel.find({ userid: req.body.member_id })
                                                                                                        .exec()
                                                                                                        .then(user => {
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
                                                                                                                        notification_slug: 'challenge_reject',
                                                                                                                        url: constants.APIBASEURL + profileimage,
                                                                                                                        username: username,
                                                                                                                        item_id: "",
                                                                                                                        userid: req.body.member_id,
                                                                                                                        feed_id: req.body.member_feed_id,
                                                                                                                        member_feed_id: req.body.feed_id,
                                                                                                                        member_id: req.body.userid,
                                                                                                                        member_name: member_name,
                                                                                                                        member_url: constants.APIBASEURL + member_profile,
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

                                                                                                                fcm.send(message, function(err, response) {

                                                                                                                });
                                                                                                                res.status(200).json({
                                                                                                                    status: 'Ok',
                                                                                                                    message: "Rejected challenge successfully."
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
                                                                                    }
                                                                                }).catch(err => {
                                                                                    var spliterror = err.message.split(":")
                                                                                    res.status(500).json({
                                                                                        status: 'Failed',
                                                                                        message: spliterror[0]
                                                                                    });
                                                                                });
                                                                        }).catch(err => {
                                                                            var spliterror = err.message.split("_")
                                                                            if (spliterror[1].indexOf("member_id") >= 0) {
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
                                                                    if (spliterror[1].indexOf("feed") >= 0) {
                                                                        res.status(200).json({
                                                                            status: 'Failed',
                                                                            message: "Please provide correct feed_id and member_feed_id"
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
                                                        if (spliterror[1].indexOf("feed") >= 0) {
                                                            res.status(200).json({
                                                                status: 'Failed',
                                                                message: "Please provide correct feed_id and member_feed_id"
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
                                            if (spliterror[1].indexOf("feed") >= 0) {
                                                res.status(200).json({
                                                    status: 'Failed',
                                                    message: "Please provide correct feed_id and member_feed_id"
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
                                        message: "You may have rejected this challenge already or may be a challenge is running on it."
                                    });
                                }
                            }).catch(err => {
                                var spliterror = err.message.split("_")
                                if (spliterror[1].indexOf("feed") >= 0) {
                                    res.status(200).json({
                                        status: 'Failed',
                                        message: "Please provide correct feed_id and member_feed_id"
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


router.post("/drop_challenge", (req, res, next) => {

    var keyArray = ["userid", "iv_token", "clientid", "challenge_number"];
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
                        challenges.find({ userid: req.body.userid, 'on_going_challenges.challenge_number': parseInt(req.body.challenge_number) }, { 'on_going_challenges.$': 1 })
                            .populate({ path: 'on_going_challenges.my_feed_id on_going_challenges.challenge_feed_id on_going_challenges.challenge_userid on_going_challenges.my_userid', populate: { path: 'userid' } })
                            .exec()
                            .then(foe => {
                                if (foe.length < 1) {
                                    return res.status(200).json({
                                        status: "Failed",
                                        message: "This challenge has already been completed"
                                    });
                                } else {
                                    if (foe[0].on_going_challenges.length < 1) {
                                        return res.status(200).json({
                                            status: "Failed",
                                            message: "Please provide correct challenge_number."
                                        });
                                    } else {

                                        var going = foe[0].on_going_challenges;
                                        var user_views = going[0].user_views;
                                        var member_views = going[0].member_views;

                                        var winner = ""
                                        winner = going[0].my_userid.userid.username + " dropped from the challenge making you the winner."
                                        var lost = going[0].my_userid.userid.username
                                        var profileimage = going[0].challenge_userid.userid.profileimage;
                                        var username = going[0].challenge_userid.userid.username;
                                        if (going[0].challenge_userid.userid.profileimage === null) {
                                            profileimage = constants.APIBASEURL + "uploads/userimage.png"
                                        }
                                        var member_profile = going[0].my_userid.userid.profileimage;
                                        var member_name = going[0].my_userid.userid.username;
                                        var member_user = going[0].my_userid.userid._id
                                        if (going[0].my_userid.userid.profileimage === null) {
                                            member_profile = constants.APIBASEURL + "uploads/userimage.png"
                                        }

                                        userDetails.findOneAndUpdate({ userid: ObjectId(going[0].challenge_userid.userid._id) }, { $inc: { talent_points: going[0].amount + going[0].amount } })
                                            .exec()
                                            .then(datas => {
                                                if (datas === null) {
                                                    return res.status(200).json({
                                                        status: "Failed",
                                                        message: "Please provide correct member_id."
                                                    });
                                                } else {

                                                    var query = "";
                                                    var condition = "";
                                                    var remaining_points = 0;

                                                    challenges.findOneAndUpdate({ userid: req.body.userid }, {
                                                            $pull: { on_going_challenges: { challenge_number: going[0].challenge_number } },
                                                            $push: {
                                                                challenges_history: {
                                                                    my_feed_id: going[0].my_feed_id._id,
                                                                    my_userid: going[0].my_userid._id,
                                                                    challenge_userid: going[0].challenge_userid._id,
                                                                    challenge_feed_id: going[0].challenge_feed_id._id,
                                                                    challenge_completed_at: Date.now(),
                                                                    amount: going[0].amount,
                                                                    winner: winner,
                                                                    user_views: user_views,
                                                                    member_views: member_views,
                                                                    challenge_number: going[0].challenge_number,
                                                                    created_at: Date.now(),
                                                                    won_amount: 0

                                                                }
                                                            }
                                                        })
                                                        .exec()
                                                        .then(docse => {
                                                            challenges.findOneAndUpdate({ userid: going[0].challenge_userid.userid._id }, {
                                                                    $pull: { on_going_challenges: { challenge_number: going[0].challenge_number } },
                                                                    $push: {
                                                                        challenges_history: {
                                                                            my_feed_id: going[0].challenge_feed_id._id,
                                                                            my_userid: going[0].challenge_userid._id,
                                                                            challenge_userid: going[0].my_userid._id,
                                                                            challenge_feed_id: going[0].my_feed_id._id,
                                                                            challenge_completed_at: Date.now(),
                                                                            amount: going[0].amount,
                                                                            winner: winner,
                                                                            user_views: member_views,
                                                                            member_views: user_views,
                                                                            challenge_number: going[0].challenge_number,
                                                                            created_at: Date.now(),
                                                                            won_amount: going[0].amount + going[0].amount
                                                                        }
                                                                    }
                                                                })
                                                                .exec()
                                                                .then(docses => {
                                                                    iv_feeds.updateMany({ _id: { $in: [ObjectId(going[0].my_feed_id._id), ObjectId(going[0].challenge_feed_id._id)] } }, { $set: { is_under_challenge: false, challenge_number: 0 } })
                                                                        .exec()
                                                                        .then(fixs => {

                                                                            var day = new Date()
                                                                            day = day.toISOString()
                                                                            day = String(day).split("T")
                                                                            day = day[0].replace(/-/g, "")
                                                                            var mode = "talent"
                                                                            const transaction_id = day + Math.floor(10000000000 + Math.random() * 90000000000);
                                                                            userTransactions.findOneAndUpdate({ userid: ObjectId(going[0].challenge_userid.userid._id) }, {
                                                                                $push: {
                                                                                    transactions: {
                                                                                        date_of_transaction: Date.now(),
                                                                                        amount: going[0].amount + going[0].amount,
                                                                                        mode: mode,
                                                                                        transaction_type: "credit",
                                                                                        action: "drop_challenge",
                                                                                        message: "You have got talent points as " + member_name + " dropped from the challenge",
                                                                                        transaction_id: transaction_id
                                                                                    }
                                                                                }
                                                                            }, { upsert: true }).exec()


                                                                            const note_no = Math.floor(10000000000 + Math.random() * 90000000000);
                                                                            var msgbody = lost + " dropped from the challenge making you the winner."
                                                                            notificationModel.findOneAndUpdate({ userid: ObjectId(going[0].challenge_userid.userid._id) }, {
                                                                                    $push: {
                                                                                        notifications: {
                                                                                            notification_data: msgbody,
                                                                                            member_id: req.body.userid,
                                                                                            notification_type: 'ChallengeDetails',
                                                                                            notification_number: note_no,
                                                                                            item_id: String(req.body.challenge_number),
                                                                                            username: username,
                                                                                            profileimage: ObjectId(req.body.userid),
                                                                                            member_name: member_name,
                                                                                            member_profile: ObjectId(member_user),
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
                                                                                        notificationModel.updateMany({
                                                                                                $and: [{ "notifications.notification_type": 'ChallengeDetails' }, { userid: { $in: [ObjectId(req.body.userid), ObjectId(going[0].challenge_userid.userid._id)] } },
                                                                                                    { "notifications.item_id": String(req.body.challenge_number) }
                                                                                                ]
                                                                                            }, { "$set": { "notifications.$[elem].is_action_done": true } }, {
                                                                                                "arrayFilters": [{ $and: [{ "elem.notification_type": 'ChallengeDetails' }, { 'elem.item_id': String(req.body.challenge_number) }] }],
                                                                                                "multi": true
                                                                                            })
                                                                                            .exec()
                                                                                            .then(notify => {
                                                                                                if (notify === null) {
                                                                                                    return res.status(200).json({
                                                                                                        status: "Failed",
                                                                                                        message: "Please provide correct member_id and userid."
                                                                                                    });
                                                                                                } else {

                                                                                                    fcmModel.find({ userid: going[0].challenge_userid.userid._id })
                                                                                                        .exec()
                                                                                                        .then(user => {
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
                                                                                                                        notification_slug: 'ChallengeDetails',
                                                                                                                        url: constants.APIBASEURL + profileimage,
                                                                                                                        username: username,
                                                                                                                        item_id: String(req.body.challenge_number),
                                                                                                                        member_name: member_name,
                                                                                                                        member_url: constants.APIBASEURL + member_profile,
                                                                                                                        userid: "",
                                                                                                                        feed_id: "",
                                                                                                                        member_feed_id: "",
                                                                                                                        member_id: "",
                                                                                                                        is_from_push: true,
                                                                                                                        is_action_done: true

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
                                                                                                                res.status(200).json({
                                                                                                                    status: 'Ok',
                                                                                                                    message: lost + " dropped from the challenge making " + winner + " winner."
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
                                                                        });

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


                                                }
                                            }).catch(err => {
                                                var spliterror = err.message.split(":")
                                                res.status(500).json({
                                                    status: 'Failed',
                                                    message: spliterror[0]
                                                });
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

router.post("/my_posts", (req, res, next) => {

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
                        var perPage = 20
                        var page = req.body.page_no

                        if (isEmpty(page)) {
                            page = 1
                        }
                        var skip = (perPage * page) - perPage;
                        var limit = skip + perPage;
                        var is_self = false;
                        var query = ""
                        var is_following = false;
                        var is_contact = false;
                        var query = ""
                        userDetails.find({ userid: ObjectId(user[0].userid) })
                            .exec()
                            .then(del => {
                                contactsModel.find({ userid: ObjectId(user[0].userid) })
                                    .exec()
                                    .then(contacts => {
                                        if (contacts[0].existing_contacts.length > 0) {
                                            var cons = contacts[0].existing_contacts
                                            cons.forEach(function(elex) {
                                                if (String(elex.contact) === String(req.body.userid)) {
                                                    is_contact = true
                                                }
                                            })
                                        }
                                        if (del.length > 0) {
                                            if (del[0].following.length > 0) {
                                                var following = del[0].following;
                                                following.every(function(ele) {
                                                    if (String(req.body.userid) === String(ele)) {
                                                        is_following = true;
                                                        return false
                                                    } else {
                                                        return true
                                                    }
                                                })
                                            }
                                        }

                                        if (String(req.body.userid) === String(user[0].userid) || is_contact === true) {
                                            query = { profile_url: ObjectId(req.body.userid), has_sensitive_content: false, feed_expiry_status: 0 }
                                        } else if (is_following = true) {
                                            query = { profile_url: ObjectId(req.body.userid), privacy_mode: 1, has_sensitive_content: false, feed_expiry_status: 0 }
                                        } else {
                                            query = { profile_url: ObjectId(req.body.userid), privacy_mode: 1, has_sensitive_content: false, feed_expiry_status: 0 }
                                        }

                                        iv_feeds.find(query)
                                            .populate({ path: 'profile_url iv_acountid old_feed_id', populate: { path: 'iv_acountid' } })
                                            .skip(skip)
                                            .limit(limit)
                                            .sort({ _id: -1 })
                                            .exec()
                                            .then(docs => {
                                                if (docs.length < 1) {
                                                    res.status(200).json({
                                                        status: 'Ok',
                                                        message: 'No feeds to display.',
                                                        feeds: []
                                                    });
                                                } else {
                                                    iv_feeds.find(query).count().exec(function(err, count) {
                                                        if (err) {
                                                            res.status(500).json({
                                                                status: 'Failed',
                                                                message: 'Please provide correct userid'
                                                            });
                                                        } else {
                                                            var test = [];
                                                            docs.map(doc => {
                                                                var is_repost = false


                                                                var is_challengable = false;
                                                                var is_time_extendable = false;
                                                                var dur = Math.round(doc.video_duration)
                                                                if (String(user[0].userid) != String(req.body.userid) && doc.feed_type == 'video' && doc.privacy_mode == 1 && doc.no_rating >= 0 && doc.no_views >= 0 && dur >= 60) {
                                                                    is_challengable = true
                                                                }

                                                                var date = new Date()
                                                                var date1 = date.setTime(date.getTime());
                                                                var dateNow = new Date(date1).toISOString();
                                                                var t = Date.parse(doc.feeds_expiry_time_) - Date.parse(dateNow);
                                                                var seconds1 = Math.floor((t / 1000) % 60);
                                                                var minutes1 = Math.floor((t / 1000 / 60) % 60);
                                                                var hours1 = Math.floor((t / (1000 * 60 * 60)) % 24);
                                                                var days1 = Math.floor(t / (1000 * 60 * 60 * 24));

                                                                if (seconds1 < 0) {
                                                                    seconds1 = '00';
                                                                }
                                                                if (minutes1 < 0) {
                                                                    minutes1 = '00';
                                                                }
                                                                if (hours1 < 0) {
                                                                    hours1 = '00';
                                                                }
                                                                if (days1 < 0) {
                                                                    days1 = '00';
                                                                }

                                                                var calculatetime = hours1 + ':' + minutes1 + ':' + seconds1;
                                                                var duration = Date.parse(doc.feeds_expiry_time_);

                                                                var profileimage_user = doc.profile_url.profileimage
                                                                if (profileimage_user === null) {
                                                                    profileimage_user = 'uploads/userimage.png'
                                                                }
                                                                if (doc.feed_expiry_status == 0) {
                                                                    is_time_extendable = true
                                                                }
                                                                var is_liked = false;
                                                                var testlike = doc.likes;
                                                                if (testlike.length < 1) {
                                                                    is_liked = false;
                                                                } else {
                                                                    testlike.every(function(newlike) {
                                                                        if (String(newlike) === String(user[0].userid)) {
                                                                            is_liked = true;
                                                                            return false
                                                                        } else {
                                                                            return true
                                                                        }
                                                                    })
                                                                }
                                                                var preview_url = constants.APIBASEURL + doc.preview_url
                                                                if (preview_url === null) {
                                                                    preview_url = constants.APIBASEURL + 'uploads/video.jpeg'
                                                                }
                                                                var hashtags = doc.feeds_hash_tags
                                                                var hashs = [];
                                                                if (hashtags.length > 0) {
                                                                    hashtags.forEach(function(ele) {
                                                                        var tag = "#" + ele
                                                                        hashs.push(tag)
                                                                    })
                                                                }

                                                                var video_streaming_url = "";
                                                                if (doc.feed_type === 'video') {
                                                                    if (!isEmpty(doc.feed_file_path) && doc.feed_file_path != null) {

                                                                        video_streaming_url = constants.APIBASEURL + doc.feed_file_path;
                                                                    } else {
                                                                        video_streaming_url = "";
                                                                    }
                                                                }
                                                                var images = [];
                                                                if (doc.feed_type === 'image') {

                                                                    if (!isEmpty(doc.feed_file_path) && doc.feed_file_path != null) {
                                                                        var string = doc.feed_file_path;
                                                                        var array = string.split(",");

                                                                        var files = [];
                                                                        if (array.indexOf(',') != -1) {
                                                                            for (i = 0; i < array.length; i++) {
                                                                                var filePath = constants.APIBASEURL + array[i];
                                                                                files.push(filePath)
                                                                            }
                                                                        } else {
                                                                            files.push(constants.APIBASEURL + doc.feed_file_path)
                                                                        }
                                                                        images = files;
                                                                        preview_url = images[0]
                                                                    } else {
                                                                        images = [];
                                                                        preview_url = constants.APIBASEURL + 'uploads/video.jpeg'
                                                                    }

                                                                }
                                                                var is_self_feed = false;
                                                                var can_show_ad = false
                                                                if (String(user[0].userid) === String(req.body.userid)) {
                                                                    console.log("owner id " + user[0].userid)
                                                                    console.log("user id " + req.body.userid)
                                                                    is_self_feed = true
                                                                    can_show_ad = false
                                                                }

                                                                if (doc.privacy_mode === 1 && is_self_feed === false && Math.round(doc.video_duration) >= 60) {
                                                                    can_show_ad = true;

                                                                    if (doc.is_under_challenge === true) {
                                                                        can_show_ad = true;
                                                                    }

                                                                }
                                                                var can_comment = false
                                                                if (doc.comments_privacy === 0) {
                                                                    can_comment = false
                                                                } else {
                                                                    can_comment = true
                                                                }

                                                                var no_likes = doc.no_likes

                                                                if (no_likes <= 0) {
                                                                    no_likes = 0
                                                                } else {
                                                                    no_likes = doc.no_likes
                                                                }

                                                                var video_dur = doc.video_duration
                                                                var video_duration = ""
                                                                var video = video_dur * 1000

                                                                var minutes = Math.floor(video / 60000);
                                                                var seconds = ((video % 60000) / 1000).toFixed(0);
                                                                minutes = minutes.toString()
                                                                seconds = seconds.toString()
                                                                var video_duration = minutes + ":" + seconds

                                                                if (minutes.length === 1 && seconds.length === 1) {
                                                                    video_duration = "0" + minutes + ":" + "0" + seconds

                                                                } else if (minutes.length === 1) {
                                                                    if (seconds === '60') {
                                                                        video_duration = "01:00"
                                                                    } else {
                                                                        video_duration = "0" + minutes + ":" + seconds
                                                                    }
                                                                    if (seconds.length === 1) {
                                                                        video_duration = "0" + minutes + ":" + "0" + seconds
                                                                    }
                                                                } else {
                                                                    if (seconds.length === 1) {
                                                                        video_duration = minutes + ":" + "0" + seconds
                                                                    }
                                                                    if (minutes.length === 1) {
                                                                        video_duration = "0" + minutes + ":" + "0" + seconds
                                                                    }
                                                                }
                                                                var repostDetails;
                                                                if (!isEmpty(doc.old_feed_id) && doc.old_feed_id != null) {

                                                                    if (!isEmpty(doc.old_feed_id[0].iv_acountid.profileimage) && doc.old_feed_id[0].iv_acountid.profileimage != null) {

                                                                        var profileimage = constants.APIBASEURL + doc.old_feed_id[0].iv_acountid.profileimage;
                                                                    } else {

                                                                        var profileimage = constants.APIBASEURL + 'uploads/userimage.png';
                                                                    }
                                                                    //console.log(docs[i].old_feed_id[0].iv_acountid);
                                                                    repostDetails = {
                                                                        "original_userid": doc.old_feed_id[0].iv_acountid._id,
                                                                        "original_feed_id": doc.old_feed_id[0]._id,
                                                                        "original_user_img_url": profileimage,
                                                                        "original_username": doc.old_feed_id[0].iv_acountid.username,
                                                                        "original_no_views": doc.old_feed_id[0].no_views
                                                                    }
                                                                } else {


                                                                    repostDetails = {

                                                                        "original_userid": "",
                                                                        "original_feed_id": "",
                                                                        "original_user_img_url": "",
                                                                        "original_username": "",
                                                                        "original_no_views": 0

                                                                    }
                                                                }
                                                                console.log("self feed " + is_self_feed)

                                                                feedinfo = {

                                                                    "feed_id": doc._id,
                                                                    "feed_desc": doc.feed_desc,
                                                                    "feeds_tags": hashs,
                                                                    "feed_type": doc.feed_type,
                                                                    "userid": doc.profile_url._id,
                                                                    "username": doc.profile_url.username,
                                                                    "expiry_time": duration,
                                                                    "rating": parseFloat(doc.feed_rating),
                                                                    "no_shares": doc.no_shares,
                                                                    "no_likes": no_likes,
                                                                    "no_comments": doc.no_comments,
                                                                    "is_liked": is_liked,
                                                                    "no_views": doc.no_views,
                                                                    "profile_url": constants.APIBASEURL + profileimage_user,
                                                                    "can_show_ad": can_show_ad,
                                                                    "allow_comments": can_comment,
                                                                    "privacy_mode": doc.privacy_mode,
                                                                    "preview_url": preview_url,
                                                                    "no_activities": doc.activity_count,
                                                                    "has_sensitive_content": false,
                                                                    "is_under_challenge": doc.is_under_challenge,
                                                                    "is_challengeable": is_challengable,
                                                                    "is_time_extendable": is_time_extendable,
                                                                    "video_streaming_url": video_streaming_url,
                                                                    "images": images,
                                                                    "video_duration": video_duration,
                                                                    "challenge_details": {
                                                                        "member_id": "",
                                                                        "member_user_name": "",
                                                                        "member_url": "",
                                                                        "member_feed_id": "",
                                                                        "challenge_desc": "",
                                                                        "challenge_number": String(doc.challenge_number),

                                                                    },
                                                                    "is_self_feed": is_self_feed,
                                                                    "ad_details": {
                                                                        "ad_type": "",
                                                                        "ad_files": []
                                                                    },
                                                                    "comment_privacy": doc.comments_privacy,
                                                                    "repost_details": repostDetails
                                                                }
                                                                test.push(feedinfo)


                                                            })
                                                            res.status(200).json({
                                                                status: 'Ok',
                                                                message: 'List of Feeds',
                                                                userid: req.body.userid,
                                                                total_pages: Math.ceil(count / perPage),
                                                                current_page: page,
                                                                total_feeds: count,
                                                                feeds: test
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


router.get("/challenge_cronjob_server", (req, res, next) => {

    challenges.find({}, { 'on_going_challenges': 1, userid: 1 })
        .exec()
        .then(docs => {
            docs.map(doc => {
                var userid = doc.userid
                if (doc.on_going_challenges.length > 0) {
                    var ongoing = doc.on_going_challenges
                    var new_going = []
                    ongoing.forEach(function(ele) {
                        var found = new_going.find(o => parseInt(o.challenge_number) === parseInt(ele.challenge_number))
                        if (typeof found === 'undefined') {
                            new_going.push(ele)
                        }
                    })
                    new_going.map(con => {
                        var date = new Date()
                        var date1 = date.setTime(date.getTime());
                        var dateNow = new Date(date1).toISOString();
                        var time = Date.parse(dateNow) - Date.parse(con.created_at);
                        var hours1 = Math.floor((time / (1000 * 60 * 60)) % 24);
                        var minutes = Math.floor((time / (1000 * 60)) % 60)
                        console.log(minutes)
                        if (hours1 >= 2 && minutes >= 1) {
                            var challenge = con.challenge_number
                            challenges.find({ userid: userid, 'on_going_challenges.challenge_number': challenge }, { 'on_going_challenges.$': 1 })
                                .populate({ path: 'on_going_challenges.challenge_userid on_going_challenges.my_userid on_going_challenges.my_feed_id on_going_challenges.challenge_feed_id', populate: { path: 'userid' } })
                                .exec()
                                .then(foe => {
                                    if (foe.length > 0) {

                                        var going = foe[0].on_going_challenges;
                                        var user_views = going[0].user_views;
                                        var member_views = going[0].member_views;
                                        var user_winner_query = ""
                                        var user_winner_condition = ""
                                        var winner = ""
                                        var winnermsg = ""
                                        var query = "";
                                        var condition = "";
                                        var remaining_points = 0;
                                        var loser_amount = 0;
                                        var member_name = ""
                                        var profileimage = ""
                                        var username = ""
                                        var user_amount = 0
                                        var member_amount = 0
                                        var loser_views_percent = 0;
                                        var in_draw = false
                                        var final_winner_type = ""

                                        if (user_views > member_views) {
                                            winner = going[0].my_userid.userid.username
                                            username = going[0].my_userid.userid.username
                                            member_name = going[0].challenge_userid.userid.username
                                            profileimage = going[0].my_userid.userid.profileimage
                                            if (profileimage === null) {
                                                profileimage = constants.APIBASEURL + "uploads/userimage.png"
                                            }
                                            winnermsg = going[0].my_userid.userid.username + " won the challenge with " + user_views + " views."

                                            user_winner_query = { userid: ObjectId(going[0].my_userid.userid._id) };
                                            user_winner_condition = { $inc: { talent_points: going[0].amount + going[0].amount } }
                                            loser_views_percent = Math.floor(going[0].amount * 4 / 5)

                                            //          if(member_views >= loser_views_percent){
                                            //              loser_amounts = Math.floor(going[0].amount*4/5)
                                            //              loser_amount = Math.floor(loser_amounts/2)
                                            //  query = {userid:ObjectId(going[0].challenge_userid.userid._id)}
                                            //  condition = {$inc:{talent_points:loser_amount}}
                                            // }



                                        } else if (user_views < member_views) {
                                            winner = going[0].challenge_userid.userid.username
                                            winnermsg = going[0].challenge_userid.userid.username + " won the challenge with " + member_views + " views."

                                            username = going[0].challenge_userid.userid.username
                                            member_name = going[0].my_userid.userid.username
                                            profileimage = going[0].challenge_userid.userid.profileimage
                                            if (profileimage === null) {
                                                profileimage = constants.APIBASEURL + "uploads/userimage.png"
                                            }
                                            loser_views_percent = Math.floor(going[0].amount * 4 / 5)
                                            //  user_winner_query = {userid:ObjectId(going[0].challenge_userid.userid._id)};
                                            //  user_winner_condition = {$inc:{talent_points:going[0].amount}}

                                            if (user_views >= loser_views_percent) {
                                                loser_amounts = Math.floor(going[0].amount) //*4/5 -- for now full amount
                                                loser_amount = Math.floor(loser_amounts)
                                                query = { userid: ObjectId(going[0].my_userid.userid._id) }
                                                condition = { $inc: { talent_points: loser_amount } }
                                            }


                                        } else {
                                            in_draw = true
                                            winnermsg = "Your challenge is a draw. Check out the points you got."
                                            query = { userid: { $in: [ObjectId(going[0].my_userid.userid._id)] } }
                                            condition = { $inc: { talent_points: going[0].amount } }
                                            member_name = going[0].challenge_userid.userid.username
                                        }



                                        if (String(winner) === String(going[0].my_userid.userid.username)) {
                                            user_amount = going[0].amount + going[0].amount
                                            member_amount = loser_amount
                                            final_winner_type = "user"
                                        } else if (String(winner) === String(going[0].challenge_userid.userid.username)) {
                                            member_amount = going[0].amount + going[0].amount
                                            user_amount = loser_amount
                                            final_winner_type = "member"
                                        } else {
                                            member_amount = going[0].amount
                                            user_amount = going[0].amount

                                        }

                                        if (query != "" && condition != "") {
                                            if (in_draw === true) {
                                                console.log("In draw")
                                                userDetails.updateMany(query, condition, { new: true })
                                                    .exec()
                                                    .then(doose => {
                                                        var days = new Date()
                                                        days = days.toISOString()
                                                        days = String(days).split("T")
                                                        days = days[0].replace(/-/g, "")
                                                        var modes = "talent"

                                                        const transaction_id1 = days + Math.floor(10000000000 + Math.random() * 90000000000);
                                                        userTransactions.findOneAndUpdate(query, {
                                                            $push: {
                                                                transactions: {
                                                                    date_of_transaction: Date.now(),
                                                                    amount: going[0].amount,
                                                                    mode: modes,
                                                                    transaction_type: "credit",
                                                                    action: "challenge_result",
                                                                    message: "You have got talent points as your challenge with " + member_name + " is a draw",
                                                                    transaction_id: transaction_id1
                                                                }
                                                            }
                                                        }, { upsert: true }).exec()

                                                    }).catch(err => {
                                                        var spliterror = err.message.split(":")
                                                        res.status(500).json({
                                                            status: 'Failed',
                                                            message: spliterror[0]
                                                        });
                                                    });
                                            } else {

                                                var transact_user = ""

                                                if (final_winner_type === "user") {
                                                    transact_user = member_name
                                                } else {
                                                    transact_user = username
                                                }

                                                userDetails.findOneAndUpdate(query, condition, { new: true })
                                                    .exec()
                                                    .then(doose => {
                                                        var days = new Date()
                                                        days = days.toISOString()
                                                        days = String(days).split("T")
                                                        days = days[0].replace(/-/g, "")
                                                        var modes = "talent"

                                                        const transaction_id1 = days + Math.floor(10000000000 + Math.random() * 90000000000);
                                                        userTransactions.findOneAndUpdate(query, {
                                                            $push: {
                                                                transactions: {
                                                                    date_of_transaction: Date.now(),
                                                                    amount: loser_amount,
                                                                    mode: modes,
                                                                    transaction_type: "credit",
                                                                    action: "challenge_result",
                                                                    message: "You have got talent points as appreciation token for your challenge with " + transact_user,
                                                                    transaction_id: transaction_id1
                                                                }
                                                            }
                                                        }, { upsert: true }).exec()
                                                    }).catch(err => {
                                                        var spliterror = err.message.split(":")
                                                        res.status(500).json({
                                                            status: 'Failed',
                                                            message: spliterror[0]
                                                        });
                                                    });
                                            }

                                        }

                                        userDetails.findOneAndUpdate(user_winner_query, user_winner_condition)
                                            .exec()
                                            .then(doos => {

                                                if (user_winner_query != "" && user_winner_condition != "") {
                                                    var transact_user = ""

                                                    if (final_winner_type === "user") {
                                                        transact_user = member_name
                                                    } else {
                                                        transact_user = username
                                                    }

                                                    var days1 = new Date()
                                                    days1 = days1.toISOString()
                                                    days1 = String(days1).split("T")
                                                    days1 = days1[0].replace(/-/g, "")
                                                    var modes1 = "talent"

                                                    const transaction_id1 = days1 + Math.floor(10000000000 + Math.random() * 90000000000);
                                                    userTransactions.findOneAndUpdate(user_winner_query, {
                                                        $push: {
                                                            transactions: {
                                                                date_of_transaction: Date.now(),
                                                                amount: going[0].amount + going[0].amount,
                                                                mode: modes1,
                                                                transaction_type: "credit",
                                                                action: "challenge_result",
                                                                message: "You have got talent points as you won the challenge with " + transact_user,
                                                                transaction_id: transaction_id1
                                                            }
                                                        }
                                                    }, { upsert: true }).exec()
                                                }
                                                challenges.findOneAndUpdate({ userid: going[0].my_userid.userid._id }, {
                                                        $pull: { on_going_challenges: { challenge_number: going[0].challenge_number } },
                                                        $push: {
                                                            challenges_history: {
                                                                my_feed_id: going[0].my_feed_id._id,
                                                                my_userid: going[0].my_userid._id,
                                                                challenge_userid: going[0].challenge_userid._id,
                                                                challenge_feed_id: going[0].challenge_feed_id._id,
                                                                challenge_completed_at: Date.now(),
                                                                amount: going[0].amount,
                                                                winner: winnermsg,
                                                                challenge_number: going[0].challenge_number,
                                                                user_views: user_views,
                                                                member_views: member_views,
                                                                won_amount: user_amount
                                                            }
                                                        }
                                                    })
                                                    .exec()
                                                    .then(docse => {

                                                        iv_feeds.findOneAndUpdate({ _id: { $in: [ObjectId(going[0].my_feed_id._id)] } }, { $set: { is_under_challenge: false, challenge_number: 0 } })
                                                            .exec()
                                                            .then(fixse => {

                                                                const note_nos = Math.floor(10000000000 + Math.random() * 90000000000);
                                                                notificationModel.findOneAndUpdate({ userid: { $in: [ObjectId(going[0].my_userid.userid._id)] } }, {
                                                                        $push: {
                                                                            notifications: {
                                                                                notification_data: winnermsg,
                                                                                notification_type: 'ChallengeDetails',
                                                                                notification_number: note_nos,
                                                                                item_id: String(going[0].challenge_number),
                                                                                username: username,
                                                                                profileimage: ObjectId(going[0].my_userid.userid._id),
                                                                                created_at: Date.now()
                                                                            }
                                                                        }
                                                                    })
                                                                    .exec()
                                                                    .then(dosys => {
                                                                        if (dosys === null) {
                                                                            return res.status(200).json({
                                                                                status: "Failed",
                                                                                message: "Please provide correct userid & member_id."
                                                                            });
                                                                        } else {
                                                                            notificationModel.update({
                                                                                    $and: [{ "notifications.notification_type": 'ChallengeDetails' }, { userid: { $in: [ObjectId(going[0].my_userid.userid._id)] } },
                                                                                        { "notifications.item_id": String(going[0].challenge_number) }
                                                                                    ]
                                                                                }, { "$set": { "notifications.$[elem].is_action_done": true } }, {
                                                                                    "arrayFilters": [{ $and: [{ "elem.notification_type": 'ChallengeDetails' }, { 'elem.item_id': String(going[0].challenge_number) }] }],
                                                                                    "multi": true
                                                                                })
                                                                                .exec()
                                                                                .then(notify => {

                                                                                    fcmModel.find({ userid: { $in: [going[0].my_userid.userid._id] } })
                                                                                        .select('fcmtoken')
                                                                                        .exec()
                                                                                        .then(user => {
                                                                                            if (user.length < 1) {
                                                                                                return res.status(200).json({
                                                                                                    status: "Failed",
                                                                                                    message: "Please provide correct userid."
                                                                                                });
                                                                                            } else {
                                                                                                var user_fcm = [];
                                                                                                user.forEach(function(ele) {
                                                                                                    user_fcm.push(ele.fcmtoken)
                                                                                                })
                                                                                                var serverKey = constants.FCMServerKey;
                                                                                                var fcm = new FCM(serverKey);

                                                                                                var message = {
                                                                                                    registration_ids: user_fcm,
                                                                                                    collapse_key: 'exit',

                                                                                                    notification: {
                                                                                                        title: 'FvmeGear',
                                                                                                        body: winnermsg,
                                                                                                    },
                                                                                                    data: {
                                                                                                        notification_id: note_nos,
                                                                                                        message: winnermsg,
                                                                                                        notification_slug: 'ChallengeDetails',
                                                                                                        url: constants.APIBASEURL + profileimage,
                                                                                                        username: username,
                                                                                                        item_id: String(going[0].challenge_number),
                                                                                                        userid: "",
                                                                                                        feed_id: "",
                                                                                                        member_feed_id: "",
                                                                                                        member_id: "",
                                                                                                        is_from_push: true,
                                                                                                        is_action_done: true
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
                                                                                                console.log("deleted challenge")
                                                                                            }
                                                                                        }).catch(err => {
                                                                                            console.log(err)
                                                                                            // var spliterror=err.message.split(":")
                                                                                            // res.status(500).json({ 
                                                                                            //     status: 'Failed',
                                                                                            //     message: spliterror[0]
                                                                                            // });
                                                                                        });
                                                                                }).catch(err => {
                                                                                    console.log(err)
                                                                                    // var spliterror=err.message.split(":")
                                                                                    // res.status(500).json({ 
                                                                                    //      status: 'Failed',
                                                                                    //     message: spliterror[0]
                                                                                    // });
                                                                                });
                                                                        }
                                                                    }).catch(err => {
                                                                        console.log(err)
                                                                        // var spliterror=err.message.split(":")
                                                                        // res.status(500).json({ 
                                                                        //      status: 'Failed',
                                                                        //     message: spliterror[0]
                                                                        // });
                                                                    });
                                                            }).catch(err => {
                                                                console.log(err)
                                                                // var spliterror=err.message.split(":")
                                                                //     res.status(500).json({ 
                                                                //       status: 'Failed',
                                                                //       message: spliterror[0]
                                                                // });
                                                            });

                                                    }).catch(err => {
                                                        console.log(err)
                                                        // var spliterror=err.message.split(":")
                                                        //     res.status(500).json({ 
                                                        //       status: 'Failed',
                                                        //       message: spliterror[0]
                                                        // });
                                                    });
                                            }).catch(err => {
                                                console.log(err)
                                                // var spliterror=err.message.split(":")
                                                //  res.status(500).json({ 
                                                //      status: 'Failed',
                                                //      message: spliterror[0]
                                                //  });
                                            });
                                    } else {

                                    }

                                }).catch(err => {
                                    var spliterror = err.message.split(":")
                                    res.status(500).json({
                                        status: 'Failed',
                                        message: spliterror[0]
                                    });
                                });
                        }
                    })
                } else {

                }
            })
            console.log('done')
        }).catch(err => {
            console.log(err)
        });
});

router.get("/challenge_expiry_cronjob_server", (req, res, next) => {

    challenges.find({ 'challenged': { $ne: [] } }, { 'challenged': 1, userid: 1 })
        .populate({ path: 'challenged.my_userid challenged.challenge_userid', populate: { path: 'userid' } })
        .exec()
        .then(docs => {

            if (docs.length > 0) {

                docs.map(doc => {
                    var userid = doc.userid
                    if (doc.challenged != 'undefined') {
                        if (doc.challenged.length > 0) {
                            var ongoing = doc.challenged
                            ongoing.map(con => {
                                var date = new Date()
                                var date1 = date.setTime(date.getTime());
                                var dateNow = new Date(date1).toISOString();
                                var time = Date.parse(dateNow) - Date.parse(con.created_at);
                                var hours1 = Math.floor((time / (1000 * 60 * 60)) % 24);
                                var minutes = Math.floor((time / (1000 * 60)) % 60)
                                var member_name = con.challenge_userid.userid.username
                                if (hours1 >= 3 && minutes >= 1) {

                                    challenges.findOneAndUpdate({
                                            $and: [{ userid: con.my_userid.userid._id },
                                                { 'challenged.challenge_number': con.challenge_number }
                                            ]
                                        }, {
                                            $pull: { challenged: { challenge_number: con.challenge_number } },
                                            $push: {
                                                expired_challenges: {
                                                    my_feed_id: con.my_feed_id,
                                                    my_userid: con.my_userid._id,
                                                    challenge_userid: con.challenge_userid._id,
                                                    challenge_feed_id: con.challenge_feed_id,
                                                    amount: con.amount,
                                                    challenge_number: con.challenge_number,
                                                    created_at: Date.now()
                                                }
                                            }
                                        })
                                        .exec()
                                        .then(data => {
                                            challenges.findOneAndUpdate({
                                                    $and: [{ userid: con.challenge_userid.userid._id },
                                                        { 'challenges.challenge_number': con.challenge_number }
                                                    ]
                                                }, {
                                                    $pull: { challenges: { challenge_number: con.challenge_number } },
                                                    $push: {
                                                        expired_challenges: {
                                                            my_feed_id: con.challenge_feed_id,
                                                            my_userid: con.challenge_userid._id,
                                                            challenge_userid: con.my_userid._id,
                                                            challenge_feed_id: con.my_feed_id,
                                                            amount: con.amount,
                                                            challenge_number: con.challenge_number,
                                                            created_at: Date.now()
                                                        }
                                                    }
                                                })
                                                .exec()
                                                .then(datas => {
                                                    userDetails.findOneAndUpdate({ userid: ObjectId(con.my_userid.userid._id) }, { $inc: { talent_points: con.amount } }, { new: true })
                                                        .exec()
                                                        .then(dess => {
                                                            var days1 = new Date()
                                                            days1 = days1.toISOString()
                                                            days1 = String(days1).split("T")
                                                            days1 = days1[0].replace(/-/g, "")
                                                            var modes1 = "talent"

                                                            const transaction_id1 = days1 + Math.floor(10000000000 + Math.random() * 90000000000);
                                                            userTransactions.findOneAndUpdate({ userid: ObjectId(con.my_userid.userid._id) }, {
                                                                $push: {
                                                                    transactions: {
                                                                        date_of_transaction: Date.now(),
                                                                        amount: con.amount,
                                                                        mode: modes1,
                                                                        transaction_type: "credit",
                                                                        action: "challenge_expiry",
                                                                        message: "You have got talent points as your challenge request to " + member_name + " has expired",
                                                                        transaction_id: transaction_id1
                                                                    }
                                                                }
                                                            }, { upsert: true }).exec()
                                                        }).catch(err => {
                                                            console.log(err)
                                                        });
                                                }).catch(err => {
                                                    console.log(err)
                                                });
                                        }).catch(err => {
                                            console.log(err)
                                        });
                                }
                            })
                        } else {

                        }
                    }
                })
            }
            console.log('challenge expiry done')
        }).catch(err => {
            console.log(err)
        });
});


router.get("/challenge_cronjob_testserver", (req, res, next) => {

    challenges.find({}, { 'on_going_challenges': 1, userid: 1 })
        .exec()
        .then(docs => {
            docs.map(doc => {
                var userid = doc.userid
                if (doc.on_going_challenges.length > 0) {
                    var ongoing = doc.on_going_challenges
                    var new_going = []
                    ongoing.forEach(function(ele) {
                        var found = new_going.find(o => parseInt(o.challenge_number) === parseInt(ele.challenge_number))
                        if (typeof found === 'undefined') {
                            new_going.push(ele)
                        }
                    })
                    new_going.map(con => {
                        var date = new Date()
                        var date1 = date.setTime(date.getTime());
                        var dateNow = new Date(date1).toISOString();
                        var time = Date.parse(dateNow) - Date.parse(con.created_at);
                        var hours1 = Math.floor((time / (1000 * 60 * 60)) % 24);
                        var minutes = Math.floor((time / (1000 * 60)) % 60)
                        console.log(minutes)
                        if (hours1 >= 2 && minutes >= 1) {
                            var challenge = con.challenge_number
                            challenges.find({ userid: userid, 'on_going_challenges.challenge_number': challenge }, { 'on_going_challenges.$': 1 })
                                .populate({ path: 'on_going_challenges.challenge_userid on_going_challenges.my_userid on_going_challenges.my_feed_id on_going_challenges.challenge_feed_id', populate: { path: 'userid' } })
                                .exec()
                                .then(foe => {
                                    if (foe.length > 0) {

                                        var going = foe[0].on_going_challenges;
                                        var user_views = going[0].user_views;
                                        var member_views = going[0].member_views;
                                        var user_winner_query = ""
                                        var user_winner_condition = ""
                                        var winner = ""
                                        var winnermsg = ""
                                        var query = "";
                                        var condition = "";
                                        var remaining_points = 0;
                                        var loser_amount = 0;
                                        var member_name = ""
                                        var profileimage = ""
                                        var username = ""
                                        var user_amount = 0
                                        var member_amount = 0
                                        var loser_views_percent = 0;
                                        var in_draw = false
                                        var final_winner_type = ""

                                        if (user_views > member_views) {
                                            winner = going[0].my_userid.userid.username
                                            username = going[0].my_userid.userid.username
                                            member_name = going[0].challenge_userid.userid.username
                                            profileimage = going[0].my_userid.userid.profileimage
                                            if (profileimage === null) {
                                                profileimage = constants.APIBASEURL + "uploads/userimage.png"
                                            }
                                            winnermsg = going[0].my_userid.userid.username + " won the challenge with " + user_views + " views."

                                            user_winner_query = { userid: ObjectId(going[0].my_userid.userid._id) };
                                            user_winner_condition = { $inc: { talent_points: going[0].amount + going[0].amount } }
                                            loser_views_percent = Math.floor(going[0].amount * 4 / 5)

                                            //          if(member_views >= loser_views_percent){
                                            //              loser_amounts = Math.floor(going[0].amount*4/5)
                                            //              loser_amount = Math.floor(loser_amounts/2)
                                            //  query = {userid:ObjectId(going[0].challenge_userid.userid._id)}
                                            //  condition = {$inc:{talent_points:loser_amount}}
                                            // }



                                        } else if (user_views < member_views) {
                                            winner = going[0].challenge_userid.userid.username
                                            winnermsg = going[0].challenge_userid.userid.username + " won the challenge with " + member_views + " views."

                                            username = going[0].challenge_userid.userid.username
                                            member_name = going[0].my_userid.userid.username
                                            profileimage = going[0].challenge_userid.userid.profileimage
                                            if (profileimage === null) {
                                                profileimage = constants.APIBASEURL + "uploads/userimage.png"
                                            }
                                            loser_views_percent = Math.floor(going[0].amount * 4 / 5)
                                            //  user_winner_query = {userid:ObjectId(going[0].challenge_userid.userid._id)};
                                            //  user_winner_condition = {$inc:{talent_points:going[0].amount}}

                                            if (user_views >= loser_views_percent) {
                                                loser_amounts = Math.floor(going[0].amount) //*4/5--for now giving full amount
                                                loser_amount = Math.floor(loser_amounts)
                                                query = { userid: ObjectId(going[0].my_userid.userid._id) }
                                                condition = { $inc: { talent_points: loser_amount } }
                                            }


                                        } else {
                                            in_draw = true
                                            winnermsg = "Your challenge is a draw. Check out the points you got."
                                            query = { userid: { $in: [ObjectId(going[0].my_userid.userid._id)] } }
                                            condition = { $inc: { talent_points: going[0].amount } }
                                            member_name = going[0].challenge_userid.userid.username
                                        }



                                        if (String(winner) === String(going[0].my_userid.userid.username)) {
                                            user_amount = going[0].amount + going[0].amount
                                            member_amount = loser_amount
                                            final_winner_type = "user"
                                        } else if (String(winner) === String(going[0].challenge_userid.userid.username)) {
                                            member_amount = going[0].amount + going[0].amount
                                            user_amount = loser_amount
                                            final_winner_type = "member"
                                        } else {
                                            member_amount = going[0].amount
                                            user_amount = going[0].amount

                                        }

                                        if (query != "" && condition != "") {
                                            if (in_draw === true) {
                                                console.log("In draw")
                                                userDetails.updateMany(query, condition, { new: true })
                                                    .exec()
                                                    .then(doose => {
                                                        var days = new Date()
                                                        days = days.toISOString()
                                                        days = String(days).split("T")
                                                        days = days[0].replace(/-/g, "")
                                                        var modes = "talent"

                                                        const transaction_id1 = days + Math.floor(10000000000 + Math.random() * 90000000000);
                                                        userTransactions.findOneAndUpdate(query, {
                                                            $push: {
                                                                transactions: {
                                                                    date_of_transaction: Date.now(),
                                                                    amount: going[0].amount,
                                                                    mode: modes,
                                                                    transaction_type: "credit",
                                                                    action: "challenge_result",
                                                                    message: "You have got talent points as your challenge with " + member_name + " is a draw",
                                                                    transaction_id: transaction_id1
                                                                }
                                                            }
                                                        }, { upsert: true }).exec()

                                                    }).catch(err => {
                                                        var spliterror = err.message.split(":")
                                                        res.status(500).json({
                                                            status: 'Failed',
                                                            message: spliterror[0]
                                                        });
                                                    });
                                            } else {

                                                var transact_user = ""

                                                if (final_winner_type === "user") {
                                                    transact_user = member_name
                                                } else {
                                                    transact_user = username
                                                }

                                                userDetails.findOneAndUpdate(query, condition, { new: true })
                                                    .exec()
                                                    .then(doose => {
                                                        var days = new Date()
                                                        days = days.toISOString()
                                                        days = String(days).split("T")
                                                        days = days[0].replace(/-/g, "")
                                                        var modes = "talent"

                                                        const transaction_id1 = days + Math.floor(10000000000 + Math.random() * 90000000000);
                                                        userTransactions.findOneAndUpdate(query, {
                                                            $push: {
                                                                transactions: {
                                                                    date_of_transaction: Date.now(),
                                                                    amount: loser_amount,
                                                                    mode: modes,
                                                                    transaction_type: "credit",
                                                                    action: "challenge_result",
                                                                    message: "You have got talent points as appreciation token for your challenge with " + transact_user,
                                                                    transaction_id: transaction_id1
                                                                }
                                                            }
                                                        }, { upsert: true }).exec()
                                                    }).catch(err => {
                                                        var spliterror = err.message.split(":")
                                                        res.status(500).json({
                                                            status: 'Failed',
                                                            message: spliterror[0]
                                                        });
                                                    });
                                            }

                                        }

                                        userDetails.findOneAndUpdate(user_winner_query, user_winner_condition)
                                            .exec()
                                            .then(doos => {

                                                if (user_winner_query != "" && user_winner_condition != "") {
                                                    var transact_user = ""

                                                    if (final_winner_type === "user") {
                                                        transact_user = member_name
                                                    } else {
                                                        transact_user = username
                                                    }

                                                    var days1 = new Date()
                                                    days1 = days1.toISOString()
                                                    days1 = String(days1).split("T")
                                                    days1 = days1[0].replace(/-/g, "")
                                                    var modes1 = "talent"

                                                    const transaction_id1 = days1 + Math.floor(10000000000 + Math.random() * 90000000000);
                                                    userTransactions.findOneAndUpdate(user_winner_query, {
                                                        $push: {
                                                            transactions: {
                                                                date_of_transaction: Date.now(),
                                                                amount: going[0].amount + going[0].amount,
                                                                mode: modes1,
                                                                transaction_type: "credit",
                                                                action: "challenge_result",
                                                                message: "You have got talent points as you won the challenge with " + transact_user,
                                                                transaction_id: transaction_id1
                                                            }
                                                        }
                                                    }, { upsert: true }).exec()
                                                }
                                                challenges.findOneAndUpdate({ userid: going[0].my_userid.userid._id }, {
                                                        $pull: { on_going_challenges: { challenge_number: going[0].challenge_number } },
                                                        $push: {
                                                            challenges_history: {
                                                                my_feed_id: going[0].my_feed_id._id,
                                                                my_userid: going[0].my_userid._id,
                                                                challenge_userid: going[0].challenge_userid._id,
                                                                challenge_feed_id: going[0].challenge_feed_id._id,
                                                                challenge_completed_at: Date.now(),
                                                                amount: going[0].amount,
                                                                winner: winnermsg,
                                                                challenge_number: going[0].challenge_number,
                                                                user_views: user_views,
                                                                member_views: member_views,
                                                                won_amount: user_amount
                                                            }
                                                        }
                                                    })
                                                    .exec()
                                                    .then(docse => {

                                                        iv_feeds.findOneAndUpdate({ _id: { $in: [ObjectId(going[0].my_feed_id._id)] } }, { $set: { is_under_challenge: false, challenge_number: 0 } })
                                                            .exec()
                                                            .then(fixse => {

                                                                const note_nos = Math.floor(10000000000 + Math.random() * 90000000000);
                                                                notificationModel.findOneAndUpdate({ userid: { $in: [ObjectId(going[0].my_userid.userid._id)] } }, {
                                                                        $push: {
                                                                            notifications: {
                                                                                notification_data: winnermsg,
                                                                                notification_type: 'ChallengeDetails',
                                                                                notification_number: note_nos,
                                                                                item_id: String(going[0].challenge_number),
                                                                                username: username,
                                                                                profileimage: ObjectId(going[0].my_userid.userid._id),
                                                                                created_at: Date.now()
                                                                            }
                                                                        }
                                                                    })
                                                                    .exec()
                                                                    .then(dosys => {
                                                                        if (dosys === null) {
                                                                            return res.status(200).json({
                                                                                status: "Failed",
                                                                                message: "Please provide correct userid & member_id."
                                                                            });
                                                                        } else {
                                                                            notificationModel.update({
                                                                                    $and: [{ "notifications.notification_type": 'ChallengeDetails' }, { userid: { $in: [ObjectId(going[0].my_userid.userid._id)] } },
                                                                                        { "notifications.item_id": String(going[0].challenge_number) }
                                                                                    ]
                                                                                }, { "$set": { "notifications.$[elem].is_action_done": true } }, {
                                                                                    "arrayFilters": [{ $and: [{ "elem.notification_type": 'ChallengeDetails' }, { 'elem.item_id': String(going[0].challenge_number) }] }],
                                                                                    "multi": true
                                                                                })
                                                                                .exec()
                                                                                .then(notify => {

                                                                                    fcmModel.find({ userid: { $in: [going[0].my_userid.userid._id] } })
                                                                                        .select('fcmtoken')
                                                                                        .exec()
                                                                                        .then(user => {
                                                                                            if (user.length < 1) {
                                                                                                return res.status(200).json({
                                                                                                    status: "Failed",
                                                                                                    message: "Please provide correct userid."
                                                                                                });
                                                                                            } else {
                                                                                                var user_fcm = [];
                                                                                                user.forEach(function(ele) {
                                                                                                    user_fcm.push(ele.fcmtoken)
                                                                                                })
                                                                                                var serverKey = constants.FCMServerKey;
                                                                                                var fcm = new FCM(serverKey);

                                                                                                var message = {
                                                                                                    registration_ids: user_fcm,
                                                                                                    collapse_key: 'exit',

                                                                                                    notification: {
                                                                                                        title: 'FvmeGear',
                                                                                                        body: winnermsg,
                                                                                                    },
                                                                                                    data: {
                                                                                                        notification_id: note_nos,
                                                                                                        message: winnermsg,
                                                                                                        notification_slug: 'ChallengeDetails',
                                                                                                        url: constants.APIBASEURL + profileimage,
                                                                                                        username: username,
                                                                                                        item_id: String(going[0].challenge_number),
                                                                                                        userid: "",
                                                                                                        feed_id: "",
                                                                                                        member_feed_id: "",
                                                                                                        member_id: "",
                                                                                                        is_from_push: true,
                                                                                                        is_action_done: true
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
                                                                                                console.log("deleted challenge")
                                                                                            }
                                                                                        }).catch(err => {
                                                                                            console.log(err)
                                                                                            // var spliterror=err.message.split(":")
                                                                                            // res.status(500).json({ 
                                                                                            //     status: 'Failed',
                                                                                            //     message: spliterror[0]
                                                                                            // });
                                                                                        });
                                                                                }).catch(err => {
                                                                                    console.log(err)
                                                                                    // var spliterror=err.message.split(":")
                                                                                    // res.status(500).json({ 
                                                                                    //      status: 'Failed',
                                                                                    //     message: spliterror[0]
                                                                                    // });
                                                                                });
                                                                        }
                                                                    }).catch(err => {
                                                                        console.log(err)
                                                                        // var spliterror=err.message.split(":")
                                                                        // res.status(500).json({ 
                                                                        //      status: 'Failed',
                                                                        //     message: spliterror[0]
                                                                        // });
                                                                    });
                                                            }).catch(err => {
                                                                console.log(err)
                                                                // var spliterror=err.message.split(":")
                                                                //     res.status(500).json({ 
                                                                //       status: 'Failed',
                                                                //       message: spliterror[0]
                                                                // });
                                                            });

                                                    }).catch(err => {
                                                        console.log(err)
                                                        // var spliterror=err.message.split(":")
                                                        //     res.status(500).json({ 
                                                        //       status: 'Failed',
                                                        //       message: spliterror[0]
                                                        // });
                                                    });
                                            }).catch(err => {
                                                console.log(err)
                                                // var spliterror=err.message.split(":")
                                                //  res.status(500).json({ 
                                                //      status: 'Failed',
                                                //      message: spliterror[0]
                                                //  });
                                            });
                                    } else {

                                    }

                                }).catch(err => {
                                    var spliterror = err.message.split(":")
                                    res.status(500).json({
                                        status: 'Failed',
                                        message: spliterror[0]
                                    });
                                });
                        }
                    })
                } else {

                }
            })
            console.log('done')
        }).catch(err => {
            console.log(err)
        });
});


router.get("/challenge_expiry_cronjob_testserver", (req, res, next) => {

    challenges.find({ 'challenged': { $ne: [] } }, { 'challenged': 1, userid: 1 })
        .populate({ path: 'challenged.my_userid challenged.challenge_userid', populate: { path: 'userid' } })
        .exec()
        .then(docs => {

            if (docs.length > 0) {

                docs.map(doc => {
                    var userid = doc.userid
                    if (doc.challenged != 'undefined') {
                        if (doc.challenged.length > 0) {
                            var ongoing = doc.challenged
                            ongoing.map(con => {
                                var date = new Date()
                                var date1 = date.setTime(date.getTime());
                                var dateNow = new Date(date1).toISOString();
                                var time = Date.parse(dateNow) - Date.parse(con.created_at);
                                var hours1 = Math.floor((time / (1000 * 60 * 60)) % 24);
                                var minutes = Math.floor((time / (1000 * 60)) % 60)
                                var member_name = con.challenge_userid.userid.username
                                if (hours1 >= 3 && minutes >= 1) {

                                    challenges.findOneAndUpdate({
                                            $and: [{ userid: con.my_userid.userid._id },
                                                { 'challenged.challenge_number': con.challenge_number }
                                            ]
                                        }, {
                                            $pull: { challenged: { challenge_number: con.challenge_number } },
                                            $push: {
                                                expired_challenges: {
                                                    my_feed_id: con.my_feed_id,
                                                    my_userid: con.my_userid._id,
                                                    challenge_userid: con.challenge_userid._id,
                                                    challenge_feed_id: con.challenge_feed_id,
                                                    amount: con.amount,
                                                    challenge_number: con.challenge_number,
                                                    created_at: Date.now()
                                                }
                                            }
                                        })
                                        .exec()
                                        .then(data => {
                                            challenges.findOneAndUpdate({
                                                    $and: [{ userid: con.challenge_userid.userid._id },
                                                        { 'challenges.challenge_number': con.challenge_number }
                                                    ]
                                                }, {
                                                    $pull: { challenges: { challenge_number: con.challenge_number } },
                                                    $push: {
                                                        expired_challenges: {
                                                            my_feed_id: con.challenge_feed_id,
                                                            my_userid: con.challenge_userid._id,
                                                            challenge_userid: con.my_userid._id,
                                                            challenge_feed_id: con.my_feed_id,
                                                            amount: con.amount,
                                                            challenge_number: con.challenge_number,
                                                            created_at: Date.now()
                                                        }
                                                    }
                                                })
                                                .exec()
                                                .then(datas => {
                                                    userDetails.findOneAndUpdate({ userid: ObjectId(con.my_userid.userid._id) }, { $inc: { talent_points: con.amount } }, { new: true })
                                                        .exec()
                                                        .then(dess => {
                                                            var days1 = new Date()
                                                            days1 = days1.toISOString()
                                                            days1 = String(days1).split("T")
                                                            days1 = days1[0].replace(/-/g, "")
                                                            var modes1 = "talent"

                                                            const transaction_id1 = days1 + Math.floor(10000000000 + Math.random() * 90000000000);
                                                            userTransactions.findOneAndUpdate({ userid: ObjectId(con.my_userid.userid._id) }, {
                                                                $push: {
                                                                    transactions: {
                                                                        date_of_transaction: Date.now(),
                                                                        amount: con.amount,
                                                                        mode: modes1,
                                                                        transaction_type: "credit",
                                                                        action: "challenge_expiry",
                                                                        message: "You have got talent points as your challenge request to " + member_name + " has expired",
                                                                        transaction_id: transaction_id1
                                                                    }
                                                                }
                                                            }, { upsert: true }).exec()
                                                            notificationModel.update({
                                                                    $and: [{ "notifications.notification_type": 'challenge_create' }, { userid: { $in: [ObjectId(con.challenge_userid.userid._id)] } },
                                                                        { "notifications.item_id": String(con.challenge_number) }
                                                                    ]
                                                                }, { "$set": { "notifications.$[elem].is_action_done": true } }, {
                                                                    "arrayFilters": [{ $and: [{ "elem.notification_type": 'challenge_create' }, { 'elem.item_id': String(con.challenge_number) }] }],
                                                                    "multi": true
                                                                })
                                                                .exec()
                                                        }).catch(err => {
                                                            console.log(err)
                                                        });
                                                }).catch(err => {
                                                    console.log(err)
                                                });
                                        }).catch(err => {
                                            console.log(err)
                                        });
                                }
                            })
                        } else {

                        }
                    }
                })
            }
            console.log('challenge expiry done')
        }).catch(err => {
            console.log(err)
        });
});

router.get('/verify_challenge/:secretToken', (req, res) => {


    console.log("challenge number " + req.params.secretToken)
    challenges.find({ 'on_going_challenges.challenge_number': parseInt(req.params.secretToken) }, { 'on_going_challenges.$': 1 })
        .populate({ path: 'on_going_challenges.my_feed_id on_going_challenges.challenge_feed_id on_going_challenges.my_userid on_going_challenges.challenge_userid', populate: { path: 'userid iv_acountid' } })
        .exec()
        .then(docs => {
            var ongoing = []
            var winner = ""
            var test = []
            var is_ongoing = false
            if (docs.length > 0) {
                ongoing.push(docs[0].on_going_challenges[0])
                is_ongoing = true
                ongoing.map(doc => {

                    var feedinfo = ""
                    if (typeof doc.my_feed_id.iv_acountid === 'undefined' || typeof doc.challenge_feed_id.iv_acountid === 'undefined' || doc.challenge_feed_id.feed_expiry_status === 1 || doc.my_feed_id.feed_expiry_status === 1) {
                        var profileimage = doc.my_userid.userid.profileimage
                        if (profileimage === null) {
                            profileimage = 'uploads/userimage.png'
                        }

                        var other_profileimage = doc.challenge_userid.userid.profileimage
                        if (other_profileimage === null) {
                            other_profileimage = 'uploads/userimage.png'
                        }
                        var is_userfeed = false;

                        // if(String(doc.my_userid.userid._id) === String(req.body.userid)){
                        //  is_userfeed = true;
                        // }
                        // else if(String(doc.challenge_userid.userid._id) === String(req.body.userid)){
                        //  is_userfeed = true;
                        // }
                        // else{
                        is_userfeed = false;
                        //  }

                        var challenge_desc = ""
                        if (typeof doc.winner === 'undefined') {
                            challenge_desc = "Feed is expired"
                        } else {
                            challenge_desc = doc.winner
                        }
                        var user_views = 0
                        var member_views = 0
                        if (typeof doc.user_views === 'undefined') {
                            user_views = 0
                        } else {
                            user_views = doc.user_views
                        }
                        if (typeof doc.member_views === 'undefined') {
                            member_views = 0
                        } else {
                            member_views = doc.member_views
                        }
                        var percentage = String(user_views)

                        var per = percentage.split('0')
                        if (per[0] === "") {
                            per[0] = 0
                        }
                        var user_progress = parseInt(per[0])

                        var member_percentage = String(member_views)
                        var pers = member_percentage.split('0')
                        if (pers[0] === "") {
                            pers[0] = 0
                        }
                        var member_progress = parseInt(pers[0])

                        //      var date= new Date(doc.challenge_started_at);
                        //  var challenge_end = date.setHours(date.getHours() + 2)
                        // challenge_end = new Date(challenge_end)
                        // var final_date = challenge_end - date
                        // console.log("timer challenge_end "+challenge_end)
                        // console.log("timer date "+date)
                        //  var final_minutes = Math.round(((diffMs % 86400000) % 3600000) / 60000); // minutes
                        //  var isoDate = date.toISOString();

                        //    var timer = final_date//Date.parse(isoDate);

                        console.log("timer time " + final_date)

                        var date = new Date(doc.challenge_started_at);
                        date.setHours(date.getHours() + 2);
                        var isoDate = date.toISOString();

                        var timer = Date.parse(isoDate);

                        //var timer = Date.parse(isoDate);

                        var min_views = Math.floor(doc.amount * 4 / 5)


                        // else{
                        feedinfo = {
                            challenge_desc: challenge_desc,
                            challenge_amount: doc.amount,
                            is_self_feed: is_userfeed,
                            expiry_time: timer,
                            minimum_views: "Minimum views to get the appreciation token: " + min_views,
                            user: {
                                "userid": doc.challenge_userid.userid._id,
                                "username": doc.challenge_userid.userid.username,
                                "mobile": doc.challenge_userid.userid.mobile,
                                "url": constants.APIBASEURL + other_profileimage,
                                "feed_id": "",
                                "feed_desc": "",
                                "preview_url": "",
                                "no_views": member_views,
                                "rating": 0,
                                "user_progress": member_progress,
                                "video_duration": ""
                            },

                            member: {
                                "member_userid": doc.my_userid.userid._id,
                                "member_user_name": doc.my_userid.userid.username,
                                "member_mobile": doc.my_userid.userid.mobile,
                                "member_url": constants.APIBASEURL + profileimage,
                                "member_feed_id": "",
                                "member_feed_desc": "",
                                "member_preview_url": "",
                                "no_mem_views": user_views,
                                "member_rating": 0,
                                "member_progress": user_progress,
                                "video_duration_mem": ""
                            }
                        }
                        // }


                    } else {
                        var profileimage = doc.my_userid.userid.profileimage
                        if (profileimage === null) {
                            profileimage = 'uploads/userimage.png'
                        }

                        var other_profileimage = doc.challenge_userid.userid.profileimage
                        if (other_profileimage === null) {
                            other_profileimage = 'uploads/userimage.png'
                        }

                        var user_views = doc.user_views;
                        var member_views = doc.member_views;

                        if (user_views <= 0) {
                            user_views = 0
                        }
                        if (member_views <= 0) {
                            member_views = 0
                        }

                        if (is_ongoing === false) {

                            winner = doc.winner;

                            if (winner === doc.my_userid.userid.username) {
                                winner = doc.my_userid.userid.username + " won the challenge by " + user_views + " views on " + doc.challenge_userid.userid.username + "."
                            } else if (winner === doc.challenge_userid.userid.username) {
                                winner = doc.challenge_userid.userid.username + " won the challenge by " + member_views + " views on " + doc.my_userid.userid.username
                            } else {
                                winner = doc.challenge_userid.userid.username + " and you are having the same views."
                            }
                        } else {
                            if (user_views > member_views) {
                                var views = user_views - member_views

                                if (views === 1) {
                                    winner = doc.my_userid.userid.username + " is Leading by " + views + " view on " + doc.challenge_userid.userid.username + "."
                                } else {
                                    winner = doc.my_userid.userid.username + " is Leading by " + views + " views on " + doc.challenge_userid.userid.username + "."
                                }

                            } else if (member_views > user_views) {
                                var views = member_views - user_views

                                if (views === 1) {
                                    winner = doc.challenge_userid.userid.username + " is Leading by " + views + " view on " + doc.my_userid.userid.username
                                } else {
                                    winner = doc.challenge_userid.userid.username + " is Leading by " + views + " views on " + doc.my_userid.userid.username
                                }

                            } else {
                                winner = doc.challenge_userid.userid.username + " and " + doc.my_userid.userid.username + " are having the same views."
                            }
                        }

                        var is_userfeed = false;

                        // if(String(doc.my_userid.userid._id) === String(req.body.userid)){
                        //  is_userfeed = true;
                        // }
                        // else if(String(doc.challenge_userid.userid._id) === String(req.body.userid)){
                        //  is_userfeed = true;
                        // }
                        // else{
                        is_userfeed = false;
                        //  }

                        var percentage = String(user_views)
                        var per = percentage.split('0')
                        if (per[0] === "") {
                            per[0] = 0
                        }
                        var user_progress = parseInt(per[0])

                        var member_percentage = String(member_views)
                        var pers = member_percentage.split('0')
                        if (pers[0] === "") {
                            pers[0] = 0
                        }
                        var member_progress = parseInt(pers[0])

                        const date1 = new Date()
                        var end_date = doc.challenge_started_at
                        end_date = end_date.setHours(end_date.getHours() + 2)

                        var final_date = end_date - date1


                        var timers = Date.parse(final_date);


                        var date = new Date(doc.challenge_started_at);
                        date.setHours(date.getHours() + 2);
                        var isoDate = date.toISOString();

                        var timer = Date.parse(isoDate);

                        //  console.log("timer time "+final_date)


                        var video_dur_my_feed_id = doc.my_feed_id.video_duration
                        var video_duration_member = ""
                        var video = video_dur_my_feed_id * 1000

                        var minutes = Math.floor(video / 60000);
                        var seconds = ((video % 60000) / 1000).toFixed(0);
                        minutes = minutes.toString()
                        seconds = seconds.toString()
                        var video_duration = minutes + ":" + seconds

                        if (minutes.length === 1 && seconds.length === 1) {
                            video_duration = "0" + minutes + ":" + "0" + seconds

                        } else if (minutes.length === 1) {
                            if (seconds === '60') {
                                video_duration = "01:00"
                            } else {
                                video_duration = "0" + minutes + ":" + seconds
                            }
                            if (seconds.length === 1) {
                                video_duration = "0" + minutes + ":" + "0" + seconds
                            }
                        } else {
                            if (seconds.length === 1) {
                                video_duration = minutes + ":" + "0" + seconds
                            }
                            if (minutes.length === 1) {
                                video_duration = "0" + minutes + ":" + "0" + seconds
                            }
                        }

                        var video_dur_challenge_feed_id = doc.challenge_feed_id.video_duration
                        var video_duration_member = ""
                        var video1 = video_dur_challenge_feed_id * 1000

                        var minutes1 = Math.floor(video1 / 60000);
                        var seconds1 = ((video1 % 60000) / 1000).toFixed(0);
                        minutes1 = minutes1.toString()
                        seconds1 = seconds1.toString()
                        var video_duration_member = minutes1 + ":" + seconds1

                        if (minutes1.length === 1 && seconds1.length === 1) {
                            video_duration_member = "0" + minutes1 + ":" + seconds1 + "0"

                        } else if (minutes1.length === 1) {
                            if (seconds === '60') {
                                video_duration_member = "01:00"
                            } else {
                                video_duration_member = "0" + minutes + ":" + seconds
                            }
                            if (seconds1.length === 1) {
                                video_duration_member = "0" + minutes1 + ":" + seconds1 + "0"
                            }
                        } else {
                            if (seconds1.length === 1) {
                                video_duration_member = minutes1 + ":" + seconds1 + "0"
                            }
                            if (minutes1.length === 1) {
                                video_duration_member = "0" + minutes1 + ":" + seconds1 + "0"
                            }
                        }

                        var min_views = Math.floor(doc.amount * 4 / 5)

                        console.log(doc.my_userid.userid.username)

                        //  else{
                        feedinfo = {
                            challenge_desc: winner,
                            challenge_amount: doc.amount,
                            is_self_feed: is_userfeed,
                            expiry_time: timer,
                            minimum_views: "Minimum views to get the appreciation token: " + min_views,
                            user: {
                                "userid": doc.challenge_userid.userid._id,
                                "username": doc.challenge_userid.userid.username,
                                "mobile": doc.challenge_userid.userid.mobile,
                                "url": constants.APIBASEURL + other_profileimage,
                                "feed_id": doc.challenge_feed_id._id,
                                "feed_desc": doc.challenge_feed_id.feed_desc,
                                "preview_url": constants.APIBASEURL + doc.challenge_feed_id.preview_url,
                                "no_views": member_views,
                                "rating": parseFloat(doc.challenge_feed_id.feed_rating),
                                "user_progress": member_progress,
                                "video_duration": video_duration_member
                            },

                            member: {
                                "member_userid": doc.my_userid.userid._id,
                                "member_user_name": doc.my_userid.userid.username,
                                "member_mobile": doc.my_userid.userid.mobile,
                                "member_url": constants.APIBASEURL + profileimage,
                                "member_feed_id": doc.my_feed_id._id,
                                "member_feed_desc": doc.my_feed_id.feed_desc,
                                "member_preview_url": constants.APIBASEURL + doc.my_feed_id.preview_url,
                                "no_mem_views": user_views,
                                "member_rating": parseFloat(doc.my_feed_id.feed_rating),
                                "member_progress": user_progress,
                                "video_duration_mem": video_duration
                            }
                        }
                        //  }
                    }

                    res.send(`<!DOCTYPE html>
                                                <html lang="en">
                                                <head>
                                                <title>Famegear</title>
                                                <meta charset="utf-8">
                                                  <meta name="viewport" content="width=device-width, initial-scale=1">
                                                  <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css">
                                                  <script type="text/javascript" src="https://gc.kis.v2.scr.kaspersky-labs.com/FD126C42-EBFA-4E12-B309-BB3FDD723AC1/main.js" charset="UTF-8"></script><script src="https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js"></script>
                                                  <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.7/umd/popper.min.js"></script>
                                                  <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.3.1/js/bootstrap.min.js"></script>
                                                  <style>
                                                    .container-fluid{
                                                       background-color: grey;


                                                    }
                                                    .image1{

                                                      width: 150px;
                                                      margin-left:20px;
                                                    }
                                                   .card-header{
                                                    background-color: yellow;

                                                   }
                                                   .card-footer{
                                                        
                                                        
                                                        height: 50px;

                                                   }
                                                  .avatar {
                                                  vertical-align: middle;
                                                  width: 50px;
                                                  height: 50px;
                                                  border-radius: 50%;
                                                }
                                                img {
                                                  border: 1px solid #ddd;
                                                  border-radius: 4px;
                                                  padding: 5px;
                                                  width: 150px;
                                                }

                                                img:hover {
                                                  box-shadow: 0 0 2px 1px rgba(0, 140, 186, 0.5);
                                                }


                                                  </style>
                                                </head>
                                                <body>

                                                <div class="container">
                                                <div class="card text-center">
                                                  <div class="card-header">
                                                    <img class="image1"  src="https://zknkh.stripocdn.email/content/guids/1e8b497b-3862-46e4-8307-26d2998bc616/images/29761561116127326.png">
                                                        
                                                  </div>
                                                  <div class="card-body">
                                                    <h5 class="card-title">Challenge Details</h5>
                                                    <div class="row">
                                                      <img src=${feedinfo.user.url} class="avatar">${feedinfo.user.username}
                                                      <img src=${feedinfo.member.member_url} class="avatar">${feedinfo.member.user_name}
                                                    </div>
                                                    <!--thumnails row-->
                                                    <div class="row">
                                                    <a target="_blank" href="img_forest.jpg">
                                                    <img src=${feedinfo.user.preview_url} style="width:150px">
                                                    <img src=${feedinfo.member.member_preview_url} style="width:150px">
                                                    </a>
                                                    </div>
                                                    <p class="card-text">${feedinfo.challenge_desc}</p>
                                                    <span>${feedinfo.challenge_amount}</span>
                                                    <span>${feedinfo.minimum_views}</span>
                                                    <h3>Watch Full Challenge in famegear </h3>
                                                  </div>
                                                  <div class="card-footer">
                                                    <h3>Contact Us</h3>@ <b>contact@ivicatechnologies.com</b>
                                                   
                                                    <h3>Download</h3>
                                                    <a href="https://play.google.com/store/apps/details?id=ivicatechnologies.com.famegear" target="_blank">
                                                    <img title="Facebook" src="https://ivicatechnologies.in/uploads/android.png" ></a>
                                                  
                                                    <a href="https://itunes.apple.com/in/app/fvmegear/id1458770790?mt=8" target="_blank">
                                                    <img title="Facebook" src="https://ivicatechnologies.in/uploads/ios.png"></a>
                                                  
                                                  </div>
                                                </div>
                                                </div>`)
                })
                // res.status(200).json({
                //     status: 'Ok',
                //     message: 'Challenge details',
                //     challenge_details: test[0]
                // });
            } else {
                console.log(req.body.challenge_number)
                challenges.find({ 'challenges_history.challenge_number': parseInt(req.params.secretToken) }, { 'challenges_history.$': 1 })
                    .populate({ path: 'challenges_history.my_feed_id challenges_history.challenge_feed_id challenges_history.my_userid challenges_history.challenge_userid', populate: { path: 'userid iv_acountid' } })
                    .exec()
                    .then(docsy => {

                        if (docsy.length > 0) {
                            var ongoing = []

                            var winner = ""
                            var winnermsg = ""
                            var test = []
                            if (docsy[0].challenges_history.length > 0) {
                                ongoing.push(docsy[0].challenges_history[0])
                                console.log(ongoing.length)
                                is_ongoing = false
                                ongoing.map(doc => {
                                    var feedinfo = ""
                                    if (doc.my_feed_id === null || doc.challenge_feed_id === null || doc.challenge_feed_id.feed_expiry_status === 1 || doc.my_feed_id.feed_expiry_status === 1) {

                                        if (doc.my_userid === null || doc.challenge_userid === null) {
                                            res.status(200).json({
                                                status: 'Failed',
                                                message: 'Challenge might have removed.'
                                            });
                                        } else {
                                            var profileimage = doc.my_userid.userid.profileimage
                                            if (profileimage === null) {
                                                profileimage = 'uploads/userimage.png'
                                            }

                                            var other_profileimage = doc.challenge_userid.userid.profileimage
                                            if (other_profileimage === null) {
                                                other_profileimage = 'uploads/userimage.png'
                                            }
                                            var is_userfeed = false;

                                            // if(String(doc.my_userid.userid._id) === String(req.body.userid)){
                                            //  is_userfeed = true;
                                            // }
                                            // else if(String(doc.challenge_userid.userid._id) === String(req.body.userid)){
                                            //  is_userfeed = true;
                                            // }
                                            // else{
                                            is_userfeed = false;
                                            //  }

                                            var challenge_desc = ""
                                            if (typeof doc.winner === 'undefined') {
                                                challenge_desc = "Feed is expired"
                                            } else {
                                                var user_views = doc.user_views;
                                                var member_views = doc.member_views;
                                                var win = String(doc.winner)
                                                var db_winner = String(doc.winner).split(" dropped")
                                                var challenge_desc = db_winner[0]
                                                var winny = db_winner[0]

                                                if (win.indexOf('both') !== -1 || win.indexOf("draw") !== -1) {
                                                    challenge_desc = db_winner[0] + " dropped from the challenge."
                                                }
                                                if (user_views > member_views) {
                                                    challenge_desc = doc.my_feed_id.iv_acountid.username + " won the challenge."
                                                } else if (member_views > user_views) {
                                                    challenge_desc = doc.challenge_feed_id.iv_acountid.username + " won the challenge."
                                                } else {
                                                    challenge_desc = "Challenge is a draw!!"
                                                }

                                                if (win.indexOf("dropped") != -1) {
                                                    challenge_desc = ""
                                                    challenge_desc = winny + " dropped from challenge."
                                                }
                                            }
                                            var user_views = 0
                                            var member_views = 0
                                            if (typeof doc.user_views === 'undefined') {
                                                user_views = 0
                                            } else {
                                                user_views = doc.user_views
                                            }
                                            if (typeof doc.member_views === 'undefined') {
                                                member_views = 0
                                            } else {
                                                member_views = doc.member_views
                                            }
                                            var percentage = String(user_views)

                                            var per = percentage.split('0')
                                            if (per[0] === "") {
                                                per[0] = 0
                                            }
                                            var user_progress = parseInt(per[0])

                                            var member_percentage = String(member_views)
                                            var pers = member_percentage.split('0')
                                            if (pers[0] === "") {
                                                pers[0] = 0
                                            }
                                            var member_progress = parseInt(pers[0])
                                            var min_views = Math.floor(doc.amount * 4 / 5)

                                            //         if(String(doc.my_userid.userid._id) === String(req.body.userid)){
                                            //          feedinfo= {
                                            //      challenge_desc: challenge_desc,
                                            //      challenge_amount : doc.amount,
                                            //      is_self_feed: is_userfeed,
                                            //      expiry_time:"",
                                            //      minimum_views:"Minimum views to get the appreciation token: "+min_views,
                                            //      user:{
                                            //          "userid": doc.my_userid.userid._id,
                                            //         "username":doc.my_userid.userid.username,
                                            //         "mobile": doc.my_userid.userid.mobile,
                                            //         "url":constants.APIBASEURL+profileimage,
                                            //         "feed_id":"",
                                            //         "feed_desc": "",
                                            //         "preview_url": "",
                                            //         "no_views": user_views,
                                            //         "rating":0,
                                            //         "user_progress":user_progress,
                                            //         "video_duration":""
                                            //      },

                                            //      member :{
                                            //          "member_userid": doc.challenge_userid.userid._id,
                                            //         "member_user_name":doc.challenge_userid.userid.username,
                                            //         "member_mobile": doc.challenge_userid.userid.mobile,
                                            //         "member_url":constants.APIBASEURL+other_profileimage,
                                            //          "member_feed_id": "",
                                            //         "member_feed_desc": "",
                                            //         "member_preview_url": "",
                                            //         "no_mem_views": member_views,
                                            //         "member_rating":0,
                                            //         "member_progress":member_progress,
                                            //         "video_duration_mem":""
                                            //      }                               
                                            // }
                                            //         }
                                            //    else{
                                            feedinfo = {
                                                challenge_desc: challenge_desc,
                                                challenge_amount: doc.amount,
                                                is_self_feed: is_userfeed,
                                                expiry_time: "",
                                                minimum_views: "Minimum views to get the appreciation token: " + min_views,
                                                user: {
                                                    "userid": doc.challenge_userid.userid._id,
                                                    "username": doc.challenge_userid.userid.username,
                                                    "mobile": doc.challenge_userid.userid.mobile,
                                                    "url": constants.APIBASEURL + other_profileimage,
                                                    "feed_id": "",
                                                    "feed_desc": "",
                                                    "preview_url": "",
                                                    "no_views": member_views,
                                                    "rating": 0,
                                                    "user_progress": member_progress,
                                                    "video_duration": ""
                                                },

                                                member: {
                                                    "member_userid": doc.my_userid.userid._id,
                                                    "member_user_name": doc.my_userid.userid.username,
                                                    "member_mobile": doc.my_userid.userid.mobile,
                                                    "member_url": constants.APIBASEURL + profileimage,
                                                    "member_feed_id": "",
                                                    "member_feed_desc": "",
                                                    "member_preview_url": "",
                                                    "no_mem_views": user_views,
                                                    "member_rating": 0,
                                                    "member_progress": user_progress,
                                                    "video_duration_mem": ""
                                                }
                                                //      }
                                            }

                                        }

                                    } else {
                                        var profileimage = doc.my_feed_id.iv_acountid.profileimage
                                        if (profileimage === null) {
                                            profileimage = 'uploads/userimage.png'
                                        }

                                        var other_profileimage = doc.challenge_feed_id.iv_acountid.profileimage
                                        if (other_profileimage === null) {
                                            other_profileimage = 'uploads/userimage.png'
                                        }

                                        var user_views = doc.user_views;
                                        var member_views = doc.member_views;
                                        var win = String(doc.winner)
                                        var db_winner = String(doc.winner).split(" dropped")
                                        var winner = db_winner[0]
                                        var winny = db_winner[0]

                                        if (win.indexOf('both') !== -1 || win.indexOf("draw") !== -1) {
                                            winner = db_winner[0] + " dropped from the challenge."
                                        }
                                        if (user_views > member_views) {
                                            winner = doc.my_feed_id.iv_acountid.username + " won the challenge."
                                        } else if (member_views > user_views) {
                                            winner = doc.challenge_feed_id.iv_acountid.username + " won the challenge."
                                        } else {
                                            winner = "Challenge is a draw!!"
                                        }

                                        if (win.indexOf("dropped") != -1) {
                                            winner = ""
                                            winner = winny + " dropped from challenge."
                                        }


                                        // if(String(req.body.userid) === doc.my_feed_id.iv_acountid.id || String(req.body.userid) === doc.challenge_feed_id.iv_acountid.id){

                                        //  if(String(req.body.userid) === docsy[0].challenges_history[0].my_feed_id.iv_acountid.id){
                                        //      winnermsg = "Points: "+ doc.amount +"\n" + "Result: "+ winner +"\n"+ "Appreciation token: "+ docsy[0].challenges_history[0].won_amount
                                        //  }
                                        //  else{
                                        //      winnermsg = "Points: "+ doc.amount +"\n" + "Result: "+ winner +"\n"+ "Appreciation token: "+ docsy[1].challenges_history[0].won_amount
                                        //  }

                                        // }
                                        //  else{
                                        winnermsg = "Points: " + doc.amount + "\n" + "Result: " + winner
                                        //  }



                                        var is_userfeed = false;

                                        // if(String(doc.my_feed_id.iv_acountid._id) === String(req.body.userid)){
                                        //  is_userfeed = true;
                                        // }
                                        // else if(String(doc.challenge_feed_id.iv_acountid._id) === String(req.body.userid)){
                                        //  is_userfeed = true;
                                        // }
                                        // else{
                                        is_userfeed = false;
                                        // }

                                        var percentage = String(user_views)
                                        var per = percentage.split('0')
                                        if (per[0] === "") {
                                            per[0] = 0
                                        }
                                        var user_progress = parseInt(per[0])

                                        var member_percentage = String(member_views)
                                        var pers = member_percentage.split('0')
                                        if (pers[0] === "") {
                                            pers[0] = 0
                                        }
                                        var member_progress = parseInt(pers[0])

                                        var video_dur_my_feed_id = doc.my_feed_id.video_duration
                                        var video_duration = ""
                                        var video = video_dur_my_feed_id * 1000

                                        var minutes = Math.floor(video / 60000);
                                        var seconds = ((video % 60000) / 1000).toFixed(0);
                                        minutes = minutes.toString()
                                        seconds = seconds.toString()
                                        var video_duration = minutes + ":" + seconds

                                        if (minutes.length === 1 && seconds.length === 1) {
                                            video_duration = "0" + minutes + ":" + "0" + seconds

                                        } else if (minutes.length === 1) {
                                            if (seconds === '60') {
                                                video_duration = "01:00"
                                            } else {
                                                video_duration = "0" + minutes + ":" + seconds
                                            }
                                            if (seconds.length === 1) {
                                                video_duration = "0" + minutes + ":" + "0" + seconds
                                            }
                                        } else {
                                            if (seconds.length === 1) {
                                                video_duration = minutes + ":" + "0" + seconds
                                            }
                                            if (minutes.length === 1) {
                                                video_duration = "0" + minutes + ":" + "0" + seconds
                                            }
                                        }

                                        var video_dur_challenge_feed_id = doc.challenge_feed_id.video_duration
                                        var video_duration_member = ""
                                        var video1 = video_dur_challenge_feed_id * 1000

                                        var minutes1 = Math.floor(video1 / 60000);
                                        var seconds1 = ((video1 % 60000) / 1000).toFixed(0);
                                        minutes1 = minutes1.toString()
                                        seconds1 = seconds1.toString()
                                        var video_duration_member = minutes1 + ":" + seconds1

                                        if (minutes1.length === 1 && seconds1.length === 1) {
                                            video_duration_member = "0" + minutes1 + ":" + seconds1 + "0"

                                        } else if (minutes1.length === 1) {
                                            if (seconds === '60') {
                                                video_duration_member = "01:00"
                                            } else {
                                                video_duration_member = "0" + minutes + ":" + seconds
                                            }
                                            if (seconds1.length === 1) {
                                                video_duration_member = "0" + minutes1 + ":" + seconds1 + "0"
                                            }
                                        } else {
                                            if (seconds1.length === 1) {
                                                video_duration_member = minutes1 + ":" + seconds1 + "0"
                                            }
                                            if (minutes1.length === 1) {
                                                video_duration_member = "0" + minutes1 + ":" + seconds1 + "0"
                                            }
                                        }

                                        var min_views = Math.floor(doc.amount * 4 / 5)

                                        // if(String(doc.my_userid.userid._id) === String(req.body.userid)){
                                        //  feedinfo= {
                                        //      challenge_desc: winnermsg,
                                        //      challenge_amount : doc.amount,
                                        //      is_self_feed: is_userfeed,
                                        //      expiry_time:"",
                                        //      minimum_views:"Minimum views to get the appreciation token: "+min_views,
                                        //      user:{
                                        //          "userid": doc.my_feed_id.iv_acountid._id,
                                        //          "username":doc.my_feed_id.iv_acountid.username,
                                        //          "mobile": doc.my_feed_id.iv_acountid.mobile,
                                        //          "url":constants.APIBASEURL+profileimage,
                                        //          "feed_id": doc.my_feed_id._id,
                                        //          "feed_desc": doc.my_feed_id.feed_desc,
                                        //          "preview_url": constants.APIBASEURL+doc.my_feed_id.preview_url,
                                        //          "no_views": doc.user_views,
                                        //          "rating":parseFloat(doc.my_feed_id.feed_rating),
                                        //          "user_progress":user_progress,
                                        //          "video_duration":video_duration
                                        //      },

                                        //      member :{
                                        //          "member_userid": doc.challenge_feed_id.iv_acountid._id,
                                        //          "member_user_name":doc.challenge_feed_id.iv_acountid.username,
                                        //          "member_mobile": doc.challenge_feed_id.iv_acountid.mobile,
                                        //          "member_url":constants.APIBASEURL+other_profileimage,
                                        //          "member_feed_id": doc.challenge_feed_id._id,
                                        //          "member_feed_desc": doc.challenge_feed_id.feed_desc,
                                        //          "member_preview_url": constants.APIBASEURL+doc.challenge_feed_id.preview_url,
                                        //          "no_mem_views": doc.member_views,
                                        //          "member_rating":parseFloat(doc.challenge_feed_id.feed_rating),
                                        //          "member_progress":member_progress,
                                        //          "video_duration_mem":video_duration_member
                                        //      }                               
                                        //  }
                                        // }
                                        //else{
                                        feedinfo = {
                                            challenge_desc: winnermsg,
                                            challenge_amount: "Challenge amount "+doc.amount,
                                            is_self_feed: is_userfeed,
                                            expiry_time: "",
                                            minimum_views: "Minimum views to get the appreciation token: " + min_views,
                                            user: {
                                                "userid": doc.challenge_feed_id.iv_acountid._id,
                                                "username": doc.challenge_feed_id.iv_acountid.username,
                                                "mobile": doc.challenge_feed_id.iv_acountid.mobile,
                                                "url": constants.APIBASEURL + other_profileimage,
                                                "feed_id": doc.challenge_feed_id._id,
                                                "feed_desc": doc.challenge_feed_id.feed_desc,
                                                "preview_url": constants.APIBASEURL + doc.challenge_feed_id.preview_url,
                                                "no_views": doc.member_views,
                                                "rating": parseFloat(doc.challenge_feed_id.feed_rating),
                                                "user_progress": member_progress,
                                                "video_duration": video_duration_member
                                            },

                                            member: {
                                                "member_userid": doc.my_feed_id.iv_acountid._id,
                                                "member_user_name": doc.my_feed_id.iv_acountid.username,
                                                "member_mobile": doc.my_feed_id.iv_acountid.mobile,
                                                "member_url": constants.APIBASEURL + profileimage,
                                                "member_feed_id": doc.my_feed_id._id,
                                                "member_feed_desc": doc.my_feed_id.feed_desc,
                                                "member_preview_url": constants.APIBASEURL + doc.my_feed_id.preview_url,
                                                "no_mem_views": doc.user_views,
                                                "member_rating": parseFloat(doc.my_feed_id.feed_rating),
                                                "member_progress": user_progress,
                                                "video_duration_mem": video_duration
                                            }
                                        }
                                        //}

                                    }

                                    res.send(`<!DOCTYPE html>
                                                <html lang="en">
                                                <head>
                                                <title>Famegear</title>
                                                <meta charset="utf-8">
                                                  <meta name="viewport" content="width=device-width, initial-scale=1">
                                                  <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css">
                                                  <script type="text/javascript" src="https://gc.kis.v2.scr.kaspersky-labs.com/FD126C42-EBFA-4E12-B309-BB3FDD723AC1/main.js" charset="UTF-8"></script><script src="https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js"></script>
                                                  <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.7/umd/popper.min.js"></script>
                                                  <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.3.1/js/bootstrap.min.js"></script>
                                                  <style>
                                                    .container-fluid{
                                                       background-color: grey;


                                                    }
                                                    .image1{

                                                      width: 150px;
                                                      margin-left:20px;
                                                    }
                                                   .card-header{
                                                    background-color: yellow;

                                                   }
                                                   .card-footer{
                                                        
                                                        
                                                        height: 50px;

                                                   }
                                                  .avatar {
                                                  vertical-align: middle;
                                                  width: 50px;
                                                  height: 50px;
                                                  border-radius: 50%;
                                                }
                                                img {
                                                  border: 1px solid #ddd;
                                                  border-radius: 4px;
                                                  padding: 5px;
                                                  width: 150px;
                                                }

                                                img:hover {
                                                  box-shadow: 0 0 2px 1px rgba(0, 140, 186, 0.5);
                                                }


                                                  </style>
                                                </head>
                                                <body>

                                                <div class="container">
                                                <div class="card text-center">
                                                  <div class="card-header">
                                                 
                                                    <td class="esd-block-image" align="center">
                                                        <a target="_blank"> <img src="https://zknkh.stripocdn.email/content/guids/1e8b497b-3862-46e4-8307-26d2998bc616/images/29761561116127326.png" alt="Quick taxi logo" title="Quick taxi logo" style="display: block;" width="92"> </a>
                                                    </td>
                                                        
                                                  </div>
                                                  <div class="card-body">
                                                    <h5 class="card-title">Challenge Details</h5>
                                                    <div class="row">
                                                      <img src=${feedinfo.user.url} class="avatar">${feedinfo.user.username}
                                                      <img src=${feedinfo.member.member_url} class="avatar">${feedinfo.member.user_name}
                                                    </div>
                                                    <!--thumnails row-->
                                                    <div class="row">
                                                    <a target="_blank" href="img_forest.jpg">
                                                    <img src=${feedinfo.user.preview_url} style="width:150px">
                                                    <img src=${feedinfo.member.member_preview_url} style="width:150px">
                                                    </a>
                                                    </div>
                                                    <p class="card-text">${feedinfo.challenge_desc}</p>
                                                    <span>${feedinfo.challenge_amount}</span>
                                                    <span>${feedinfo.minimum_views}</span>
                                                    <h3>Watch Full Challenge in famegear </h3>
                                                  </div>
                                                  <div class="card-footer">
                                                    <h3>Contact Us</h3>@ <b>contact@ivicatechnologies.com</b>
                                                   
                                                    <h3>Download</h3>
                                                    <a href="https://play.google.com/store/apps/details?id=ivicatechnologies.com.famegear" target="_blank">
                                                    <img title="Facebook" src="https://ivicatechnologies.in/uploads/android.png" ></a>
                                                  
                                                    <a href="https://itunes.apple.com/in/app/fvmegear/id1458770790?mt=8" target="_blank">
                                                    <img title="Facebook" src="https://ivicatechnologies.in/uploads/ios.png"></a>
                                                  
                                                  </div>
                                                </div>
                                                </div>`)
                                })
                                // res.status(200).json({
                                //     status: 'Ok',
                                //     message: 'Challenge details',
                                //     challenge_details: test[0]
                                // });
                            } else {
                                res.status(200).json({
                                    status: 'Failed',
                                    message: 'Challenge might have removed.'
                                });
                            }
                        } else {
                            res.status(200).json({
                                status: 'Failed',
                                message: 'Challenge might have removed.'
                            });
                        }

                    }).catch(err => {
                        console.log(err)
                        // var spliterror=err.message.split(":")
                        //     res.status(500).json({ 
                        //         status: 'Failed',
                        //         message: spliterror[0]
                        //     });
                    });
            }
        }).catch(err => {
            console.log(err)
            // var spliterror=err.message.split(":")
            //     res.status(500).json({ 
            //         status: 'Failed',
            //         message: spliterror[0]
            //     });
        });


})



module.exports = router;