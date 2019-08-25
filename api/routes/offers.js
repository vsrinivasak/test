const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const constants = require("../constants/constants");
const User = require("../models/user");
const userDetails = require("../models/userDetails");
const authModel = require("../models/auth");
const categoryModel = require("../models/iv_category");
const bsOffers = require("../models/bsOffers");
const primaryOffers = require("../models/primaryoffers");
const multer = require('multer');
const isEmpty = require("is-empty");
const business = require("../models/business");
const customeOffer = require("../models/customoffers");
const contactsModel = require("../models/contacts");
const colorCodeModel = require("../models/colorcodes");
const fs = require('fs');
const csv = require('fast-csv');
const ObjectId = require('mongodb').ObjectID;
const reviewQuestions = require("../models/reviewQuestions");
const wishlistOffers = require("../models/wishlist");
const addressModel = require("../models/userAddress");
const offerRedeemModel = require("../models/offer_redeems");
const offerRedeemFailureModel = require("../models/failed_transactions");
const text_type = require('node-strings');
const notificationModel = require("../models/notifications");
const fcmModel = require("../models/fcmtoken");
const FCM = require('fcm-node');
const userTransactions = require("../models/user_transactions")

router.post("/get_offers", (req, res, next) => {

    var keyArray = ["userid", "iv_token", "clientid", "page_no"];
    var key = Object.keys(req.body);
    console.log(req.body.page_no)

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

                        userDetails.find({ userid: ObjectId(req.body.userid) })
                            .populate("offer_details.offer offer_details.primary_offer offers_history.offer offers_history.primary_offer bus_id")
                            .exec()
                            .then(data => {
                                if (data.length < 1) {
                                    return res.status(200).json({
                                        status: "Failed",
                                        message: "Please provide correct userid."
                                    });
                                } else {

                                    var active = data[0].offer_details;
                                    var active_offers = [];
                                    var redeem_offers = [];
                                    var redeem = data[0].offers_history;
                                    var wish = data[0].wishlist_offers
                                    var wish_offers = [];
                                    var offer_cat_desc_url = "";

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

                                    bsOffers.find({ $and: [{ _id: { $nin: redeem_offers } }, { _id: { $nin: active_offers } }, { is_expired: false }] })
                                        .populate('bus_id')
                                        //  .skip(skip)
                                        //.limit(limit)
                                        .sort({ business_post_startdate: -1 })
                                        .exec()
                                        .then(docs => {
                                            bsOffers.find({ $and: [{ _id: { $nin: redeem_offers } }, { _id: { $nin: active_offers } }, { is_expired: false }] }).count().exec(function(err, count) {
                                                if (err) {
                                                    res.status(500).json({
                                                        status: 'Failed',
                                                        message: 'Error fetching offers.'
                                                    });
                                                } else {
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
                                                                var discount = discounts(price) //0

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

                                                                var disc = ""

                                                                if (discount > 0) {
                                                                    disc = "Upto " + discount + "% OFF."
                                                                }

                                                                var testss = {
                                                                    "offer_id": doc._id,
                                                                    "offer_name": doc.business_post_name,
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
                                                                    "discount": disc,
                                                                    "offer_category": doc.offer_category,
                                                                    "is_coming_soon": false,
                                                                    "is_delivery_required": doc.is_delivery_required,
                                                                    "no_used": doc.redeem.length,
                                                                    "payable_amount": parseFloat(final_total).toFixed(2),
                                                                    "offer_cat_desc_url": offer_cat_desc_url
                                                                }
                                                                test.push(testss)
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
                                                                var discount1 = discounts_wishlist(price1)
                                                                var disc = ""

                                                                if (discount1 > 0) {
                                                                    disc = "Upto " + discount1 + "% OFF."
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
                                                                    "discount": disc,
                                                                    "offer_category": "Stellar",
                                                                    "is_coming_soon": true,
                                                                    "is_delivery_required": false,
                                                                    "no_used": exe.used.length,
                                                                    "payable_amount": parseFloat(final_total_interested).toFixed(2),
                                                                    "offer_cat_desc_url": offer_cat_desc_url
                                                                }
                                                                testapi.push(wishlist)
                                                            })

                                                            var total_offers = test.length + testapi.length

                                                            test = testapi.concat(test)

                                                           // if (total_offers > perPage) {
                                                                test = test.splice(skip, limit)
                                                           // }

                                                            res.status(200).json({
                                                                status: "Ok",
                                                                message: "List of Business Offers.",
                                                                total_pages: Math.ceil(total_offers / perPage),
                                                                current_page: page,
                                                                total_offers: total_offers,
                                                                offers: test
                                                            });
                                                        }).catch(err => {
                                                            console.log(err)
                                                            // var spliterror = err.message.split(":")
                                                            // res.status(500).json({
                                                            //     status: 'Failed',
                                                            //     message: spliterror[0]
                                                            // });
                                                        });
                                                }
                                            })
                                        }).catch(err => {
                                            console.log(err)
                                            // var spliterror = err.message.split(":")
                                            // res.status(500).json({
                                            //     status: 'Failed',
                                            //     message: spliterror[0]
                                            // });
                                        });
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
                }).catch(err => {
                    console.log(err)
                    // var spliterror = err.message.split(":")
                    // res.status(500).json({
                    //     status: 'Failed',
                    //     message: spliterror[0]
                    // });
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

router.post("/active_offers", (req, res, next) => {

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
                            .populate({
                                path: 'offer_details.offer offer_details.primary_offer offer_details.rejected_group offer_details.active_group offer_details.requested_group',
                                populate: { path: 'userid bus_id' }
                            })
                            .exec()
                            .then(result => {
                                if (result.length < 1) {
                                    res.status(200).json({
                                        status: "Failed",
                                        message: "Please provide correct userid."
                                    })
                                } else {
                                    var docs = result[0].offer_details

                                    if (docs.length < 1) {
                                        res.status(200).json({
                                            status: "Ok",
                                            message: "No Active offers available.",
                                            offers: []
                                        })
                                    } else {
                                        contactsModel.distinct("existing_contacts.contact", { userid: ObjectId(req.body.userid) })
                                            .exec()
                                            .then(dex => {
                                                var no_contacts = 0
                                                var followers = result[0].followers.length
                                                var eligible_status = false
                                                var eligible_status_text = ""

                                                if (dex.length > 0) {
                                                    no_contacts = result[0].no_contacts
                                                }
                                                colorCodeModel.find({})
                                                    .exec()
                                                    .then(data => {
                                                        var test = [];
                                                        docs.map(doc => {

                                                            if (doc.is_primary_offer === true) {

                                                                var total = 0
                                                                var progress = 0
                                                                if (total === 0) {
                                                                    total = 0
                                                                    progress = 0
                                                                } else {
                                                                    if (doc.primary_contribution === true) {
                                                                        progress = 100
                                                                        total = 20
                                                                    }

                                                                }

                                                                var contributions = doc.contributions
                                                                var view_points_from = 0
                                                                var talent_points_from = 0
                                                                if (doc.primary_contribution === true) {
                                                                    if (contributions.length > 0) {
                                                                        contributions.forEach(function(con) {
                                                                            var date = new Date()
                                                                            var dates1 = date.setTime(date.getTime());
                                                                            var dateNow1 = new Date(dates1).toISOString();
                                                                            var current_day = String(dateNow1).split('T')
                                                                            var hists = (con.cont_date).toISOString();
                                                                            var history_date = String(hists).split('T')
                                                                            if (current_day[0] === history_date[0]) {
                                                                                progress = 100
                                                                                view_points_from = con.view_points_from
                                                                                talent_points_from = con.talent_points_from
                                                                            }

                                                                        })
                                                                    } else {
                                                                        progress = 0
                                                                    }
                                                                }
                                                                if (no_contacts >= 10 || followers >= 10 || no_contacts + followers >= 10) {
                                                                    eligible_status = true
                                                                } else {
                                                                    eligible_status = false
                                                                    progress = 0
                                                                    total = 0
                                                                }

                                                                eligible_status_text = "You have " + no_contacts + " friends and " + followers + " followers. Need atleast 10 connections."

                                                                var foe = {
                                                                    "offer_id": doc.primary_offer._id,
                                                                    "offer_name": doc.primary_offer.business_post_name,
                                                                    "offer_desc": doc.primary_offer.business_post_desc,
                                                                    "offer_rating": 0,
                                                                    "no_used": 0,
                                                                    "no_likes": 0,
                                                                    "no_comments": 0,
                                                                    "progress_val": parseInt(progress),
                                                                    "expiry_time": "",
                                                                    "offer_price": doc.primary_offer.business_post_price,
                                                                    "offer_img_url": constants.APIBASEURL + doc.primary_offer.business_post_logo,
                                                                    //  "offer_category": "Primary Offer",
                                                                    "no_of_items_remaining": 100000,
                                                                    "out_of_stock": false,
                                                                    "is_primary_offer": true,
                                                                    "offer_status": doc.offer_status,
                                                                    "coin_details": {
                                                                        "view_points": view_points_from,
                                                                        "talent_points": talent_points_from,
                                                                    },
                                                                    "offer_vendor": "Fvmegear",
                                                                    "is_liked": false,
                                                                    "menu": "",
                                                                    "is_custom": false,
                                                                    "has_group": false,
                                                                    "is_admin": true,
                                                                    "is_donated": true,
                                                                    "group_details": { users: [] },
                                                                    "discount": "",
                                                                    "contribution_status": total + " points are allocated.",
                                                                    "eligible_status": eligible_status,
                                                                    "eligible_status_fr": eligible_status_text,
                                                                    "payable_amount": parseFloat(doc.primary_offer.business_post_price).toFixed(2),
                                                                    "offer_category": "",
                                                                    "is_delivery_required": false,
                                                                    "daily_progress": parseInt(0),
                                                                    "today_contribution": parseInt(0)
                                                                }
                                                                test.push(foe)
                                                            } else {
                                                                var is_admin = false
                                                                var is_donated = false
                                                                var view_points_from = 0
                                                                var talent_points_from = 0
                                                                var today_contribution = 0
                                                                var count = 0
                                                                if (String(result[0]._id) === String(doc.admin)) {
                                                                    is_admin = true
                                                                    is_donated = false
                                                                }

                                                                var group = doc.active_group;
                                                                var active_group_members = []
                                                                var group_array = [];
                                                                var has_group = false
                                                                if (group.length > 0) {
                                                                    group.map(con => {
                                                                        active_group_members.push(ObjectId(con.userid._id))

                                                                        if (String(con._id) != String(doc.admin)) {

                                                                            var tag = con.userid.username;
                                                                            var tagname = (tag.charAt(0)).toUpperCase();
                                                                            var donated_today = false
                                                                            var tagcolor = "";
                                                                            if (doc.contributions.length > 0) {
                                                                                var contribution = doc.contributions
                                                                                var count_today = 0
                                                                                contribution.forEach(function(efe) {
                                                                                    var contributions = doc.contributions

                                                                                    var date = new Date()
                                                                                    var dates1 = date.setTime(date.getTime());
                                                                                    var dateNow1 = new Date(dates1).toISOString();
                                                                                    var current_day = String(dateNow1).split('T')
                                                                                    var hists = (efe.cont_date).toISOString();
                                                                                    var history_date = String(hists).split('T')
                                                                                    if (current_day[0] === history_date[0]) {
                                                                                        //today_contribution = parseInt(today_contribution) + parseInt(efe.cont_points)

                                                                                        if (String(efe.userid) === String(con._id)) {
                                                                                            count_today++
                                                                                        }
                                                                                        if (String(efe.userid) === String(result[0]._id)) {
                                                                                            count++
                                                                                        }

                                                                                    }
                                                                                })
                                                                                if (count_today >= 1) {
                                                                                    donated_today = true
                                                                                } else {
                                                                                    donated_today = false
                                                                                }
                                                                            }


                                                                            data.every(function(colors) {
                                                                                if (colors.letter === tagname) {
                                                                                    tagcolor = colors.color;
                                                                                    return false
                                                                                } else {
                                                                                    return true
                                                                                }
                                                                            })
                                                                            var profileimage = con.userid.profileimage;
                                                                            if (con.userid.profileimage === null) {
                                                                                profileimage = "uploads/userimage.png"
                                                                            }
                                                                            var foo = {
                                                                                "userid": con.userid._id,
                                                                                "username": con.userid.username,
                                                                                "background_color": "#" + tagcolor,
                                                                                "tag_name": tagname,
                                                                                "status": 1,
                                                                                "is_member_donated": donated_today,
                                                                                "image": constants.APIBASEURL + profileimage
                                                                            }
                                                                            group_array.push(foo)
                                                                        }
                                                                    })
                                                                }

                                                                if (doc.contributions.length > 0) {
                                                                    var contribution = doc.contributions
                                                                    var count_today = 0
                                                                    contribution.forEach(function(efe) {
                                                                        var contributions = doc.contributions
                                                                        var date = new Date()
                                                                        var dates1 = date.setTime(date.getTime());
                                                                        var dateNow1 = new Date(dates1).toISOString();
                                                                        var current_day = String(dateNow1).split('T')
                                                                        var hists = (efe.cont_date).toISOString();
                                                                        var history_date = String(hists).split('T')
                                                                        if (current_day[0] === history_date[0]) {
                                                                            console.log(today_contribution)
                                                                            today_contribution = parseInt(today_contribution) + parseInt(efe.cont_points)
                                                                        }
                                                                        if (String(efe.userid) === String(result[0]._id)) {
                                                                            count++
                                                                        }

                                                                    })

                                                                }

                                                                if (count >= 1) {
                                                                    if (is_admin === true) {
                                                                        is_donated = false
                                                                    } else {
                                                                        is_donated = true
                                                                    }

                                                                } else {
                                                                    is_donated = false
                                                                }

                                                                if (doc.offer.no_likes > 0) {
                                                                    likes = doc.no_likes
                                                                }
                                                                var is_liked = false;
                                                                var testlike = doc.offer.likes;
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
                                                                if (group_array.length > 0) {
                                                                    has_group = true
                                                                } else {
                                                                    has_group = false
                                                                }

                                                                var price = doc.offer.business_post_price
                                                                var discount = discounts(price)


                                                                var total = doc.total_contributions
                                                                var finals = price * (discount / 100)
                                                                var final = parseInt(finals * 10)
                                                                var final_total = price - finals
                                                                var final_disc = ((total / final) * discount)

                                                                var cont_limit = final - total
                                                                var cons = parseInt(finals * 10)
                                                                console.log("coins to be paid " + cons)

                                                                if (cons === 0) {
                                                                    cons = total
                                                                }
                                                                var progress = 0
                                                                if (total > 0) {
                                                                    progress = (total / cons) * 100
                                                                }

                                                                if (progress === 1) {
                                                                    progress = 100
                                                                } else {
                                                                    if (progress > 100) {
                                                                        progress = 100
                                                                    } else {
                                                                        progress = progress
                                                                    }

                                                                }

                                                                var diffDays = 0

                                                                if (doc.is_primary_offer === false) {

                                                                    var date = new Date()
                                                                    var dates1 = date.setTime(date.getTime());
                                                                    var dateNow1 = new Date(dates1).toISOString();
                                                                    var current_date = String(dateNow1).split('T')
                                                                    var current_day = current_date[0].split('-')
                                                                    var current = current_day[1] + "-" + current_day[2] + "-" + current_day[0] + " 00:00:00"


                                                                    var expiry_day = doc.offer.business_post_enddate
                                                                    var expiry_array = expiry_day.split('/')
                                                                    var expiry = expiry_array[1] + "-" + expiry_array[0] + "-" + expiry_array[2] + " 00:00:00"

                                                                    var user_expiry = (doc.created_at).toISOString()
                                                                    var user_expiry_date = String(user_expiry).split('T')
                                                                    var user_expiry_day = user_expiry_date[0].split('-')
                                                                    var user_day = user_expiry_day[1] + "-" + user_expiry_day[2] + "-" + user_expiry_day[0] + " 00:00:00"

                                                                    var today = new Date(current)
                                                                    var offer_expiry = new Date(expiry)
                                                                    var user_exp = new Date(user_day)

                                                                    var timeDiff = Math.abs(offer_expiry.getTime() - user_exp.getTime());
                                                                    var diffDays1 = Math.ceil(timeDiff / (1000 * 3600 * 24));

                                                                    var offer_date = ""

                                                                    if (diffDays1 > 10) {
                                                                        offer_date = new Date(user_exp.getTime() + (10 * 24 * 60 * 60 * 1000));
                                                                    } else {
                                                                        offer_date = new Date(user_exp.getTime() + (diffDays1 * 24 * 60 * 60 * 1000));
                                                                    }

                                                                    var timeDiff1 = Math.abs(offer_date.getTime() - today.getTime());
                                                                    diffDays = Math.ceil(timeDiff1 / (1000 * 3600 * 24));
                                                                } else {
                                                                    diffDays = 0;
                                                                }

                                                                var stock = doc.offer.no_of_items
                                                                var in_stock = false
                                                                if (parseInt(stock) === 0) {
                                                                    in_stock = true
                                                                }

                                                                var daily_amount = 0
                                                                var daily_progress = 0


                                                                if (diffDays > 0) {
                                                                    daily_amount = parseInt(cons / diffDays)
                                                                }


                                                                var todays_extra_contribution = 0
                                                                var date1 = new Date();
                                                                date1.setDate(date1.getDate() + 1);
                                                                var has_today_extra = false

                                                                if (typeof doc.todays_extra_contribution != 'undefined' && doc.todays_extra_contribution > 0) {

                                                                    var day = new Date()

                                                                    if ((doc.next_cont_date).setHours(0, 0, 0, 0) <= day.setHours(0, 0, 0, 0)) {


                                                                        today_contribution = parseInt(today_contribution) + parseInt(doc.todays_extra_contribution)
                                                                        has_today_extra = true
                                                                    }

                                                                    if ((doc.next_cont_date).setHours(0, 0, 0, 0) === date1.setHours(0, 0, 0, 0)) {
                                                                        todays_extra_contribution = doc.todays_extra_contribution
                                                                    }

                                                                }

                                                                if (today_contribution != 0 && daily_amount != 0 && today_contribution === daily_amount) {
                                                                    daily_progress = 100
                                                                } else {
                                                                    if (today_contribution != 0 && daily_amount != 0 && today_contribution > daily_amount) {

                                                                        var left_over_conts = parseInt(today_contribution - daily_amount)
                                                                        //var todays_extra_contribution = parseInt(left_over_conts)+parseInt(todays_extra_contribution)

                                                                        daily_progress = 100

                                                                    } else {
                                                                        if (today_contribution != 0 && daily_amount != 0) {

                                                                            if (has_today_extra === false) {
                                                                                daily_progress = parseInt((total / daily_amount) * 100)

                                                                                if (daily_progress > 100) {
                                                                                    daily_progress = 100

                                                                                }
                                                                            } else {
                                                                                daily_progress = parseInt((today_contribution / daily_amount) * 100)
                                                                            }


                                                                        } else {
                                                                            daily_progress = 0
                                                                        }

                                                                    }
                                                                }

                                                                var contribution_status = ""

                                                                if (parseInt(discount) === parseInt(final_disc)) {
                                                                    contribution_status = "Hurray!! You can now redeem your offer for " + parseInt(final_disc) + "% discount with the donated points."
                                                                } else {

                                                                    if (parseInt(final_disc) === 0) {
                                                                        contribution_status = "Donate points to get discount."
                                                                    } else {
                                                                        contribution_status = "You can get " + parseFloat(final_disc).toFixed(1) + "% discount with the donated points. Donate more points to get more discount."
                                                                    }

                                                                }


                                                                // console.log("final price after discount " + final)
                                                                console.log("total contributions" + today_contribution)
                                                                console.log("dicount " + daily_amount)
                                                                console.log("daily progress" + daily_progress)
                                                                console.log(group_array)
                                                                //console.log("progress " + progress)

                                                                var final_field = text_type.bold(parseFloat(final_total).toFixed(2))

                                                                if (parseInt(progress) >= 100 && in_stock === false) {
                                                                    daily_progress = 100
                                                                }

                                                                var disc = ""

                                                                if (discount > 0) {
                                                                    disc = "Upto " + discount + "% OFF."
                                                                }

                                                                var foe = {
                                                                    "offer_id": doc.offer._id,
                                                                    "offer_name": doc.offer.business_post_name,
                                                                    "offer_desc": doc.offer.business_post_desc,
                                                                    "offer_rating": doc.offer.offer_rating,
                                                                    "no_used": 0,
                                                                    "no_likes": doc.offer.likes.length,
                                                                    "no_comments": doc.offer.no_comments,
                                                                    "progress_val": parseInt(progress),
                                                                    "expiry_time": "In " + diffDays + " days",
                                                                    "offer_price": parseFloat(doc.offer.business_post_price),
                                                                    "offer_img_url": constants.APIBASEBIZURL + doc.offer.business_post_logo,
                                                                    // "offer_category": doc.offer.business_catetgory_type,
                                                                    "no_of_items_remaining": parseInt(doc.offer.no_of_items),
                                                                    "out_of_stock": in_stock,
                                                                    "is_primary_offer": doc.is_primary_offer,
                                                                    "offer_status": doc.offer_status,
                                                                    "coin_details": {
                                                                        "view_points": view_points_from,
                                                                        "talent_points": talent_points_from,
                                                                    },
                                                                    "offer_vendor": doc.offer.bus_id.bus_name,
                                                                    "likes": doc.offer.likes,
                                                                    "is_liked": is_liked,
                                                                    "menu": "",
                                                                    "is_custom": false,
                                                                    "has_group": has_group,
                                                                    "is_admin": is_admin,
                                                                    "is_donated": is_donated,
                                                                    "group_details": { users: group_array },
                                                                    "discount": disc,
                                                                    "contribution_status": contribution_status,
                                                                    "eligible_status": false,
                                                                    "eligible_status_fr": "",
                                                                    "payable_amount": parseFloat(final_total).toFixed(2),
                                                                    "offer_category": doc.offer.offer_category,
                                                                    "is_delivery_required": doc.offer.is_delivery_required,
                                                                    "daily_progress": parseInt(daily_progress),
                                                                    "today_contribution": parseInt(todays_extra_contribution)
                                                                }
                                                                test.push(foe)
                                                            }
                                                        })

                                                        test.sort(function(x, y) {
                                                            return y.is_primary_offer - x.is_primary_offer
                                                        });

                                                        res.status(200).json({
                                                            status: "Ok",
                                                            message: "Active offers",
                                                            total_offers: test.length,
                                                            offers: test
                                                        })
                                                    }).catch(err => {
                                                        console.log(err)
                                                        // var spliterror=err.message.split(":")
                                                        // res.status(500).json({
                                                        //     status: 'Failed',
                                                        //     message: spliterror[0]
                                                        // });
                                                    })
                                            }).catch(err => {
                                                console.log(err)
                                                // var spliterror=err.message.split(":")
                                                // res.status(500).json({
                                                //     status: 'Failed',
                                                //     message: spliterror[0]
                                                // });
                                            })
                                    }
                                }
                            }).catch(err => {
                                console.log(err)
                                // var spliterror=err.message.split(":")
                                //     res.status(500).json({
                                //         status: 'Failed',
                                //         message: spliterror[0]+ spliterror[1]
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



router.post("/get_offer_details", (req, res, next) => {

    var keyArray = ["userid", "iv_token", "clientid", "offer_id", "is_primary_offer"];
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
                        userDetails.find({userid: ObjectId(req.body.userid)})
                            .populate({
                                path: 'offer_details.offer offer_details.active_group offers_history.offer offers_history.primary_offer bus_id',
                                populate: {path: 'userid bus_id'}
                            })
                            .exec()
                            .then(data => {
                                console.log(req.body.offer_id)
                                contactsModel.distinct("existing_contacts.contact", {userid: ObjectId(req.body.userid)})
                                    .exec()
                                    .then(dex => {
                                        var offer_cat_desc_url = ""
                                        var no_contacts = 0
                                        var followers = 0
                                        var eligible_status = false
                                        if (dex.length > 0) {
                                            no_contacts = data[0].no_contacts
                                        }
                                        if (data.length < 1) {
                                            return res.status(200).json({
                                                status: "Failed",
                                                message: "Please provide correct userid."
                                            });
                                        } else {
                                            var active = data[0].offer_details;
                                            var active_offers = [];
                                            var redeem_offers = [];
                                            var redeem = data[0].offers_history
                                            followers = data[0].followers.length

                                            console.log(req.body.is_primary_offer)


                                            if (req.body.is_primary_offer === true) {
                                                primaryOffers.find({_id: req.body.offer_id})
                                                    .exec()
                                                    .then(docs => {
                                                        var is_liked = false;
                                                        var offer_type = "primary_offers"
                                                        var progress = 0
                                                        var total = 0
                                                        var payment_id = ""
                                                        var payment_status = ""
                                                        var payment_type = ""

                                                        active.every(function (efe) {
                                                            if (efe.is_primary_offer === true) {
                                                                if (String(efe.primary_offer._id) === String(req.body.offer_id)) {
                                                                    offer_type = "active_offers"
                                                                    return false
                                                                } else {
                                                                    return true
                                                                }
                                                            } else {
                                                                if (String(efe.offer._id) === String(req.body.offer_id)) {
                                                                    offer_type = "active_offers"
                                                                    return false
                                                                } else {
                                                                    return true
                                                                }
                                                            }

                                                        })
                                                        redeem.every(function (efe) {
                                                            if (efe.is_primary_offer === true) {
                                                                if (String(efe.primary_offer._id) === String(req.body.offer_id)) {
                                                                    offer_type = "history_offers"
                                                                    payment_id = ""
                                                                    payment_status = "completed"
                                                                    payment_type = ""
                                                                    return false
                                                                } else {
                                                                    return true
                                                                }
                                                            } else {
                                                                if (String(efe.offer._id) === String(req.body.offer_id)) {
                                                                    offer_type = "history_offers"
                                                                    payment_id = ""
                                                                    payment_status = "completed"
                                                                    payment_type = ""
                                                                    return false
                                                                } else {
                                                                    return true
                                                                }
                                                            }
                                                        })
                                                        var price = docs[0].business_post_price
                                                        var discount = 0

                                                        var offers = data[0].offer_details
                                                        var view_points_from = 0
                                                        var talent_points_from = 0

                                                        if (offers.length > 0) {
                                                            var found = offers.find(o => String(o.primary_offer) === String(req.body.offer_id))
                                                            if (typeof found === 'undefined') {
                                                                progress = 0
                                                                total = 0
                                                            } else {
                                                                //total = found.total_contributions

                                                                if (total === 0) {
                                                                    total = 0
                                                                    progress = 0
                                                                } else {
                                                                    if (found.primary_contribution === true) {
                                                                        progress = 100
                                                                        total = 20
                                                                    }

                                                                }

                                                                var contributions = found.contributions

                                                                if (found.primary_contribution === true) {
                                                                    if (contributions.length > 0) {
                                                                        contributions.forEach(function (con) {
                                                                            var date = new Date()
                                                                            var dates1 = date.setTime(date.getTime());
                                                                            var dateNow1 = new Date(dates1).toISOString();
                                                                            var current_day = String(dateNow1).split('T')
                                                                            var hists = (con.cont_date).toISOString();
                                                                            var history_date = String(hists).split('T')
                                                                            if (current_day[0] === history_date[0]) {
                                                                                progress = 100
                                                                                view_points_from = con.view_points_from
                                                                                talent_points_from = con.talent_points_from
                                                                            }

                                                                        })
                                                                    }
                                                                }

                                                            }

                                                        }
                                                        if (no_contacts >= 10 || followers >= 10 || no_contacts + followers >= 10) {
                                                            eligible_status = true
                                                        } else {
                                                            eligible_status = false
                                                            progress = 0
                                                            total = 0
                                                        }

                                                        eligible_status_text = "You have " + no_contacts + " friends and " + followers + " followers. Need atleast 10 connections."

                                                        res.status(200).json({
                                                            status: "Ok",
                                                            message: "Offer Details",
                                                            offer: {
                                                                "offer_id": docs[0]._id,
                                                                "offer_name": docs[0].business_post_name,
                                                                "offer_desc": docs[0].business_post_desc,
                                                                "offer_rating": 0,
                                                                "no_used": 0,
                                                                "no_likes": 0,
                                                                "expiry_time": "",
                                                                "offer_validity": 0,
                                                                "progress_val": parseInt(progress),
                                                                "no_comments": 0,
                                                                "is_primary_offer": true,
                                                                "offer_price": docs[0].business_post_price,
                                                                "offer_img_url": constants.APIBASEURL + docs[0].business_post_logo,
                                                                //  "offer_category": "Primary Offer",
                                                                "no_of_items_remaining": 100000,
                                                                "out_of_stock": false,
                                                                "offer_vendor": "Fvmegear",//doc.bus_id.bus_name
                                                                "is_liked": is_liked,
                                                                "menu": "",
                                                                "coin_details": {
                                                                    "view_points": view_points_from,
                                                                    "talent_points": talent_points_from,
                                                                },
                                                                "is_custom": false,
                                                                "is_admin": true,
                                                                "is_donated": true,
                                                                "has_group": false,
                                                                "offer_type": offer_type,
                                                                "discount": "",
                                                                "group_details": {users: []},
                                                                "contribution_status": total + " points are allocated.",
                                                                "eligible_status": eligible_status,
                                                                "eligible_status_fr": eligible_status_text,
                                                                "payment_status": payment_status,
                                                                "payment_id": payment_id,
                                                                "payment_type": payment_type,
                                                                "payable_amount": parseFloat(docs[0].business_post_price).toFixed(2),
                                                                "offer_category": "Primary Offer",
                                                                "is_coming_soon": false,
                                                                "is_wish_listed": false,
                                                                "is_delivery_required": false,
                                                                "offer_cat_desc_url": offer_cat_desc_url,
                                                                "daily_progress": parseInt(0),
                                                                "today_contribution": parseInt(0)
                                                            }
                                                        });

                                                    }).catch(err => {
                                                        console.log(err)
                                                    // var spliterror = err.message.split("_")
                                                    // if (spliterror[1].indexOf("id") >= 0) {
                                                    //     res.status(200).json({
                                                    //         status: 'Failed',
                                                    //         message: "Please provide correct offer_id"
                                                    //     });
                                                    // } else {
                                                    //     res.status(500).json({
                                                    //         status: 'Failed',
                                                    //         message: err.message
                                                    //     });
                                                    // }
                                                });
                                            } else {
                                                bsOffers.find({_id: req.body.offer_id})
                                                    .populate('bus_id')
                                                    .exec()
                                                    .then(docs => {
                                                        colorCodeModel.find({})
                                                            .exec()
                                                            .then(datas => {
                                                                if (docs.length > 0) {

                                                                    var is_liked = false;
                                                                    docs.map(like => {
                                                                        var testlike = like.likes;
                                                                        if (testlike.length < 1) {
                                                                            is_liked = false;
                                                                        } else {
                                                                            testlike.every(function (newlike) {
                                                                                if (String(newlike) === String(req.body.userid)) {
                                                                                    is_liked = true;
                                                                                    return false
                                                                                } else {
                                                                                    return true
                                                                                }
                                                                            })
                                                                        }
                                                                    })
                                                                    var likes = 0;
                                                                    if (docs[0].no_likes > 0) {
                                                                        likes = docs[0].no_likes
                                                                    }

                                                                    var offer_type = "available_offers"
                                                                    var progress = 0
                                                                    var contribution = ""
                                                                    var payment_id = ""
                                                                    var payment_status = ""
                                                                    var payment_type = ""
                                                                    var has_group = false
                                                                    var today_contribution = 0
                                                                    var count = 0
                                                                    active.every(function (efe) {
                                                                        if (efe.is_primary_offer === true) {
                                                                            if (String(efe.primary_offer._id) === String(req.body.offer_id)) {
                                                                                offer_type = "active_offers"

                                                                                return false
                                                                            } else {
                                                                                return true
                                                                            }
                                                                        } else {
                                                                            if (String(efe.offer._id) === String(req.body.offer_id)) {
                                                                                offer_type = "active_offers"
                                                                                if (efe.active_group.length > 0) {
                                                                                    has_group = true
                                                                                }
                                                                                return false
                                                                            } else {
                                                                                return true
                                                                            }
                                                                        }

                                                                    })
                                                                    redeem.every(function (efe) {
                                                                        if (efe.is_primary_offer === true) {
                                                                            if (String(efe.primary_offer._id) === String(req.body.offer_id)) {
                                                                                offer_type = "history_offers"
                                                                                payment_id = ""
                                                                                payment_status = ""
                                                                                payment_type = ""

                                                                                return false
                                                                            } else {
                                                                                return true
                                                                            }
                                                                        } else {
                                                                            if (String(efe.offer._id) === String(req.body.offer_id)) {
                                                                                offer_type = "history_offers"
                                                                                payment_id = efe.payment_id
                                                                                payment_status = efe.pay_status
                                                                                payment_type = efe.payment_type
                                                                                // if(efe.active_group.length > 0){
                                                                                //  has_group = true
                                                                                // }
                                                                                return false
                                                                            } else {
                                                                                return true
                                                                            }
                                                                        }
                                                                    })

                                                                    var price = docs[0].business_post_price
                                                                    var discount = discounts(price)

                                                                    var disc = ""

                                                                    if (discount > 0) {
                                                                        disc = "Upto "+discount + "% OFF."
                                                                    }

                                                                    var offers = data[0].offer_details
                                                                    var progress = 0
                                                                    var view_points_from = 0
                                                                    var talent_points_from = 0
                                                                    var cont_limit = 0
                                                                    var price = docs[0].business_post_price
                                                                    var total = 0
                                                                    var finals = price * (discount / 100)
                                                                    var final = finals * 10
                                                                    var final_total = price - finals

                                                                    var offer_contributions = []
                                                                    var is_admin = false
                                                                    var is_donated = false
                                                                    var group_array = []

                                                                    if (offers.length > 0) {
                                                                        var found = offers.find(o => o.is_primary_offer === false && String(o.offer._id) === String(req.body.offer_id))
                                                                        if (typeof found === 'undefined') {
                                                                            progress = 0
                                                                        } else {
                                                                            if (String(found.admin) === String(data[0]._id)) {
                                                                                is_admin = true
                                                                                is_donated = false
                                                                            }
                                                                            total = found.total_contributions
                                                                            offer_contributions = found.contributions
                                                                            if (total === 0) {
                                                                                total = 0
                                                                                progress = 0
                                                                            }

                                                                            var group = found.active_group;
                                                                            var group_array = [];
                                                                            if (group.length > 0) {
                                                                                group.map(con => {
                                                                                    if (String(con._id) != String(found.admin)) {

                                                                                        var tag = con.userid.username;
                                                                                        var donated_today = false
                                                                                        var tagname = (tag.charAt(0)).toUpperCase();
                                                                                        console.log(tagname)
                                                                                        var tagcolor = "";

                                                                                        if (found.contributions.length > 0) {
                                                                                            var contribution = found.contributions

                                                                                            var count_today = 0
                                                                                            contribution.forEach(function (efe) {
                                                                                                var contributions = found.contributions
                                                                                                
                                                                                                    var date = new Date()
                                                                                                    var dates1 = date.setTime(date.getTime());
                                                                                                    var dateNow1 = new Date(dates1).toISOString();
                                                                                                    var current_day = String(dateNow1).split('T')
                                                                                                    var hists = (efe.cont_date).toISOString();
                                                                                                    var history_date = String(hists).split('T')

                                                                                                    if (current_day[0] === history_date[0]) {
                                                                                                     //   today_contribution = parseInt(today_contribution) + parseInt(efe.cont_points)
                                                                                                        if (String(efe.userid) === String(con._id)) {
                                                                                                        count_today++
                                                                                                        console.log(count_today)
                                                                                                    }
                                                                                                    if(String(efe.userid) === String(data[0]._id)){
                                                                                                            count++ 
                                                                                                    }
                                                        
                                                                                                } 
                                                                                            })
                                                                                            if (count_today >= 1) {
                                                                                                donated_today = true
                                                                                            } else {
                                                                                                donated_today = false
                                                                                            }
                                                                                        }

                                                                                        console.log("today donated " + donated_today)

                                                                                        datas.every(function (colors) {
                                                                                            if (colors.letter === tagname) {
                                                                                                tagcolor = colors.color;
                                                                                                return false
                                                                                            } else {
                                                                                                return true
                                                                                            }
                                                                                        })
                                                                                        var profileimage = con.userid.profileimage;
                                                                                        if (con.userid.profileimage === null) {
                                                                                            profileimage = "uploads/userimage.png"
                                                                                        }
                                                                                        var foo = {
                                                                                            "userid": con.userid._id,
                                                                                            "username": con.userid.username,
                                                                                            "background_color": "#" + tagcolor,
                                                                                            "tag_name": tagname,
                                                                                            "status": 1,
                                                                                            "is_member_donated": donated_today,
                                                                                            "image": constants.APIBASEURL + profileimage
                                                                                        }
                                                                                        group_array.push(foo)
                                                                                    }
                                                                                })
                                                                            }
                                                                                if (found.contributions.length > 0) {
                                                                                            var contribution = found.contributions

                                                                                            var count_today = 0
                                                                                            contribution.forEach(function (efe) {
                                                                                                var contributions = found.contributions

                                                                                                    var date = new Date()
                                                                                                    var dates1 = date.setTime(date.getTime());
                                                                                                    var dateNow1 = new Date(dates1).toISOString();
                                                                                                    var current_day = String(dateNow1).split('T')
                                                                                                    var hists = (efe.cont_date).toISOString();
                                                                                                    var history_date = String(hists).split('T')

                                                                                                    if (current_day[0] === history_date[0]) {
                                                                                                        today_contribution = parseInt(today_contribution) + parseInt(efe.cont_points)
                                                                                                        count_today++
                                                                                                        console.log(count_today)
                                                                                                        if(String(efe.userid) === String(data[0]._id)){
                                                                                                                count++ 
                                                                                                        }
                                                                                                    }
                                                        
                                                                                            })
                                                                                            if (count_today >= 1) {
                                                                                                donated_today = true
                                                                                            } else {
                                                                                                donated_today = false
                                                                                            }
                                                                                        }
                                                                            

                                                                            if (count >= 1) {
                                                                                if (is_admin === true) {
                                                                                    is_donated = false
                                                                                } else {
                                                                                    is_donated = true
                                                                                }

                                                                            } else {
                                                                                is_donated = false
                                                                            }


                                                                            var cont_limit = final - total
                                                                            var cons = parseInt(finals * 10)

                                                                            if (cons === 0) {
                                                                                cons = total
                                                                            }
                                                                            if (total > 0) {
                                                                                progress = Math.floor(total / cons * 100)

                                                                                if (progress > 100) {
                                                                                    progress = 100
                                                                                }
                                                                            }

                                                                            var date = new Date()
                                                                            var dates1 = date.setTime(date.getTime());
                                                                            var dateNow1 = new Date(dates1).toISOString();
                                                                            var current_date = String(dateNow1).split('T')
                                                                            var current_day = current_date[0].split('-')
                                                                            var current = current_day[1] + "-" + current_day[2] + "-" + current_day[0] + " 00:00:00"


                                                                            var expiry_day = docs[0].business_post_enddate
                                                                            var expiry_array = expiry_day.split('/')
                                                                            var expiry = expiry_array[1] + "-" + expiry_array[0] + "-" + expiry_array[2] + " 00:00:00"

                                                                            var user_expiry = (found.created_at).toISOString()
                                                                            var user_expiry_date = String(user_expiry).split('T')
                                                                            var user_expiry_day = user_expiry_date[0].split('-')
                                                                            var user_day = user_expiry_day[1] + "-" + user_expiry_day[2] + "-" + user_expiry_day[0] + " 00:00:00"

                                                                            var today = new Date(current)
                                                                            var offer_expiry = new Date(expiry)
                                                                            var user_exp = new Date(user_day)

                                                                            var timeDiff = Math.abs(offer_expiry.getTime() - user_exp.getTime());
                                                                            var diffDays1 = Math.ceil(timeDiff / (1000 * 3600 * 24));

                                                                            var offer_date = ""

                                                                            if (diffDays1 > 10) {
                                                                                offer_date = new Date(user_exp.getTime() + (10 * 24 * 60 * 60 * 1000));
                                                                            } else {
                                                                                offer_date = new Date(user_exp.getTime() + (diffDays1 * 24 * 60 * 60 * 1000));
                                                                            }

                                                                            var timeDiff1 = Math.abs(offer_date.getTime() - today.getTime());
                                                                            diffDays = Math.ceil(timeDiff1 / (1000 * 3600 * 24));


                                                                        }
                                                                    }
                                                                    if (typeof diffDays === 'undefined') {
                                                                        var diffDays = 0
                                                                        var date = new Date()
                                                                        var dates1 = date.setTime(date.getTime());
                                                                        var dateNow1 = new Date(dates1).toISOString();
                                                                        var current_date = String(dateNow1).split('T')
                                                                        var expiry_day = docs[0].business_post_enddate
                                                                        var expiry_array = expiry_day.split('/')
                                                                        var current_day = current_date[0].split('-')
                                                                        var expiry = expiry_array[1] + "-" + expiry_array[0] + "-" + expiry_array[2] + " 00:00:00"
                                                                        var current = current_day[1] + "-" + current_day[2] + "-" + current_day[0] + " 00:00:00"
                                                                        var today = new Date(current)
                                                                        var offer_expiry = new Date(expiry)
                                                                        var timeDiff = Math.abs(offer_expiry.getTime() - today.getTime());
                                                                        diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                                                    }
                                                                    cont_limit = Math.floor(final_total - total)

                                                                    var stock = docs[0].no_of_items
                                                                    var in_stock = false
                                                                    if (parseInt(stock) === 0) {
                                                                        in_stock = true
                                                                    }

                                                                    var daily_amount = 0
                                                                    var daily_progress = 0
                                                                    

                                                                    if (diffDays > 0) {
                                                                        daily_amount = parseInt(cons / diffDays)
                                                                    }

                                                                        var todays_extra_contribution = 0
                                                                        var date1 = new Date();
                                                                        date1.setDate(date1.getDate() + 1);
                                                                        var has_today_extra = false

                                                                        if (typeof found != 'undefined' && typeof found.todays_extra_contribution != 'undefined' && found.todays_extra_contribution > 0) {

                                                                            var day = new Date()
                                                                            
                                                                            if ((found.next_cont_date).setHours(0, 0, 0, 0) <= day.setHours(0, 0, 0, 0)) {


                                                                                today_contribution = parseInt(today_contribution) + parseInt(found.todays_extra_contribution)
                                                                                has_today_extra = true
                                                                            }

                                                                            if((found.next_cont_date).setHours(0, 0, 0, 0) === date1.setHours(0, 0, 0, 0)){
                                                                                todays_extra_contribution = found.todays_extra_contribution
                                                                            }

                                                                        }

                                                                        if (today_contribution != 0 && daily_amount != 0 && today_contribution === daily_amount) {
                                                                            daily_progress = 100
                                                                        } 
                                                                        else {
                                                                            if (today_contribution != 0 && daily_amount != 0 && today_contribution > daily_amount) {

                                                                                var left_over_conts = parseInt(today_contribution - daily_amount)
                                                                                //var todays_extra_contribution = parseInt(left_over_conts)+parseInt(todays_extra_contribution)

                                                                                daily_progress = 100

                                                                            } else {
                                                                                if (today_contribution != 0 && daily_amount != 0) {
                                                                                    
                                                                                    if(has_today_extra === false){
                                                                                        daily_progress = parseInt((total / daily_amount) * 100)
                                                                                        
                                                                                        if(daily_progress > 100){
                                                                                            daily_progress = 100
                                                                                            
                                                                                        }
                                                                                    }
                                                                                    else{
                                                                                        daily_progress = parseInt((today_contribution / daily_amount) * 100)
                                                                                    }

                                                                                   
                                                                                } else {
                                                                                    daily_progress = 0
                                                                                }

                                                                            }
                                                                        }
                                                                        var final_disc = ((total / final)*discount)
                                                                        var contribution_status  = ""

                                                                    if(parseInt(discount) === parseInt(final_disc)){
                                                                        contribution_status =  "Hurray!! You can now redeem your offer for "+parseInt(final_disc)+"% discount with the donated points."
                                                                    }
                                                                    else{
                                                                       if(parseInt(final_disc) === 0){
                                                                            contribution_status =  "Donate points to get discount."
                                                                        }
                                                                        else{
                                                                            contribution_status =  "You can get "+parseFloat(final_disc).toFixed(1)+"% discount with the donated points. Donate more points to get more discount."
                                                                        }
                                                                    }

                                                                    if(parseInt(progress) >= 100 && in_stock === false){
                                                                        daily_progress = 100
                                                                    }
                                                                    

                                                                    console.log("daily_progress" + daily_progress)
                                                                    console.log("today_contribution" + today_contribution)
                                                                    console.log("daily_amount" + daily_amount)


                                                                    console.log("progress " + progress)
                                                                    res.status(200).json({
                                                                        status: "Ok",
                                                                        message: "Offer Details",
                                                                        offer: {
                                                                            "offer_id": docs[0]._id,
                                                                            "offer_name": docs[0].business_post_name,
                                                                            "offer_desc": docs[0].business_post_desc,
                                                                            "offer_rating": docs[0].offer_rating,
                                                                            "no_used": 0,
                                                                            "no_likes": docs[0].likes.length,
                                                                            "expiry_time": "Expires in " + diffDays + " days",
                                                                            "offer_validity": 0,
                                                                            "progress_val": parseInt(progress),
                                                                            "no_comments": docs[0].no_comments,
                                                                            "offer_price": parseFloat(docs[0].business_post_price),
                                                                            "offer_img_url": constants.APIBASEBIZURL + docs[0].business_post_logo,
                                                                            //  "offer_category": docs[0].business_catetgory_type,
                                                                            "no_of_items_remaining": parseInt(docs[0].no_of_items),
                                                                            "out_of_stock": in_stock,
                                                                            "offer_vendor": docs[0].bus_id.bus_name,
                                                                            "is_liked": is_liked,
                                                                            "is_admin": is_admin,
                                                                            "is_donated": is_donated,
                                                                            "has_group": has_group,
                                                                            "group_details": {users: group_array},
                                                                            "menu": "",
                                                                            "coin_details": {
                                                                                "view_points": view_points_from,
                                                                                "talent_points": talent_points_from,
                                                                            },
                                                                            "is_custom": false,
                                                                            "offer_type": offer_type,
                                                                            "discount": disc,
                                                                            "contribution_status": contribution_status,
                                                                            "is_primary_offer": false,
                                                                            "eligible_status": false,
                                                                            "eligible_status_fr": "",
                                                                            "payment_status": payment_status,
                                                                            "payment_id": payment_id,
                                                                            "payment_type": payment_type,
                                                                            "payable_amount": parseFloat(final_total).toFixed(2),
                                                                            "offer_category": docs[0].offer_category,
                                                                            "is_coming_soon": false,
                                                                            "is_wish_listed": false,
                                                                            "is_delivery_required": docs[0].is_delivery_required,
                                                                            "offer_cat_desc_url": offer_cat_desc_url,
                                                                            "daily_progress": parseInt(daily_progress),
                                                                            "today_contribution": parseInt(todays_extra_contribution)
                                                                        }
                                                                    });
                                                                } else {
                                                                    wishlistOffers.find({_id: ObjectId(req.body.offer_id)})
                                                                        .exec()
                                                                        .then(docs => {
                                                                            var is_liked = false;
                                                                            var offer_type = "primary_offers"
                                                                            var progress = 0
                                                                            var total = 0

                                                                            var price = docs[0].business_post_price
                                                                            var discount = 0

                                                                            var view_points_from = 0
                                                                            var talent_points_from = 0

                                                                            var eligible_status_text = ""
                                                                            var eligible_status = false

                                                                            if (docs[0].no_likes > 0) {
                                                                                likes = docs[0].no_likes
                                                                            }
                                                                            var is_liked = false;
                                                                            var testlike = docs[0].likes;
                                                                            if (typeof testlike === 'undefined') {
                                                                                is_liked = false;
                                                                            } else {
                                                                                testlike.every(function (newlike) {
                                                                                    if (String(newlike) === String(req.body.userid)) {
                                                                                        is_liked = true;
                                                                                        return false
                                                                                    } else {
                                                                                        return true
                                                                                    }
                                                                                })
                                                                            }

                                                                            var is_wish_listed = false
                                                                            var is_coming_soon = true

                                                                            if (data[0].wishlist_offers.length > 0) {
                                                                                var wish = data[0].wishlist_offers

                                                                                wish.every(function (wish_list) {
                                                                                    if (String(wish_list.offer) === String(req.body.offer_id)) {
                                                                                        is_wish_listed = true;
                                                                                        is_coming_soon = false
                                                                                        return false
                                                                                    } else {
                                                                                        return true
                                                                                    }
                                                                                })
                                                                            }

                                                                            var price = docs[0].business_post_price
                                                                            var discount = discounts_wishlist(price)
                                                                            var disc = ""

                                                                             if (discount > 0) {
                                                                                    disc = "Upto "+discount + "% OFF."
                                                                                }

                                                                            var finals = price * (discount / 100)
                                                                            var final = finals * 10
                                                                            var final_total = price - finals


                                                                            res.status(200).json({
                                                                                status: "Ok",
                                                                                message: "Offer Details",
                                                                                offer: {
                                                                                    "offer_id": docs[0]._id,
                                                                                    "offer_name": docs[0].business_post_name,
                                                                                    "offer_desc": docs[0].business_post_desc,
                                                                                    "offer_rating": 0,
                                                                                    "no_used": 0,
                                                                                    "no_likes": docs[0].likes.length,
                                                                                    "expiry_time": "",
                                                                                    "offer_validity": 0,
                                                                                    "progress_val": parseInt(progress),
                                                                                    "no_comments": docs[0].comments.length,
                                                                                    "is_primary_offer": false,
                                                                                    "offer_price": docs[0].business_post_price,
                                                                                    "offer_img_url": constants.APIBASEURL + docs[0].business_post_logo,
                                                                                    //  "offer_category": "Primary Offer",
                                                                                    "no_of_items_remaining": 10000,
                                                                                    "out_of_stock": false,
                                                                                    "offer_vendor": "Fvmegear",//doc.bus_id.bus_name
                                                                                    "is_liked": is_liked,
                                                                                    "menu": "",
                                                                                    "coin_details": {
                                                                                        "view_points": view_points_from,
                                                                                        "talent_points": talent_points_from,
                                                                                    },
                                                                                    "is_custom": false,
                                                                                    "is_admin": true,
                                                                                    "is_donated": true,
                                                                                    "has_group": false,
                                                                                    "offer_type": "coming soon",
                                                                                    "discount": disc,
                                                                                    "group_details": {users: []},
                                                                                    "contribution_status": "",
                                                                                    "eligible_status": eligible_status,
                                                                                    "eligible_status_fr": eligible_status_text,
                                                                                    "payment_status": "",
                                                                                    "payment_id": "",
                                                                                    "payment_type": "",
                                                                                    "payable_amount": parseFloat(final_total).toFixed(2),
                                                                                    "offer_category": "Stellar",
                                                                                    "is_coming_soon": is_coming_soon,
                                                                                    "is_wish_listed": is_wish_listed,
                                                                                    "is_delivery_required": false,
                                                                                    "offer_cat_desc_url": offer_cat_desc_url,
                                                                                    "daily_progress": parseInt(0),
                                                                                    "today_contribution": parseInt(0)
                                                                                }
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

                                                    }).catch(err => {
                                                    console.log(err)
                                                    var spliterror = err.message.split("_")
                                                    if (spliterror[1].indexOf("id") >= 0) {
                                                        res.status(200).json({
                                                            status: 'Failed',
                                                            message: "Please provide correct offer_id"
                                                        });
                                                    } else {
                                                        res.status(500).json({
                                                            status: 'Failed',
                                                            message: err.message
                                                        });
                                                    }
                                                });
                                            }
                                        }
                                    }).catch(err => {
                                    console.log(err)
                                    // var spliterror = err.message.split("_")
                                    // if (spliterror[1].indexOf("userid") >= 0) {
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
                            console.log(err)
                            // var spliterror = err.message.split("_")
                            // if (spliterror[1].indexOf("userid") >= 0) {
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


router.post("/select_offer", (req, res, next) => {

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
                        bsOffers.find({ _id: req.body.offer_id })
                            .exec()
                            .then(docs => {

                                userDetails.find({ userid: ObjectId(req.body.userid) })
                                    .exec()
                                    .then(data => {
                                        if (data.length < 1) {
                                            res.status(200).json({
                                                status: "Failed",
                                                message: "Please provide correct userid."
                                            })
                                        } else {
                                            var offers = data[0].offer_details;
                                            var is_offer_exists = false

                                            if (offers.length < 0) {
                                                res.status(200).json({
                                                    status: 'Failed',
                                                    message: "You have crossed your offer selection limit."
                                                });
                                            } else {

                                                offers.forEach(function(ele) {
                                                    if (ele.is_primary_offer === false) {
                                                        if (String(ele.offer) === String(req.body.offer_id)) {
                                                            is_offer_exists = true
                                                        }
                                                    }
                                                })

                                                if (is_offer_exists === false) {

                                                    userDetails.findOneAndUpdate({ userid: ObjectId(req.body.userid) }, {
                                                            $push: {
                                                                offer_details: {
                                                                    offer: docs[0]._id,
                                                                    offer_status: "Active",
                                                                    offer_category: docs[0].business_catetgory_type,
                                                                    admin: data[0]._id
                                                                }
                                                            }
                                                        })

                                                        .exec()
                                                        .then(result => {
                                                            if (result === null) {
                                                                res.status(200).json({
                                                                    status: 'Failed',
                                                                    message: "Please provide correct userid"
                                                                });
                                                            } else {
                                                                res.status(200).json({
                                                                    status: "Ok",
                                                                    message: "Offer selected successfully."
                                                                });
                                                            }
                                                        }).catch(err => { //catch for userid update
                                                            var spliterror = err.message.split(":")
                                                            res.status(500).json({
                                                                status: 'Failed',
                                                                message: spliterror[0]
                                                            });
                                                        });
                                                } else {
                                                    res.status(200).json({
                                                        status: 'Failed',
                                                        message: "You have already selected this offer."
                                                    });
                                                }
                                            }
                                        }
                                    }).catch(err => {
                                        var spliterror = err.message.split(":")
                                        res.status(500).json({
                                            status: 'Failed',
                                            message: spliterror[0] + spliterror[1]
                                        });
                                    });

                            }).catch(err => { //catch for offer_id find.
                                var spliterror = err.message.split("_")
                                if (spliterror[1].indexOf("id") >= 0) {
                                    res.status(200).json({
                                        status: 'Failed',
                                        message: "Please provide correct offer_id"
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

router.post("/get_offer_history", (req, res, next) => {

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
                        userDetails.find({ userid: ObjectId(req.body.userid) })
                            //.populate('offers_history.offer','-__v -clicks -views -redeem -iv_acountid')
                            .populate({
                                path: 'offers_history.offer offers_history.primary_offer selected_address',
                                populate: { path: 'bus_id' }
                            })
                            //   .sort({'offers_history.redeemed_on':1})
                            .select('-offers_history._id ')
                            .exec()
                            .then(result => {
                                if (result.length < 1) {
                                    res.status(200).json({
                                        status: "Failed",
                                        message: "Please provide correct userid."
                                    })
                                } else {

                                    var docs = result[0].offers_history;
                                    if (docs.length < 1) {
                                        res.status(200).json({
                                            status: "Ok",
                                            message: "No History available",
                                            offers: []
                                        })
                                    } else {
                                        var offer_cat_desc_url = ""
                                        var perPage = 20;
                                        var page = req.body.page_no;

                                        if (isEmpty(page)) {
                                            page = 1
                                        }
                                        var skip = (perPage * page) - perPage;
                                        var limit = skip + perPage;;
                                        var test = [];

                                        docs.map(doc => {

                                            if (doc.is_primary_offer === true) {

                                                var date_redeem = new Date(doc.redeemed_on)
                                                var redeem = date_redeem.getDate() + "-" + (date_redeem.getMonth() + 1) + "-" + date_redeem.getFullYear()

                                                console.log(redeem)

                                                var foe = {
                                                    "offer_id": doc.primary_offer._id,
                                                    "offer_name": doc.primary_offer.business_post_name,
                                                    "offer_desc": doc.primary_offer.business_post_desc,
                                                    "offer_rating": doc.primary_offer.offer_rating,
                                                    "no_used": 0,
                                                    "no_likes": 0,
                                                    "no_comments": 0,
                                                    "progress_val": 0,
                                                    "offer_exp_time": 0,
                                                    "offer_price": parseFloat(doc.primary_offer.business_post_price),
                                                    "offer_img_url": constants.APIBASEURL + doc.primary_offer.business_post_logo,
                                                    //  "offer_category": doc.offer.business_catetgory_type,
                                                    "no_of_items_remaining": 100000,
                                                    "out_of_stock": true,
                                                    "is_primary_offer": true,
                                                    "redeemed_on": redeem,
                                                    "offer_vendor": 'Fvmegear',
                                                    "likes": [],
                                                    "is_liked": false,
                                                    "menu": "",
                                                    "is_custom": false,
                                                    "eligible_status": false,
                                                    "eligible_status_fr": "",
                                                    "payment_status": "Completed",
                                                    "payment_id": "",
                                                    "payment_type": "",
                                                    "offer_category": "Primary Offer",
                                                    "is_delivery_required": false,
                                                    "address_name": "",
                                                    "lottery_message": "Lottery won on " + redeem,
                                                    "offer_cat_desc_url": offer_cat_desc_url
                                                }
                                                test.push(foe)
                                            } else {
                                                var likes = 0;
                                                if (doc.offer.no_likes > 0) {
                                                    likes = doc.offer.no_likes
                                                }
                                                var is_liked = false;
                                                var testlike = doc.offer.likes;
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

                                                var stock = doc.offer.no_of_items
                                                var in_stock = false
                                                if (parseInt(stock) === 0) {
                                                    in_stock = true
                                                }
                                                var payment_status = doc.pay_status
                                                var payment_id = doc.payment_id
                                                var payment_type = doc.payment_type

                                                if (typeof doc.pay_status === 'undefined') {
                                                    payment_status = ""
                                                }
                                                if (typeof doc.payment_id === 'undefined') {
                                                    payment_id = ""
                                                }
                                                if (typeof doc.payment_type === 'undefined') {
                                                    payment_type = ""
                                                }

                                                var address_name = ""

                                                if (doc.offer.is_delivery_required === true) {

                                                    if (typeof doc.selected_address === 'undefined') {
                                                        address_name = ""
                                                    } else {

                                                        if (doc.selected_address === null) {
                                                            address_name = ""
                                                        } else {
                                                            address_name = doc.selected_address.address_name
                                                        }
                                                    }

                                                }

                                                var redeem_on = new Date(doc.redeemed_on)
                                                var days = redeem_on.getDate()
                                                var months = redeem_on.getMonth() + 1
                                                var years = redeem_on.getFullYear()

                                                var redeemed_on = days + "-" + months + "-" + years
                                                console.log(redeemed_on)

                                                var foe = {
                                                    "offer_id": doc.offer._id,
                                                    "offer_name": doc.offer.business_post_name,
                                                    "offer_desc": doc.offer.business_post_desc,
                                                    "offer_rating": doc.offer.offer_rating,
                                                    "no_used": 0,
                                                    "no_likes": doc.offer.likes.length,
                                                    "no_comments": doc.offer.no_comments,
                                                    "progress_val": 0,
                                                    "offer_exp_time": 0,
                                                    "offer_price": parseFloat(doc.offer.business_post_price),
                                                    "offer_img_url": constants.APIBASEBIZURL + doc.offer.business_post_logo,
                                                    //  "offer_category": doc.offer.business_catetgory_type,
                                                    "no_of_items_remaining": parseInt(doc.offer.no_of_items),
                                                    "out_of_stock": in_stock,
                                                    "is_primary_offer": false,
                                                    "redeemed_on": redeemed_on,
                                                    "offer_vendor": doc.offer.bus_id.bus_name,
                                                    "likes": doc.offer.likes,
                                                    "is_liked": is_liked,
                                                    "menu": "",
                                                    "is_custom": false,
                                                    "eligible_status": false,
                                                    "eligible_status_fr": "",
                                                    "payment_status": payment_status,
                                                    "payment_id": payment_id,
                                                    "payment_type": payment_type,
                                                    "offer_category": doc.offer.offer_category,
                                                    "is_delivery_required": doc.offer.is_delivery_required,
                                                    "address_name": address_name,
                                                    "lottery_message": "",
                                                    "offer_cat_desc_url": offer_cat_desc_url

                                                }
                                                test.push(foe)

                                            }
                                        })

                                        test.reverse()

                                        var totalPages = 1;
                                        const totalOffers = test.length;

                                        if (test.length > perPage) {
                                            totalPages = Math.ceil((test.length) / perPage);
                                            
                                        } else {
                                            page = 1;
                                        }
                                        test = test.slice(skip, limit);

                                        res.status(200).json({
                                            status: "Ok",
                                            message: "History offers",
                                            total_pages: totalPages,
                                            current_page: page,
                                            total_offers: totalOffers,
                                            offers: test
                                        })
                                    }

                                }
                            }).catch(err => {
                                console.log(err)
                                // var spliterror=err.message.split(":")
                                //     res.status(500).json({
                                //         status: 'Failed',
                                //         message: spliterror[0]+ spliterror[1]
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

router.post("/payment_validation", (req, res, next) => {

    var keyArray = ["userid", "iv_token", "clientid", "offer_id", "payment_id", "payment_type", "payment_status", "address_id", "paid_amount"]; //
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
                        var payment_type = req.body.payment_type
                        if (payment_type == "") {
                            payment_type = "Coins"
                        }
                        var payment_status = req.body.payment_status
                        if (payment_status == "") {
                            payment_status = "Completed"
                        }

                        userDetails.find({
                                userid: ObjectId(req.body.userid),
                                "offer_details.offer": ObjectId(req.body.offer_id)
                            }, { 'offer_details.$': 1, 'userid': 1, '_id': 1 })
                            .populate('offer_details.offer userid offer_details.active_group')
                            .exec()
                            .then(docs => {
                                var address_id;

                                if (req.body.address_id != "") {
                                    address_id = req.body.address_id
                                } else {
                                    address_id = null;
                                }
                                console.log('address_id=', address_id)

                                var mobile = docs[0].userid.mobile
                                var username = docs[0].userid.username
                                var profileimage = docs[0].userid.profileimage

                                if (profileimage === null) {
                                    profileimage = 'uploads/userimage.png'
                                }

                                var offer = docs[0].offer_details
                                const num = Math.floor(100000 + Math.random() * 900000);
                                const transaction_id = "MTI" + num
                                var admin = offer[0].admin

                                var price = offer[0].offer.business_post_price
                                var discount = discounts(price)

                                var total = offer[0].total_contributions
                                var finals = price * (discount / 100)
                                var final = finals
                                var final_total = price - final
                                var cont_limit = final - total / 10
                                var amount = parseFloat(cont_limit) + parseFloat(final_total)
                                var final_disc = parseFloat(total / 10).toFixed(2)
                                var gst = parseFloat(price / 100 * 18).toFixed(2)
                                var final_amount_paid = parseFloat(amount) + parseFloat(gst)
                                var service_tax = parseFloat(final_amount_paid / 100 * 2).toFixed(2) //parseFloat(0).toFixed(2)//
                                var final_amount = parseFloat(final_amount_paid) + parseFloat(service_tax)
                                var final_amount_paise = 0

                                if (final_amount < 1) {
                                    final_amount = 0
                                }

                                final_amount_paise = parseFloat(parseFloat(final_amount).toFixed(2) * 100).toFixed(2)

                                amount_paid = parseInt(req.body.paid_amount) / 100

                                console.log("paid amount " + req.body.paid_amount)
                                console.log("paid amount " + final_amount_paise)

                                if (parseInt(final_amount_paise) === parseInt(req.body.paid_amount)) {
                                    console.log("In amount equal")
                                    var average_disc = Math.floor((final * 10) / 2)
                                    var contributions = offer[0].contributions
                                    var is_disc = false

                                    if (total >= average_disc) {
                                        is_disc = true
                                    }



                                    if (offer[0].active_group.length > 0) {
                                        var actives = offer[0].active_group
                                        var active = []
                                        var active_users = []
                                        var active_users_object = []

                                        actives.forEach(function(dex) {
                                            active.push(dex._id)

                                            if (String(dex.userid) != String(req.body.userid)) {
                                                active_users.push(dex.userid)
                                                active_users_object.push(ObjectId(dex.userid))
                                            }

                                        })

                                        userDetails.updateMany({ _id: { $in: active } }, {
                                                $push: {
                                                    offers_history: {
                                                        offer: req.body.offer_id,
                                                        redeemed_on: Date.now(),
                                                        transaction_id: transaction_id,
                                                        payment_id: req.body.payment_id,
                                                        payment_type: payment_type,
                                                        payment_status: 1,
                                                        pay_status: payment_status,
                                                        selected_address: address_id,
                                                        admin: ObjectId(admin),
                                                        discount_redeemed: is_disc,
                                                        total_contributions: total,
                                                        contributions: contributions
                                                    }
                                                },
                                                $pull: { offer_details: { offer: req.body.offer_id } }
                                            })
                                            .exec()
                                            .then(result => {
                                                if (result === null) {
                                                    res.status(200).json({
                                                        status: 'Failed',
                                                        message: "Please provide correct userid"
                                                    });
                                                } else {
                                                    bsOffers.findOneAndUpdate({ _id: req.body.offer_id }, {
                                                            $push: { redeem: req.body.userid },
                                                            $inc: { no_redeem: 1 }
                                                        }, { new: true })
                                                        .exec()
                                                        .then(data => {
                                                            var items = parseInt(data.no_of_items)
                                                            var stock = items - 1
                                                            bsOffers.findOneAndUpdate({ _id: req.body.offer_id }, { $set: { no_of_items: String(stock) } })
                                                                .exec()
                                                                .then(dex => {

                                                                    userDetails.findOneAndUpdate({ userid: ObjectId(req.body.userid) }, { $push: { pending_rating: { offer: ObjectId(req.body.offer_id) } } })
                                                                        .exec()
                                                                        .then(datas => {

                                                                            if (active_users.length > 0) {
                                                                                const note_no = Math.floor(10000000000 + Math.random() * 90000000000);
                                                                                var msgbody = "Your friend " + username + " successfully redeemed the offer you are participating in."
                                                                                notificationModel.updateMany({ userid: { $in: active_users_object } }, {
                                                                                        $push: {
                                                                                            notifications: {
                                                                                                notification_data: msgbody,
                                                                                                member_id: req.body.userid,
                                                                                                notification_type: 'OfferGroup',
                                                                                                notification_number: note_no,
                                                                                                item_id: req.body.offer_id,
                                                                                                profileimage: ObjectId(req.body.userid),
                                                                                                username: username,
                                                                                                created_at: Date.now()
                                                                                            }
                                                                                        }
                                                                                    })
                                                                                    .exec()
                                                                                    .then(dosy => {
                                                                                        if (dosy === null) {

                                                                                        } else {
                                                                                            fcmModel.find({ userid: { $in: active_users } })
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
                                                                                                                notification_slug: 'OfferGroup',
                                                                                                                url: constants.APIBASEURL + profileimage,
                                                                                                                username: username,
                                                                                                                item_id: req.body.offer_id,
                                                                                                                userid: req.body.userid,
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
                                                                                                    console.log(err)
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
                                                                            }

                                                                            res.status(200).json({
                                                                                status: "Ok",
                                                                                message: "Offer redeemed successfully.",
                                                                                transaction_id: transaction_id
                                                                            });
                                                                        }).catch(err => { //catch for offer_id find.
                                                                            console.log(err)
                                                                            //       var spliterror=err.message.split("_")
                                                                            // if(spliterror[1].indexOf("id")>=0){
                                                                            //    res.status(200).json({
                                                                            //        status: 'Failed',
                                                                            //        message: "Please provide correct offer_id"
                                                                            //    });
                                                                            // }
                                                                            // else{
                                                                            //    res.status(500).json({
                                                                            //        status: 'Failed',
                                                                            //        message: err.message
                                                                            //    });
                                                                            // }
                                                                        });
                                                                }).catch(err => { //catch for offer_id find.
                                                                    console.log(err)
                                                                    //       var spliterror=err.message.split("_")
                                                                    // if(spliterror[1].indexOf("id")>=0){
                                                                    //    res.status(200).json({
                                                                    //        status: 'Failed',
                                                                    //        message: "Please provide correct offer_id"
                                                                    //    });
                                                                    // }
                                                                    // else{
                                                                    //    res.status(500).json({
                                                                    //        status: 'Failed',
                                                                    //        message: err.message
                                                                    //    });
                                                                    // }
                                                                });
                                                        }).catch(err => { //catch for offer_id find.
                                                            console.log(err)
                                                            //       var spliterror=err.message.split("_")
                                                            // if(spliterror[1].indexOf("id")>=0){
                                                            //    res.status(200).json({
                                                            //        status: 'Failed',
                                                            //        message: "Please provide correct offer_id"
                                                            //    });
                                                            // }
                                                            // else{
                                                            //    res.status(500).json({
                                                            //        status: 'Failed',
                                                            //        message: err.message
                                                            //    });
                                                            // }
                                                        });
                                                }
                                            }).catch(err => { //catch for userid update
                                                var spliterror = err.message.split(":")
                                                res.status(500).json({
                                                    status: 'Failed',
                                                    message: spliterror[0]
                                                });
                                            });

                                    } else {
                                        userDetails.findOneAndUpdate({ userid: ObjectId(req.body.userid) }, {
                                                $push: {
                                                    offers_history: {
                                                        offer: req.body.offer_id,
                                                        redeemed_on: Date.now(),
                                                        transaction_id: transaction_id,
                                                        payment_id: req.body.payment_id,
                                                        payment_type: payment_type,
                                                        payment_status: 1,
                                                        pay_status: payment_status,
                                                        selected_address: address_id,
                                                        admin: ObjectId(admin),
                                                        discount_redeemed: is_disc,
                                                        total_contributions: total,
                                                        contributions: contributions
                                                    }
                                                },
                                                $pull: { offer_details: { offer: req.body.offer_id } }
                                            })
                                            .exec()
                                            .then(result => {
                                                if (result === null) {
                                                    res.status(200).json({
                                                        status: 'Failed',
                                                        message: "Please provide correct userid"
                                                    });
                                                } else {
                                                    bsOffers.findOneAndUpdate({ _id: req.body.offer_id }, {
                                                            $push: { redeem: req.body.userid },
                                                            $inc: { no_redeem: 1 }
                                                        })
                                                        .exec()
                                                        .then(data => {
                                                            var items = parseInt(data.no_of_items)
                                                            var stock = items - 1
                                                            bsOffers.findOneAndUpdate({ _id: req.body.offer_id }, { $set: { no_of_items: String(stock) } })
                                                                .exec()
                                                                .then(dex => {
                                                                    userDetails.findOneAndUpdate({ userid: ObjectId(req.body.userid) }, { $push: { pending_rating: { offer: ObjectId(req.body.offer_id) } } })
                                                                        .exec()
                                                                        .then(datas => {
                                                                            res.status(200).json({
                                                                                status: "Ok",
                                                                                message: "Offer redeemed successfully.",
                                                                                transaction_id: transaction_id
                                                                            });
                                                                        }).catch(err => {
                                                                            var spliterror = err.message.split("_")
                                                                            if (spliterror[1].indexOf("id") >= 0) {
                                                                                res.status(200).json({
                                                                                    status: 'Failed',
                                                                                    message: "Please provide correct offer_id"
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
                                                                            message: "Please provide correct offer_id"
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
                                                                    message: "Please provide correct offer_id"
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
                                    }

                                    const note_no = Math.floor(10000000000 + Math.random() * 90000000000);
                                    var msgbody = username + " your offer is redeemed successfully. " + transaction_id + " is the transaction id."
                                    notificationModel.findOneAndUpdate({ userid: ObjectId(req.body.userid) }, {
                                            $push: {
                                                notifications: {
                                                    notification_data: msgbody,
                                                    member_id: req.body.userid,
                                                    notification_type: 'OfferGroup',
                                                    notification_number: note_no,
                                                    item_id: req.body.offer_id,
                                                    profileimage: ObjectId(req.body.userid),
                                                    username: username,
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
                                                                    notification_slug: 'OfferGroup',
                                                                    url: constants.APIBASEURL + profileimage,
                                                                    username: username,
                                                                    item_id: req.body.offer_id,
                                                                    userid: req.body.userid,
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
                                                        console.log(err)
                                                    });
                                            }
                                        }).catch(err => {
                                            var spliterror = err.message.split(":")
                                            res.status(500).json({
                                                status: 'Failed',
                                                message: spliterror[0]
                                            });
                                        });

                                    const redeem_details = new offerRedeemModel({
                                        _id: new mongoose.Types.ObjectId(),
                                        userid: ObjectId(req.body.userid),
                                        offer: ObjectId(req.body.offer_id),
                                        payment_id: req.body.payment_id,
                                        redeem_on: Date.now(),
                                        payment_type: payment_type,
                                        payment_status: payment_status,
                                        transaction_id: transaction_id,
                                        address: address_id,
                                        amount_paid: parseFloat(final_amount).toFixed(2),
                                        coins_paid: total,
                                        discount: final_disc
                                    })
                                    console.log(redeem_details);


                                    redeem_details.save()
                                } else {

                                    var redeem_details = new offerRedeemFailureModel({
                                        _id: new mongoose.Types.ObjectId(),
                                        userid: ObjectId(req.body.userid),
                                        offer: ObjectId(req.body.offer_id),
                                        payment_id: req.body.payment_id,
                                        redeem_on: Date.now(),
                                        payment_type: payment_type,
                                        payment_status: payment_status,
                                        amount_paid: parseFloat(amount_paid).toFixed(2)
                                    })

                                    redeem_details.save()

                                    res.status(200).json({
                                        status: 'Failed',
                                        message: 'Payable amount not matching with Offer price.'
                                    });
                                }

                            }).catch(err => {
                                console.log(err);
                                var spliterror = err.message.split("_")
                                console.log(spliterror);
                                if (spliterror[1].indexOf("id") >= 0) {
                                    res.status(200).json({
                                        status: 'Failed',
                                        message: "Please provide correct offer_id"
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

router.post("/redeem_offer", (req, res, next) => {

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
                        userDetails.find({
                                userid: ObjectId(req.body.userid),
                                'offer_details.offer': ObjectId(req.body.offer_id)
                            }, { 'offer_details.$': 1, _id: 1, userid: 1, offers_history: 1 })
                            .populate('offer_details.offer userid')
                            .exec()
                            .then(docs => {
                                if (docs.length > 0) {
                                    if (docs[0].userid.mobile_verified == 'true') {

                                        var test = []
                                        var testapi = []
                                        var offer = docs[0].offer_details
                                        var offer_history = docs[0].offers_history
                                        var can_redeem = true

                                        var date = new Date()
                                        var month = date.getMonth() + 1

                                        if (offer_history.length > 2) {
                                            var found = offer_history.filter(o => month === (new Date(o.redeemed_on)).getMonth() + 1)
                                            console.log("current month " + month)

                                            if (found.length >= 1) {
                                                can_redeem = false
                                            }
                                        } else {
                                            can_redeem = true
                                        }

                                        if (can_redeem === true) {
                                            offer.map(doc => {

                                                var price = doc.offer.business_post_price
                                                var delivery = doc.offer.is_delivery_required
                                                console.log(delivery)
                                                var discount = discounts(price)

                                                var total = doc.total_contributions
                                                var finals = price * (discount / 100)
                                                var final = finals
                                                var discount_taken = finals * 10
                                                var final_total = price - final
                                                var cont_limit = final - total / 10
                                                var amount = parseFloat(cont_limit) + parseFloat(final_total)
                                                var final_disc = parseFloat(total / 10).toFixed(2) //parseInt((total / discount_taken)*discount)
                                                var gst = parseFloat(price / 100 * 18).toFixed(2)
                                                var final_amount_paid = parseFloat(amount) + parseFloat(gst)
                                                var service_tax = parseFloat(final_amount_paid / 100 * 2).toFixed(2) //parseFloat(0).toFixed(2)
                                                var final_amount = parseFloat(final_amount_paid) + parseFloat(service_tax)
                                                var final_amount_paise = 0

                                                //var discount_taken = final * 10 - total

                                                var average_disc = Math.floor((final * 10) / 2)

                                                if (parseInt(final_amount) < 1) {
                                                    final_amount = 0
                                                    final_amount_paise = 0
                                                } else {
                                                    final_amount_paise = parseFloat((parseFloat(final_amount).toFixed(2)) * 100).toFixed(2)
                                                }

                                                console.log(final_amount_paise)

                                                var payment = {
                                                    'original_price': parseFloat(price).toFixed(2),
                                                    'discount': final_disc,
                                                    'gst': gst,
                                                    'service_tax': service_tax,
                                                    'amount_after_discount': parseFloat(amount).toFixed(2),
                                                    'total_amount_to_be_payable': parseFloat(final_amount).toFixed(2),
                                                    'total_amount_to_be_payable_paise': String(final_amount_paise),
                                                    'is_delivery_required': doc.offer.is_delivery_required
                                                }
                                                testapi.push(payment)
                                            })
                                            return res.status(200).json({
                                                status: "Ok",
                                                message: "Redeem details",
                                                offer_id: req.body.offer_id,
                                                userid: req.body.userid,
                                                payment_details: testapi[0]
                                            });
                                        } else {
                                            res.status(200).json({
                                                status: 'Redeem',
                                                message: "You have exceeded your offer redeem limit for this month."
                                            });
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
                                        message: "Please provide correct userid"
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


router.post("/record_offer_like", (req, res, next) => {

    var keyArray = ["userid", "iv_token", "clientid", "offer_id", "is_liked", "is_custom"];
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
                        User.find({ _id: req.body.userid })
                            .exec()
                            .then(doc => {
                                if (req.body.is_custom === true) {
                                    if (req.body.is_liked === false) {
                                        customeOffer.findOneAndUpdate({ _id: req.body.offer_id }, {
                                                $push: { likes: req.body.userid },
                                                $inc: { no_likes: 1 }
                                            })
                                            .exec()
                                            .then(data => {
                                                res.status(200).json({
                                                    status: 'Ok',
                                                    message: 'Offer liked successfully.',
                                                })

                                            }).catch(err => { //catch for offer_id find and update.
                                                var spliterror = err.message.split("_")
                                                if (spliterror[1].indexOf("id") >= 0) {
                                                    res.status(200).json({
                                                        status: 'Failed',
                                                        message: "Please provide correct offer_id"
                                                    });
                                                } else {
                                                    res.status(500).json({
                                                        status: 'Failed',
                                                        message: err.message
                                                    });
                                                }
                                            });
                                    } else {
                                        customeOffer.findOneAndUpdate({ _id: req.body.offer_id }, {
                                                $pull: { likes: ObjectId(req.body.userid) },
                                                $inc: { no_likes: -1 }
                                            })
                                            .exec()
                                            .then(data => {
                                                res.status(200).json({
                                                    status: 'Ok',
                                                    message: 'Offer unliked successfully.',
                                                })

                                            }).catch(err => { //catch for offer_id find and update.
                                                var spliterror = err.message.split("_")
                                                if (spliterror[1].indexOf("id") >= 0) {
                                                    res.status(200).json({
                                                        status: 'Failed',
                                                        message: "Please provide correct offer_id"
                                                    });
                                                } else {
                                                    res.status(500).json({
                                                        status: 'Failed',
                                                        message: err.message
                                                    });
                                                }
                                            });
                                    }
                                } else {
                                    if (req.body.is_liked === false) {

                                        bsOffers.find({ _id: req.body.offer_id, likes: ObjectId(req.body.userid) })
                                            .exec()
                                            .then(dex => {
                                                if (dex.length > 0) {
                                                    bsOffers.findOneAndUpdate({ _id: req.body.offer_id }, {
                                                            $pull: { likes: ObjectId(req.body.userid) },
                                                            $inc: { no_likes: -1 }
                                                        })
                                                        .exec()
                                                        .then(data => {

                                                            if (data === null) {
                                                                wishlistOffers.findOneAndUpdate({ _id: req.body.offer_id }, {
                                                                        $pull: { likes: ObjectId(req.body.userid) },
                                                                        $inc: { no_likes: -1 }
                                                                    })
                                                                    .exec()
                                                                    .then(dex => {
                                                                        res.status(200).json({
                                                                            status: 'Ok',
                                                                            message: 'Offer unliked successfully.',
                                                                        })
                                                                    }).catch(err => { //catch for offer_id find and update.
                                                                        var spliterror = err.message.split("_")
                                                                        if (spliterror[1].indexOf("id") >= 0) {
                                                                            res.status(200).json({
                                                                                status: 'Failed',
                                                                                message: "Please provide correct offer_id"
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
                                                                    status: 'Ok',
                                                                    message: 'Offer unliked successfully.',
                                                                })
                                                            }

                                                        }).catch(err => { //catch for offer_id find and update.
                                                            var spliterror = err.message.split("_")
                                                            if (spliterror[1].indexOf("id") >= 0) {
                                                                res.status(200).json({
                                                                    status: 'Failed',
                                                                    message: "Please provide correct offer_id"
                                                                });
                                                            } else {
                                                                res.status(500).json({
                                                                    status: 'Failed',
                                                                    message: err.message
                                                                });
                                                            }
                                                        });
                                                } else {
                                                    bsOffers.findOneAndUpdate({ _id: req.body.offer_id }, {
                                                            $push: { likes: req.body.userid },
                                                            $inc: { no_likes: 1 }
                                                        })
                                                        .exec()
                                                        .then(data => {

                                                            if (data === null) {
                                                                wishlistOffers.findOneAndUpdate({ _id: req.body.offer_id }, {
                                                                        $push: { likes: req.body.userid },
                                                                        $inc: { no_likes: 1 }
                                                                    })
                                                                    .exec()
                                                                    .then(dex => {
                                                                        res.status(200).json({
                                                                            status: 'Ok',
                                                                            message: 'Offer liked successfully.',
                                                                        })
                                                                    }).catch(err => { //catch for offer_id find and update.
                                                                        var spliterror = err.message.split("_")
                                                                        if (spliterror[1].indexOf("id") >= 0) {
                                                                            res.status(200).json({
                                                                                status: 'Failed',
                                                                                message: "Please provide correct offer_id"
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
                                                                    status: 'Ok',
                                                                    message: 'Offer liked successfully.',
                                                                })
                                                            }


                                                        }).catch(err => { //catch for offer_id find and update.
                                                            var spliterror = err.message.split("_")
                                                            if (spliterror[1].indexOf("id") >= 0) {
                                                                res.status(200).json({
                                                                    status: 'Failed',
                                                                    message: "Please provide correct offer_id"
                                                                });
                                                            } else {
                                                                res.status(500).json({
                                                                    status: 'Failed',
                                                                    message: err.message
                                                                });
                                                            }
                                                        });
                                                }
                                            }).catch(err => { //catch for offer_id find and update.
                                                var spliterror = err.message.split("_")
                                                if (spliterror[1].indexOf("id") >= 0) {
                                                    res.status(200).json({
                                                        status: 'Failed',
                                                        message: "Please provide correct offer_id"
                                                    });
                                                } else {
                                                    res.status(500).json({
                                                        status: 'Failed',
                                                        message: err.message
                                                    });
                                                }
                                            });
                                    } else {
                                        bsOffers.findOneAndUpdate({ _id: req.body.offer_id }, {
                                                $pull: { likes: ObjectId(req.body.userid) },
                                                $inc: { no_likes: -1 }
                                            })
                                            .exec()
                                            .then(data => {

                                                if (data === null) {
                                                    wishlistOffers.findOneAndUpdate({ _id: req.body.offer_id }, {
                                                            $pull: { likes: ObjectId(req.body.userid) },
                                                            $inc: { no_likes: -1 }
                                                        })
                                                        .exec()
                                                        .then(dex => {
                                                            res.status(200).json({
                                                                status: 'Ok',
                                                                message: 'Offer unliked successfully.',
                                                            })
                                                        }).catch(err => { //catch for offer_id find and update.
                                                            var spliterror = err.message.split("_")
                                                            if (spliterror[1].indexOf("id") >= 0) {
                                                                res.status(200).json({
                                                                    status: 'Failed',
                                                                    message: "Please provide correct offer_id"
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
                                                        status: 'Ok',
                                                        message: 'Offer unliked successfully.',
                                                    })
                                                }

                                            }).catch(err => { //catch for offer_id find and update.
                                                var spliterror = err.message.split("_")
                                                if (spliterror[1].indexOf("id") >= 0) {
                                                    res.status(200).json({
                                                        status: 'Failed',
                                                        message: "Please provide correct offer_id"
                                                    });
                                                } else {
                                                    res.status(500).json({
                                                        status: 'Failed',
                                                        message: err.message
                                                    });
                                                }
                                            });
                                    }
                                }
                            }).catch(err => { //catch for userid find and update.
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

router.post("/add_offer_comment", (req, res, next) => {

    var keyArray = ["userid", "iv_token", "clientid", "offer_id", "comment_msg", "is_custom"];
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
                        User.find({ _id: req.body.userid })
                            .exec()
                            .then(doc => {
                                const con_number = Math.floor(10000000000 + Math.random() * 90000000000);
                                if (req.body.is_custom === true) {

                                    customeOffer.findOneAndUpdate({ _id: req.body.offer_id }, {
                                            $push: {
                                                comments: {
                                                    commented_by: req.body.userid,
                                                    comment_data: req.body.comment_msg,
                                                    comment_number: con_number
                                                }
                                            },
                                            $inc: { no_comments: 1 }
                                        }, { new: true })
                                        .exec()
                                        .then(data => {
                                            customeOffer.find({ $and: [{ _id: req.body.offer_id }, { "comments.comment_number": con_number }] }, { 'comments.$': 1 })
                                                .populate("comments.commented_by")
                                                .exec()
                                                .then(result => {
                                                    var test = [];
                                                    docs = result[0].comments
                                                    docs.map(comm => {
                                                        var profileimage = doc[0].profileimage;
                                                        if (doc[0].profileimage === null) {
                                                            profileimage = "uploads/userimage.png"
                                                        }
                                                        var foe = {
                                                            "comment_id": comm._id,
                                                            "comment_msg": comm.comment_data,
                                                            "comment_by": comm.commented_by.username,
                                                            "userid": comm.commented_by._id,
                                                            "profile_image": constants.APIBASEURL + profileimage
                                                        }
                                                        test.push(foe)
                                                    })
                                                    var total_comments = data.comments.length
                                                    res.status(200).json({
                                                        status: 'Ok',
                                                        message: "Comment",
                                                        comment: test[0],
                                                        total_comments: total_comments
                                                    })
                                                }).catch(err => { //catch for offer_id find and update.
                                                    console.log(err)

                                                    var spliterror = err.message.split("_")
                                                    if (spliterror[1].indexOf("id") >= 0) {
                                                        res.status(200).json({
                                                            status: 'Failed',
                                                            message: "Please provide correct offer_id"
                                                        });
                                                    } else {
                                                        res.status(500).json({
                                                            status: 'Failed',
                                                            message: err.message
                                                        });
                                                    }
                                                });
                                        }).catch(err => { //catch for offer_id find.
                                            var spliterror = err.message.split("_")
                                            if (spliterror[1].indexOf("id") >= 0) {
                                                res.status(200).json({
                                                    status: 'Failed',
                                                    message: "Please provide correct offer_id"
                                                });
                                            } else {
                                                res.status(500).json({
                                                    status: 'Failed',
                                                    message: err.message
                                                });
                                            }
                                        });
                                } else {
                                    bsOffers.findOneAndUpdate({ _id: req.body.offer_id }, {
                                            $push: {
                                                comments: {
                                                    commented_by: req.body.userid,
                                                    comment_data: req.body.comment_msg,
                                                    comment_number: con_number
                                                }
                                            },
                                            $inc: { no_comments: 1 }
                                        }, { new: true })
                                        .exec()
                                        .then(data => {
                                            if (data === null) {
                                                wishlistOffers.findOneAndUpdate({ _id: req.body.offer_id }, {
                                                        $push: {
                                                            comments: {
                                                                commented_by: req.body.userid,
                                                                comment_data: req.body.comment_msg,
                                                                comment_number: con_number
                                                            }
                                                        },
                                                        $inc: { no_comments: 1 }
                                                    }, { new: true })
                                                    .exec()
                                                    .then(dex => {

                                                        wishlistOffers.find({ $and: [{ _id: req.body.offer_id }, { "comments.comment_number": con_number }] }, { 'comments.$': 1 })
                                                            .populate("comments.commented_by")
                                                            .exec()
                                                            .then(result => {
                                                                console.log(result)
                                                                var test = [];
                                                                var docs = result[0].comments
                                                                docs.map(comm => {
                                                                    var profileimage = doc[0].profileimage;
                                                                    if (doc[0].profileimage === null) {
                                                                        profileimage = "uploads/userimage.png"
                                                                    }
                                                                    var foe = {
                                                                        "comment_id": comm._id,
                                                                        "comment_msg": comm.comment_data,
                                                                        "comment_by": comm.commented_by.username,
                                                                        "userid": comm.commented_by._id,
                                                                        "profile_image": constants.APIBASEURL + profileimage
                                                                    }
                                                                    test.push(foe)
                                                                })
                                                                var total_comments = dex.comments.length
                                                                res.status(200).json({
                                                                    status: 'Ok',
                                                                    message: "Comment",
                                                                    comment: test[0],
                                                                    total_comments: total_comments
                                                                })
                                                            }).catch(err => { //catch for offer_id find and update.
                                                                var spliterror = err.message.split("_")
                                                                if (spliterror[1].indexOf("id") >= 0) {
                                                                    res.status(200).json({
                                                                        status: 'Failed',
                                                                        message: "Please provide correct offer_id"
                                                                    });
                                                                } else {
                                                                    res.status(500).json({
                                                                        status: 'Failed',
                                                                        message: err.message
                                                                    });
                                                                }
                                                                console.log(err)
                                                            });
                                                    }).catch(err => { //catch for offer_id find and update.
                                                        var spliterror = err.message.split("_")
                                                        if (spliterror[1].indexOf("id") >= 0) {
                                                            res.status(200).json({
                                                                status: 'Failed',
                                                                message: "Please provide correct offer_id"
                                                            });
                                                        } else {
                                                            res.status(500).json({
                                                                status: 'Failed',
                                                                message: err.message
                                                            });
                                                        }
                                                        console.log(err)
                                                    });
                                            } else {

                                                bsOffers.find({ $and: [{ _id: req.body.offer_id }, { "comments.comment_number": con_number }] }, { 'comments.$': 1 })
                                                    .populate("comments.commented_by")
                                                    .exec()
                                                    .then(result => {
                                                        console.log(result)
                                                        var test = [];
                                                        var docs = result[0].comments
                                                        docs.map(comm => {
                                                            var profileimage = doc[0].profileimage;
                                                            if (doc[0].profileimage === null) {
                                                                profileimage = "uploads/userimage.png"
                                                            }
                                                            var foe = {
                                                                "comment_id": comm._id,
                                                                "comment_msg": comm.comment_data,
                                                                "comment_by": comm.commented_by.username,
                                                                "userid": comm.commented_by._id,
                                                                "profile_image": constants.APIBASEURL + profileimage
                                                            }
                                                            test.push(foe)
                                                        })
                                                        var total_comments = data.comments.length
                                                        res.status(200).json({
                                                            status: 'Ok',
                                                            message: "Comment",
                                                            comment: test[0],
                                                            total_comments: total_comments
                                                        })
                                                    }).catch(err => { //catch for offer_id find and update.
                                                        var spliterror = err.message.split("_")
                                                        if (spliterror[1].indexOf("id") >= 0) {
                                                            res.status(200).json({
                                                                status: 'Failed',
                                                                message: "Please provide correct offer_id"
                                                            });
                                                        } else {
                                                            res.status(500).json({
                                                                status: 'Failed',
                                                                message: err.message
                                                            });
                                                        }
                                                        console.log(err)
                                                    });
                                            }
                                        }).catch(err => { //catch for offer_id find.
                                            var spliterror = err.message.split("_")
                                            if (spliterror[1].indexOf("id") >= 0) {
                                                res.status(200).json({
                                                    status: 'Failed',
                                                    message: "Please provide correct offer_id"
                                                });
                                            } else {
                                                res.status(500).json({
                                                    status: 'Failed',
                                                    message: err.message
                                                });
                                            }
                                            console.log(err)
                                        });
                                }
                            }).catch(err => { //catch for userid find and update.
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
                            });
                    }
                }).catch(err => {
                    console.log(err)
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

router.post("/delete_offer_comment", (req, res, next) => {

    var keyArray = ["userid", "iv_token", "clientid", "offer_id", "comment_id", "is_custom"];
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
                        if (req.body.is_custom === true) {

                            customeOffer.findOneAndUpdate({ $and: [{ _id: req.body.offer_id }, { "comments.commented_by": ObjectId(req.body.userid) }, { "comments._id": ObjectId(req.body.comment_id) }] }, {
                                    $pull: {
                                        comments: { _id: req.body.comment_id }
                                    },
                                    $inc: { no_comments: -1 }
                                }, { new: true })
                                .exec()
                                .then(data => {
                                    if (data === null) {
                                        res.status(200).json({
                                            status: 'Ok',
                                            message: 'Comment does not exist',
                                        })
                                    } else {
                                        var total_comments = data.comments.length
                                        res.status(200).json({
                                            status: 'Ok',
                                            message: 'Comment deleted successfully.',
                                            total_comments: total_comments
                                        })
                                    }
                                }).catch(err => { //catch for offer_id find and update.
                                    var spliterror = err.message.split("\"")
                                    if (spliterror[3] === "commented_by") {
                                        res.status(200).json({
                                            status: 'Failed',
                                            message: "Please provide correct userid"
                                        });
                                    } else if (spliterror[3] === "_id") {
                                        res.status(200).json({
                                            status: 'Failed',
                                            message: "Please provide correct offer_id"
                                        });
                                    } else {
                                        res.status(500).json({
                                            status: 'Failed',
                                            message: err.message
                                        });
                                    }
                                });
                        } else {
                            bsOffers.findOneAndUpdate({ $and: [{ _id: req.body.offer_id }, { "comments.commented_by": req.body.userid }, { "comments._id": req.body.comment_id }] }, {
                                    $pull: {
                                        comments: { _id: req.body.comment_id }
                                    },
                                    $inc: { no_comments: -1 }
                                }, { new: true })
                                .exec()
                                .then(data => {
                                    if (data === null) {
                                        wishlistOffers.findOneAndUpdate({ $and: [{ _id: req.body.offer_id }, { "comments.commented_by": req.body.userid }, { "comments._id": req.body.comment_id }] }, {
                                                $pull: {
                                                    comments: { _id: req.body.comment_id }
                                                },
                                                $inc: { no_comments: -1 }
                                            }, { new: true })
                                            .exec()
                                            .then(dex => {
                                                var total_comments = dex.comments.length
                                                res.status(200).json({
                                                    status: 'Ok',
                                                    message: 'Comment deleted successfully.',
                                                    total_comments: total_comments
                                                })
                                            }).catch(err => { //catch for offer_id find and update.
                                                var spliterror = err.message.split("\"")
                                                if (spliterror[3] === "commented_by") {
                                                    res.status(200).json({
                                                        status: 'Failed',
                                                        message: "Please provide correct userid"
                                                    });
                                                } else if (spliterror[3] === "_id") {
                                                    res.status(200).json({
                                                        status: 'Failed',
                                                        message: "Please provide correct offer_id"
                                                    });
                                                } else {
                                                    res.status(500).json({
                                                        status: 'Failed',
                                                        message: err.message
                                                    });
                                                }
                                            });
                                    } else {
                                        var total_comments = data.comments.length
                                        res.status(200).json({
                                            status: 'Ok',
                                            message: 'Comment deleted successfully.',
                                            total_comments: total_comments
                                        })
                                    }
                                }).catch(err => { //catch for offer_id find and update.
                                    var spliterror = err.message.split("\"")
                                    if (spliterror[3] === "commented_by") {
                                        res.status(200).json({
                                            status: 'Failed',
                                            message: "Please provide correct userid"
                                        });
                                    } else if (spliterror[3] === "_id") {
                                        res.status(200).json({
                                            status: 'Failed',
                                            message: "Please provide correct offer_id"
                                        });
                                    } else {
                                        res.status(500).json({
                                            status: 'Failed',
                                            message: err.message
                                        });
                                    }
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

router.post("/get_offer_comments", (req, res, next) => {

    var keyArray = ["userid", "iv_token", "clientid", "offer_id", "is_custom", "page_no"];
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
                        User.find({ _id: req.body.userid })
                            .exec()
                            .then(docy => {
                                var perPage = 20;
                                var page = req.body.page_no;

                                if (isEmpty(page)) {
                                    page = 1
                                }
                                var skip = (perPage * page) - perPage;
                                var limit = skip + perPage;

                                if (req.body.is_custom === true) {
                                    customeOffer.find({ _id: req.body.offer_id })
                                        .populate("comments.commented_by")
                                        .exec()
                                        .then(data => {

                                            var docs = data[0].comments

                                            var totalPages = 1;
                                            const totalComments = docs.length;
                                            if (docs.length > perPage) {
                                                totalPages = Math.ceil((docs.length) / perPage);
                                                docs = docs.slice(skip, limit);
                                            } else {
                                                page = 1;
                                            }
                                            var test = [];
                                            docs.map(doc => {
                                                var profileimage = doc.commented_by.profileimage;
                                                if (doc.commented_by.profileimage === null) {
                                                    profileimage = "uploads/userimage.png"
                                                }
                                                var foe = {
                                                    "comment_id": doc._id,
                                                    "comment_msg": doc.comment_data,
                                                    "comment_by": doc.commented_by.username,
                                                    "comment_userid": doc.commented_by._id,
                                                    "profile_image": constants.APIBASEURL + profileimage
                                                }
                                                test.push(foe)
                                            })


                                            res.status(200).json({
                                                status: 'Ok',
                                                message: "Comments",
                                                total_pages: totalPages,
                                                current_page: page,
                                                total_comments: totalComments,
                                                comments: test
                                            });

                                        }).catch(err => { //catch for offer_id find and update.
                                            var spliterror = err.message.split("_")
                                            if (spliterror[1].indexOf("id") >= 0) {
                                                res.status(200).json({
                                                    status: 'Failed',
                                                    message: "Please provide correct offer_id"
                                                });
                                            } else {
                                                res.status(500).json({
                                                    status: 'Failed',
                                                    message: err.message
                                                });
                                            }
                                        });
                                } else {
                                    bsOffers.find({ _id: req.body.offer_id })
                                        .populate("comments.commented_by")
                                        .exec()
                                        .then(data => {
                                            if (data.length > 0) {

                                                var docs = data[0].comments
                                                var totalPages = 1;
                                                const totalComments = docs.length;
                                                if (docs.length > perPage) {
                                                    totalPages = Math.ceil((docs.length) / perPage);
                                                    docs = docs.slice(skip, limit);
                                                } else {
                                                    page = 1;
                                                }
                                                console.log(docs)
                                                var test = [];
                                                docs.map(doc => {
                                                    var profileimage = "";
                                                    if (doc.commented_by.profileimage === null) {
                                                        profileimage = "uploads/userimage.png"
                                                    } else {
                                                        profileimage = doc.commented_by.profileimage
                                                    }
                                                    var foe = {
                                                        "comment_id": doc._id,
                                                        "comment_msg": doc.comment_data,
                                                        "comment_by": doc.commented_by.username,
                                                        "comment_userid": doc.commented_by._id,
                                                        "profile_image": constants.APIBASEURL + profileimage
                                                    }
                                                    test.push(foe)
                                                })

                                                res.status(200).json({
                                                    status: 'Ok',
                                                    message: "Comments",
                                                    total_pages: totalPages,
                                                    current_page: page,
                                                    total_comments: totalComments,
                                                    comments: test
                                                });
                                            } else {
                                                wishlistOffers.find({ _id: req.body.offer_id })
                                                    .populate("comments.commented_by")
                                                    .exec()
                                                    .then(dex => {

                                                        var docs = dex[0].comments
                                                        console.log(docs)
                                                        var totalPages = 1;
                                                        const totalComments = docs.length;
                                                        if (docs.length > perPage) {
                                                            totalPages = Math.ceil((docs.length) / perPage);
                                                            docs = docs.slice(skip, limit);
                                                        } else {
                                                            page = 1;
                                                        }
                                                        console.log(docs)
                                                        var test = [];
                                                        docs.map(doc => {
                                                            var profileimage = "";
                                                            if (doc.commented_by.profileimage === null) {
                                                                profileimage = "uploads/userimage.png"
                                                            } else {
                                                                profileimage = doc.commented_by.profileimage
                                                            }
                                                            var foe = {
                                                                "comment_id": doc._id,
                                                                "comment_msg": doc.comment_data,
                                                                "comment_by": doc.commented_by.username,
                                                                "comment_userid": doc.commented_by._id,
                                                                "profile_image": constants.APIBASEURL + profileimage
                                                            }
                                                            test.push(foe)
                                                        })

                                                        res.status(200).json({
                                                            status: 'Ok',
                                                            message: "Comments",
                                                            total_pages: totalPages,
                                                            current_page: page,
                                                            total_comments: totalComments,
                                                            comments: test
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
                                            var spliterror = err.message.split("_")
                                            if (spliterror[1].indexOf("id") >= 0) {
                                                res.status(200).json({
                                                    status: 'Failed',
                                                    message: "Please provide correct offer_id"
                                                });
                                            } else {
                                                res.status(500).json({
                                                    status: 'Failed',
                                                    message: err.message
                                                });
                                            }
                                        });
                                }
                            }).catch(err => { //catch for userid find and update.
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

router.post("/select_primary_offer", (req, res, next) => {

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
                        primaryOffers.find({ _id: req.body.offer_id })
                            .exec()
                            .then(docs => {

                                userDetails.find({ userid: ObjectId(req.body.userid) })
                                    .exec()
                                    .then(data => {
                                        var offers = data[0].offer_details;

                                        if (offers.length > 0) {
                                            offers.every(function(doc) {
                                                if (doc.is_primary_offer === true) {
                                                    res.status(200).json({
                                                        status: 'Ok',
                                                        message: "A Primary offer already exists"
                                                    });
                                                } else {
                                                    userDetails.findOneAndUpdate({ userid: ObjectId(req.body.userid) }, {
                                                            $push: {
                                                                offer_details: {
                                                                    primary_offer: docs[0]._id,
                                                                    offer_status: "Active",
                                                                    is_primary_offer: true,
                                                                    total_contributions: 0
                                                                }
                                                            }
                                                        })
                                                        .exec()
                                                        .then(result => {

                                                            if (result === null) {
                                                                res.status(200).json({
                                                                    status: 'Failed',
                                                                    message: "Please provide correct userid"
                                                                });
                                                            } else {
                                                                res.status(200).json({
                                                                    status: "Ok",
                                                                    message: "Primary offer selected successfully."
                                                                });
                                                            }
                                                        }).catch(err => { //catch for userid update
                                                            var spliterror = err.message.split(":")
                                                            res.status(500).json({
                                                                status: 'Failed',
                                                                message: spliterror[0]
                                                            });
                                                        });
                                                }
                                            })
                                        } else if (offers.length === 0) {
                                            userDetails.findOneAndUpdate({ userid: ObjectId(req.body.userid) }, {
                                                    $push: {
                                                        offer_details: {
                                                            primary_offer: docs[0]._id,
                                                            offer_status: "Active",
                                                            is_primary_offer: true,
                                                            total_contributions: 20
                                                        }
                                                    }
                                                })
                                                .exec()
                                                .then(result => {
                                                    if (result === null) {
                                                        res.status(200).json({
                                                            status: 'Failed',
                                                            message: "Please provide correct userid"
                                                        });
                                                    } else {
                                                        res.status(200).json({
                                                            status: "Ok",
                                                            message: "Primary offer selected successfully."
                                                        });
                                                    }
                                                }).catch(err => { //catch for userid update
                                                    var spliterror = err.message.split(":")
                                                    res.status(500).json({
                                                        status: 'Failed',
                                                        message: spliterror[0]
                                                    });
                                                });
                                        } else {
                                            res.status(200).json({
                                                status: 'Ok',
                                                message: "A Primary offer already exists"
                                            });
                                        }
                                    }).catch(err => {
                                        var spliterror = err.message.split("_")
                                        if (spliterror[1].indexOf("userid") >= 0) {
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

                            }).catch(err => { //catch for offer_id find.
                                var spliterror = err.message.split("_")
                                if (spliterror[1].indexOf("id") >= 0) {
                                    res.status(200).json({
                                        status: 'Failed',
                                        message: "Please provide correct offer_id"
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

router.post("/delete_offer", (req, res, next) => {

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
                        userDetails.find({
                                $and: [{ userid: ObjectId(req.body.userid) },
                                    { "offer_details.offer": ObjectId(req.body.offer_id) }
                                ]
                            }, { 'offer_details.$': 1 })
                            .populate('offer_details.offer')
                            .exec()
                            .then(docs => {
                                if (docs.length < 1) {
                                    res.status(200).json({
                                        status: 'Failed',
                                        message: "Please provide correct userid"
                                    });
                                } else {

                                    var offer = docs[0].offer_details;
                                    var is_primary_offer = false;
                                    var active_grp = [];

                                    if (offer.length > 0) {
                                        if (offer[0].is_primary_offer === true) {
                                            is_primary_offer = true;
                                        }
                                        if (offer[0].active_group.length > 0) {
                                            active_grp = offer[0].active_group
                                        } else {
                                            active_grp.push(docs[0]._id)
                                        }
                                    } else {
                                        active_grp.push(docs[0]._id)
                                    }

                                    if (offer[0].total_contributions != 0) {
                                        var conts = offer[0].contributions

                                        active_grp.forEach(function(ele) {
                                            var amount = 0
                                            conts.forEach(function(dog) {
                                                if (String(dog.userid) === String(ele)) {
                                                    amount = amount + dog.cont_points
                                                }
                                            })

                                            if (amount > 0) {
                                                userDetails.findOneAndUpdate({ _id: ObjectId(ele) }, { $inc: { talent_points: amount } })
                                                    .exec()
                                                    .then(data => {

                                                        var day = new Date()
                                                        day = day.toISOString()
                                                        day = String(day).split("T")
                                                        day = day[0].replace(/-/g, "")
                                                        var amounts = amount
                                                        var mode = "talent"
                                                        var offer_name = offer[0].offer.business_post_name
                                                        const transaction_id = day + Math.floor(10000000000 + Math.random() * 90000000000);

                                                        userTransactions.findOneAndUpdate({ userid: ObjectId(data.userid) }, {
                                                                $push: {
                                                                    transactions: {
                                                                        date_of_transaction: Date.now(),
                                                                        amount: amounts,
                                                                        mode: mode,
                                                                        transaction_type: "credit",
                                                                        action: "offer_delete",
                                                                        message: "Your donations for offer are reversed to talent points as the offer-" + offer_name + " is deleted",
                                                                        transaction_id: transaction_id
                                                                    }
                                                                }
                                                            }, { upsert: true })
                                                            .exec()
                                                            .then(dex => {})
                                                    }).catch(err => { //catch for userid update
                                                        var spliterror = err.message.split(":")
                                                        res.status(500).json({
                                                            status: 'Failed',
                                                            message: spliterror[0]
                                                        });
                                                    });
                                            }
                                        })
                                    }
                                    userDetails.updateMany({
                                            $and: [{ _id: { $in: active_grp } },
                                                { "offer_details.offer": req.body.offer_id }
                                            ]
                                        }, { $pull: { offer_details: { offer: ObjectId(req.body.offer_id) } } })
                                        .exec()
                                        .then(result => {
                                            if (result === null) {
                                                // res.status(200).json({
                                                //     status: 'Failed',
                                                //     message: "Please provide correct userid"
                                                // });
                                            } else {
                                                res.status(200).json({
                                                    status: "Ok",
                                                    message: "Offer removed successfully.",
                                                    is_primary_offer: is_primary_offer
                                                });
                                            }
                                        }).catch(err => { //catch for userid update
                                            var spliterror = err.message.split(":")
                                            res.status(500).json({
                                                status: 'Failed',
                                                message: spliterror[0]
                                            });
                                        });
                                }
                            }).catch(err => { //catch for offer_id find.
                                var spliterror = err.message.split("_")
                                if (spliterror[1].indexOf("id") >= 0) {
                                    res.status(200).json({
                                        status: 'Failed',
                                        message: "Please provide correct offer_id"
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

router.post("/get_primary_offers", (req, res, next) => {

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
                        var offer_cat_desc_url = "";
                        var perPage = 20
                        var page = req.body.page_no

                        if (isEmpty(page)) {
                            page = 1
                        }
                        var skip = (perPage * page) - perPage;
                        var limit = skip + perPage;

                        userDetails.find({ userid: ObjectId(req.body.userid) })
                            .populate("offer_details.primary_offer offers_history.primary_offer bus_id")
                            .exec()
                            .then(data => {
                                if (data.length < 1) {
                                    return res.status(200).json({
                                        status: "Failed",
                                        message: "Please provide correct userid."
                                    });
                                } else {

                                    var active = data[0].offer_details;
                                    var history = data[0].offers_history
                                    var active_offers = [];
                                    //for active offers
                                    if (active.length > 0) {
                                        active.forEach(function(element) {
                                            if (element.is_primary_offer === true) {
                                                active_offers.push(ObjectId(element.primary_offer._id))
                                            }
                                        })
                                    }
                                    // if (history.length > 0) {
                                    //     history.forEach(function(element) {
                                    //         if (element.is_primary_offer === true) {
                                    //             active_offers.push(ObjectId(element.primary_offer._id))
                                    //         }
                                    //     })
                                    // }

                                    primaryOffers.find({ _id: { $nin: active_offers }, is_expired: false })
                                        .skip(skip)
                                        .limit(limit)
                                        .sort({ business_post_create: -1 })
                                        .exec()
                                        .then(docs => {
                                            primaryOffers.find({ _id: { $nin: active_offers } }).count().exec(function(err, count) {
                                                if (err) {
                                                    res.status(500).json({
                                                        status: 'Failed',
                                                        message: 'Error fetching offers.'
                                                    });
                                                } else {
                                                    var test = [];
                                                    var likes = 0;

                                                    docs.map(doc => {
                                                        //                          if(doc.no_likes > 0){
                                                        //                              likes = doc.no_likes
                                                        //                          }
                                                        //                          var is_liked = false;
                                                        //                          var testlike= doc.likes;
                                                        //  if(typeof testlike === 'undefined'){
                                                        //  is_liked =false;
                                                        // }
                                                        // else{
                                                        //  testlike.every(function(newlike){
                                                        //      if(String(newlike) === String(req.body.userid)){
                                                        //          is_liked = true;
                                                        //          return false
                                                        //      }else{
                                                        //          return true
                                                        //      }
                                                        //  })
                                                        // }

                                                        // var date = new Date()
                                                        //                  var dates1 = date.setTime(date.getTime());
                                                        //              var dateNow1 = new Date(dates1).toISOString();
                                                        //              var current_date = String(dateNow1).split('T')
                                                        //              var expiry_day = doc.business_post_enddate
                                                        //              var expiry_array = expiry_day.split('/')
                                                        //              var current_day = current_date[0].split('-')
                                                        //              var expiry = expiry_array[1]+"-"+expiry_array[0]+"-"+expiry_array[2]+" 00:00:00"
                                                        //              var current = current_day[1]+"-"+current_day[2]+"-"+current_day[0]+" 00:00:00"
                                                        //              var today = new Date(current)
                                                        //              var offer_expiry = new Date(expiry)
                                                        //              var timeDiff = Math.abs(offer_expiry.getTime() - today.getTime());
                                                        // var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

                                                        var testss = {
                                                            "offer_id": doc._id,
                                                            "offer_name": doc.business_post_name,
                                                            "offer_desc": doc.business_post_desc,
                                                            "offer_rating": 0,
                                                            "no_used": 0,
                                                            "no_likes": 0,
                                                            "expiry_time": "",
                                                            "offer_validity": 0,
                                                            "no_comments": 0,
                                                            "offer_price": parseFloat(doc.business_post_price).toFixed(2),
                                                            "offer_img_url": constants.APIBASEURL + doc.business_post_logo,
                                                            "offer_category": "Primary Offer",
                                                            "no_of_items_remaining": 100000,
                                                            "out_of_stock": false,
                                                            "offer_vendor": "Fvmegear",
                                                            "is_liked": false,
                                                            "menu": "",
                                                            "is_custom": false,
                                                            "is_primary_offer": true,
                                                            "offer_cat_desc_url": offer_cat_desc_url,
                                                            "payable_amount": parseFloat(doc.business_post_price).toFixed(2),
                                                        }
                                                        test.push(testss)
                                                    })

                                                    res.status(200).json({
                                                        status: "Ok",
                                                        message: "List of primary offers.",
                                                        total_pages: Math.ceil(count / perPage),
                                                        current_page: page,
                                                        total_offers: count,
                                                        offers: test
                                                    });
                                                }
                                            })
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

router.post("/get_vendors", (req, res, next) => {

    var keyArray = ["userid", "iv_token", "clientid", "category"];
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
                        business.find({ bus_category: req.body.category })
                            .exec()
                            .then(docs => {

                                if (docs.length < 1) {
                                    res.status(200).json({
                                        status: "Ok",
                                        message: "No vendors"
                                    })
                                } else {
                                    var test = [];
                                    docs.map(doc => {
                                        var testss = {
                                            "id": doc._id,
                                            "name": doc.bus_name,
                                            "logo": constants.APIBASEURL + doc.bus_logo,
                                            "category": doc.bus_category,
                                            "location": doc.bus_location
                                        }
                                        test.push(testss)
                                    })
                                    res.status(200).json({
                                        status: "Ok",
                                        message: "List of Vendors.",
                                        list: test
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

router.post("/get_menu", (req, res, next) => {

    var keyArray = ["userid", "iv_token", "clientid", "vendor_id"];
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
                        business.find({ _id: req.body.vendor_id })
                            .exec()
                            .then(docs => {
                                var list = [];
                                csv.fromPath("./uploads/menu.csv", { headers: true })
                                    .on('data', (data) => {
                                        list.push(data)
                                    })
                                    .on('end', function(data) {
                                        var test = [];
                                        list.map(doc => {
                                            var foe = {
                                                "id": doc.menu_id,
                                                "name": doc.menu_name,
                                            }
                                            test.push(foe)
                                        })
                                        res.status(200).json({
                                            status: 'Ok',
                                            message: "Menu",
                                            list: test
                                        });
                                    })

                            }).catch(err => { //catch for vendor_id find.
                                var spliterror = err.message.split("_")
                                if (spliterror[1].indexOf("id") >= 0) {
                                    res.status(200).json({
                                        status: 'Failed',
                                        message: "Please provide correct vendor_id"
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

router.post("/create_custom_offer", (req, res, next) => {

    var keyArray = ["userid", "iv_token", "clientid", "vendor_id", "offer_name", "menu_ids", "offer_desc"];
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
                            .populate("offer_details.offer offers_history.offer")
                            .exec()
                            .then(data => {
                                business.find({ bus_id: req.body.vendor_id })
                                    .exec()
                                    .then(docs => {
                                        var offer = new customeOffer({
                                            _id: new mongoose.Types.ObjectId(),
                                            user: req.body.userid,
                                            offer_name: req.body.offer_name,
                                            offer_desc: req.body.offer_desc,
                                            vendor: req.body.vendor_id,
                                            menu_items: req.body.menu_ids
                                        })
                                        offer.save()
                                            .then(del => {
                                                res.status(200).json({
                                                    status: 'Ok',
                                                    message: "Custom offer created successfully."
                                                });
                                            }).catch(err => {
                                                var spliterror = err.message.split(":")
                                                res.status(500).json({
                                                    status: 'Failed',
                                                    message: spliterror[0]
                                                });
                                            });
                                    }).catch(err => { //catch for offer_id find.
                                        var spliterror = err.message.split("\"")
                                        if (spliterror[3] === "bus_id") {
                                            res.status(200).json({
                                                status: 'Failed',
                                                message: "Please provide correct vendor_id"
                                            });
                                        } else if (spliterror[3] === "offer_name") {
                                            res.status(200).json({
                                                status: 'Failed',
                                                message: "Please provide offer_name"
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

router.post("/get_custom_offers", (req, res, next) => {

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
                        User.find({ _id: req.body.userid })
                            .exec()
                            .then(datas => {

                                var perPage = 20
                                var page = req.body.page_no

                                if (isEmpty(page)) {
                                    page = 1
                                }
                                customeOffer.find({})
                                    .populate("user vendor")
                                    .skip((perPage * page) - perPage)
                                    .limit(perPage)
                                    .exec()
                                    .then(docs => {
                                        customeOffer.count().exec(function(err, count) {
                                            if (err) {
                                                res.status(500).json({
                                                    status: "Failed",
                                                    message: "Error fetching offers."
                                                })
                                            } else {
                                                if (docs.length > 0) {
                                                    var list = [];
                                                    var menu = [];
                                                    csv.fromPath("./uploads/menu.csv", { headers: true })
                                                        .on('data', (data) => {
                                                            list.push(data)
                                                        })
                                                        .on('end', function(data) {

                                                            if (docs[0].menu_items.length > 0) {
                                                                var redeem = docs[0].menu_items
                                                                redeem.forEach(function(elements) {
                                                                    list.forEach(function(drops) {
                                                                        if (String(elements) === String(drops.menu_id)) {
                                                                            menu.push(drops)
                                                                        }
                                                                    })
                                                                })
                                                            }
                                                            var test = [];
                                                            docs.map(doc => {
                                                                var foe = {
                                                                    "offer_id": doc._id,
                                                                    "offer_name": doc.offer_name,
                                                                    "offer_desc": doc.offer_desc,
                                                                    "offer_rating": doc.offer_rating,
                                                                    "no_used": 0,
                                                                    "no_likes": doc.no_likes,
                                                                    "no_comments": doc.no_comments,
                                                                    "progress_val": 0,
                                                                    "offer_exp_time": 0,
                                                                    "offer_price": 0.00,
                                                                    "offer_img_url": constants.APIBASEBIZURL + doc.vendor.bus_logo,
                                                                    "offer_category": doc.vendor.bus_category,
                                                                    "no_of_items_remaining": 0,
                                                                    "out_of_stock": false,
                                                                    "offer_vendor": doc.vendor.bus_name,
                                                                    "is_liked": false,
                                                                    "menu": menu,
                                                                    "is_custom": true
                                                                }
                                                                test.push(foe)
                                                            })
                                                            res.status(200).json({
                                                                status: 'Ok',
                                                                message: 'Custom offers',
                                                                total_pages: Math.ceil(count / perPage),
                                                                current_page: page,
                                                                total_offers: count,
                                                                offers: test
                                                            });

                                                        })
                                                } else {
                                                    res.status(200).json({
                                                        status: 'Ok',
                                                        message: 'No custom offers to display.',
                                                        offers: []
                                                    });
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


router.post("/rate_offer", (req, res, next) => {

    var keyArray = ["userid", "iv_token", "clientid", "offer_id", "rating", "Q_ratings"];
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
                        bsOffers.find({ _id: req.body.offer_id }, { rating: 1, offer_rating: 1, review_status: 1 })
                            .exec()
                            .then(result => {
                                var is_rated = true;
                                if (result[0].rating.length > 0) {
                                    var rating = result[0].rating;
                                    var found = rating.find(ele => String(ele.rated_by) === String(req.body.userid))

                                    if (typeof found === 'undefined') {
                                        is_rated = false;
                                    } else {
                                        res.status(200).json({
                                            status: 'Ok',
                                            message: "You have already rated this offer.",
                                            rating: result[0].rating[0].rating_value
                                        });
                                    }
                                } else {
                                    is_rated = false;
                                }
                                if (is_rated === false) {
                                    var quest = req.body.Q_ratings;
                                    var queuu = quest.replace(/{/g, "")
                                    queuu = queuu.replace(/}/g, "")
                                    console.log(queuu)
                                    if (queuu.length === 0) {

                                        var rating = result[0].offer_rating;
                                        var user_rating = req.body.rating;
                                        var final_rating = 0;

                                        if (rating === 0) {
                                            final_rating = user_rating;
                                        } else {
                                            final_rating = ((rating + user_rating) / 2).toFixed(1);
                                        }
                                        bsOffers.findOneAndUpdate({ _id: req.body.offer_id }, {
                                                $push: {
                                                    rating: {
                                                        rated_by: req.body.userid,
                                                        rating_value: req.body.rating
                                                    }
                                                },
                                                $inc: { no_rating: 1 },
                                                $set: { offer_rating: final_rating }
                                            })
                                            .exec()
                                            .then(data => {
                                                userDetails.findOneAndUpdate({
                                                        userid: ObjectId(req.body.userid),
                                                        "pending_rating.offer": ObjectId(req.body.offer_id)
                                                    }, { $pull: { pending_rating: { offer: ObjectId(req.body.offer_id) } } }, { new: true })
                                                    .exec()
                                                    .then(data => {
                                                        if (data === null) {
                                                            res.status(200).json({
                                                                status: 'Failed',
                                                                message: 'Please provide correct offer_id'
                                                            });
                                                        } else {
                                                            res.status(200).json({
                                                                status: 'Ok',
                                                                message: "Rated offer successfully."
                                                            });
                                                        }
                                                    }).catch(err => { //catch for userid find.
                                                        var spliterror = err.message.split("_")
                                                        if (spliterror[1].indexOf("userid") >= 0) {
                                                            res.status(200).json({
                                                                status: 'Failed',
                                                                message: "Please provide correct userid"
                                                            });
                                                        } else if (spliterror[1].indexOf("offer_id") >= 0) {
                                                            res.status(200).json({
                                                                status: 'Failed',
                                                                message: "Please provide correct offer_id"
                                                            });
                                                        } else {
                                                            res.status(500).json({
                                                                status: 'Failed',
                                                                message: err.message
                                                            });
                                                        }
                                                    });
                                            }).catch(err => { //catch for offer_id find.
                                                var spliterror = err.message.split("_")
                                                if (spliterror[1].indexOf("id") >= 0) {
                                                    res.status(200).json({
                                                        status: 'Failed',
                                                        message: "Please provide correct offer_id"
                                                    });
                                                } else {
                                                    res.status(500).json({
                                                        status: 'Failed',
                                                        message: err.message
                                                    });
                                                }
                                            });
                                    } else {

                                        var rating = result[0].offer_rating;
                                        var user_rating = req.body.rating;
                                        var final_rating = 0;

                                        if (rating === 0) {
                                            final_rating = user_rating;
                                        } else {
                                            final_rating = ((rating + user_rating) / 2).toFixed(1);
                                        }
                                        bsOffers.findOneAndUpdate({ _id: req.body.offer_id }, {
                                                $push: {
                                                    rating: {
                                                        rated_by: ObjectId(req.body.userid),
                                                        rating_value: req.body.rating
                                                    }
                                                },
                                                $inc: { no_rating: 1 },
                                                $set: { offer_rating: final_rating }
                                            })
                                            .exec()
                                            .then(data => {
                                                var questions = [];
                                                var que = quest.replace(/{/g, "")
                                                que = que.replace(/}/g, "")
                                                var req_new = que.split(",")
                                                if (req_new.length > 0) {
                                                    for (var i = 0; i < req_new.length; i++) {
                                                        var question_update = req_new[0].split("=")
                                                        var foox = {
                                                            'Q_id': question_update[0],
                                                            'Q_rating': question_update[1]
                                                        }
                                                        questions.push(foox)
                                                    }
                                                }
                                                const count = questions.length
                                                var counter = 0;
                                                var is_question = true;

                                                userDetails.findOneAndUpdate({
                                                        userid: ObjectId(req.body.userid),
                                                        "pending_rating.offer": ObjectId(req.body.offer_id)
                                                    }, { $pull: { pending_rating: { offer: ObjectId(req.body.offer_id) } } }, { new: true })
                                                    .exec()
                                                    .then(data => {
                                                        if (data === null) {
                                                            res.status(200).json({
                                                                status: 'Failed',
                                                                message: 'No offer to rate.'
                                                            });
                                                        } else {
                                                            if (questions.length > 0) {
                                                                questions.forEach(function(efe) {
                                                                    reviewQuestions.find({ _id: ObjectId(efe.Q_id) })
                                                                        .exec()
                                                                        .then(del => {
                                                                            if (del.length < 1) {} else {
                                                                                var question_rating = del[0].question_rating;
                                                                                var question_final = 0;

                                                                                if (question_rating === 0) {
                                                                                    question_final = efe.Q_rating;
                                                                                } else {
                                                                                    question_final = ((question_rating + efe.Q_rating) / 2).toFixed(1);
                                                                                }

                                                                                reviewQuestions.findOneAndUpdate({ _id: ObjectId(efe.Q_id) }, {
                                                                                        $push: {
                                                                                            user_answer: {
                                                                                                userid: ObjectId(req.body.userid),
                                                                                                rating: efe.Q_rating
                                                                                            }
                                                                                        },
                                                                                        $set: { question_rating: question_final }
                                                                                    })
                                                                                    .exec()
                                                                                    .then(reqs => {

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
                                                                    counter++;
                                                                })
                                                            }

                                                            if (counter === count) {
                                                                res.status(200).json({
                                                                    status: 'Ok',
                                                                    message: "Rated offer successfully."
                                                                });
                                                            } else {
                                                                res.status(200).json({
                                                                    status: 'Ok',
                                                                    message: "Please provide correct Q_id"
                                                                });
                                                            }
                                                        }
                                                    }).catch(err => {
                                                        var spliterror = err.message.split("_")
                                                        if (spliterror[1].indexOf("userid") >= 0) {
                                                            res.status(200).json({
                                                                status: 'Failed',
                                                                message: "Please provide correct userid"
                                                            });
                                                        } else if (spliterror[1].indexOf("offer_id") >= 0) {
                                                            res.status(200).json({
                                                                status: 'Failed',
                                                                message: "Please provide correct offer_id"
                                                            });
                                                        } else {

                                                            res.status(500).json({
                                                                status: 'Failed',
                                                                message: err.message
                                                            });
                                                        }
                                                    });
                                            }).catch(err => { //catch for offer_id find.
                                                var spliterror = err.message.split("_")
                                                if (spliterror[1].indexOf("id") >= 0) {
                                                    res.status(200).json({
                                                        status: 'Failed',
                                                        message: "Please provide correct offer_id"
                                                    });
                                                } else {
                                                    res.status(500).json({
                                                        status: 'Failed',
                                                        message: err.message
                                                    });
                                                }
                                            });
                                    }
                                }
                            }).catch(err => { //catch for offer_id find and update.
                                var spliterror = err.message.split("_")
                                if (spliterror[1].indexOf("id") >= 0) {
                                    res.status(200).json({
                                        status: 'Failed',
                                        message: "Please provide correct offer_id"
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


router.post("/get_rating_details", (req, res, next) => {

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
                            .populate('userid pending_rating.offer')
                            .exec()
                            .then(data => {
                                if (data[0].pending_rating.length < 1) {
                                    res.status(200).json({
                                        status: 'Ok',
                                        message: 'No pending ratings.',
                                        is_rating_required: false
                                    });
                                } else {
                                    var pending = data[0].pending_rating;
                                    var offers = [];
                                    var has_primary_offer = false;
                                    var primary = [];

                                    if (data[0].offer_details.length > 0) {
                                        primary = data[0].offer_details
                                        primary.every(function(efe) {
                                            if (efe.is_primary_offer === true) {
                                                has_primary_offer = true
                                                return false
                                            } else {
                                                has_primary_offer = false
                                                return true
                                            }
                                        })
                                    }
                                    if (data[0].offers_history.length > 0) {
                                        var history = data[0].offers_history
                                        var found = history.find(ele => String(ele.offer) === String(pending[0].offer._id))
                                        if (typeof found === 'undefined') {
                                            res.status(200).json({
                                                status: 'Ok',
                                                message: 'No offer is redeemed.',
                                                is_rating_required: false
                                            });
                                        } else {
                                            var test = [];
                                            if (pending[0].offer.review_status === 1) {
                                                reviewQuestions.find({ ads_business_post_id: pending[0].offer._id })
                                                    .select('review_question _id ads_business_post_id')
                                                    .exec()
                                                    .then(result => {
                                                        if (result.length > 0) {
                                                            result.map(doc => {
                                                                var foe = {
                                                                    'Q_id': doc._id,
                                                                    "Q_desc": doc.review_question
                                                                }
                                                                test.push(foe)
                                                            })
                                                            pending.map(dec => {
                                                                var foo = {
                                                                    'userid': req.body.userid,
                                                                    'offer_id': dec.offer._id,
                                                                    'offer_desc': dec.offer.business_post_desc,
                                                                    'transaction_id': found.transaction_id,
                                                                    'redeemed_on': String(found.redeemed_on).substring(0, 10),
                                                                    'is_mandatory': dec.offer.review_status,
                                                                    'questions': test
                                                                }
                                                                offers.push(foo)
                                                            })

                                                            res.status(200).json({
                                                                status: 'Ok',
                                                                message: 'Rating details',
                                                                has_primary_offer: has_primary_offer,
                                                                is_rating_required: true,
                                                                rating_details: offers[0]
                                                            });
                                                        } else {
                                                            test = [];
                                                            pending.map(dec => {
                                                                var foo = {
                                                                    'userid': req.body.userid,
                                                                    'offer_id': dec.offer._id,
                                                                    'offer_desc': dec.offer.business_post_desc,
                                                                    'redeemed_on': String(found.redeemed_on).substring(0, 10),
                                                                    'is_mandatory': 0,
                                                                    'transaction_id': found.transaction_id,
                                                                    'questions': test
                                                                }
                                                                offers.push(foo)
                                                            })

                                                            res.status(200).json({
                                                                status: 'Ok',
                                                                message: 'Rating details',
                                                                is_rating_required: true,
                                                                has_primary_offer: has_primary_offer,
                                                                rating_details: offers[0]
                                                            });
                                                        }
                                                    })
                                            } else {
                                                test = [];
                                                pending.map(dec => {
                                                    var foo = {
                                                        'userid': req.body.userid,
                                                        'offer_id': dec.offer._id,
                                                        'offer_desc': dec.offer.business_post_desc,
                                                        'redeemed_on': String(found.redeemed_on).substring(0, 10),
                                                        'is_mandatory': 0,
                                                        'transaction_id': found.transaction_id,
                                                        'questions': test
                                                    }
                                                    offers.push(foo)
                                                })

                                                res.status(200).json({
                                                    status: 'Ok',
                                                    message: 'Rating details',
                                                    is_rating_required: true,
                                                    has_primary_offer: has_primary_offer,
                                                    rating_details: offers[0]
                                                });
                                            }
                                        }
                                    }
                                }
                            }).catch(err => { //catch for userid find.
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

router.post("/skip_rating", (req, res, next) => {

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
                        userDetails.findOneAndUpdate({
                                userid: ObjectId(req.body.userid),
                                "pending_rating.offer": ObjectId(req.body.offer_id)
                            }, { $pull: { pending_rating: { offer: ObjectId(req.body.offer_id) } } }, { new: true })
                            .exec()
                            .then(data => {
                                if (data === null) {
                                    res.status(200).json({
                                        status: 'Failed',
                                        message: 'Please provide correct offer_id'
                                    });
                                } else {
                                    res.status(200).json({
                                        status: 'Ok',
                                        message: 'Skipped rating for this offer.'
                                    });
                                }
                            }).catch(err => { //catch for userid find.
                                var spliterror = err.message.split("_")
                                if (spliterror[1].indexOf("userid") >= 0) {
                                    res.status(200).json({
                                        status: 'Failed',
                                        message: "Please provide correct userid"
                                    });
                                } else if (spliterror[1].indexOf("offer_id") >= 0) {
                                    res.status(200).json({
                                        status: 'Failed',
                                        message: "Please provide correct offer_id"
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

router.post("/store_primary_offers", (req, res, next) => {
    var primary = new primaryOffers({
        _id: new mongoose.Types.ObjectId(),
        business_post_desc: req.body.desc,
        business_post_name: req.body.offer_name,
        business_post_price: req.body.price
    })
    primary.save()
        .then(docs => {
            return res.status(200).json({
                status: 'Ok',
                message: 'added successfully.'
            })
        }).catch(err => {
            var spliterror = err.message.split(":")
            res.status(500).json({
                status: 'Failed',
                message: spliterror[0]
            });
        });

});


router.post("/add_wishlist", (req, res, next) => {

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
                        wishlistOffers.find({ _id: req.body.offer_id })
                            .exec()
                            .then(docs => {

                                userDetails.find({ userid: ObjectId(req.body.userid) })
                                    .exec()
                                    .then(data => {
                                        userDetails.findOneAndUpdate({ userid: ObjectId(req.body.userid) }, {
                                                $push: {
                                                    wishlist_offers: {
                                                        offer: docs[0]._id,
                                                        offer_status: "coming soon",
                                                        admin: data[0]._id,
                                                        created_at: Date.now()
                                                    }
                                                }
                                            })

                                            .exec()
                                            .then(result => {
                                                if (result === null) {
                                                    res.status(200).json({
                                                        status: 'Failed',
                                                        message: "Please provide correct userid"
                                                    });
                                                } else {

                                                    wishlistOffers.findOneAndUpdate({ _id: ObjectId(req.body.offer_id) }, {
                                                            $push: { used: ObjectId(req.body.userid) },
                                                            $inc: { no_used: 1 }
                                                        })
                                                        .exec()
                                                        .then(dex => {
                                                            console.log("updated wishlist")
                                                        }).catch(err => { //catch for userid update
                                                            var spliterror = err.message.split(":")
                                                            res.status(500).json({
                                                                status: 'Failed',
                                                                message: spliterror[0]
                                                            });
                                                        });
                                                    res.status(200).json({
                                                        status: "Ok",
                                                        message: "Offer moved to wishlist successfully."
                                                    });
                                                }
                                            }).catch(err => { //catch for userid update
                                                console.log(err)
                                                var spliterror = err.message.split(":")
                                                res.status(500).json({
                                                    status: 'Failed',
                                                    message: spliterror[0]
                                                });
                                            });


                                    }).catch(err => {
                                        console.log(err)
                                        var spliterror = err.message.split(":")
                                        res.status(500).json({
                                            status: 'Failed',
                                            message: spliterror[0] + spliterror[1]
                                        });
                                    });

                            }).catch(err => { //catch for offer_id find.
                                console.log(err)
                                var spliterror = err.message.split("_")
                                if (spliterror[1].indexOf("id") >= 0) {
                                    res.status(200).json({
                                        status: 'Failed',
                                        message: "Please provide correct offer_id"
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


router.post("/get_wishlist", (req, res, next) => {

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

                        userDetails.find({ userid: ObjectId(req.body.userid) })
                            .populate('wishlist_offers.offer')
                            .exec()
                            .then(docs => {
                                var wishlist = docs[0].wishlist_offers
                                var test = []
                                var offer_cat_desc_url = ""
                                if (typeof wishlist != 'undefined' && wishlist.length > 0) {

                                    wishlist.map(doc => {

                                        if (doc.offer.no_likes > 0) {
                                            likes = doc.offer.no_likes
                                        }
                                        var is_liked = false;
                                        var testlike = doc.offer.likes;
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

                                        var price = doc.offer.business_post_price
                                        var discount = discounts_wishlist(price)
                                        var disc = ""

                                        if (discount > 0) {
                                            disc = "Upto " + discount + "% OFF."
                                        }

                                        var finals = price * (discount / 100)
                                        var final = finals * 10
                                        var final_total = price - finals

                                        var testss = {
                                            "offer_id": doc.offer._id,
                                            "offer_name": doc.offer.business_post_name,
                                            "offer_desc": doc.offer.business_post_desc,
                                            "offer_rating": 0,
                                            "no_used": 0,
                                            "no_likes": doc.offer.likes.length,
                                            "expiry_time": "",
                                            "offer_validity": 0,
                                            "no_comments": doc.offer.comments.length,
                                            "offer_price": parseFloat(doc.offer.business_post_price),
                                            "offer_img_url": constants.APIBASEURL + doc.offer.business_post_logo,
                                            "offer_category": "Stellar",
                                            "no_of_items_remaining": 10000,
                                            "out_of_stock": false,
                                            "offer_vendor": "Fvmegear",
                                            "is_liked": is_liked,
                                            "menu": "",
                                            "is_custom": false,
                                            "is_primary_offer": false,
                                            "is_wish_listed": true,
                                            "is_coming_soon": false,
                                            "discount": disc,
                                            "no_used": doc.offer.used.length,
                                            "payable_amount": parseFloat(final_total).toFixed(2),
                                            "offer_cat_desc_url": offer_cat_desc_url

                                        }
                                        test.push(testss)
                                    })

                                    var count = test.length

                                  //  if (count > perPage) {
                                        test = test.slice(skip, limit)
                                 //   }

                                    res.status(200).json({
                                        status: "Ok",
                                        message: "List of interest offers.",
                                        total_pages: Math.ceil(count / perPage),
                                        current_page: page,
                                        total_offers: count,
                                        offers: test
                                    });
                                } else {
                                    res.status(200).json({
                                        status: "Ok",
                                        message: "No wishlist.",
                                        offers: []
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


router.post("/delete_wishlist", (req, res, next) => {

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
                        wishlistOffers.find({ _id: req.body.offer_id })
                            .exec()
                            .then(docs => {

                                userDetails.find({ userid: ObjectId(req.body.userid) })
                                    .exec()
                                    .then(data => {

                                        userDetails.findOneAndUpdate({ userid: ObjectId(req.body.userid) }, {
                                                $pull: {
                                                    wishlist_offers: { offer: docs[0]._id }
                                                }
                                            })

                                            .exec()
                                            .then(result => {
                                                if (result === null) {
                                                    res.status(200).json({
                                                        status: 'Failed',
                                                        message: "Please provide correct userid"
                                                    });
                                                } else {
                                                    wishlistOffers.findOneAndUpdate({ _id: ObjectId(req.body.offer_id) }, {
                                                            $pull: { used: ObjectId(req.body.userid) },
                                                            $inc: { no_used: -1 }
                                                        })
                                                        .exec()
                                                        .then(dex => {
                                                            console.log("updated wishlist")
                                                        }).catch(err => { //catch for userid update
                                                            var spliterror = err.message.split(":")
                                                            res.status(500).json({
                                                                status: 'Failed',
                                                                message: spliterror[0]
                                                            });
                                                        });
                                                    res.status(200).json({
                                                        status: "Ok",
                                                        message: "Offer removed from wishlist successfully."
                                                    });
                                                }
                                            }).catch(err => { //catch for userid update
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

                            }).catch(err => { //catch for offer_id find.
                                var spliterror = err.message.split("_")
                                if (spliterror[1].indexOf("id") >= 0) {
                                    res.status(200).json({
                                        status: 'Failed',
                                        message: "Please provide correct offer_id"
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

router.get("/offer_expiry", (req, res, next) => {

    bsOffers.find({})
        .exec()
        .then(data => {
            var test = [];
            data.map(doc => {
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

                if (diffDays === 0) {
                    test.push(ObjectId(doc._id))
                }
            })

            bsOffers.updateMany({ _id: { $in: test } }, { $set: { is_expired: true } })
                .exec()
                .then(result => {
                    console.log("completed offer expiry cron job.")
                }).catch(err => { //catch for offer_id find.

                    console.log(err.message)
                });
        }).catch(err => { //catch for offer_id find.
            var spliterror = err.message.split("_")

            console.log(err.message)
        });
});


router.get("/user_offers_cron_server", (req, res, next) => {

    userDetails.find({})
        .populate('offer_details.offer')
        .exec()
        .then(data => {
            data.map(doc => {
                if (doc.offer_details.length > 0) {
                    var offers = doc.offer_details
                    offers.map(dex => {
                        if (dex.is_primary_offer === false) {
                            if (typeof dex.offer.is_expired != 'undefined') {
                                var offer_name = dex.offer.business_post_name
                                if (dex.offer.is_expired === true) {
                                    if (dex.active_group.length > 0) {
                                        var active_grp = dex.active_group
                                        if (dex.total_contributions != 0) {
                                            var conts = dex.contributions


                                            var amount = 0
                                            conts.forEach(function(dog) {
                                                if (String(dog.userid) === String(doc._id)) {
                                                    amount = amount + dog.cont_points
                                                }
                                            })

                                            if (amount > 0) {
                                                userDetails.findOneAndUpdate({ _id: ObjectId(doc._id) }, { $inc: { talent_points: amount } })
                                                    .exec()
                                                    .then(data => {
                                                        var day = new Date()
                                                        day = day.toISOString()
                                                        day = String(day).split("T")
                                                        day = day[0].replace(/-/g, "")
                                                        var amounts = amount
                                                        var mode = "talent"
                                                        const transaction_id = day + Math.floor(10000000000 + Math.random() * 90000000000);

                                                        userTransactions.findOneAndUpdate({ userid: ObjectId(doc.userid) }, {
                                                                $push: {
                                                                    transactions: {
                                                                        date_of_transaction: Date.now(),
                                                                        amount: amounts,
                                                                        mode: mode,
                                                                        transaction_type: "credit",
                                                                        action: "offer_expiry",
                                                                        message: "Your donations for offer are reversed to talent points as the offer-" + offer_name + " is expired",
                                                                        transaction_id: transaction_id
                                                                    }
                                                                }
                                                            }, { upsert: true })
                                                            .exec()
                                                            .then(dex => {})
                                                    }).catch(err => { //catch for userid update
                                                        console.log(err)
                                                    });
                                            }
                                        }

                                        userDetails.findOneAndUpdate({
                                                $and: [{ _id: ObjectId(doc._id) },
                                                    { "offer_details.offer": dex.offer._id }
                                                ]
                                            }, { $pull: { offer_details: { offer: dex.offer._id } } })
                                            .exec()
                                            .then(result => {
                                                console.log("cron job to remove expired offers from users done.")
                                            }).catch(err => { //catc
                                                console.log(err)
                                            });
                                    } else {
                                        if (dex.total_contributions != 0) {
                                            var conts = dex.total_contributions

                                            if (conts > 0) {
                                                userDetails.findOneAndUpdate({ _id: ObjectId(doc._id) }, { $inc: { talent_points: conts } })
                                                    .exec()
                                                    .then(data => {
                                                        var day = new Date()
                                                        day = day.toISOString()
                                                        day = String(day).split("T")
                                                        day = day[0].replace(/-/g, "")
                                                        var amounts = conts
                                                        var mode = "talent"
                                                        const transaction_id = day + Math.floor(10000000000 + Math.random() * 90000000000);

                                                        userTransactions.findOneAndUpdate({ userid: ObjectId(doc.userid) }, {
                                                                $push: {
                                                                    transactions: {
                                                                        date_of_transaction: Date.now(),
                                                                        amount: amounts,
                                                                        mode: mode,
                                                                        transaction_type: "credit",
                                                                        action: "offer_expiry",
                                                                        message: "Your donations for offer are reversed to talent points as the offer-" + offer_name + " is expired",
                                                                        transaction_id: transaction_id
                                                                    }
                                                                }
                                                            }, { upsert: true })
                                                            .exec()
                                                            .then(dex => {})
                                                    }).catch(err => { //catch for userid update
                                                        console.log(err)
                                                    });
                                            }
                                        }

                                        userDetails.findOneAndUpdate({
                                                $and: [{ _id: ObjectId(doc._id) },
                                                    { "offer_details.offer": dex.offer._id }
                                                ]
                                            }, { $pull: { offer_details: { offer: dex.offer._id } } })
                                            .exec()
                                            .then(result => {
                                                console.log("cron job to remove expired offers from users done.")
                                            }).catch(err => { //catch for userid update
                                                console.log(err)
                                            });
                                    }
                                } else {
                                    var date = new Date()
                                    var dates1 = date.setTime(date.getTime());
                                    var dateNow1 = new Date(dates1).toISOString();
                                    var current_date = String(dateNow1).split('T')
                                    var current_day = current_date[0].split('-')
                                    var current = current_day[1] + "-" + current_day[2] + "-" + current_day[0] + " 00:00:00"


                                    var expiry_day = dex.offer.business_post_enddate
                                    var expiry_array = expiry_day.split('/')
                                    var expiry = expiry_array[1] + "-" + expiry_array[0] + "-" + expiry_array[2] + " 00:00:00"

                                    var user_expiry = (dex.created_at).toISOString()
                                    var user_expiry_date = String(user_expiry).split('T')
                                    var user_expiry_day = user_expiry_date[0].split('-')
                                    var user_day = user_expiry_day[1] + "-" + user_expiry_day[2] + "-" + user_expiry_day[0] + " 00:00:00"

                                    var today = new Date(current)
                                    var offer_expiry = new Date(expiry)
                                    var user_exp = new Date(user_day)

                                    var timeDiff = Math.abs(offer_expiry.getTime() - user_exp.getTime());
                                    var diffDays1 = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                    var offer_date = ""

                                    if (diffDays1 > 10) {
                                        offer_date = new Date(user_exp.getTime() + (10 * 24 * 60 * 60 * 1000));
                                    } else {
                                        offer_date = new Date(user_exp.getTime() + (diffDays1 * 24 * 60 * 60 * 1000));
                                    }

                                    var timeDiff1 = Math.abs(offer_date.getTime() - today.getTime());
                                    diffDays = Math.ceil(timeDiff1 / (1000 * 3600 * 24));

                                    console.log("days left " + diffDays)

                                    if (parseInt(diffDays) === 0) {

                                        if (dex.active_group.length > 0) {
                                            var active_grp = dex.active_group
                                            if (dex.total_contributions != 0) {
                                                var conts = dex.contributions

                                                var amount = 0
                                                conts.forEach(function(dog) {
                                                    if (String(dog.userid) === String(doc._id)) {
                                                        amount = amount + dog.cont_points
                                                    }
                                                })

                                                if (amount > 0) {
                                                    userDetails.findOneAndUpdate({ _id: ObjectId(doc._id) }, { $inc: { talent_points: amount } })
                                                        .exec()
                                                        .then(data => {
                                                            var day = new Date()
                                                            day = day.toISOString()
                                                            day = String(day).split("T")
                                                            day = day[0].replace(/-/g, "")
                                                            var amounts = amount
                                                            var mode = "talent"
                                                            const transaction_id = day + Math.floor(10000000000 + Math.random() * 90000000000);

                                                            userTransactions.findOneAndUpdate({ userid: ObjectId(doc.userid) }, {
                                                                    $push: {
                                                                        transactions: {
                                                                            date_of_transaction: Date.now(),
                                                                            amount: amounts,
                                                                            mode: mode,
                                                                            transaction_type: "credit",
                                                                            action: "offer_expiry",
                                                                            message: "Your donations for offer are reversed to talent points as the offer-" + offer_name + " is expired",
                                                                            transaction_id: transaction_id
                                                                        }
                                                                    }
                                                                }, { upsert: true })
                                                                .exec()
                                                                .then(dex => {})
                                                        }).catch(err => { //catch for userid update
                                                            console.log(err)
                                                        });
                                                }
                                            }

                                            userDetails.findOneAndUpdate({
                                                    $and: [{ _id: ObjectId(doc._id) },
                                                        { "offer_details.offer": dex.offer._id }
                                                    ]
                                                }, { $pull: { offer_details: { offer: dex.offer._id } } })
                                                .exec()
                                                .then(result => {
                                                    console.log("cron job to remove expired offers from users done.")
                                                }).catch(err => { //catc
                                                    console.log(err)
                                                });
                                        } else {
                                            if (dex.total_contributions != 0) {
                                                var conts = dex.total_contributions

                                                if (conts > 0) {
                                                    userDetails.findOneAndUpdate({ _id: ObjectId(doc._id) }, { $inc: { talent_points: conts } })
                                                        .exec()
                                                        .then(data => {
                                                            var day = new Date()
                                                            day = day.toISOString()
                                                            day = String(day).split("T")
                                                            day = day[0].replace(/-/g, "")
                                                            var amounts = conts
                                                            var mode = "talent"
                                                            const transaction_id = day + Math.floor(10000000000 + Math.random() * 90000000000);

                                                            userTransactions.findOneAndUpdate({ userid: ObjectId(doc.userid) }, {
                                                                    $push: {
                                                                        transactions: {
                                                                            date_of_transaction: Date.now(),
                                                                            amount: amounts,
                                                                            mode: mode,
                                                                            transaction_type: "credit",
                                                                            action: "offer_expiry",
                                                                            message: "Your donations for offer are reversed to talent points as the offer-" + offer_name + " is expired",
                                                                            transaction_id: transaction_id
                                                                        }
                                                                    }
                                                                }, { upsert: true })
                                                                .exec()
                                                                .then(dex => {})
                                                        }).catch(err => { //catch for userid update
                                                            console.log(err)
                                                        });
                                                }
                                            }

                                            userDetails.findOneAndUpdate({
                                                    $and: [{ _id: ObjectId(doc._id) },
                                                        { "offer_details.offer": dex.offer._id }
                                                    ]
                                                }, { $pull: { offer_details: { offer: dex.offer._id } } })
                                                .exec()
                                                .then(result => {
                                                    console.log("cron job to remove expired offers from users done.")
                                                }).catch(err => { //catch for userid update
                                                    console.log(err)
                                                });
                                        }
                                    }
                                }
                            }
                        }
                    })
                }
            })
        }).catch(err => {
            console.log(err)
        });

});

router.get("/primary_donation_server", (req, res, next) => {

    userDetails.find({})
        .populate('userid')
        .exec()
        .then(data => {
            var mobile_verified = []
            var not_verified_objects = []
            var not_verified = []

            data.map(users => {
                if (users.userid != null) {
                    if (users.userid.mobile_verified == 'true') {
                        mobile_verified.push(users)
                    } else {
                        not_verified.push(users.userid._id)
                        not_verified_objects.push(ObjectId(users.userid._id))
                    }
                }
            })

            if (not_verified.length > 0) {

                // var msgbody = "Please verify your mobile number to participate in primary offer lottery."
                // const note_no = Math.floor(10000000000 + Math.random() * 90000000000);
                // notificationModel.updateMany({ userid: { $in: not_verified_objects } }, {
                //         $push: {
                //             notifications: {
                //                 notification_data: msgbody,
                //                 member_id: "",
                //                 notification_type: 'is_verification_required',
                //                 notification_number: note_no,
                //                 username: "",
                //                 item_id: "",
                //                 profileimage: ObjectId(null),
                //                 created_at: Date.now()
                //             }
                //         }
                //     })
                //     .exec()
                //     .then(dosy => {
                //         if (dosy === null) {

                //         } else {
                //             fcmModel.find({ userid: { $in: not_verified } })
                //                 .exec()
                //                 .then(user => {
                //                   //  console.log(user)
                //                     if (user.length < 1) {
                //                         // return res.status(200).json({
                //                         //   status:"Failed",
                //                         //   message:"Please provide correct member_id."
                //                         // });
                //                     } else {
                //                         var serverKey = constants.FCMServerKey;
                //                         var fcm = new FCM(serverKey);

                //                         var user_fcm = [];
                //                         user.forEach(function(ele) {
                //                             user_fcm.push(ele.fcmtoken)
                //                         })

                //                         var message = {
                //                             registration_ids: user_fcm,
                //                             collapse_key: 'exit',

                //                             notification: {
                //                                 title: 'FvmeGear',
                //                                 body: msgbody,
                //                             },
                //                             data: {
                //                                 notification_id: note_no,
                //                                 message: msgbody,
                //                                 notification_slug: 'is_verification_required',
                //                                 url: "",
                //                                 username: "",
                //                                 item_id: "",

                //                                 userid: "",
                //                                 feed_id: "",
                //                                 member_feed_id: "",
                //                                 member_id: "",
                //                                 is_from_push: true
                //                             },
                //                             android: {
                //                                 priority: "high"
                //                             },
                //                             webpush: {
                //                                 headers: {
                //                                     "Urgency": "high"
                //                                 }
                //                             }
                //                         };
                //                         var is_err = false
                //                         fcm.send(message, function(err, response) {
                //                             console.log(response)

                //                         });
                //                         //          res.status(200).json({
                //                         //  status: 'Ok',
                //                         //  message: "Sent successfully"
                //                         // });
                //                     }
                //                 }).catch(err => {
                //                     var spliterror = err.message.split(":")
                //                     res.status(500).json({
                //                         status: 'Failed',
                //                         message: spliterror[0]
                //                     });
                //                 });
                //         }
                //     }).catch(err => {
                //         var spliterror = err.message.split(":")
                //         res.status(500).json({
                //             status: 'Failed',
                //             message: spliterror[0]
                //         });
                //     });
                // console.log("message sent.")
            }

            mobile_verified.map(doc => {

                var no_contacts = 0
                var followers = 0
                // if (dex.length > 0) {
                no_contacts = doc.no_contacts
                // }

                followers = doc.followers.length

                if (no_contacts >= 10 || followers >= 10 || no_contacts + followers >= 10) {
                    // if (no_contacts >= 20 || followers >= 20 || no_contacts + followers >= 20) {
                    if (doc.offer_details.length > 0) {
                        var offers = doc.offer_details
                        var found = offers.find(o => o.is_primary_offer === true)
                        if (typeof found != 'undefined') {
                            console.log("user name -------------- " + doc.userid.username)
                            if (found.primary_contribution === false) {
                                var talent_points = doc.talent_points;
                                var view_points = doc.view_points
                                var user_condition = ""
                                var user_query = ""
                                var amount = 10;
                                var min_amount = 120;
                                var enough_coins = true;
                                var remaining_points = 0;
                                var view_points_from = 0
                                var talent_points_from = 0
                                var mode = ""
                                var final_mode = ""

                                if (talent_points >= min_amount) {
                                    user_query = { userid: ObjectId(doc.userid._id) }
                                    user_condition = { $inc: { talent_points: -amount } }
                                    talent_points_from = amount
                                    mode = "talent"
                                } else if (view_points >= min_amount) {
                                    user_query = { userid: ObjectId(doc.userid._id) }
                                    user_condition = { $inc: { view_points: -amount } }
                                    view_points_from = amount
                                    mode = "view"
                                } else if (view_points + talent_points >= min_amount) {
                                    remaining_points = amount - talent_points
                                    user_query = { userid: ObjectId(doc.userid._id) }
                                    user_condition = {
                                        $inc: { view_points: -remaining_points },
                                        $set: { talent_points: 0 }
                                    }
                                    talent_points_from = talent_points
                                    view_points_from = remaining_points
                                    mode = "both"
                                } else {
                                    enough_coins = false
                                }

                                if (enough_coins === false) {
                                    userDetails.findOneAndUpdate({
                                            userid: ObjectId(doc.userid._id),
                                            'offer_details.primary_offer': ObjectId(found.primary_offer)
                                        }, { $set: { 'offer_details.$.primary_contribution': false } }, { new: true })
                                        .exec()
                                        .then(dox => {}).catch(err => { //catch for userid update
                                            console.log(err.message)
                                        });
                                    var msgbody = "Do some activity to participate in primary offer lottery."
                                    const note_no = Math.floor(10000000000 + Math.random() * 90000000000);
                                    notificationModel.update({ userid: ObjectId(doc.userid._id) }, {
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
                                            if (dosy === null) {} else {
                                                fcmModel.find({ userid: doc.userid._id })
                                                    .exec()
                                                    .then(user => {
                                                        // console.log(user)
                                                        if (user.length < 1) {
                                                            // return res.status(200).json({
                                                            //   status:"Failed",
                                                            //   message:"Please provide correct member_id."
                                                            // });
                                                        } else {
                                                            var serverKey = constants.FCMServerKey;
                                                            var fcm = new FCM(serverKey);

                                                            var user_fcm = [];
                                                            // user.forEach(function(ele) {
                                                            //     user_fcm.push(ele.fcmtoken)
                                                            // })

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
                                } else {
                                    userDetails.findOneAndUpdate(user_query, user_condition)
                                        .exec()
                                        .then(dox => {
                                            userDetails.findOneAndUpdate({
                                                    userid: ObjectId(doc.userid._id),
                                                    // userid: ObjectId('5cb477621bee0205be802e56'),
                                                    'offer_details.primary_offer': ObjectId(found.primary_offer)
                                                }, {
                                                    $push: {
                                                        'offer_details.$.contributions': {
                                                            userid: ObjectId(doc._id),
                                                            cont_points: amount,
                                                            view_points_from: view_points_from,
                                                            talent_points_from: talent_points_from,
                                                            cont_date: Date.now()
                                                        }
                                                    },
                                                    $inc: { 'offer_details.$.total_contributions': amount },
                                                    $set: { 'offer_details.$.primary_contribution': true }
                                                })
                                                .exec()
                                                .then(dox => {
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
                                                    userTransactions.findOneAndUpdate({ userid: ObjectId(doc.userid._id) }, {
                                                            $push: {
                                                                transactions: {
                                                                    date_of_transaction: Date.now(),
                                                                    amount: amount,
                                                                    mode: mode,
                                                                    transaction_type: "debit",
                                                                    action: "primary_offer_donation",
                                                                    message: "20" + final_mode + " points are deducted as part of primary offer",
                                                                    transaction_id: transaction_id
                                                                }
                                                            }
                                                        }, { upsert: true })
                                                        .exec()
                                                        .then(dex => {})

                                                    var msgbody = "20 Points are been deducted as part of the primary offer lottery."
                                                    const note_no = Math.floor(10000000000 + Math.random() * 90000000000);
                                                    notificationModel.update({ userid: ObjectId(doc.userid._id) }, {
                                                            $push: {
                                                                notifications: {
                                                                    notification_data: msgbody,
                                                                    member_id: "",
                                                                    notification_type: 'home',
                                                                    notification_number: note_no,
                                                                    username: "",
                                                                    item_id: found.primary_offer,
                                                                    profileimage: ObjectId(null),
                                                                    created_at: Date.now()
                                                                }
                                                            }
                                                        })
                                                        .exec()
                                                        .then(dosy => {
                                                            if (dosy === null) {} else {
                                                                fcmModel.find({ userid: doc.userid._id })
                                                                    .exec()
                                                                    .then(user => {
                                                                        //  console.log(user)
                                                                        if (user.length < 1) {
                                                                            // return res.status(200).json({
                                                                            //   status:"Failed",
                                                                            //   message:"Please provide correct member_id."
                                                                            // });
                                                                        } else {
                                                                            var serverKey = constants.FCMServerKey;
                                                                            var fcm = new FCM(serverKey);

                                                                            var user_fcm = [];
                                                                            // user.forEach(function(ele) {
                                                                            //     user_fcm.push(ele.fcmtoken)
                                                                            // })

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
                                                                                    notification_slug: 'home',
                                                                                    url: "",
                                                                                    username: "",
                                                                                    item_id: found.primary_offer,

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
                                                    console.log("primary offer donation done.")
                                                }).catch(err => { //catch for userid update
                                                    console.log(err.message)
                                                });
                                        }).catch(err => { //catch for userid update
                                            console.log(err.message)
                                        });
                                }
                            } else {
                                console.log("In else -----------------")
                            }
                        }
                    }

                }

            })
        }).catch(err => {
            console.log(err.message)
        });

});

router.get("/contact_dup", (req, res, next) => {

    contactsModel.distinct("existing_contacts.contact", { userid: { $in: [ObjectId("5c8f34b9fce58409bbe22b3d"), ObjectId("5c8ef4bbca2884686236c1bd")] } })
        .exec()
        .then(data => {
            console.log(data)

        }).catch(err => { //catch for offer_id find.
            var spliterror = err.message.split("_")

            console.log(err.message)
        });
});

router.post("/add_address", (req, res, next) => {

    var keyArray = ["userid", "iv_token", "clientid", "address"];
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
                        var address = req.body.address
                        var users = new addressModel({
                            _id: new mongoose.Types.ObjectId(),
                            userid: req.body.userid,
                            name: address.name,
                            door_no: address.door_no,
                            street: address.street,
                            locality: address.locality,
                            city: address.city,
                            state: address.state,
                            pin: address.pin,
                            alternate_mobile: address.alternate_mobile,
                            address_name: address.address_name,
                            created_on: Date.now()
                        });

                        users.save()
                            .then(data => {

                                if (data === null) {
                                    return res.status(200).json({
                                        status: "Failed",
                                        message: "Please provide correct userid."
                                    });
                                } else {
                                    userDetails.findOneAndUpdate({ userid: ObjectId(req.body.userid) }, { $push: { user_address: ObjectId(data._id) } })
                                        .exec()
                                        .then(dex => {
                                            if (dex === null) {
                                                return res.status(200).json({
                                                    status: "Failed",
                                                    message: "Can't add address to database."
                                                });
                                            } else {
                                                return res.status(200).json({
                                                    status: "Ok",
                                                    message: "Added address successfully.",
                                                    address: {
                                                        "address_id": data._id,
                                                        "address_name": data.address_name,
                                                        "name": data.name,
                                                        "door_no": data.door_no,
                                                        "street": data.street,
                                                        "locality": data.locality,
                                                        "city": data.city,
                                                        "state": data.state,
                                                        "pin": data.pin,
                                                        "alternate_mobile": data.alternate_mobile
                                                    }
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


router.post("/get_address_list", (req, res, next) => {

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
                            .populate("user_address")
                            .exec()
                            .then(docs => {
                                if (docs.length < 1) {
                                    res.status(200).json({
                                        status: "Failed",
                                        message: "Please provide correct userid."
                                    })
                                } else {

                                    var test = []
                                    var ff = docs[0].user_address
                                    ff.map(doc => {

                                        var foe = {
                                            "address_id": doc._id,
                                            "address_name": doc.address_name,
                                            "name": doc.name,
                                            "door_no": doc.door_no,
                                            "street": doc.street,
                                            "locality": doc.locality,
                                            "city": doc.city,
                                            "state": doc.state,
                                            "pin": doc.pin,
                                            "alternate_mobile": doc.alternate_mobile
                                        }
                                        test.push(foe);
                                    })

                                    res.status(200).json({
                                        status: "Ok",
                                        message: "List of Address.",
                                        addresses: test
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

router.get('/offers_redeem_tracking_list', (req, res, next) => {


    offerRedeemModel.aggregate([{
            $group: {
                _id: "$userid",
                redeems: {
                    $addToSet: {
                        offer: "$offer",
                        redeem_on: "$redeem_on",
                        coins_paid: "$coins_paid",
                        is_redeemed_only_with_coins: "$is_redeemed_only_with_coins",
                        payment_id: "$payment_id",
                        payment_type: "$payment_type",
                        payment_status: "$payment_status",
                        transaction_id: "$transaction_id",
                        address: "$address",
                        amount_paid: "$amount_paid",
                        discount: "$discount"
                    }
                },
                count: { $sum: 1 }
            }
        }
        // , { $lookup: { from: "redeems", localField: "$redeems.userid", foreignField: "_id", as: "users"  } }
    ], function(err, data) {
        // console.log(data);
        // res.json({
        //     status:'OK',
        //     message:data
        // })
        if (err) {
            res.status(200).json({
                status: 'Failed',
                message: 'Please provide correct feed_id.'
            });
        } else {
            if (data.length > 0) {
                User.populate(data, {
                    path: '_id',
                    select: 'profileimage mobile fullname username email'
                    //    populate: {path: 'userid'}
                }, function(err, result) {
                    bsOffers.populate(result, {
                        path: 'redeems.offer',
                        //    populate: {path: 'userid'}
                        select: 'business_post_name business_post_price business_post_desc business_catetgory_type'
                        // {$project:{no_likes:1}}
                    }, function(err, final_result) {
                        console.log(final_result);
                        return res.json({
                            status: 'OK',
                            // data:data,
                            message: final_result
                        })
                    })
                })
            } else {
                res.status(200).json({
                    status: 'Ok',
                    message: 'No redeems',
                });
            }
        }
    })

    // offerRedeemModel.find({})
    //     .populate('offer userid address')
    //     .exec()
    //     .then(result => {
    //         console.log(result);
    //         return res.json({
    //             status: 'Ok',
    //             result: result
    //         })
    //         var redeemed_arr = [];
    //         result.filter(function (doc) {
    //             var profileimage = "";
    //             if (doc.userid.profileimage) {
    //                 profileimage = doc.userid.profileimage;
    //             } else {
    //                 profileimage = 'uploads/userimage.png';
    //             }
    //             var obj = {
    //                 _id: doc._id,
    //                 redeem_on: doc.redeem_on,
    //                 coins_paid: doc.coins_paid,
    //                 is_redeemed_only_with_coins: doc.is_redeemed_only_with_coins,
    //                 payment_id: doc.payment_id,
    //                 payment_type: doc.payment_type,
    //                 payment_status: doc.payment_status,
    //                 transaction_id: doc.transaction_id,
    //                 address: doc.address,
    //                 amount_paid: doc.amount_paid,
    //                 discount: doc.discount,
    //                 profileimage: profileimage,
    //                 mobile: doc.userid.mobile,
    //                 fullname: doc.userid.fullname,
    //                 username: doc.userid.username,
    //                 email: doc.userid.email,
    //                 business_post_name: doc.offer.business_post_name,
    //                 business_post_price: doc.offer.business_post_price,
    //                 business_post_desc: doc.offer.business_post_desc,
    //                 business_catetgory_type: doc.offer.business_catetgory_type
    //             }
    //             redeemed_arr.push(obj);
    //         })
    //
    //         res.status(200).json({
    //             status: 'OK',
    //             message: redeemed_arr
    //         })
    //     }).catch(err => {
    //     var spliterror = err.message.split(":")
    //     res.status(500).json({
    //         status: 'Failed',
    //         message: spliterror[0] + spliterror[1]
    //     });
    // });

})

router.get('/offers_redeem_tracking', (req, res, next) => {
    offerRedeemModel.find({})
        .populate('offer')
        .exec()
        .then(result => {
            // console.log(result);
            // return res.json({
            //     status:'Ok',
            //     result:result
            // })
            var redeemed_only_with_coins_arr = [];
            result.filter(function(doc) {
                if (doc.is_redeemed_only_with_coins == true) {
                    console.log('return');
                    return;
                }
                var price = doc.offer.business_post_price
                var discount = discounts(price)
                //  var total = doc.total_contributions
                var finals = price * (discount / 100)
                //   var final = finals * 10
                //   var final_total = price - finals

                //   var cont_limit = final - total
                var coins = parseInt(finals * 10)
                console.log("cons", coins);
                if (doc.coins_paid == coins && !doc.is_redeemed_only_with_coins) {
                    redeemed_only_with_coins_arr.push(doc._id);
                    console.log("redeemed with coins", doc._id);
                }
            });
            offerRedeemModel.updateMany({ _id: { $in: redeemed_only_with_coins_arr } }, {
                    $set: { is_redeemed_only_with_coins: true }
                }, { new: true })
                .exec()
                .then(update_result => {
                    res.json({
                        status: "OK",
                        message: update_result
                    });
                }).catch(err => { //catch for userid update
                    var spliterror = err.message.split(":")
                    res.status(500).json({
                        status: 'Failed',
                        message: spliterror[0]
                    });
                })
            //console.log('final');

        }).catch(err => {
            var spliterror = err.message.split(":")
            res.status(500).json({
                status: 'Failed',
                message: spliterror[0] + spliterror[1]
            });
        });

})

var discounts = function(price) {
    var discount = 0
    // if (Math.floor(price) <= 10) {
    //                                             discount = 100
    //                                         } else if (Math.floor(price) >= 11 && Math.floor(price) <= 99) {
    //                                             discount = 80
    //                                         } else if (Math.floor(price) >= 100 && Math.floor(price) <= 499) {
    //                                             discount = 70
    //                                         } else if (Math.floor(price) >= 500 && Math.floor(price) <= 1499) {
    //                                             discount = 75
    //                                         } else if (Math.floor(price) >= 1500 && Math.floor(price) <= 2499) {
    //                                             discount = 60
    //                                         } else if (Math.floor(price) >= 2500 && Math.floor(price) <= 5000) {
    //                                             discount = 45
    //                                         } else {
    //                                             discount = 0
    //        
    //}
    if (Math.floor(price) <= 100) {
        discount = 100
    } else {
        discount = parseInt(100 / price * 100)
    }

    return discount
}

var discounts_wishlist = function(price) {
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
    // if(Math.floor(price) <= 100)  {
    //     discount = 100
    // }   
    // else{
    //     discount = parseInt(100/price * 100)
    // }                            

    return discount
}

module.exports = router;