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
const userTransactions = require("../models/user_transactions")
const messageModel = require("../models/iv_message");

mongoose.set('useFindAndModify', false);

router.post("/store_contacts", (req, res, next) => {

    var keyArray = ["userid", "iv_token", "clientid", "contacts"];
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
                        });;
                    } else {
                        User.find({ _id: req.body.userid })
                            .exec()
                            .then(dex => {
                                if (dex.length < 1) {
                                    res.status(200).json({
                                        status: 'Failed',
                                        message: 'Please provide correct userid.'
                                    });
                                } else {
                                    var contacts = req.body.contacts
                                    var contactArray = [];
                                    if (contacts.length > 0) {
                                        contacts.forEach(function(ele) {

                                            var foundy = contactArray.find(o => String(o.mobile) === String(ele.mobile))

                                            if (typeof foundy === 'undefined') {

                                                var mobile = String(ele.mobile).replace(/\s/g, "")
                                                mobile = mobile.replace(/-/g, "")
                                                mobile = mobile.replace(/ /g, "")
                                                mobile = mobile.replace(/[`~!@#$%^&*()_|\-=?;:'",.<>\{\}\[\]\\\/]/gi, '')
                                                if (mobile.substring(0, 1) === '+') {
                                                    mobile = mobile.substring(3)
                                                }
                                                if (mobile.substring(0, 1) === '+') {
                                                    mobile = mobile.substring(3)
                                                }
                                                mobile = parseInt(mobile)
                                                if (isNaN(mobile)) {
                                                    mobile = 0
                                                }
                                                contactArray.push(mobile)
                                            }
                                        })
                                    }

                                    User.find({ mobile: { $in: contactArray } })
                                        .select('_id mobile')
                                        .exec()
                                        .then(data => {
                                            existing_contacts_ids = [];
                                            existing_contacts = [];
                                            data.map(doc => {
                                                //console.log(doc.mobile)
                                                if (String(dex[0].mobile) != String(doc.mobile)) {
                                                    existing_contacts_ids.push(ObjectId(doc._id))
                                                    existing_contacts.push(doc.mobile)
                                                }
                                            })

                                            var new_contacts = [];
                                            contacts.forEach(function(efe) {
                                                var mobi = String(efe.mobile).replace(/\s/g, "")
                                                mobi = String(efe.mobile).replace(/-/g, "")
                                                mobi = String(efe.mobile).replace(/ /g, "")
                                                mobi = String(efe.mobile).replace(/[`~!@#$%^&*()_|\-=?;:'",.<>\{\}\[\]\\\/]/gi, '')
                                                if (mobi.substring(0, 1) === '+') {
                                                    mobi = mobi.substring(3)
                                                }
                                                var found = existing_contacts.find(o => String(o) === String(mobi));
                                                if (typeof found === 'undefined') {
                                                    var founds = new_contacts.find(o => String(o.mobile) === String(mobi))
                                                    if (typeof founds === 'undefined') {
                                                        var foee = { 'username': efe.username, 'mobile': mobi }
                                                        new_contacts.push(foee)
                                                    }

                                                }

                                            })
                                            contactsModel.aggregate([{
                                                        $match: { userid: ObjectId(req.body.userid) }
                                                    },
                                                    { $unwind: "$existing_contacts" },
                                                    { $match: { 'existing_contacts.contact': { $in: existing_contacts_ids } } },
                                                    { $group: { _id: "$userid", contacts: { $addToSet: "$existing_contacts.contact" } } }
                                                ]).exec()
                                                .then(result => {

                                                    var non_exist = [];
                                                    if (result.length > 0) {
                                                        if (result[0].contacts.length > 0) {
                                                            var conlist = result[0].contacts
                                                            existing_contacts_ids.forEach(function(ele) {
                                                                var found = conlist.find(o => String(o) === String(ele));
                                                                if (typeof found === 'undefined') {
                                                                    non_exist.push(ObjectId(ele))
                                                                }
                                                            })
                                                        }
                                                    } else {
                                                        //console.log("in no exist")
                                                        non_exist = existing_contacts_ids
                                                    }

                                                    userDetails.find({ userid: { $in: non_exist } })
                                                        .populate('userid')
                                                        .select('_id userid category_type')
                                                        .exec()
                                                        .then(docs => {
                                                            var ex_contacts = [];
                                                            docs.map(con => {
                                                                var foe = {
                                                                    contact: con.userid._id,
                                                                    contact_details: con._id,
                                                                    user_category: con.category_type,
                                                                    status: ""
                                                                }
                                                                ex_contacts.push(foe) //existing contacts to be pushed
                                                            })
                                                            contactsModel.find({ userid: req.body.userid })
                                                                .exec()
                                                                .then(docy => {
                                                                    var newconcs = docy[0].new_contacts
                                                                    var all_false = false;
                                                                    var one_true = false;
                                                                    var new_con = [];
                                                                    var change_con = [];
                                                                    if (newconcs.length > 0) {
                                                                        new_contacts.forEach(function(efo) {
                                                                            var all_false = false;
                                                                            var one_true = false;
                                                                            var foun = newconcs.find(o => String(o.mobile) === String(efo.mobile))
                                                                            if (typeof foun === 'undefined') {
                                                                                all_false = true
                                                                            } else {
                                                                                // 								if(String(efo.username) === String(foun.username) && String(efo.mobile) != String(foun.mobile) ){
                                                                                //  	all_false = false;
                                                                                //  	one_true = true;

                                                                                //  								}
                                                                                // if(String(efo.username) != String(foun.username) && String(efo.mobile) === String(foun.mobile) ){
                                                                                //  	all_false = false;
                                                                                //  	one_true = true
                                                                                // }
                                                                            }
                                                                            if (all_false === true) {
                                                                                new_con.push(efo)
                                                                            }
                                                                            if (one_true === true) {
                                                                                change_con.push(efo)
                                                                            }
                                                                        })
                                                                    } else {
                                                                        new_con = new_contacts
                                                                    }
                                                                    contactsModel.findOneAndUpdate({ userid: ObjectId(req.body.userid) }, { $push: { existing_contacts: ex_contacts, new_contacts: new_con } }, { new: true })
                                                                        .exec()
                                                                        .then(reqe => {
                                                                            // if(change_con.length>0){
                                                                            // 	change_con.forEach(function(ola){
                                                                            // 			contactsModel.findOneAndUpdate({$and:[{userid:ObjectId(req.body.userid)},
                                                                            // 						{$or:[{new_contacts:{$elemMatch:{username:ola.username}}},
                                                                            // 							{new_contacts:{$elemMatch:{mobile:ola.mobile}}}
                                                                            // 						]}
                                                                            // 						]},
                                                                            // 					{$set:{'new_contacts.$':{
                                                                            // 						username: ola.username,
                                                                            // 						mobile: ola.mobile,
                                                                            // 						status: ""
                                                                            // 					}}},{new:true})
                                                                            // 					.exec()
                                                                            // 					.then(dec =>{
                                                                            // 						console.log(dec)
                                                                            // 					}).catch(err => {
                                                                            //        var spliterror=err.message.split(":")
                                                                            //          res.status(500).json({
                                                                            //            status: 'Failed',
                                                                            //            message: spliterror[0]
                                                                            //          });
                                                                            //    });
                                                                            // 	})
                                                                            // }

                                                                            res.status(200).json({
                                                                                status: 'Ok',
                                                                                message: 'Contacts added successfully'
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

router.post("/get_contacts_by_category", (req, res, next) => {

    var keyArray = ["userid", "iv_token", "clientid", "category", "page_no"];
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
                        contactsModel.aggregate(
                            [{ $match: { userid: ObjectId(req.body.userid) } },
                               // { $match: { 'existing_contacts.user_category': req.body.category } },
                                {
                                    $project: {
                                        blocked: '$blocked',
                                        existing_contacts: '$existing_contacts.contact_details'
                                    }
                                }
                            ],
                            function(err, data) {
                                if (err) {
                                    return res.status(200).json({
                                        status: "Failed",
                                        message: 'Please provide correct userid.'
                                    });
                                } else {

                                    if (data.length < 1) {
                                        res.status(200).json({
                                            status: 'Ok',
                                            message: 'No contacts to display',
                                            contacts: []
                                        });
                                    } else {

                                        var perPage = 100;
                                        var page = req.body.page_no;

                                        if (isEmpty(page)) {
                                            page = 1
                                        }
                                        var skip = (perPage * page) - perPage;
                                        var limit = skip + perPage;

                                        var category_array = []
                                        var category_user = req.body.category

                                        if(category_user === 'Supernova'){
                                        	category_array = ['Supernova','Stellar']
                                        }
                                        else{
                                        	category_array = ['Stellar']
                                        }

                                        userDetails.find({ $and: [{ userid: { $nin: data[0].blocked } }, { _id: { $in: data[0].existing_contacts } }, {category_type:{$in:category_array}}] })
                                            .populate("userid", "_id username profileimage mobile fullname")
                                            .exec()
                                            .then(docs => {
                                                if (docs.length < 1) {
                                                    return res.status(200).json({
                                                        status: "Ok",
                                                        message: "No contacts to display.",
                                                        contacts: []
                                                    });
                                                } else {
                                                    var testapi = [];
                                                    docs.map(conn => {
                                                        var offer = conn.offer_details;
                                                        if (typeof offer != 'undefined') {
                                                            //if(offer.length>0){
                                                            var profileimage = conn.userid.profileimage;
                                                            if (conn.userid.profileimage === null) {
                                                                profileimage = "uploads/userimage.png"
                                                            }
                                                            var tess = {
                                                                "username": conn.userid.username,
                                                                "fullname": conn.userid.fullname,
                                                                "userid": conn.userid._id,
                                                                "mobile": conn.userid.mobile,
                                                                "profileimage": constants.APIBASEURL + profileimage,
                                                                "view_points": 0,
                                                                "talent_points": 0
                                                            }
                                                            testapi.push(tess)
                                                            //	}
                                                        }
                                                    })
                                                    testapi.sort(
                                                        function(a, b) {
                                                            if ((a.username).toLowerCase() < (b.username).toLowerCase()) return -1;
                                                            if ((a.username).toLowerCase() > (b.username).toLowerCase()) return 1;
                                                            return 0;
                                                        }
                                                    );
                                                    var totalPages = 1;
                                                    const totalcontacts = testapi.length;
                                                    if (testapi.length > perPage) {
                                                        totalPages = Math.ceil((testapi.length) / perPage);
                                                        testapi = testapi.slice(skip, limit);
                                                    } else {
                                                        page = 1;
                                                    }
                                                    res.status(200).json({
                                                        status: 'Ok',
                                                        message: 'List of contacts',
                                                        total_pages: totalPages,
                                                        current_page: page,
                                                        total_contacts: totalcontacts,
                                                        userid: req.body.userid,
                                                        contacts: testapi
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

router.post("/create_offer_group", (req, res, next) => {

    var keyArray = ["userid", "iv_token", "clientid", "offer_id", "member_ids"];
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
                                    .populate('userid')
                                    .exec()
                                    .then(data => {
                                        var offers = data[0].offer_details;
                                        var username = data[0].userid.username;
                                        var is_offer_exists = false
                                        var profileimage = data[0].userid.profileimage;
                                        if (data[0].userid.profileimage === null) {
                                            profileimage = constants.APIBASEURL + "uploads/userimage.png"
                                        }
                                        var msgbody = username + " requested you to join an offer group."
                                        var can_select = true

                                        var date = new Date()
                                        var month = date.getMonth()+1

                                        if(offers.length > 1){
                                            var found = offers.filter(o => String(o.admin) === String(data[0]._id) && month === (new Date(o.created_at)).getMonth()+1)
                                            
                                            console.log("found with month "+found)
                                            if(found.length >= 1){
                                                can_select = false
                                            }
                                        }

                                        if (can_select === false) {
                                            res.status(200).json({
                                                status: 'Failed',
                                                message: "You have crossed your offer selection limit for this month."
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

                                                var reqbody = req.body.member_ids;
                                                var bodyreq = reqbody.split(",");
                                                var objectMembers = [];
                                                var fcmmembers = [];
                                                // reqbody.forEach(function(ele){
                                                // 	objectMembers.push(ObjectId(ele))
                                                // 	fcmmembers.push(ele)
                                                // })
                                                for (var i = 0; i < bodyreq.length; i++) {
                                                    objectMembers.push(ObjectId(bodyreq[i]))
                                                    fcmmembers.push(bodyreq[i])
                                                }

                                                if (objectMembers.length < 0) {
                                                    res.status(200).json({
                                                        status: 'Failed',
                                                        message: "Only 9 members can be part of a group."
                                                    });
                                                } else {

                                                    userDetails.find({ userid: { $in: objectMembers } })
                                                        .exec()
                                                        .then(conn => {

                                                            var users = conn;
                                                            var objectusers = [];
                                                            users.forEach(function(mems) {
                                                                objectusers.push(ObjectId(mems._id))
                                                            })
                                                            objectusers.push(ObjectId(data[0]._id))
                                                            userDetails.findOneAndUpdate({ userid: ObjectId(req.body.userid) }, {
                                                                    $push: {
                                                                        offer_details: {
                                                                            offer: docs[0]._id,
                                                                            offer_status: "Active",
                                                                            requested_group: objectusers,
                                                                            active_group: ObjectId(data[0]._id),
                                                                            admin: ObjectId(data[0]._id),
                                                                            offer_category: docs[0].business_catetgory_type
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
                                                                        const note_no = Math.floor(10000000000 + Math.random() * 90000000000);
                                                                        notificationModel.updateMany({ userid: { $in: objectMembers } }, {
                                                                                $push: {
                                                                                    notifications: {
                                                                                        notification_data: msgbody,
                                                                                        member_id: req.body.userid,
                                                                                        'additional_details.member_id': req.body.userid,
                                                                                        notification_type: 'CreateOfferGroup',
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
                                                                                    fcmModel.find({ userid: { $in: fcmmembers } })
                                                                                        .select('fcmtoken')
                                                                                        .exec()
                                                                                        .then(con => {
                                                                                            if (con.length < 1) {
                                                                                                res.status(200).json({
                                                                                                    status: 'Failed',
                                                                                                    message: "Please provide correct member_ids"
                                                                                                });
                                                                                            } else {
                                                                                                var conarray = [];
                                                                                                con.map(dec => {
                                                                                                    var contacts = dec.fcmtoken
                                                                                                    conarray.push(contacts)
                                                                                                })
                                                                                                var serverKey = constants.FCMServerKey;
                                                                                                var fcm = new FCM(serverKey);

                                                                                                var message = {
                                                                                                    registration_ids: conarray,
                                                                                                    collapse_key: 'exit',

                                                                                                    notification: {
                                                                                                        title: 'FvmeGear',
                                                                                                        body: msgbody,
                                                                                                    },
                                                                                                    data: {
                                                                                                        notification_id: note_no,
                                                                                                        message: msgbody,
                                                                                                        notification_slug: 'CreateOfferGroup',
                                                                                                        url: constants.APIBASEURL + profileimage,
                                                                                                        username: username,
                                                                                                        item_id: req.body.offer_id,
                                                                                                        userid: "",
                                                                                                        feed_id: "",
                                                                                                        member_feed_id: "",
                                                                                                        member_id: req.body.userid,
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
                                                                                                    status: "Ok",
                                                                                                    message: "Group created successfully."
                                                                                                });

                                                                                            }
                                                                                        }).catch(err => {
                                                                                            //console.log(err)
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
                                                                            })
                                                                    }
                                                                }).catch(err => { //catch for userid update
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

                                                        }).catch(err => { //catch for member_ids find.
                                                            var spliterror = err.message.split("_")
                                                            if (spliterror[1].indexOf("id") >= 0) {
                                                                res.status(200).json({
                                                                    status: 'Failed',
                                                                    message: "Please provide correct member_ids"
                                                                });
                                                            } else {
                                                                res.status(500).json({
                                                                    status: 'Failed',
                                                                    message: err.message
                                                                });
                                                            }
                                                        })
                                                }
                                            } else {
                                                res.status(200).json({
                                                    status: 'Failed',
                                                    message: "You have already selected this offer."
                                                });
                                            }
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


router.post("/accept_group_request", (req, res, next) => {

    var keyArray = ["userid", "iv_token", "clientid", "offer_id", "requested_userid"];
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
                                    .populate('userid')
                                    .exec()
                                    .then(data => {
                                        if (data === null) {
                                            res.status(200).json({
                                                status: "Failed",
                                                message: "Please provide correct userid."
                                            })
                                        } else {
                                            userDetails.find({
                                                    userid: ObjectId(req.body.requested_userid),
                                                    'offer_details.offer': ObjectId(req.body.offer_id)
                                                }, { 'offer_details.$': 1, '_id': 1 })
                                                .exec()
                                                .then(dex => {

                                                    if (dex.length < 1) {
                                                        res.status(200).json({
                                                            status: "Failed",
                                                            message: "This offer has been removed."
                                                        })
                                                    } else {
                                                        var ofx = dex[0].offer_details
                                                        var is_rejected = false
                                                        ofx.map(dip => {
                                                            if (dip.rejected_group.length > 0) {
                                                                var rej = dip.rejected_group
                                                                var fou = rej.find(o => String(o) === String(data[0]._id))
                                                                if (typeof fou != undefined) {
                                                                    is_rejected = true
                                                                }
                                                            }
                                                        })

                                                        if (is_rejected === false) {

	                                                        var date = new Date()
					                                        var month = date.getMonth()+1
					                                        var offers = data[0].offer_details
					                                        var can_select = true

					                                        if(data[0].offer_details.length > 1){
					                                            var found = offers.filter(o => String(o.admin) != String(data[0]._id) && month === (new Date(o.created_at)).getMonth()+1)
					                                            
					                                            console.log("found with month "+found)
					                                            if(found.length >= 3){
					                                                can_select = false
					                                            }
					                                        }

                                                            if (can_select === false) {
                                                                res.status(200).json({
                                                                    status: 'Failed',
                                                                    message: "You have crossed your offer participation limit for this month."
                                                                });
                                                            } else {
                                                                var offers = data[0].offer_details

                                                                var found = offers.find(o => String(o.offer) === String(req.body.offer_id))

                                                                if (typeof found === 'undefined') {

                                                                    var username = data[0].userid.username;
                                                                    var msgbody = data[0].userid.username + " accepted your request to join your offer group."
                                                                    var profileimage = data[0].userid.profileimage;
                                                                    if (data[0].userid.profileimage === null) {
                                                                        profileimage = constants.APIBASEURL + "uploads/userimage.png"
                                                                    }

                                                                    var active_group = ofx[0].active_group

                                                                    userDetails.updateMany({ _id: { $in: active_group }, 'offer_details.offer': ObjectId(req.body.offer_id) }, { $push: { 'offer_details.$.active_group': ObjectId(data[0]._id) } }, { new: true })
                                                                        .exec()
                                                                        .then(result => {
                                                                            if (result === null) {
                                                                                res.status(200).json({
                                                                                    status: 'Failed',
                                                                                    message: "This offer request is not valid now."
                                                                                });
                                                                            } else {

                                                                                userDetails.findOneAndUpdate({ userid: ObjectId(req.body.userid) }, {
                                                                                        $push: {
                                                                                            offer_details: ofx
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
                                                                                            userDetails.findOneAndUpdate({ userid: ObjectId(req.body.userid), 'offer_details.offer': ObjectId(req.body.offer_id) }, {
                                                                                                    $push: {
                                                                                                        'offer_details.$.active_group': ObjectId(data[0]._id)
                                                                                                    }
                                                                                                })
                                                                                                .exec()
                                                                                                .then(testing => {

                                                                                                    const note_no = Math.floor(10000000000 + Math.random() * 90000000000);
                                                                                                    notificationModel.findOneAndUpdate({ userid: ObjectId(req.body.requested_userid) }, {
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
                                                                                                                    message: "Please provide correct requested userid."
                                                                                                                });
                                                                                                            } else {

                                                                                                                notificationModel.update({
                                                                                                                        $and: [{ "notifications.notification_type": 'CreateOfferGroup' }, { userid: ObjectId(req.body.userid) },
                                                                                                                            { "notifications.member_id": req.body.requested_userid }, { "notifications.item_id": req.body.offer_id }
                                                                                                                        ]
                                                                                                                    }, { "$set": { "notifications.$[elem].is_action_done": true } }, {
                                                                                                                        "arrayFilters": [{ $and: [{ 'elem.member_id': req.body.requested_userid }, { 'elem.item_id': req.body.offer_id }, { "elem.notification_type": 'CreateOfferGroup' }] }],
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

                                                                                                                            console.log(notify)

                                                                                                                            fcmModel.find({ userid: req.body.requested_userid })
                                                                                                                                .exec()
                                                                                                                                .then(user => {
                                                                                                                                    console.log(user)
                                                                                                                                    if (user.length < 1) {
                                                                                                                                        return res.status(200).json({
                                                                                                                                            status: "Failed",
                                                                                                                                            message: "Please provide correct requested_userid."
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

                                                                                                                                        res.status(200).json({
                                                                                                                                            status: 'Ok',
                                                                                                                                            message: "Added to group successfully"
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
                                                                                                                        console.log(err)
                                                                                                                        //  var spliterror=err.message.split(":")
                                                                                                                        //  res.status(500).json({
                                                                                                                        //     status: 'Failed',
                                                                                                                        //     message: spliterror[0]
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
                                                                                                }).catch(err => { //catch for userid update
                                                                                                    var spliterror = err.message.split("_")
                                                                                                    if (spliterror[1].indexOf("id") >= 0) {
                                                                                                        res.status(200).json({
                                                                                                            status: 'Failed',
                                                                                                            message: "Please provide correct userid"
                                                                                                        });
                                                                                                    } else {
                                                                                                        res.status(500).json({
                                                                                                            status: 'Failed',
                                                                                                            message: spliterror[0]
                                                                                                        });
                                                                                                    }
                                                                                                });
                                                                                        }
                                                                                    }).catch(err => { //catch for userid update
                                                                                        var spliterror = err.message.split("_")
                                                                                        if (spliterror[1].indexOf("id") >= 0) {
                                                                                            res.status(200).json({
                                                                                                status: 'Failed',
                                                                                                message: "Please provide correct userid"
                                                                                            });
                                                                                        } else {
                                                                                            res.status(500).json({
                                                                                                status: 'Failed',
                                                                                                message: spliterror[0]
                                                                                            });
                                                                                        }
                                                                                    });
                                                                            }
                                                                        }).catch(err => { //catch for userid update
                                                                            var spliterror = err.message.split("_")
                                                                            if (spliterror[1].indexOf("id") >= 0) {
                                                                                res.status(200).json({
                                                                                    status: 'Failed',
                                                                                    message: "Please provide correct requested_userid"
                                                                                });
                                                                            } else {
                                                                                res.status(500).json({
                                                                                    status: 'Failed',
                                                                                    message: spliterror[0]
                                                                                });
                                                                            }
                                                                        });
                                                                } else {
                                                                    res.status(200).json({
                                                                        status: 'Failed',
                                                                        message: "You are already participating in this offer."
                                                                    });
                                                                }
                                                            }
                                                        } else {
                                                            console.log("failed")
                                                            res.status(200).json({
                                                                status: 'Failed',
                                                                message: "You have previously rejected this offer."
                                                            });
                                                        }
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

router.post("/reject_group_request", (req, res, next) => {

    var keyArray = ["userid", "iv_token", "clientid", "offer_id", "requested_userid"];
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
                                    .populate('userid')
                                    .exec()
                                    .then(data => {
                                        if (data.length < 1) {
                                            res.status(200).json({
                                                status: "Failed",
                                                message: "Please provide correct userid."
                                            })
                                        } else {

                                            var username = data[0].userid.username;
                                            var msgbody = data[0].userid.username + " rejected your request to join your offer group."
                                            var profileimage = data[0].userid.profileimage;
                                            if (data[0].userid.profileimage === null) {
                                                profileimage = constants.APIBASEURL + "uploads/userimage.png"
                                            }
                                            var offers = data[0].offer_details;

                                            userDetails.find({
                                                    userid: ObjectId(req.body.requested_userid),
                                                    'offer_details.offer': ObjectId(req.body.offer_id)
                                                }, { 'offer_details.$': 1 })
                                                .exec()
                                                .then(dex => {

                                                    if (dex.length < 1) {
                                                        res.status(200).json({
                                                            status: "Failed",
                                                            message: "This offer has been removed."
                                                        })
                                                    } else {

                                                        var off = dex[0].offer_details
                                                        var is_rejected = false
                                                        var is_active = false
                                                        off.map(dog => {
                                                            if (dog.rejected_group.length > 0) {
                                                                var rej = dog.rejected_group
                                                                var foo = rej.find(o => String(o) === String(data[0]._id))
                                                                if (typeof foo != 'undefined') {
                                                                    is_rejected = true
                                                                }
                                                            }

                                                            if (dog.active_group.length > 0) {
                                                                var act = dog.active_group
                                                                var foo = act.find(o => String(o) === String(data[0]._id))
                                                                if (typeof foo != 'undefined') {
                                                                    is_active = true
                                                                }
                                                            }
                                                        })

                                                        if (is_rejected === false) {
                                                            if (is_active === false) {


                                                                userDetails.findOneAndUpdate({ userid: ObjectId(req.body.requested_userid), 'offer_details.offer': ObjectId(req.body.offer_id) }, { $push: { 'offer_details.$.rejected_group': ObjectId(data[0]._id) } })
                                                                    .exec()
                                                                    .then(result => {
                                                                        if (result === null) {
                                                                            res.status(200).json({
                                                                                status: 'Failed',
                                                                                message: "This offer request is not valid now."
                                                                            });
                                                                        } else {
                                                                            const note_no = Math.floor(10000000000 + Math.random() * 90000000000);
                                                                            notificationModel.findOneAndUpdate({ userid: ObjectId(req.body.requested_userid) }, {
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
                                                                                            message: "Please provide correct requested userid."
                                                                                        });
                                                                                    } else {

                                                                                        notificationModel.update({
                                                                                                $and: [{ "notifications.notification_type": 'CreateOfferGroup' }, { userid: ObjectId(req.body.userid) },
                                                                                                    { "notifications.member_id": req.body.requested_userid }, { "notifications.item_id": req.body.offer_id }
                                                                                                ]
                                                                                            }, { "$set": { "notifications.$[elem].is_action_done": true } }, {
                                                                                                "arrayFilters": [{ $and: [{ 'elem.member_id': req.body.requested_userid }, { 'elem.item_id': req.body.offer_id }, { "elem.notification_type": 'CreateOfferGroup' }] }],
                                                                                                "multi": true
                                                                                            })
                                                                                            .exec()
                                                                                            .then(notify => {
                                                                                                if (notify === null) {
                                                                                                    return res.status(200).json({
                                                                                                        status: "Failed",
                                                                                                        message: "Please provide correct requested userid."
                                                                                                    });
                                                                                                } else {

                                                                                                    fcmModel.find({ userid: req.body.requested_userid })
                                                                                                        .exec()
                                                                                                        .then(user => {
                                                                                                            console.log(user)
                                                                                                            if (user.length < 1) {
                                                                                                                return res.status(200).json({
                                                                                                                    status: "Failed",
                                                                                                                    message: "Please provide correct requested_userid."
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
                                                                                                                    status: "Ok",
                                                                                                                    message: "Rejected join request to group successfully."
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
                                                                    message: 'You ar already participating in this offer.'
                                                                });
                                                            }
                                                        } else {
                                                            res.status(200).json({
                                                                status: 'Failed',
                                                                message: 'You have already rejected this offer.'
                                                            });
                                                        }
                                                    }

                                                }).catch(err => { //catch for userid update
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


router.post("/get_offer_group_details", (req, res, next) => {

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
                        userDetails.find({ userid: ObjectId(req.body.userid), 'offer_details.offer': ObjectId(req.body.offer_id) }, { 'offer_details.$': 1 })
                            .populate({ path: 'offer_details.rejected_group offer_details.active_group offer_details.requested_group', populate: { path: 'userid' } })
                            .exec()
                            .then(result => {
                                if (result.length < 1) {
                                    return res.status(200).json({
                                        status: "Failed",
                                        message: "User might have deleted the offer."
                                    });
                                } else {
                                    var offer = result[0].offer_details
                                    var active_members = [];
                                    var offerdetails = [];
                                    var test = [];
                                    if (typeof offer != 'undefined') {
                                        offer.map(docs => {
                                            var request_group = [];
                                            var rejected_group = [];
                                            var count = 0;
                                            if (typeof docs.active_group != 'undefined') {
                                                var ac_group = docs.active_group
                                                ac_group.map(conn => {
                                                    var is_admin = false
                                                    var is_donated = true;
                                                    var profileimage = conn.userid.profileimage;
                                                    if (conn.userid.profileimage === null) {
                                                        profileimage = "uploads/userimage.png"
                                                    }
                                                    if (String(conn._id) === String(docs.admin)) {
                                                        is_admin = true
                                                        is_donated = false
                                                    } else {
                                                        if (docs.contributions.length > 0) {
                                                            var contribution = docs.contributions
                                                            contribution.forEach(function(efe) {
                                                                if (String(efe.userid) === String(result[0]._id)) {
                                                                    var date = new Date()
                                                                    var dates1 = date.setTime(date.getTime());
                                                                    var dateNow1 = new Date(dates1).toISOString();
                                                                    var current_day = String(dateNow1).split('T')
                                                                    var hists = (efe.cont_date).toISOString();
                                                                    var history_date = String(hists).split('T')
                                                                    if (current_day[0] === history_date[0]) {
                                                                        count++
                                                                    }
                                                                } else {
                                                                    count = 0;
                                                                }
                                                            })
                                                            console.log(count)
                                                            if (count >= 1) {
                                                                console.log(is_donated)
                                                                is_donated = true
                                                            } else {
                                                                is_donated = false
                                                            }
                                                        }
                                                    }
                                                    var goo = {
                                                        "userid": conn.userid._id,
                                                        "username": conn.userid.username,
                                                        "fullname": conn.userid.fullname,
                                                        "profileimage": constants.APIBASEURL + profileimage,
                                                        "mobile": conn.userid.mobile,
                                                        "view_points": conn.view_points,
                                                        "talent_points": conn.talent_points,
                                                        "is_admin": is_admin,
                                                        "is_donated": is_donated,
                                                        "status": 1
                                                    }
                                                    active_members.push(conn._id)
                                                    test.push(goo);
                                                })
                                            }
                                            if (typeof docs.requested_group != 'undefined') {
                                                var req_group = docs.requested_group;
                                                req_group.map(con => {
                                                    var is_admin = false
                                                    var is_donated = false;

                                                    var profileimage = con.userid.profileimage;
                                                    if (con.userid.profileimage === null) {
                                                        profileimage = "uploads/userimage.png"
                                                    }
                                                    if (active_members.length > 0) {
                                                        var found = active_members.every(function(eff) {
                                                            if (String(eff) === String(con._id)) {
                                                                return false
                                                            } else {
                                                                return true
                                                            }
                                                        })
                                                        if (found === true) {
                                                            var foo = {
                                                                "userid": con.userid._id,
                                                                "username": con.userid.username,
                                                                "fullname": con.userid.fullname,
                                                                "profileimage": constants.APIBASEURL + profileimage,
                                                                "mobile": con.userid.mobile,
                                                                "view_points": con.view_points,
                                                                "talent_points": con.talent_points,
                                                                "is_admin": is_admin,
                                                                "is_donated": is_donated,
                                                                "status": 0
                                                            }
                                                            test.push(foo);
                                                        }
                                                    }
                                                })
                                            }
                                            if (typeof docs.rejected_group != 'undefined') {
                                                var rej_group = docs.rejected_group;
                                                rej_group.map(conns => {
                                                    var is_admin = false
                                                    var is_donated = false;
                                                    var profileimage = conns.userid.profileimage;
                                                    if (conns.userid.profileimage === null) {
                                                        profileimage = "uploads/userimage.png"
                                                    }
                                                    if (active_members.length > 0) {
                                                        var found = active_members.every(function(eff) {
                                                            if (String(eff) === String(con._id)) {
                                                                return false
                                                            } else {
                                                                return true
                                                            }
                                                        })
                                                        if (found === true) {
                                                            var foo = {
                                                                "userid": con.userid._id,
                                                                "username": con.userid.username,
                                                                "fullname": con.userid.fullname,
                                                                "profileimage": constants.APIBASEURL + profileimage,
                                                                "mobile": con.userid.mobile,
                                                                "view_points": con.view_points,
                                                                "talent_points": con.talent_points,
                                                                "is_admin": is_admin,
                                                                "is_donated": is_donated,
                                                                "status": 2
                                                            }
                                                            test.push(foo);
                                                        }
                                                    }
                                                })
                                            }
                                        })
                                        res.status(200).json({
                                            status: 'Ok',
                                            message: 'Offer group details',
                                            userid: req.body.userid,
                                            offer_id: req.body.offer_id,
                                            offer_status: offer[0].offer_status,
                                            is_primary_offer: offer[0].is_primary_offer,
                                            group: {
                                                users: test
                                            }

                                        });
                                    } else {
                                        res.status(200).json({
                                            status: 'Failed',
                                            message: 'User might have deleted the offer.'
                                        });
                                    }
                                }
                            }).catch(err => { //catch for userid find
                                var spliterror = err.message.split("_")
                                if (spliterror[1].indexOf("_id") >= 0) {
                                    res.status(200).json({
                                        status: 'Failed',
                                        message: "Please provide correct offer_id"
                                    });
                                } else if (spliterror[1].indexOf("id") >= 0) {
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

router.post("/get_contacts", (req, res, next) => {

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
                        console.log(req.body.page_no)
                        contactsModel.aggregate([{ $match: { userid: ObjectId(req.body.userid) } },
                            {
                                $project: {
                                    blocked: '$blocked',
                                    existing_contacts: '$existing_contacts.contact_details'
                                }
                            }
                        ], function(err, data) {
                            if (err) {
                                res.status(200).json({
                                    status: 'Failed',
                                    message: "Please provide correct userid"
                                });
                            } else {
                                if (data.length < 1) {
                                    res.status(200).json({
                                        status: 'Ok',
                                        message: 'No contacts to Display.',
                                        contacts: []
                                    });
                                } else {

                                    var perPage = 100;
                                    var page = req.body.page_no;

                                    if (isEmpty(page)) {
                                        page = 1
                                    }
                                    var skip = (perPage * page) - perPage;
                                    var limit = skip + perPage;
                                    userDetails.find({ $and: [{ userid: { $nin: data[0].blocked } }, { _id: { $in: data[0].existing_contacts } }] })
                                        .populate("userid", "_id username profileimage mobile fullname")
                                        //.skip(skip)
                                        //.limit(limit)
                                        .exec()
                                        .then(docs => {

                                            userDetails.find({ $and: [{ userid: { $nin: data[0].blocked } }, { _id: { $in: data[0].existing_contacts } }] }).count().exec(function(err, count) {
                                                if (err) {
                                                    res.status(500).json({
                                                        status: "Failed",
                                                        message: "Error fetching contacts."
                                                    })
                                                } else {
                                                    if (docs.length < 1) {
                                                        return res.status(200).json({
                                                            status: "Ok",
                                                            message: "No contacts to display.",
                                                            contacts: []
                                                        });
                                                    } else {
                                                        var contacts = []

                                                        docs.map(dex => {
                                                            contacts.push(dex.userid._id)
                                                        })

                                                        messageModel.find({
                                                                $or: [{
                                                                        $and: [{ userid: ObjectId(req.body.userid) },
                                                                            { memberid: { $in: contacts } }
                                                                        ]
                                                                    },
                                                                    {
                                                                        $and: [{ userid: { $in: contacts } },
                                                                            { memberid: ObjectId(req.body.userid) }
                                                                        ]
                                                                    }
                                                                ]
                                                            })
                                                            .populate('userid memberid messages.user')
                                                            .exec()
                                                            .then(result => {
                                                                var test = []

                                                                result.map(doc => {
                                                                    var delete_user = doc.delete_user

                                                                    var user_deleted = delete_user.find(o => String(o.user_id) === String(req.body.userid))

                                                                    if (typeof user_deleted === 'undefined') {

                                                                        var msg = doc.messages
                                                                        var topics = doc.topic
                                                                        var title = String(topics).split("-")
                                                                        var sender = title[1]
                                                                        var rec = title[0]
                                                                        var title_vice = sender + "-" + rec
                                                                        var user_id = ""

                                                                        msg.sort(function(a, b) {
                                                                            return new Date(b.created_at) - new Date(a.created_at);
                                                                        });

                                                                        msg = msg.filter(o => !o.message.includes(topics) && !o.message.includes(title_vice))

                                                                        var unread_msgs = 0

                                                                        if (String(doc.userid._id) == String(req.body.userid)) {

                                                                            var found = []

                                                                            if (doc.userid_read != null) {
                                                                                found = msg.filter(o => new Date(o.created_at) > doc.userid_read && String(o.user._id) != String(req.body.userid))
                                                                            }

                                                                            if (found.length > 0) {
                                                                                unread_msgs = found.length
                                                                            }
                                                                        } else {

                                                                            var found = []

                                                                            if (doc.memberid_read != null) {
                                                                                found = msg.filter(o => new Date(o.created_at) > doc.memberid_read && String(o.user._id) != String(req.body.userid))
                                                                            }

                                                                            if (found.length > 0) {
                                                                                unread_msgs = found.length
                                                                            }
                                                                        }
                                                                        var has_unread_messages = false

                                                                        if (unread_msgs > 0) {
                                                                            has_unread_messages = true
                                                                        }

                                                                        if (msg.length > 0) {
                                                                            msg.map(foe => {

                                                                                if (String(sender) === String(req.body.userid)) {
                                                                                    user_id = rec
                                                                                } else {
                                                                                    user_id = sender
                                                                                }

                                                                                var dex = {
                                                                                    'userid': user_id,
                                                                                    'has_unread_messages': has_unread_messages
                                                                                }
                                                                                test.push(dex)
                                                                            })
                                                                        }
                                                                    } else {
                                                                        var msg = doc.messages
                                                                        var topics = doc.topic
                                                                        var title = String(topics).split("-")
                                                                        var sender = title[1]
                                                                        var rec = title[0]
                                                                        var title_vice = sender + "-" + rec
                                                                        var deleted_at = user_deleted.deleted_at

                                                                        msg.sort(function(a, b) {
                                                                            return new Date(b.created_at) - new Date(a.created_at);
                                                                        });

                                                                        msg = msg.filter(o => o.created_at > deleted_at)

                                                                        msg = msg.filter(o => !o.message.includes(topics) && !o.message.includes(title_vice))

                                                                        var unread_msgs = 0

                                                                        if (String(doc.userid._id) == String(req.body.userid)) {

                                                                            var found = []

                                                                            if (doc.userid_read != null) {
                                                                                found = msg.filter(o => new Date(o.created_at) > doc.userid_read && String(o.user._id) != String(req.body.userid))
                                                                            }

                                                                            if (found.length > 0) {
                                                                                unread_msgs = found.length
                                                                            }
                                                                        } else {

                                                                            var found = []

                                                                            if (doc.memberid_read != null) {
                                                                                found = msg.filter(o => new Date(o.created_at) > doc.memberid_read && String(o.user._id) != String(req.body.userid))
                                                                            }

                                                                            if (found.length > 0) {
                                                                                unread_msgs = found.length
                                                                            }
                                                                        }
                                                                        if (msg.length > 0) {
                                                                            msg.map(foe => {

                                                                                if (String(sender) === String(req.body.userid)) {
                                                                                    user_id = rec
                                                                                } else {
                                                                                    user_id = sender
                                                                                }

                                                                                var dex = {
                                                                                    'userid': user_id,
                                                                                    'has_unread_messages': has_unread_messages
                                                                                }
                                                                                test.push(dex)
                                                                            })
                                                                        }
                                                                    }

                                                                })

                                                                var testapi = [];
                                                                docs.map(conn => {
                                                                    var has_unread_messages = false
                                                                    var found = test.find(o => String(o.userid) === String(conn.userid._id))

                                                                    if (typeof found === 'undefined') {
                                                                        has_unread_messages = false
                                                                        //console.log(has_unread_messages)
                                                                    } else {
                                                                        has_unread_messages = true
                                                                    }


                                                                    var profileimage = conn.userid.profileimage;
                                                                    if (conn.userid.profileimage === null) {
                                                                        profileimage = "uploads/userimage.png"
                                                                    }
                                                                    var tess = {
                                                                        "username": conn.userid.username,
                                                                        "fullname": conn.userid.fullname,
                                                                        "userid": conn.userid._id,
                                                                        "mobile": conn.userid.mobile,
                                                                        "profileimage": constants.APIBASEURL + profileimage,
                                                                        "view_points": 0,
                                                                        "talent_points": 0,
                                                                        "has_unread_messages": has_unread_messages
                                                                    }
                                                                    testapi.push(tess)
                                                                })

                                                                testapi.sort(
                                                                    function(a, b) {
                                                                        if ((a.username).toLowerCase() < (b.username).toLowerCase()) return -1;
                                                                        if ((a.username).toLowerCase() > (b.username).toLowerCase()) return 1;
                                                                        return 0;
                                                                    }
                                                                );

                                                                var totalPages = 1;

                                                                if (count > perPage) {


                                                                    testapi.slice(skip, limit)
                                                                }

                                                                //	testapi = testapi.concat(testapi)
                                                                //	testapi = testapi.concat(testapi)

                                                                res.status(200).json({
                                                                    status: 'Ok',
                                                                    message: 'List of contacts',
                                                                    total_pages: Math.ceil(count / perPage),
                                                                    current_page: page,
                                                                    total_contacts: count,
                                                                    userid: req.body.userid,
                                                                    contacts: testapi
                                                                });



                                                            }).catch(err => {
                                                                console.log(err)
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


router.post("/create_group", (req, res, next) => {

    var keyArray = ["userid", "iv_token", "clientid", "member_ids", "group_name"];
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
                        var group_image = "uploads/group.png"
                        userDetails.find({ userid: ObjectId(req.body.userid) })
                            .populate('userid')
                            .exec()
                            .then(data => {
                                var username = data[0].userid.username;
                                var profileimage = data[0].userid.profileimage;
                                if (data[0].userid.profileimage === null) {
                                    profileimage = constants.APIBASEURL + "uploads/userimage.png"
                                }
                                var msgbody = username + " added you to group " + req.body.group_name + "."
                                var reqbody = req.body.member_ids;
                                var bodyreq = reqbody.split(",");
                                var objectMembers = [];
                                var fcmObjectMembers = [];
                                var fcmmembers = [];
                                // reqbody.forEach(function(ele){
                                // 	objectMembers.push(ObjectId(ele))
                                // 	fcmObjectMembers.push(ObjectId(ele))
                                // 	fcmmembers.push(ele)
                                // })
                                for (var i = 0; i < bodyreq.length; i++) {
                                    objectMembers.push(ObjectId(bodyreq[i]))
                                    fcmObjectMembers.push(ObjectId(bodyreq[i]))
                                    fcmmembers.push(bodyreq[i])
                                }
                                const group_value = Math.floor(10000000000 + Math.random() * 90000000000);
                                userDetails.find({ userid: { $in: objectMembers } })
                                    .exec()
                                    .then(conn => {
                                        if (conn.length != objectMembers.length) {
                                            res.status(200).json({
                                                status: 'Failed',
                                                message: "Please provide correct member_ids"
                                            });
                                        } else {
                                            var users = conn;
                                            var objectusers = [];
                                            users.forEach(function(mems) {
                                                objectusers.push(ObjectId(mems._id))
                                            })
                                            objectusers.push(ObjectId(data[0]._id))
                                            objectMembers.push(ObjectId(req.body.userid))
                                            userDetails.updateMany({ userid: { $in: objectMembers } }, {
                                                    $push: {
                                                        groups: {
                                                            group_name: req.body.group_name,
                                                            group_image: group_image,
                                                            members: objectusers,
                                                            group_admin: ObjectId(req.body.userid),
                                                            group_number: group_value
                                                        }
                                                    },
                                                    $inc: { groups_count: 1 }
                                                })
                                                .exec()
                                                .then(result => {
                                                    if (result === null) {
                                                        res.status(200).json({
                                                            status: 'Failed',
                                                            message: "Please provide correct userid"
                                                        });
                                                    } else {
                                                        const note_no = Math.floor(10000000000 + Math.random() * 90000000000);
                                                        notificationModel.updateMany({ userid: { $in: fcmObjectMembers } }, {
                                                                $push: {
                                                                    notifications: {
                                                                        notification_data: msgbody,
                                                                        member_id: req.body.userid,
                                                                        notification_type: 'GroupDetails',
                                                                        notification_number: note_no,
                                                                        item_id: group_value,
                                                                        profileimage: ObjectId(req.body.userid),
                                                                        username: username,
                                                                        created_at: Date.now()
                                                                    }
                                                                }
                                                            })
                                                            .exec()
                                                            .then(dosy => {
                                                                console.log(dosy)
                                                                if (dosy === null) {
                                                                    return res.status(200).json({
                                                                        status: "Failed",
                                                                        message: "Please provide correct userid."
                                                                    });
                                                                } else {
                                                                    fcmModel.find({ userid: { $in: fcmmembers } })
                                                                        .select('fcmtoken')
                                                                        .exec()
                                                                        .then(con => {
                                                                            console.log(con)
                                                                            if (con.length < 1) {
                                                                                res.status(200).json({
                                                                                    status: 'Failed',
                                                                                    message: "Please provide correct member_ids"
                                                                                });
                                                                            } else {
                                                                                var conarray = [];
                                                                                con.map(dec => {
                                                                                    var contacts = dec.fcmtoken
                                                                                    conarray.push(contacts)
                                                                                })
                                                                                var serverKey = constants.FCMServerKey;
                                                                                var fcm = new FCM(serverKey);

                                                                                var message = {
                                                                                    registration_ids: conarray,
                                                                                    collapse_key: 'exit',

                                                                                    notification: {
                                                                                        title: 'FvmeGear',
                                                                                        body: msgbody,
                                                                                    },
                                                                                    data: {
                                                                                        notification_id: note_no,
                                                                                        message: msgbody,
                                                                                        notification_slug: 'GroupDetails',
                                                                                        url: constants.APIBASEURL + profileimage,
                                                                                        username: username,
                                                                                        item_id: group_value,

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
                                                                                res.status(200).json({
                                                                                    status: "Ok",
                                                                                    message: "Group created successfully."
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
                                                            })
                                                    }
                                                }).catch(err => { //catch for userid update
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
                                    }).catch(err => { //catch for member_ids find.
                                        var spliterror = err.message.split("_")
                                        if (spliterror[1].indexOf("id") >= 0) {
                                            res.status(200).json({
                                                status: 'Failed',
                                                message: "Please provide correct member_ids"
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


router.post("/get_groups", (req, res, next) => {

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
                            .populate({ path: 'groups.members groups.group_admin', populate: { path: 'userid' } })
                            .exec()
                            .then(result => {
                                var group = result[0].groups
                                var test = [];
                                if (typeof group != 'undefined') {

                                    group.map(doc => {

                                        var members = doc.members
                                        var foo = {
                                            "group_name": doc.group_name,
                                            "url": constants.APIBASEURL + doc.group_image,
                                            "group_id": doc.group_number,
                                            "total_members": members.length
                                        }
                                        test.push(foo)
                                    })

                                    test.sort(
                                        function(a, b) {
                                            if ((a.group_name).toLowerCase() < (b.group_name).toLowerCase()) return -1;
                                            if ((a.group_name).toLowerCase() > (b.group_name).toLowerCase()) return 1;
                                            return 0;
                                        }
                                    );

                                    res.status(200).json({
                                        status: 'Ok',
                                        message: 'Groups',
                                        userid: req.body.userid,
                                        total_groups: test.length,
                                        groups: test

                                    });
                                } else {
                                    res.status(200).json({
                                        status: 'Ok',
                                        message: 'No groups to display',
                                        groups: test
                                    });
                                }

                            }).catch(err => { //catch for userid find
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


router.post("/get_group_details", (req, res, next) => {

    var keyArray = ["userid", "iv_token", "clientid", "group_id"];
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
                        userDetails.find({ userid: ObjectId(req.body.userid), 'groups.group_number': parseInt(req.body.group_id) }, { 'groups.$': 1 })
                            .populate({ path: 'groups.members', populate: { path: 'userid' } })
                            .exec()
                            .then(result => {
                                if (result.length < 1) {
                                    res.status(200).json({
                                        status: 'Failed',
                                        message: "User might have deleted the group."
                                    });
                                } else {

                                    var group = result[0].groups
                                    var test = [];
                                    group.map(doc => {
                                        var members = doc.members
                                        var admin = doc.group_admin
                                        var is_user_admin = false;
                                        if (String(req.body.userid) === String(admin)) {
                                            is_user_admin = true;
                                        }
                                        var groupdetails = [];
                                        members.map(conns => {
                                            var profileimage = conns.userid.profileimage;
                                            var is_admin = false;
                                            if (conns.userid.profileimage === null) {
                                                profileimage = "uploads/userimage.png"
                                            }
                                            if (String(conns.userid._id) === String(admin)) {
                                                is_admin = true;
                                            }
                                            var foe = {
                                                "userid": conns.userid._id,
                                                "username": conns.userid.username,
                                                "fullname": conns.userid.fullname,
                                                "profileimage": constants.APIBASEURL + profileimage,
                                                "mobile": conns.userid.mobile,
                                                "is_admin": is_admin
                                            }
                                            groupdetails.push(foe)
                                        })
                                        var foo = {
                                            "group_name": doc.group_name,
                                            "url": constants.APIBASEURL + doc.group_image,
                                            "is_admin": is_user_admin,
                                            "group_id": doc.group_number,
                                            "total_members": groupdetails.length,
                                            "users": groupdetails
                                        }
                                        test.push(foo)
                                    })
                                    res.status(200).json({
                                        status: 'Ok',
                                        message: 'Group details',
                                        userid: req.body.userid,
                                        group: test[0]
                                    });
                                }
                            }).catch(err => { //catch for userid find
                                var spliterror = err.message.split("_")
                                if (spliterror[1].indexOf("userid") >= 0) {
                                    res.status(200).json({
                                        status: 'Failed',
                                        message: "Please provide correct userid"
                                    });
                                } else if (spliterror[1].indexOf("group_id") >= 0) {
                                    res.status(200).json({
                                        status: 'Failed',
                                        message: "Please provide correct group_id"
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

router.post("/leave_group", (req, res, next) => {

    var keyArray = ["userid", "iv_token", "clientid", "group_id"];
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
                        userDetails.find({ userid: ObjectId(req.body.userid), 'groups.group_number': parseInt(req.body.group_id) }, { '$groups': 1 })
                            .exec()
                            .then(dox => {
                                if (dox.length < 1) {
                                    return res.status(200).json({
                                        status: "Failed",
                                        message: "User might have deleted the group."
                                    });
                                } else {
                                    userDetails.findOneAndUpdate({ userid: ObjectId(req.body.userid) }, { $pull: { groups: { group_number: parseInt(req.body.group_id) } }, $inc: { groups_count: -1 } })
                                        .exec()
                                        .then(result => {
                                            if (result === null) {
                                                return res.status(200).json({
                                                    status: "Failed",
                                                    message: "User might have deleted the group."
                                                });
                                            } else {
                                                var group = result.groups
                                                var test = [];
                                                if (typeof group != 'undefined') {
                                                    group.every(function(doc) {
                                                        if (String(doc.group_number) === String(req.body.group_id)) {
                                                            test.push(doc)
                                                            return false;
                                                        } else {
                                                            return true;
                                                        }
                                                    })
                                                    var members = test[0].members
                                                    members.forEach(function(ele) {
                                                        if (String(ele) === String(result._id)) {
                                                            var indexs = members.indexOf(ele);
                                                            members.splice(indexs, 1)
                                                        }
                                                    })
                                                    var group_number = test[0].group_number;

                                                    if (String(test[0].group_admin) === String(req.body.userid)) {
                                                        userDetails.updateMany({ _id: { $in: members } }, {
                                                                $pull: { groups: { group_number: group_number } },
                                                                $inc: { groups_count: -1 }
                                                            })
                                                            .exec()
                                                            .then(data => {
                                                                res.status(200).json({
                                                                    status: 'Ok',
                                                                    message: "You Left the group."
                                                                });
                                                            }).catch(err => { //catch for userid find
                                                                var spliterror = err.message.split("_")
                                                                if (spliterror[1].indexOf("id") >= 0) {
                                                                    res.status(200).json({
                                                                        status: 'Failed',
                                                                        message: "Error while exiting the group."
                                                                    });
                                                                } else {
                                                                    res.status(500).json({
                                                                        status: 'Failed',
                                                                        message: err.message
                                                                    });
                                                                }
                                                            });
                                                    } else {
                                                        userDetails.updateMany({ _id: { $in: members }, 'groups.group_number': group_number }, { $pull: { 'groups.$.members': ObjectId(result._id) } })
                                                            .exec()
                                                            .then(data => {
                                                                res.status(200).json({
                                                                    status: 'Ok',
                                                                    message: "You Left the group."
                                                                });
                                                            }).catch(err => { //catch for userid find
                                                                var spliterror = err.message.split("_")
                                                                if (spliterror[1].indexOf("id") >= 0) {
                                                                    res.status(200).json({
                                                                        status: 'Failed',
                                                                        message: "Error while exiting the group."
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
                                                    res.status(200).json({
                                                        status: 'Failed',
                                                        message: 'Please provide correct group_id'
                                                    });
                                                }
                                            }

                                        }).catch(err => { //catch for userid find
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

router.post("/add_member_to_group", (req, res, next) => {

    var keyArray = ["userid", "iv_token", "clientid", "group_id", "member_id"];
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
                        userDetails.find({ userid: ObjectId(req.body.userid), 'groups.group_number': parseInt(req.body.group_id) }, { 'groups.$': 1, userid: 1 })
                            .populate('userid')
                            .exec()
                            .then(result => {
                                var group = result[0].groups
                                var updated_members = group[0].members
                                var group_name = group[0].group_name
                                var username = result[0].userid.username;
                                var profileimage = result[0].userid.profileimage;
                                if (result[0].userid.profileimage === null) {
                                    profileimage = constants.APIBASEURL + "uploads/userimage.png"
                                }
                                var msgbody = username + " added you to group " + group_name + "."
                                var members = [];
                                var new_members = [];
                                var fcm_members = [];
                                var req_members = req.body.member_id;
                                var bodyreq = req_members.split(",");
                                // req_members.forEach(function(ele){
                                // 	members.push(ObjectId(ele))
                                // 	fcm_members.push(ele)
                                // })
                                for (var i = 0; i < bodyreq.length; i++) {
                                    members.push(ObjectId(bodyreq[i]))
                                    fcm_members.push(bodyreq[i])
                                }
                                userDetails.find({ userid: { $in: members } })
                                    .exec()
                                    .then(docs => {

                                        userDetails.updateMany({ userid: { $in: members } }, {
                                                $push: {
                                                    groups: {
                                                        group_name: group[0].group_name,
                                                        group_image: group[0].group_image,
                                                        members: updated_members,
                                                        group_admin: group[0].group_admin,
                                                        group_number: group[0].group_number
                                                    }
                                                },
                                                $inc: { groups_count: 1 }
                                            })
                                            .exec()
                                            .then(conn => {

                                                var group_number = group[0].group_number;
                                                docs.map(foe => {
                                                    updated_members.push(ObjectId(foe._id))
                                                    new_members.push(ObjectId(foe._id))
                                                })

                                                userDetails.updateMany({ _id: { $in: updated_members }, 'groups.group_number': group_number }, { $push: { 'groups.$.members': new_members } })
                                                    .exec()
                                                    .then(data => {
                                                        const note_no = Math.floor(10000000000 + Math.random() * 90000000000);
                                                        notificationModel.updateMany({ userid: { $in: members } }, {
                                                                $push: {
                                                                    notifications: {
                                                                        notification_data: msgbody,
                                                                        member_id: req.body.userid,
                                                                        notification_type: 'GroupDetails',
                                                                        notification_number: note_no,
                                                                        item_id: group_number,
                                                                        profileimage: ObjectId(req.body.userid),
                                                                        username: username,
                                                                        created_at: Date.now()
                                                                    }
                                                                }
                                                            })
                                                            .exec()
                                                            .then(dosy => {
                                                                console.log(dosy)
                                                                if (dosy === null) {
                                                                    return res.status(200).json({
                                                                        status: "Failed",
                                                                        message: "Please provide correct userid."
                                                                    });
                                                                } else {
                                                                    fcmModel.find({ userid: { $in: fcm_members } })
                                                                        .select('fcmtoken')
                                                                        .exec()
                                                                        .then(con => {
                                                                            if (con.length < 1) {
                                                                                res.status(200).json({
                                                                                    status: 'Failed',
                                                                                    message: "Please provide correct member_ids"
                                                                                });
                                                                            } else {
                                                                                var conarray = [];
                                                                                con.map(dec => {
                                                                                    var contacts = dec.fcmtoken
                                                                                    conarray.push(contacts)
                                                                                })
                                                                                var serverKey = constants.FCMServerKey;
                                                                                var fcm = new FCM(serverKey);

                                                                                var message = {
                                                                                    registration_ids: conarray,
                                                                                    collapse_key: 'exit',

                                                                                    notification: {
                                                                                        title: 'FvmeGear',
                                                                                        body: msgbody,
                                                                                    },
                                                                                    data: {
                                                                                        notification_id: note_no,
                                                                                        message: msgbody,
                                                                                        notification_slug: 'GroupDetails',
                                                                                        url: constants.APIBASEURL + profileimage,
                                                                                        username: username,
                                                                                        item_id: group_number,

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
                                                                                res.status(200).json({
                                                                                    status: "Ok",
                                                                                    message: "Added new member to group."
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
                                                            })
                                                    }).catch(err => { //catch for userid find
                                                        var spliterror = err.message.split("_")
                                                        if (spliterror[1].indexOf("id") >= 0) {
                                                            res.status(200).json({
                                                                status: 'Failed',
                                                                message: "Please provide correct userid."
                                                            });
                                                        } else {
                                                            res.status(500).json({
                                                                status: 'Failed',
                                                                message: err.message
                                                            });
                                                        }
                                                    });
                                            }).catch(err => { //catch for member_id find
                                                var spliterror = err.message.split("_")
                                                if (spliterror[1].indexOf("id") >= 0) {
                                                    res.status(200).json({
                                                        status: 'Failed',
                                                        message: "Please provide correct member_ids"
                                                    });
                                                } else {
                                                    res.status(500).json({
                                                        status: 'Failed',
                                                        message: err.message,
                                                    });
                                                }
                                            });
                                    }).catch(err => { //catch for member_id find
                                        var spliterror = err.message.split("_")
                                        if (spliterror[1].indexOf("id") >= 0) {
                                            res.status(200).json({
                                                status: 'Failed',
                                                message: "Please provide correct member_ids"
                                            });
                                        } else {
                                            res.status(500).json({
                                                status: 'Failed',
                                                message: err.message
                                            });
                                        }
                                    });
                            }).catch(err => { //catch for userid find
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


router.post("/get_admin_contacts", (req, res, next) => {

    var keyArray = ["userid", "iv_token", "clientid", "page_no", "group_id"];
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
                        userDetails.find({ userid: ObjectId(req.body.userid), 'groups.group_number': parseInt(req.body.group_id) }, { 'groups.$': 1, 'blocked': 1 })
                            .exec()
                            .then(result => {
                                var perPage = 100;
                                var page = req.body.page_no;

                                if (isEmpty(page)) {
                                    page = 1
                                }
                                var skip = (perPage * page) - perPage;
                                var limit = skip + perPage;
                                var group = result[0].groups
                                var members = group[0].members;
                                var blocked = result[0].blocked;
                                contactsModel.aggregate(
                                    [{ $match: { userid: ObjectId(req.body.userid) } },
                                        { $unwind: "$existing_contacts" },
                                        {
                                            $match: {
                                                $and: [{ 'existing_contacts.contact_details': { $nin: members } },
                                                    { 'existing_contacts.contact': { $nin: blocked } }
                                                ]
                                            }
                                        },
                                        {
                                            $group: {
                                                _id: "$_id",
                                                existing_contacts: { $push: "$existing_contacts.contact_details" }
                                            }
                                        }
                                    ],
                                    function(err, data) {
                                        if (data.length < 1) {
                                            res.status(200).json({
                                                status: 'Ok',
                                                message: "No contacts to display"
                                            });
                                        } else {
                                            userDetails.find({ _id: { $in: data[0].existing_contacts } })
                                                .populate("userid", "_id username profileimage mobile fullname")
                                                .sort({ 'userid.username': -1 })
                                                .skip(skip)
                                                .limit(limit)
                                                .exec()
                                                .then(docs => {

                                                    userDetails.find({ _id: { $in: data[0].existing_contacts } }).count().exec(function(err, count) {
                                                        if (err) {
                                                            res.status(500).json({
                                                                status: "Failed",
                                                                message: "Error fetching contacts."
                                                            })
                                                        } else {
                                                            if (docs.length < 1) {
                                                                return res.status(200).json({
                                                                    status: "Ok",
                                                                    message: "No contacts to display."
                                                                });
                                                            } else {
                                                                var testapi = [];
                                                                docs.map(conn => {
                                                                    var profileimage = conn.userid.profileimage;
                                                                    if (conn.userid.profileimage === null) {
                                                                        profileimage = "uploads/userimage.png"
                                                                    }
                                                                    var tess = {
                                                                        "username": conn.userid.username,
                                                                        "fullname": conn.userid.fullname,
                                                                        "userid": conn.userid._id,
                                                                        "mobile": conn.userid.mobile,
                                                                        "profileimage": constants.APIBASEURL + profileimage,
                                                                        "view_points": 0,
                                                                        "talent_points": 0
                                                                    }
                                                                    testapi.push(tess)
                                                                })

                                                                testapi.sort(
                                                                    function(a, b) {
                                                                        if ((a.username).toLowerCase() < (b.username).toLowerCase()) return -1;
                                                                        if ((a.username).toLowerCase() > (b.username).toLowerCase()) return 1;
                                                                        return 0;
                                                                    }
                                                                );
                                                                res.status(200).json({
                                                                    status: 'Ok',
                                                                    message: 'List of contacts',
                                                                    total_pages: Math.ceil(count / perPage),
                                                                    current_page: page,
                                                                    total_contacts: count,
                                                                    userid: docs[0].userid._id,
                                                                    contacts: testapi
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
                                        }
                                    })
                            }).catch(err => { //catch for userid find
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


router.post("/colors", (req, res, next) => {
    var color = new colorCodeModel({
        _id: new mongoose.Types.ObjectId(),
        letter: req.body.letter,
        color: req.body.color
    })
    color.save()
        .then(docs => {

            res.status(200).json({
                status: 'Ok',
                message: "added"
            });
        }).catch(err => {
            res.status(500).json({
                status: 'Failed',
                message: err.message
            });
        });
});

router.post("/donate_points", (req, res, next) => {

    var keyArray = ["userid", "iv_token", "clientid", "offer_id", "amount"];
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
                        userDetails.find({ userid: ObjectId(req.body.userid), 'offer_details.offer': ObjectId(req.body.offer_id) }, { 'offer_details.$': 1, talent_points: 1, view_points: 1, userid: 1 })
                            .populate('offer_details.offer offer_details.admin userid')
                            .exec()
                            .then(result => {
                                if (result.length > 0) {
                                    if (result[0].userid.mobile_verified == 'true') {
                                        console.log(result[0].userid.mobile_verified)

                                        var offer = result[0].offer_details
                                        var username = result[0].userid.username
                                        var profileimage = result[0].userid.profileimage
                                        if (result[0].userid.profileimage === null) {
                                            profileimage = constants.APIBASEURL + "uploads/userimage.png"
                                        }
                                        var offerdetails = [];
                                        var admin = "";
                                        if (typeof offer != 'undefined') {
                                            var test = [];
                                            var active_group = [];
                                            offer.map(docs => {
                                                admin = docs.admin._id
                                                admin_notify = docs.admin.userid
                                                if (typeof docs.active_group != 'undefined') {
                                                    var active = docs.active_group
                                                    active.map(ele => {
                                                        active_group.push(ObjectId(ele))
                                                    })

                                                }
                                            })
                                            var talent_points = result[0].talent_points;
                                            var view_points = result[0].view_points
                                            var user_condition = ""
                                            var user_query = ""
                                            var amount = 0;
                                            var enough_coins = true;
                                            var view_points_from = 0
                                            var talent_points_from = 0
                                            var price = offer[0].offer.business_post_price
                                            var offer_name = offer[0].offer.business_post_name
                                            var mode = ""
                                            var final_mode = ""
                                            var discount = 0

                                            // if(Math.floor(price) <= 10){
                                            // 	discount = 100
                                            // }
                                            // else if(Math.floor(price) >=11 && Math.floor(price) <= 99){
                                            // 	discount = 80
                                            // }
                                            // else if(Math.floor(price) >=100 && Math.floor(price) <= 499){
                                            // 	discount = 70
                                            // }
                                            // else if(Math.floor(price) >=500 && Math.floor(price) <= 1499){
                                            // 	discount = 75
                                            // }
                                            // else if(Math.floor(price) >=1500 && Math.floor(price) <= 2499){
                                            // 	discount = 60
                                            // }
                                            // else if(Math.floor(price) >=2500 && Math.floor(price) <= 5000){
                                            // 	discount = 45
                                            // }
                                            // else{
                                            // 	discount = 0
                                            // }

                                            if (Math.floor(price) <= 100) {
                                                discount = 100
                                            } else {
                                                discount = parseInt(100 / price * 100)
                                            }

                                            var total = offer[0].total_contributions
                                            var finals = price * (discount / 100)
                                            var final = finals * 10
                                            var cont_limit = Math.floor(final - total)

                                            if (parseInt(final) === parseInt(total)) {
                                                return res.status(200).json({
                                                    status: "Failed",
                                                    message: "It's time for you to reedem the offer as you have donated 100%."
                                                });
                                            } else {
                                                if (active_group.length < 1) {
                                                    active_group.push(ObjectId(result[0]._id))
                                                }

                                                if (String(result[0]._id) === String(admin)) {

                                                    amount = req.body.amount
                                                    console.log(cont_limit)
                                                    if (parseInt(amount) > parseInt(cont_limit)) {

                                                        amount = cont_limit
                                                        if (amount < 0) {
                                                            amount = 0
                                                        }
                                                    }
                                                    if (talent_points >= amount) {
                                                        user_query = { userid: ObjectId(req.body.userid) }
                                                        user_condition = { $inc: { talent_points: -amount } }
                                                        talent_points_from = amount
                                                        mode = "talent"
                                                    } else if (view_points >= amount) {
                                                        user_query = { userid: ObjectId(req.body.userid) }
                                                        user_condition = { $inc: { view_points: -amount } }
                                                        view_points_from = amount
                                                        mode = "view"
                                                    } else if (view_points + talent_points >= amount) {
                                                        remaining_points = amount - talent_points
                                                        user_query = { userid: ObjectId(req.body.userid) }
                                                        user_condition = { $inc: { view_points: -remaining_points }, $set: { talent_points: 0 } }
                                                        talent_points_from = talent_points
                                                        view_points_from = remaining_points
                                                        mode = "both"
                                                    } else {
                                                        enough_coins = false
                                                    }
                                                } else {

                                                    var remaining_points = 0;
                                                    amount = 50
                                                    if (parseInt(amount) > parseInt(cont_limit)) {
                                                        amount = cont_limit
                                                        if (amount < 0) {
                                                            amount = 0
                                                        }
                                                    }
                                                    if (talent_points >= amount) {
                                                        user_query = { userid: ObjectId(req.body.userid) }
                                                        user_condition = { $inc: { talent_points: -amount } }
                                                        talent_points_from = amount
                                                        mode = "talent"
                                                    } else if (view_points >= amount) {
                                                        user_query = { userid: ObjectId(req.body.userid) }
                                                        user_condition = { $inc: { view_points: -amount } }
                                                        view_points_from = amount
                                                        mode = "view"
                                                    } else if (view_points + talent_points >= amount) {
                                                        remaining_points = amount - talent_points
                                                        user_query = { userid: ObjectId(req.body.userid) }
                                                        user_condition = { $inc: { view_points: -remaining_points }, $set: { talent_points: 0 } }
                                                        talent_points_from = talent_points
                                                        view_points_from = remaining_points
                                                        mode = "both"
                                                    } else {
                                                        enough_coins = false
                                                    }
                                                }
                                                if (enough_coins === false) {
                                                    return res.status(200).json({
                                                        status: "Failed",
                                                        message: "Insufficient points in your account to donate."
                                                    });
                                                } else {

                                                    userDetails.findOneAndUpdate(user_query, user_condition, { new: true })
                                                        .exec()
                                                        .then(data => {

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

                                                            userTransactions.findOneAndUpdate({ userid: ObjectId(req.body.userid) }, {
                                                                    $push: {
                                                                        transactions: {
                                                                            date_of_transaction: Date.now(),
                                                                            amount: amount,
                                                                            mode: mode,
                                                                            transaction_type: "debit",
                                                                            action: "donate_points",
                                                                            message: "You have donated" + final_mode + " points to offer-" + offer_name,
                                                                            transaction_id: transaction_id
                                                                        }
                                                                    }
                                                                }, { upsert: true })
                                                                .exec()
                                                                .then(dex => {
                                                                    userDetails.updateMany({ _id: { $in: active_group }, 'offer_details.offer': ObjectId(req.body.offer_id) }, {
                                                                            $push: {
                                                                                'offer_details.$.contributions': {
                                                                                    userid: ObjectId(result[0]._id),
                                                                                    cont_points: amount,
                                                                                    view_points_from: view_points_from,
                                                                                    talent_points_from: talent_points_from,
                                                                                }
                                                                            },
                                                                            $inc: { 'offer_details.$.total_contributions': amount }
                                                                        })
                                                                        .exec()
                                                                        .then(dox => {
                                                                            var diffDays = 0
                                                                            var price = offer[0].offer.business_post_price
                                                                            var daily_amount = 0
                                                                            var daily_progress = 0
                                                                            var today_contribution = parseInt(amount)
                                                                            var discount = 0

                                                                            // if(Math.floor(price) <= 10){
                                                                            //     discount = 100
                                                                            // }
                                                                            // else if(Math.floor(price) >=11 && Math.floor(price) <= 99){
                                                                            //     discount = 80
                                                                            // }
                                                                            // else if(Math.floor(price) >=100 && Math.floor(price) <= 499){
                                                                            //     discount = 70
                                                                            // }
                                                                            // else if(Math.floor(price) >=500 && Math.floor(price) <= 1499){
                                                                            //     discount = 75
                                                                            // }
                                                                            // else if(Math.floor(price) >=1500 && Math.floor(price) <= 2499){
                                                                            //     discount = 60
                                                                            // }
                                                                            // else if(Math.floor(price) >=2500 && Math.floor(price) <= 5000){
                                                                            //     discount = 45
                                                                            // }
                                                                            // else{
                                                                            //     discount = 0
                                                                            // }
                                                                            if (Math.floor(price) <= 100) {
                                                                                discount = 100
                                                                            } else {
                                                                                discount = parseInt(100 / price * 100)
                                                                            }
                                                                            var total = offer[0].total_contributions
                                                                            var finals = price * (discount / 100)
                                                                            var final = parseInt(finals * 10)
                                                                            var final_total = price - finals

                                                                            var cont_limit = final - total
                                                                            var cons = parseInt(finals * 10)


                                                                            if (offer[0].is_primary_offer === false) {

                                                                                var date = new Date()
                                                                                var dates1 = date.setTime(date.getTime());
                                                                                var dateNow1 = new Date(dates1).toISOString();
                                                                                var current_date = String(dateNow1).split('T')
                                                                                var current_day = current_date[0].split('-')
                                                                                var current = current_day[1] + "-" + current_day[2] + "-" + current_day[0] + " 00:00:00"


                                                                                var expiry_day = offer[0].offer.business_post_enddate
                                                                                var expiry_array = expiry_day.split('/')
                                                                                var expiry = expiry_array[1] + "-" + expiry_array[0] + "-" + expiry_array[2] + " 00:00:00"

                                                                                var user_expiry = (offer[0].created_at).toISOString()
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

                                                                            var stock = offer[0].offer.no_of_items
                                                                            var in_stock = false
                                                                            if (parseInt(stock) === 0) {
                                                                                in_stock = true
                                                                            }


                                                                            var count = 0

                                                                            if (diffDays > 0) {
                                                                                daily_amount = parseInt(cons / diffDays)
                                                                            }

                                                                            var contribution = offer[0].contributions

                                                                            contribution.forEach(function(efe) {
                                                                                var contributions = offer[0].contributions
                                                                                var date = new Date()
                                                                                var dates1 = date.setTime(date.getTime());
                                                                                var dateNow1 = new Date(dates1).toISOString();
                                                                                var current_day = String(dateNow1).split('T')
                                                                                var hists = (efe.cont_date).toISOString();
                                                                                var history_date = String(hists).split('T')
                                                                                if (current_day[0] === history_date[0]) {

                                                                                    console.log("todays contributions" + efe.cont_points)

                                                                                    today_contribution = parseInt(today_contribution) + parseInt(efe.cont_points)

                                                                                }


                                                                            })


                                                                            var todays_extra_contribution = 0
                                                                            var date1 = new Date();
                                                                            date1.setDate(date1.getDate() + 1);


                                                                            if (typeof offer[0].todays_extra_contribution != 'undefined' && offer[0].todays_extra_contribution > 0) {

                                                                                var day = new Date()
                                                                                //var date1 = new Date();
                                                                                todays_extra_contribution = offer[0].todays_extra_contribution



                                                                                if ((offer[0].next_cont_date).setHours(0, 0, 0, 0) <= day.setHours(0, 0, 0, 0)) {

                                                                                    today_contribution = parseInt(today_contribution) + parseInt(offer[0].todays_extra_contribution)
                                                                                    console.log("coins to be paid " + today_contribution)

                                                                                    if (today_contribution != 0 && daily_amount != 0 && today_contribution > daily_amount) {

                                                                                        var left_over_conts = parseInt(today_contribution - daily_amount)

                                                                                        if (left_over_conts < 1) {
                                                                                            left_over_conts = 0
                                                                                        }

                                                                                        console.log("left over " + left_over_conts)

                                                                                        userDetails.updateMany({ _id: { $in: active_group }, 'offer_details.offer': ObjectId(req.body.offer_id) }, {
                                                                                            $set: {
                                                                                                'offer_details.$.todays_extra_contribution': left_over_conts,
                                                                                                'offer_details.$.next_cont_date': date1
                                                                                            }
                                                                                        }).exec()

                                                                                        daily_progress = 100
                                                                                    }

                                                                                }

                                                                            }

                                                                            if (today_contribution != 0 && daily_amount != 0 && today_contribution === daily_amount) {
                                                                                daily_progress = 100
                                                                            } else {
                                                                                if (today_contribution != 0 && daily_amount != 0 && today_contribution > daily_amount && offer[0].next_cont_date === null || (offer[0].next_cont_date != null && (offer[0].next_cont_date).setHours(0, 0, 0, 0) != date1.setHours(0, 0, 0, 0))) {

                                                                                    var left_over_conts = parseInt(today_contribution - daily_amount)
                                                                                    if (left_over_conts < 1) {
                                                                                        left_over_conts = 0
                                                                                    }
                                                                                    //var total_today_conts = parseInt(left_over_conts)+parseInt(todays_extra_contribution)
                                                                                    console.log("left over " + left_over_conts)

                                                                                    userDetails.updateMany({ _id: { $in: active_group }, 'offer_details.offer': ObjectId(req.body.offer_id) }, {
                                                                                        $set: {
                                                                                            'offer_details.$.todays_extra_contribution': left_over_conts,
                                                                                            'offer_details.$.next_cont_date': date1
                                                                                        }
                                                                                    }).exec()

                                                                                    daily_progress = 100
                                                                                } else {

                                                                                    if (offer[0].next_cont_date != null && (offer[0].next_cont_date).setHours(0, 0, 0, 0) === date1.setHours(0, 0, 0, 0)) {

                                                                                        var final_amount = parseInt(offer[0].todays_extra_contribution) + parseInt(amount)
                                                                                        console.log("final amount in else " + final_amount)

                                                                                        userDetails.updateMany({ _id: { $in: active_group }, 'offer_details.offer': ObjectId(req.body.offer_id) }, {
                                                                                            $set: {
                                                                                                'offer_details.$.todays_extra_contribution': final_amount

                                                                                            }
                                                                                        }).exec()
                                                                                    }

                                                                                }
                                                                            }

                                                                            console.log("daily_progress" + daily_progress)
                                                                            console.log("today_contribution" + today_contribution)
                                                                            console.log("daily_amount" + daily_amount)

                                                                            if (String(admin_notify) != String(req.body.userid)) {

                                                                                var msgbody = username + " has donated to the offer-" + offer_name
                                                                                const note_no = Math.floor(10000000000 + Math.random() * 90000000000);
                                                                                notificationModel.findOneAndUpdate({ userid: ObjectId(admin_notify) }, {
                                                                                        $push: {
                                                                                            notifications: {
                                                                                                notification_data: msgbody,
                                                                                                member_id: req.body.userid,
                                                                                                notification_type: 'OfferGroup',
                                                                                                notification_number: note_no,
                                                                                                username: username,
                                                                                                item_id: req.body.offer_id,
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
                                                                                            fcmModel.find({ userid: admin_notify })
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
                                                                                                                notification_slug: 'OfferGroup',
                                                                                                                url: constants.APIBASEURL + profileimage,
                                                                                                                username: username,
                                                                                                                item_id: req.body.offer_id,

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
                                                                                                    }
                                                                                                }).catch(err => {
                                                                                                    console.log(err)
                                                                                                    // var spliterror=err.message.split(":")
                                                                                                    // res.status(500).json({
                                                                                                    //     status: 'Failed',
                                                                                                    //     message: spliterror[0]
                                                                                                    // });
                                                                                                });
                                                                                        }
                                                                                    }).catch(err => {
                                                                                        console.log(err)
                                                                                        // var spliterror=err.message.split(":")
                                                                                        // res.status(500).json({
                                                                                        //    	status: 'Failed',
                                                                                        //     message: spliterror[0]
                                                                                        // });
                                                                                    });

                                                                            }
                                                                            res.status(200).json({
                                                                                status: 'Ok',
                                                                                message: 'You have donated ' + amount + ' to the offer successfully'

                                                                            });

                                                                        }).catch(err => {
                                                                            console.log(err)
                                                                            // var spliterror=err.message.split(":")
                                                                            //   res.status(500).json({
                                                                            //     status: 'Failed',
                                                                            //     message: spliterror[0]
                                                                            //   });
                                                                        });
                                                                }).catch(err => {
                                                                    console.log(err)
                                                                    // var spliterror=err.message.split(":")
                                                                    //   res.status(500).json({
                                                                    //     status: 'Failed',
                                                                    //     message: spliterror[0]
                                                                    //   });
                                                                });

                                                        }).catch(err => {
                                                            console.log(err)
                                                            // var spliterror=err.message.split(":")
                                                            //   res.status(500).json({
                                                            //     status: 'Failed',
                                                            //     message: spliterror[0]
                                                            //   });
                                                        });
                                                }
                                            }

                                        } else {
                                            console.log(err)
                                            // res.status(200).json({
                                            // 	status: 'Failed',
                                            // 	message: 'Please provide correct offer_id'
                                            // });
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
                                console.log(err)
                                //       var spliterror=err.message.split("_")
                                // if(spliterror[1].indexOf("id")>=0){
                                //    res.status(200).json({
                                //        status: 'Failed',
                                //        message: "Please provide correct userid"
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


router.post("/get_invite_contacts", (req, res, next) => {

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
                        console.log(req.body.page_no)
                        var perPage = 100
                        var page = req.body.page_no

                        if (isEmpty(page)) {
                            page = 1
                        }
                        var skip = (perPage * page) - perPage;
                        var limit = skip + perPage;

                        contactsModel.find({ userid: ObjectId(req.body.userid) })
                            .populate('existing_contacts.contact')
                            .exec()
                            .then(docs => {
                                var test = []
                                var contacts = docs[0].new_contacts
                                var existing_contacts = docs[0].existing_contacts
                                const count = contacts.length

                                if (contacts.length > 0) {
                                    contacts.sort(function(a, b) {
                                        var nameA = a.username
                                        var nameB = b.username
                                        if (nameA < nameB) //sort string ascending
                                            return -1
                                        if (nameA > nameB)
                                            return 1
                                        return 0 //default return value (no sorting)
                                    })
                                    contacts = contacts.slice(skip, limit)
                                    contacts.map(doc => {
                                        var cons = doc.mobile
                                        cons = String(doc.mobile).replace(/ /g, "")

                                        var found = existing_contacts.find(o => String(o.contact.mobile) === String(cons))

                                        if (typeof found === 'undefined') {
                                            var foe = {
                                                'username': doc.username,
                                                'mobile': cons,
                                                'profileimage': constants.APIBASEURL + 'uploads/userimage.png'
                                            }
                                            test.push(foe)
                                        }
                                    })

                                    var totalPages = 1;

                                    if (count > perPage) {


                                        totalPages = Math.ceil(count / perPage);
                                    } else {
                                        page = 1;
                                    }
                                    console.log(totalPages)

                                    res.status(200).json({
                                        status: 'Ok',
                                        message: 'List of contacts',
                                        total_pages: totalPages,
                                        current_page: page,
                                        total_contacts: count,
                                        userid: req.body.userid,
                                        contacts: test
                                    })
                                } else {
                                    return res.status(200).json({
                                        status: "Ok",
                                        message: "No contacts to display.",
                                        contacts: test
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


router.post("/force_store_contacts", (req, res, next) => {

    var keyArray = ["userid", "iv_token", "clientid", "contacts", "page_no"];
    var key = Object.keys(req.body);
    //console.log(req.body.page_no);
    //console.log(req.body.contacts);
    var ContactsData = req.body.contacts;

    if (keyArray.length == key.length && keyArray.every((v) => key.indexOf(v) >= 0)) {
        if (constants.AndriodClientId === req.body.clientid || constants.IosClientId === req.body.clientid) {

            authModel.find({ iv_token: req.body.iv_token })
                .exec()
                .then(user => {
                    if (user.length < 1) {
                        return res.status(200).json({
                            status: "Logout",
                            message: "You are logged in other device."
                        });;
                    } else {
                        //&& !isEmpty(ContactsData)
                        contactsModel.find({ userid: ObjectId(req.body.userid), 'existing_contacts.contact_id': { $exists: true } })
                            .exec()
                            .then(Cnlengt => {
                                if (req.body.page_no === 1 && ContactsData.length != 0) {
                                    contactsModel.findOneAndUpdate({ userid: ObjectId(req.body.userid) }, { $set: { existing_contacts: [], new_contacts: [] } })
                                        .exec()
                                        .then(dog => {
                                            userDetails.findOneAndUpdate({ userid: ObjectId(req.body.userid) }, { $set: { no_contacts: 0 } })
                                                .exec()
                                            if (dog != null) {

                                                User.find({ _id: req.body.userid })
                                                    .exec()
                                                    .then(dex => {
                                                        if (dex.length < 1) {
                                                            res.status(200).json({
                                                                status: 'Failed',
                                                                message: 'Please provide correct userid.'
                                                            });
                                                        } else {
                                                            var contacts = req.body.contacts
                                                            var contactArray = [];
                                                            var contact_details_array = []
                                                            if (contacts.length > 0) {
                                                                contacts.forEach(function(ele) {

                                                                    var foundy = contactArray.find(o => String(o.mobile) === String(ele.mobile))

                                                                    if (typeof foundy === 'undefined') {

                                                                        var mobile = String(ele.mobile).replace(/\s/g, "")
                                                                        mobile = mobile.replace(/-/g, "")
                                                                        mobile = mobile.replace(/ /g, "")
                                                                        mobile = mobile.replace(/[`~!@#$%^&*()_|\-=?;:'",.<>\{\}\[\]\\\/]/gi, '')
                                                                        if (mobile.substring(0, 1) === '+') {
                                                                            mobile = mobile.substring(3)
                                                                        }
                                                                        if (mobile.substring(0, 1) === '+') {
                                                                            mobile = mobile.substring(3)
                                                                        }
                                                                        mobile = parseInt(mobile)
                                                                        if (isNaN(mobile)) {
                                                                            mobile = 0
                                                                        }
                                                                        contactArray.push(mobile)

                                                                        contact_details_array.push({
                                                                            'mobile': mobile,
                                                                            'contact_id': ele.contact_id
                                                                        })
                                                                    }
                                                                })
                                                            }

                                                            User.find({ mobile: { $in: contactArray } })
                                                                .select('_id mobile')
                                                                .exec()
                                                                .then(data => {
                                                                    existing_contacts_ids = [];
                                                                    existing_contacts = [];
                                                                    data.map(doc => {
                                                                        console.log(doc.mobile)
                                                                        if (String(dex[0].mobile) != String(doc.mobile)) {
                                                                            existing_contacts_ids.push(ObjectId(doc._id))
                                                                            existing_contacts.push(doc.mobile)
                                                                        }
                                                                    })

                                                                    var new_contacts = [];
                                                                    contacts.forEach(function(efe) {
                                                                        var mobi = String(efe.mobile).replace(/\s/g, "")
                                                                        mobi = String(efe.mobile).replace(/-/g, "")
                                                                        mobi = String(efe.mobile).replace(/ /g, "")
                                                                        mobi = String(efe.mobile).replace(/[`~!@#$%^&*()_|\-=?;:'",.<>\{\}\[\]\\\/]/gi, '')
                                                                        if (mobi.substring(0, 1) === '+') {
                                                                            mobi = mobi.substring(3)
                                                                        }
                                                                        if (mobi.substring(0, 1) === '+') {
                                                                            mobi = mobi.substring(3)
                                                                        }
                                                                        var found = existing_contacts.find(o => String(o) === String(mobi));
                                                                        if (typeof found === 'undefined') {
                                                                            var founds = new_contacts.find(o => String(o.mobile) === String(mobi))
                                                                            if (typeof founds === 'undefined') {
                                                                                var foee = { 'username': efe.username, 'mobile': mobi, 'contact_id': efe.contact_id }
                                                                                new_contacts.push(foee)
                                                                            }

                                                                        }

                                                                    })
                                                                    contactsModel.aggregate([{
                                                                                $match: { userid: ObjectId(req.body.userid) }
                                                                            },
                                                                            { $unwind: "$existing_contacts" },
                                                                            { $match: { 'existing_contacts.contact': { $in: existing_contacts_ids } } },
                                                                            { $group: { _id: "$userid", contacts: { $addToSet: "$existing_contacts.contact" } } }
                                                                        ]).exec()
                                                                        .then(result => {

                                                                            var non_exist = [];
                                                                            if (result.length > 0) {
                                                                                if (result[0].contacts.length > 0) {
                                                                                    var conlist = result[0].contacts
                                                                                    existing_contacts_ids.forEach(function(ele) {
                                                                                        var found = conlist.find(o => String(o) === String(ele));
                                                                                        if (typeof found === 'undefined') {
                                                                                            non_exist.push(ObjectId(ele))
                                                                                        }
                                                                                    })
                                                                                }
                                                                            } else {
                                                                                console.log("in no exist")
                                                                                non_exist = existing_contacts_ids
                                                                            }

                                                                            userDetails.find({ userid: { $in: non_exist } })
                                                                                .populate('userid')
                                                                                .select('_id userid category_type')
                                                                                .exec()
                                                                                .then(docs => {
                                                                                    var ex_contacts = [];
                                                                                    docs.map(con => {

                                                                                        var found = contact_details_array.find(o => String(o.mobile) === String(con.userid.mobile))

                                                                                        if (typeof found != 'undefined') {
                                                                                            var foe = {
                                                                                                contact: con.userid._id,
                                                                                                contact_details: con._id,
                                                                                                user_category: con.category_type,
                                                                                                status: "",
                                                                                                contact_id: found.contact_id
                                                                                            }
                                                                                            ex_contacts.push(foe) //existing contacts to be pushed
                                                                                        }
                                                                                    })
                                                                                    contactsModel.find({ userid: req.body.userid })
                                                                                        .exec()
                                                                                        .then(docy => {
                                                                                            var newconcs = docy[0].new_contacts
                                                                                            var all_false = false;
                                                                                            var one_true = false;
                                                                                            var new_con = [];
                                                                                            var change_con = [];
                                                                                            if (newconcs.length > 0) {
                                                                                                new_contacts.forEach(function(efo) {
                                                                                                    var all_false = false;
                                                                                                    var one_true = false;
                                                                                                    var foun = newconcs.find(o => String(o.mobile) === String(efo.mobile))
                                                                                                    if (typeof foun === 'undefined') {
                                                                                                        all_false = true
                                                                                                    } else {
                                                                                                        // 								if(String(efo.username) === String(foun.username) && String(efo.mobile) != String(foun.mobile) ){
                                                                                                        //  	all_false = false;
                                                                                                        //  	one_true = true;

                                                                                                        //  								}
                                                                                                        // if(String(efo.username) != String(foun.username) && String(efo.mobile) === String(foun.mobile) ){
                                                                                                        //  	all_false = false;
                                                                                                        //  	one_true = true
                                                                                                        // }
                                                                                                    }
                                                                                                    if (all_false === true) {
                                                                                                        new_con.push(efo)
                                                                                                    }
                                                                                                    if (one_true === true) {
                                                                                                        change_con.push(efo)
                                                                                                    }
                                                                                                })
                                                                                            } else {
                                                                                                new_con = new_contacts
                                                                                            }
                                                                                            no_contacts = ex_contacts.length
                                                                                            console.log(no_contacts)
                                                                                            contactsModel.findOneAndUpdate({ userid: ObjectId(req.body.userid) }, { $push: { existing_contacts: ex_contacts, new_contacts: new_con } }, { new: true })
                                                                                                .exec()
                                                                                                .then(reqe => {

                                                                                                    userDetails.findOneAndUpdate({ userid: ObjectId(req.body.userid) }, { $inc: { no_contacts: no_contacts } })
                                                                                                        .exec()
                                                                                                        .then(exe => {
                                                                                                            res.status(200).json({
                                                                                                                status: 'Ok',
                                                                                                                message: 'Contacts added successfully'
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
                                            } else {
                                                return res.status(200).json({
                                                    status: "Failed",
                                                    message: "Please provide correct userid."
                                                });;
                                            }
                                        }).catch(err => {
                                            var spliterror = err.message.split(":")
                                            res.status(500).json({
                                                status: 'Failed',
                                                message: spliterror[0]
                                            });
                                        });
                                } else if (ContactsData.length != 0 && Cnlengt.length >= 0) {
                                    console.log('test2');
                                    User.find({ _id: req.body.userid })
                                        .exec()
                                        .then(dex => {
                                            if (dex.length < 1) {
                                                res.status(200).json({
                                                    status: 'Failed',
                                                    message: 'Please provide correct userid.'
                                                });
                                            } else {
                                                var contacts = req.body.contacts
                                                var contactArray = [];
                                                var contact_details_array = []
                                                if (contacts.length > 0) {
                                                    contacts.forEach(function(ele) {

                                                        var foundy = contactArray.find(o => String(o.mobile) === String(ele.mobile))

                                                        if (typeof foundy === 'undefined') {

                                                            var mobile = String(ele.mobile).replace(/\s/g, "")
                                                            mobile = mobile.replace(/-/g, "")
                                                            mobile = mobile.replace(/ /g, "")
                                                            mobile = mobile.replace(/[`~!@#$%^&*()_|\-=?;:'",.<>\{\}\[\]\\\/]/gi, '')
                                                            if (mobile.substring(0, 1) === '+') {
                                                                mobile = mobile.substring(3)
                                                            }
                                                            if (mobile.substring(0, 1) === '+') {
                                                                mobile = mobile.substring(3)
                                                            }
                                                            mobile = parseInt(mobile)
                                                            if (isNaN(mobile)) {
                                                                mobile = 0
                                                            }
                                                            contactArray.push(mobile)

                                                            contact_details_array.push({
                                                                'mobile': mobile,
                                                                'contact_id': ele.contact_id
                                                            })
                                                        }
                                                    })
                                                }

                                                User.find({ mobile: { $in: contactArray } })
                                                    .select('_id mobile')
                                                    .exec()
                                                    .then(data => {
                                                        existing_contacts_ids = [];
                                                        existing_contacts = [];
                                                        data.map(doc => {
                                                            console.log(doc.mobile)
                                                            if (String(dex[0].mobile) != String(doc.mobile)) {
                                                                existing_contacts_ids.push(ObjectId(doc._id))
                                                                existing_contacts.push(doc.mobile)
                                                            }
                                                        })

                                                        var new_contacts = [];
                                                        contacts.forEach(function(efe) {
                                                            var mobi = String(efe.mobile).replace(/\s/g, "")
                                                            mobi = String(efe.mobile).replace(/-/g, "")
                                                            mobi = String(efe.mobile).replace(/ /g, "")
                                                            mobi = String(efe.mobile).replace(/[`~!@#$%^&*()_|\-=?;:'",.<>\{\}\[\]\\\/]/gi, '')
                                                            if (mobi.substring(0, 1) === '+') {
                                                                mobi = mobi.substring(3)
                                                            }
                                                            if (mobi.substring(0, 1) === '+') {
                                                                mobi = mobi.substring(3)
                                                            }
                                                            var found = existing_contacts.find(o => String(o) === String(mobi));
                                                            if (typeof found === 'undefined') {
                                                                var founds = new_contacts.find(o => String(o.mobile) === String(mobi))
                                                                if (typeof founds === 'undefined') {
                                                                    var foee = { 'username': efe.username, 'mobile': mobi, 'contact_id': efe.contact_id }
                                                                    new_contacts.push(foee)
                                                                }

                                                            }

                                                        })
                                                        contactsModel.aggregate([{
                                                                    $match: { userid: ObjectId(req.body.userid) }
                                                                },
                                                                { $unwind: "$existing_contacts" },
                                                                { $match: { 'existing_contacts.contact': { $in: existing_contacts_ids } } },
                                                                { $group: { _id: "$userid", contacts: { $addToSet: "$existing_contacts.contact" } } }
                                                            ]).exec()
                                                            .then(result => {

                                                                var non_exist = [];
                                                                if (result.length > 0) {
                                                                    if (result[0].contacts.length > 0) {
                                                                        var conlist = result[0].contacts
                                                                        existing_contacts_ids.forEach(function(ele) {
                                                                            var found = conlist.find(o => String(o) === String(ele));
                                                                            if (typeof found === 'undefined') {
                                                                                non_exist.push(ObjectId(ele))
                                                                            }
                                                                        })
                                                                    }
                                                                } else {
                                                                    console.log("in no exist")
                                                                    non_exist = existing_contacts_ids
                                                                }

                                                                userDetails.find({ userid: { $in: non_exist } })
                                                                    .populate('userid')
                                                                    .select('_id userid category_type')
                                                                    .exec()
                                                                    .then(docs => {
                                                                        var ex_contacts = [];
                                                                        docs.map(con => {

                                                                            var found = contact_details_array.find(o => String(o.mobile) === String(con.userid.mobile))

                                                                            if (typeof found != 'undefined') {
                                                                                var foe = {
                                                                                    contact: con.userid._id,
                                                                                    contact_details: con._id,
                                                                                    user_category: con.category_type,
                                                                                    status: "",
                                                                                    contact_id: found.contact_id
                                                                                }
                                                                                ex_contacts.push(foe) //existing contacts to be pushed
                                                                            }
                                                                        })
                                                                        contactsModel.find({ userid: req.body.userid })
                                                                            .exec()
                                                                            .then(docy => {
                                                                                var newconcs = docy[0].new_contacts
                                                                                var all_false = false;
                                                                                var one_true = false;
                                                                                var new_con = [];
                                                                                var change_con = [];
                                                                                if (newconcs.length > 0) {
                                                                                    new_contacts.forEach(function(efo) {
                                                                                        var all_false = false;
                                                                                        var one_true = false;
                                                                                        var foun = newconcs.find(o => String(o.mobile) === String(efo.mobile))
                                                                                        if (typeof foun === 'undefined') {
                                                                                            all_false = true
                                                                                        } else {
                                                                                            // 								if(String(efo.username) === String(foun.username) && String(efo.mobile) != String(foun.mobile) ){
                                                                                            //  	all_false = false;
                                                                                            //  	one_true = true;

                                                                                            //  								}
                                                                                            // if(String(efo.username) != String(foun.username) && String(efo.mobile) === String(foun.mobile) ){
                                                                                            //  	all_false = false;
                                                                                            //  	one_true = true
                                                                                            // }
                                                                                        }
                                                                                        if (all_false === true) {
                                                                                            new_con.push(efo)
                                                                                        }
                                                                                        if (one_true === true) {
                                                                                            change_con.push(efo)
                                                                                        }
                                                                                    })
                                                                                } else {
                                                                                    new_con = new_contacts
                                                                                }
                                                                                no_contacts = ex_contacts.length
                                                                                console.log(no_contacts)
                                                                                contactsModel.findOneAndUpdate({ userid: ObjectId(req.body.userid) }, { $push: { existing_contacts: ex_contacts, new_contacts: new_con } }, { new: true })
                                                                                    .exec()
                                                                                    .then(reqe => {
                                                                                        userDetails.findOneAndUpdate({ userid: ObjectId(req.body.userid) }, { $inc: { no_contacts: no_contacts } })
                                                                                            .exec()
                                                                                            .then(exe => {
                                                                                                res.status(200).json({
                                                                                                    status: 'Ok',
                                                                                                    message: 'Contacts added successfully'
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
                                } else {

                                    console.log('test3');
                                    contactsModel.findOneAndUpdate({ userid: ObjectId(req.body.userid) }, { $set: { existing_contacts: [], new_contacts: [] } })
                                        .exec()

                                    res.status(200).json({
                                        status: 'Ok',
                                        message: 'Contacts added successfully'
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

router.post("/edit_contacts", (req, res, next) => {

    var keyArray = ["userid", "iv_token", "clientid", "contacts", "page_no", "contact_type"];
    var key = Object.keys(req.body);
    var page_no = req.body.page_no;
    var deleteArray = [];
    var editlist = [];
    var edit_contact = [];
    //console.log('page_no');
    //console.log(page_no);
    console.log(req.body.contacts);
    if (keyArray.length == key.length && keyArray.every((v) => key.indexOf(v) >= 0)) {
        if (constants.AndriodClientId === req.body.clientid || constants.IosClientId === req.body.clientid) {

            authModel.find({ iv_token: req.body.iv_token })
                .exec()
                .then(user => {
                    if (user.length < 1) {
                        return res.status(200).json({
                            status: "Logout",
                            message: "You are logged in other device."
                        });;
                    } else {

                        contactsModel.find({ userid: ObjectId(req.body.userid) }, { 'new_contacts': 1, 'existing_contacts': 1, 'userid': 1 })
                            .populate('existing_contacts.contact')
                            .exec()
                            .then(docs => {
                                var contacts = req.body.contacts
                                //console.log('contactsLength');
                                //console.log(contacts.length);
                                var existing_contacts = docs[0].existing_contacts
                                var new_contacts = docs[0].new_contacts

                                var pushNewContact = [];

                                var contactArray = [];
                                var final_delete_existing = [];
                                var final_delete_new = [];
                                var new_contact_list = [];

                                if (new_contacts.length > 0) {

                                    new_contacts.map(data => {
                                        var contact_mobile = String(data.mobile).replace(/\s/g, "")
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
                                        new_contact_list.push({
                                            'mobile': contact_mobile,
                                            'username': data.username,
                                            'userid': data._id
                                        })
                                    })
                                }
                                console.log('contacts');
                                console.log(contacts.length);
                                if (contacts.length > 0) {
                                    console.log(contacts);
                                    contacts.forEach(function(ele) {

                                        if (ele.mobile.substring(0, 1) === '+') {
                                            var Contact_mobile = ele.mobile.substring(3)
                                        }

                                        if (ele.mobile.substring(0, 1) === '+') {
                                            var Contact_mobile = ele.mobile.substring(3)
                                        }
                                        var foundy = deleteArray.find(o => String(o.contact_id) === String(ele.contact_id));
                                        var foundyEdit = edit_contact.find(o => String(o.mobile) === String(Contact_mobile));
                                        //  console.log(deleteArray);
                                        //  console.log(Contact_mobile);
                                        //  console.log(edit_contact);
                                        //  console.log(Contact_mobile);
                                        //  console.log('foundy');
                                        //  console.log('foundyEdit');
                                        //  console.log(foundyEdit);

                                        // console.log(ele.type);
                                        //console.log(ele.mobile);
                                        //console.log('contactLoop');
                                        if (ele.type === true) // delete
                                        {


                                            if (typeof foundy === 'undefined') {

                                                var mobile = String(ele.mobile).replace(/\s/g, "")
                                                mobile = mobile.replace(/-/g, "")
                                                mobile = mobile.replace(/ /g, "")
                                                mobile = mobile.replace(/[`~!@#$%^&*()_|\-=?;:'",.<>\{\}\[\]\\\/]/gi, '')

                                                if (mobile.substring(0, 1) === '+') {
                                                    mobile = mobile.substring(3)
                                                }
                                                if (mobile.substring(0, 1) === '+') {
                                                    mobile = mobile.substring(3)
                                                }
                                                mobile = parseInt(mobile)
                                                if (isNaN(mobile)) {
                                                    mobile = 0
                                                }

                                                deleteArray.push(ele.contact_id)
                                            }
                                        } else {
                                            if (typeof foundyEdit === 'undefined') {
                                                var mobile = String(ele.mobile).replace(/\s/g, "")
                                                mobile = mobile.replace(/-/g, "")
                                                mobile = mobile.replace(/ /g, "")
                                                mobile = mobile.replace(/[`~!@#$%^&*()_|\-=?;:'",.<>\{\}\[\]\\\/]/gi, '')

                                                if (mobile.substring(0, 1) === '+') {
                                                    mobile = mobile.substring(3)
                                                }
                                                if (mobile.substring(0, 1) === '+') {
                                                    mobile = mobile.substring(3)
                                                }
                                                mobile = parseInt(mobile)
                                                if (isNaN(mobile)) {
                                                    mobile = 0
                                                }

                                                edit_contact.push(mobile)
                                                editlist.push({
                                                    'username': ele.username,
                                                    'mobile': mobile,
                                                    'contact_id': ele.contact_id
                                                })
                                            }
                                        }

                                    })

                                    // console.log('deleteArrayLength');
                                    //  console.log(deleteArray.length);
                                    //   console.log('deleteArray');
                                    console.log(deleteArray);
                                    if (deleteArray.length > 0) {


                                        deleteArray.forEach(function(dex) {
                                            console.log(dex);
                                            /*var dexMobile = dex.mobile;
			 if(dexMobile.substring(0,1) === '+'){
    			var	dex_mobile = dexMobile.substring(3)
    			}

    			if(dexMobile.substring(0,1) === '+'){
    			 var dex_mobile = dexMobile.substring(3)
    			}
			*/


                                            //console.log(dex.contact_id);
                                            var found = existing_contacts.find(o => String(o.contact_id) === String(dex))
                                            console.log('deleted');
                                            //console.log(dex.mobile);
                                            //console.log(existing_contacts);
                                            console.log(found);
                                            if (typeof found != 'undefined') {
                                                console.log('FountDelted');
                                                console.log(String(dex));
                                                final_delete_existing.push(String(dex))
                                            } else {

                                                //console.log('new contact deleted');

                                                var founds = new_contact_list.find(o => String(o.contact_id) === String(dex))
                                                // console.log(founds);
                                                // console.log(dex.mobile);
                                                //console.log(new_contact_list);

                                                if (typeof founds != 'undefined') {
                                                    final_delete_existing.push(String(dex))
                                                }
                                            }
                                        })
                                        console.log(final_delete_existing);
                                        console.log('final_delete_new');

                                        contactsModel.findOneAndUpdate({ userid: ObjectId(req.body.userid) }, { $pull: { existing_contacts: { contact_id: { $in: final_delete_existing } }, new_contacts: { contact_id: { $in: final_delete_existing } } } }).exec()
                                    }
                                    console.log('Edit_contact');
                                    console.log(editlist);
                                    if (edit_contact.length > 0) {

                                        editlist.forEach(function(dex) {
                                            // console.log('test1');
                                            // var dexMobile = dex.mobile;
                                            //console.log(existing_contacts);
                                            var foundUp = existing_contacts.find(o => String(o.contact_id) === String(dex.contact_id));

                                            var foundUpUsername = existing_contacts.find(o => String(o.contact.username) === String(dex.username));
                                            var foundUpMobile = existing_contacts.find(o => String(o.contact.mobile) === String(dex.mobile));

                                            var foundUpNew = new_contacts.find(o => String(o.contact_id) === String(dex.contact_id));
                                            var foundUpNewName = new_contacts.find(o => String(o.username) === String(dex.username));
                                            var foundUpNewMob = new_contacts.find(o => String(o.mobile) === String(dex.mobile));
                                            console.log(foundUpNew);
                                            console.log(foundUpNewName);
                                            console.log(foundUpNewMob);
                                            console.log(dex.contact_id);
                                            console.log(dex.username);
                                            console.log(dex.mobile);


                                            //var foundMobileUp = existing_contacts.find(o => String(o.contact.mobile) === String(dex.mobile));
                                            //var foundUsernameUp = existing_contacts.find(o => String(o.contact.username) === String(dex.username));
                                            console.log(foundUp);
                                            console.log(foundUpUsername);
                                            console.log(foundUpMobile);
                                            if (typeof foundUp != 'undefined' && (typeof foundUpUsername === 'undefined' || typeof foundUpMobile === 'undefined')) // if contact_id found in exiting_contacts
                                            {
                                                console.log('test2');
                                                console.log(dex.contact_id);
                                                //if(typeof foundMobileUp === 'undefined')
                                                //{
                                                // if contact id compare to deleted in existing contacts after that add new contact

                                                pushNewContact.push({
                                                    'username': dex.username,
                                                    'mobile': dex.mobile,
                                                    'contact_id': dex.contact_id
                                                })
                                                var ConactID = dex.contact_id;
                                                contactsModel.findOneAndUpdate({ userid: ObjectId(req.body.userid) }, { $pull: { existing_contacts: { contact_id: ConactID } } }).exec()

                                                contactsModel.findOneAndUpdate({ userid: ObjectId(req.body.userid), 'new_contacts.contact_id': ConactID }, { $set: { "new_contacts.$.mobile": dex.mobile, "new_contacts.$.username": dex.username } }).exec();


                                                /*  contactsModel.findOneAndUpdate({userid:ObjectId(req.body.userid)},
      										{$pull:{existing_contacts:{contact_id:foundUp.contact_id}},
      										$push:{new_contacts:pushNewContact}})
      						.exec();*/

                                                pushNewContact = [];
                                                //    }

                                                // final_delete_existing.push(found.contact._id)
                                            } else if (typeof foundUpNew != 'undefined' && (typeof foundUpNewName === 'undefined' || typeof foundUpNewMob === 'undefined')) // if contact_id found in exiting_contacts
                                            {
                                                var ConactID = dex.contact_id;
                                                console.log('test3');
                                                contactsModel.findOneAndUpdate({ userid: ObjectId(req.body.userid), 'new_contacts.contact_id': ConactID }, { $set: { "new_contacts.$.mobile": dex.mobile, "new_contacts.$.username": dex.username } }).exec();
                                            }
                                            /* else{   // if contact id not found in exiting_contacts
            //  console.log('test3');
          var foundUpNew = new_contacts.find(o => String(o.contact_id) === String(dex.contact_id));

           // console.log(foundUpNew);
            // Username , mobile , contaCT ID

            if(typeof foundUpNew === 'undefined') // if contact_id not found in new_contacts
            {
//console.log('test5');

              pushNewContact.push({
                'username':dex.username,
                'mobile':dex.mobile,
                'contact_id':dex.contact_id
              })
             // contactsModel.findOneAndUpdate({userid:ObjectId(req.body.userid)},
                    //       {$push:{new_contacts:pushNewContact}}).exec();


            } // if contact_id found in new_contacts
            else {
                  //  console.log('test4');
	//  console.log(dex.mobile);
	//  console.log(dex.username);


              contactsModel.findOneAndUpdate({userid:ObjectId(req.body.userid),'new_contacts.contact_id':foundUpNew.contact_id},
                           {$set:{"new_contacts.$.mobile":dex.mobile,"new_contacts.$.username":dex.username}}).exec();


            }

        } */

                                        })
                                    }

                                    //}) // contact loop end


                                }
                            }).catch(err => {
                                console.log(err)
                            });
                        if (req.body.contact_type === true) {
                            res.status(200).json({
                                status: 'Ok',
                                message: 'Successfully contacts deleted',
                                page_no: page_no
                            });
                        } else {
                            res.status(200).json({
                                status: 'Ok',
                                message: 'Successfully contacts updated',
                                page_no: page_no
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

module.exports = router;