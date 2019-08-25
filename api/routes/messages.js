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
const multer = require('multer');
const userDetails = require("../models/userDetails");
const isEmpty = require("is-empty");
const ObjectId = require('mongodb').ObjectID;
const http = require('http');
const fs = require('fs');
const messageModel = require("../models/iv_message");
const moment = require('moment')

router.post("/get_contacts_chat", (req, res, next) => {

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
                        var perPage = 20;
                        var page = req.body.page_no;

                        if(isEmpty(page)){
                            page=1
                        }
                        var skip = (perPage * page) - perPage;
                        var limit = skip+perPage;

                contactsModel.aggregate(
                   [ {$match:{userid:ObjectId(req.body.userid)}},
                    {$project:{blocked:'$blocked',
                        existing_contacts:'$existing_contacts.contact'
                    }
                }], function(err,data){
                    if(err){
                          return res.status(200).json({
                            status:"Failed",
                            message:'Please provide correct userid.'
                          });
                    }else{
                        if(data.length<1){
                            res.status(200).json({
                                status: 'Ok',
                                message: 'No chats.',
                                total_pages: 1,
                                current_page:1,
                                total_contacts:0,
                                userid:req.body.userid,
                                contacts: []
                            });
                        }
                        else{
                            var contacts = data[0].existing_contacts
                            var blocked = data[0].blocked
                            contacts.push(ObjectId(req.body.userid))
                            messageModel.find({$or:
                                                [{$and:
                                                    [{userid:ObjectId(req.body.userid)},
                                                    {memberid:{$in:contacts}},
                                                    {memberid:{$nin:blocked}}]
                                                },
                                                {$and:
                                                    [{userid:{$in:contacts}},
                                                    {userid:{$nin:blocked}},
                                                    {memberid:ObjectId(req.body.userid)}]  
                                                }]
                                            })
                                .populate('userid memberid messages.user')
                                .exec()
                                .then(docs =>{
                                    if(docs.length < 1){
                                            res.status(200).json({
                                                status: 'Ok',
                                                message: 'No chats.',
                                                total_pages: 1,
                                                current_page:1,
                                                total_contacts:0,
                                                userid:req.body.userid,
                                                contacts: []
                                            });
                                    }
                                    else{

                                        var test =[]
                                        docs.map(doc =>{
                                            var delete_user = doc.delete_user

                                            var user_deleted = delete_user.find(o => String(o.user_id) === String(req.body.userid))

                                            if(typeof user_deleted === 'undefined'){

                                                var msg = doc.messages
                                                var topics = doc.topic
                                                  var title = String(topics).split("-")
                                                  var sender = title[1]
                                                  var rec = title[0]
                                                  var title_vice = sender+"-"+rec

                                                msg.sort(function(a,b){
                                                    return new Date(b.created_at) - new Date(a.created_at);
                                                });

                                                msg = msg.filter(o => !o.message.includes(topics) && !o.message.includes(title_vice))

                                                var unread_msgs = 0

                                                if(String(doc.userid._id) == String(req.body.userid)){

                                                    var found = []

                                                    if(doc.userid_read != null){
                                                        found = msg.filter(o => new Date(o.created_at) > doc.userid_read && String(o.user._id) != String(req.body.userid))
                                                    }

                                                    if(found.length > 0){ 
                                                        unread_msgs = found.length
                                                    }
                                                }
                                                else{

                                                    var found =[]

                                                    if(doc.memberid_read != null){
                                                        found = msg.filter(o => new Date(o.created_at) > doc.memberid_read && String(o.user._id) != String(req.body.userid))
                                                    }
                                                    
                                                    if(found.length > 0){
                                                        unread_msgs = found.length
                                                    }
                                                }

                                                    if(msg.length > 0){
                                                        var last_msg =msg[0]
                                                        var userid =""
                                                        var username = ""
                                                        var profileimage =""
                                                        var fullname =""
                                                        var mobile = ""

                                                        if(String(last_msg.user._id) === String(req.body.userid)){

                                                            if(String(doc.userid._id) === String(req.body.userid)){
                                                                username = doc.memberid.username
                                                                fullname = doc.memberid.fullname
                                                                userid = doc.memberid._id
                                                                mobile = doc.memberid.mobile
                                                                profileimage = doc.memberid.profileimage;

                                                                if(doc.memberid.profileimage === null){
                                                                    profileimage = "uploads/userimage.png"
                                                                }
                                                            }
                                                            else{
                                                                username = doc.userid.username
                                                                fullname = doc.userid.fullname
                                                                userid = doc.userid._id
                                                                mobile = doc.userid.mobile
                                                                profileimage = doc.userid.profileimage;
                                                                
                                                                if(doc.userid.profileimage === null){
                                                                    profileimage = "uploads/userimage.png"
                                                                }
                                                            }

                                                        }
                                                        else{
                                                            username = last_msg.user.username
                                                            fullname = last_msg.user.fullname
                                                            userid = last_msg.user._id
                                                            mobile = last_msg.user.mobile
                                                            profileimage = last_msg.user.profileimage;
                                                            
                                                            if(last_msg.user.profileimage === null){
                                                                profileimage = "uploads/userimage.png"
                                                            }

                                                        }
                                                        
                                                        var date1 = moment(last_msg.created_at).format("DD-MM-YYYY")
                                                        var has_unread_messages = false

                                                        if(unread_msgs > 0){
                                                            has_unread_messages = true
                                                        }

                                                        var indiaTime = new Date(last_msg.created_at).toLocaleString("en-US", {timeZone: "Asia/Kolkata"});
                                                        indiaTimes = new Date(indiaTime);
                                                        var today = new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"});


                                                        var splitTime= String(indiaTime).split(',')
                                                        var splitTime_today= String(today).split(',')

                                                        if(String(splitTime[0]) == String(splitTime_today[0])){
                                                            //var new_time = String(splitTime[1]).split(':')
                                                                                var final_time = String(splitTime[1]).replace(' ','')
                                                                                var edited_time = final_time.split(' ')
                                                                                var new_edited_time = edited_time[0].split(':')
                                                                                indiaTime = new_edited_time[0]+":"+new_edited_time[1]+" "+edited_time[1]
                                                        } 
                                                        else{
                                                            var new_time = String(indiaTime).split(',')
                                                            
                                                            indiaTime = new_time[0]
                                                        }  
                                                           
                                                        var foe ={
                                                                    "username": username,
                                                                    "fullname":fullname,
                                                                    "userid":userid,
                                                                    "mobile":mobile,
                                                                    "profileimage":constants.APIBASEURL+profileimage,
                                                                    "message":last_msg.message,
                                                                    "message_time":indiaTime,
                                                                    "message_created_at":last_msg.created_at,
                                                                    "unread_count":unread_msgs,
                                                                    "has_unread_messages":has_unread_messages
                                                        }
                                                        test.push(foe)
                                                    }
                                            }
                                            else{
                                                var msg = doc.messages
                                                var topics = doc.topic
                                                  var title = String(topics).split("-")
                                                  var sender = title[1]
                                                  var rec = title[0]
                                                  var title_vice = sender+"-"+rec
                                                  var deleted_at = user_deleted.deleted_at

                                                msg.sort(function(a,b){
                                                    return new Date(b.created_at) - new Date(a.created_at);
                                                });

                                                msg = msg.filter(o => o.created_at > deleted_at)

                                                msg = msg.filter(o => !o.message.includes(topics) && !o.message.includes(title_vice))

                                                var unread_msgs = 0

                                                if(String(doc.userid._id) == String(req.body.userid)){

                                                    var found = []

                                                    if(doc.userid_read != null){
                                                        found = msg.filter(o => new Date(o.created_at) > doc.userid_read && String(o.user._id) != String(req.body.userid))
                                                    }

                                                    if(found.length > 0){
                                                        unread_msgs = found.length
                                                    }
                                                }
                                                else{

                                                    var found =[]

                                                    if(doc.memberid_read != null){
                                                        found = msg.filter(o => new Date(o.created_at) > doc.memberid_read && String(o.user._id) != String(req.body.userid))
                                                    }
                                                    
                                                    if(found.length > 0){
                                                        unread_msgs = found.length
                                                    }
                                                }

                                                    if(msg.length > 0){
                                                        var last_msg =msg[0]
                                                        var userid =""
                                                        var username = ""
                                                        var profileimage =""
                                                        var fullname =""
                                                        var mobile = ""

                                                        if(String(last_msg.user._id) === String(req.body.userid)){

                                                            if(String(doc.userid._id) === String(req.body.userid)){
                                                                username = doc.memberid.username
                                                                fullname = doc.memberid.fullname
                                                                userid = doc.memberid._id
                                                                mobile = doc.memberid.mobile
                                                                profileimage = doc.memberid.profileimage;

                                                                if(doc.memberid.profileimage === null){
                                                                    profileimage = "uploads/userimage.png"
                                                                }
                                                            }
                                                            else{
                                                                username = doc.userid.username
                                                                fullname = doc.userid.fullname
                                                                userid = doc.userid._id
                                                                mobile = doc.userid.mobile
                                                                profileimage = doc.userid.profileimage;
                                                                
                                                                if(doc.userid.profileimage === null){
                                                                    profileimage = "uploads/userimage.png"
                                                                }
                                                            }

                                                        }
                                                        else{
                                                            username = last_msg.user.username
                                                            fullname = last_msg.user.fullname
                                                            userid = last_msg.user._id
                                                            mobile = last_msg.user.mobile
                                                            profileimage = last_msg.user.profileimage;
                                                            
                                                            if(last_msg.user.profileimage === null){
                                                                profileimage = "uploads/userimage.png"
                                                            }

                                                        }
                                                        
                                                        var date1 = moment(last_msg.created_at).format("DD-MM-YYYY")

                                                        var has_unread_messages = false
                                                        if(unread_msgs > 0){
                                                            has_unread_messages = true
                                                        }
                                                        var indiaTime = new Date(last_msg.created_at).toLocaleString("en-US", {timeZone: "Asia/Kolkata"});
                                                        indiaTimes = new Date(indiaTime);
                                                        var today = new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"});

                                                        var splitTime= String(indiaTime).split(',')
                                                        var splitTime_today= String(today).split(',')

                                                        if(String(splitTime[0]) == String(splitTime_today[0])){
                                                            //var new_time = String(splitTime[1]).split(':')
                                                            var final_time = String(splitTime[1]).replace(' ','')
                                                            var edited_time = final_time.split(' ')
                                                            var new_edited_time = edited_time[0].split(':')
                                                            indiaTime = new_edited_time[0]+":"+new_edited_time[1]+" "+edited_time[1]
                                                        }   
                                                        else{
                                                            var new_time = String(indiaTime).split(',')
                                                            
                                                            indiaTime = new_time[0]
                                                        } 


                                                        var foe ={
                                                                    "username": username,
                                                                    "fullname":fullname,
                                                                    "userid":userid,
                                                                    "mobile":mobile,
                                                                    "profileimage":constants.APIBASEURL+profileimage,
                                                                    "message":last_msg.message,
                                                                    "message_time":indiaTime,
                                                                    "message_created_at":last_msg.created_at,
                                                                    "unread_count":unread_msgs,
                                                                    "has_unread_messages":has_unread_messages
                                                        }
                                                        test.push(foe)
                                                    }
                                            }

                                        })

                                        notificationModel.update(
                                            {$and: [{$or: [{"notifications.notification_type": 'new_message'}]}, {userid: ObjectId(req.body.userid)}]},
                                            {"$set": {"notifications.$[elem].view_status": true}},
                                            {
                                                "arrayFilters": [{$or: [{'elem.notification_type': 'new_message'}]}],
                                                "multi": true
                                            })
                                            .exec()


                                            test.sort(function(a,b){
                                                return new Date(b.message_created_at) - new Date(a.message_created_at);
                                            });

                                               var totalPages= 1;
                                                const totalcontacts = test.length;
                                                if(test.length > perPage){
                                                        totalPages = Math.ceil((test.length) / perPage);
                                                        test = test.slice(skip,limit);
                                                }
                                                else{
                                                        page=1;
                                                }

                                                test.forEach(function(ele){
                                                    delete ele.message_created_at
                                                })

                                        res.status(200).json({ 
                                                status: 'Ok',
                                                message:'list of chats',
                                                total_pages: totalPages,
                                                current_page:page,
                                                total_contacts:totalcontacts,
                                                userid:req.body.userid,
                                                contacts: test
                                            });
                                    }
                                }).catch(err => {
                                    console.log(err)
                                });
                        }
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
})


router.post("/get_others_chat", (req, res, next) => {

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
                        var perPage = 20;
                        var page = req.body.page_no;

                        if(isEmpty(page)){
                            page=1
                        }
                        var skip = (perPage * page) - perPage;
                        var limit = skip+perPage;

                    userDetails.find({userid:ObjectId(req.body.userid)})
                                .populate('following followers blocked')
                                .exec()
                                .then(data =>{

                                    if(data.length<1){
                                        res.status(200).json({
                                            status: 'Ok',
                                            message: 'No chats.',
                                            total_pages: 1,
                                            current_page:1,
                                            total_contacts:0,
                                            userid:req.body.userid,
                                            contacts: []
                                        });
                                    }
                                    else{
                                        var contacts =[]
                                        var blocked_list =[]
                                        var followers = data[0].followers
                                        var following = data[0].following
                                        var blocked = data[0].blocked

                                        if(followers.length > 0){
                                            followers.forEach(function(dex){
                                                contacts.push(ObjectId(dex.userid))
                                            })
                                        }

                                        if(following.length > 0){
                                            following.forEach(function(dexs){
                                                var found = contacts.find(o => String(o) === String(dexs.userid))

                                                if(typeof found === 'undefined'){
                                                    contacts.push(ObjectId(dexs.userid))
                                                }
                                            })
                                        }

                                        if(blocked.length > 0){
                                            blocked.forEach(function(dex){
                                                blocked_list.push(ObjectId(dex.userid))
                                            })
                                        }

                                        contacts.push(ObjectId(req.body.userid))

                                         messageModel.find({$or:
                                                [{$and:
                                                    [{userid:ObjectId(req.body.userid)},
                                                    {memberid:{$in:contacts}},
                                                    {memberid:{$nin:blocked_list}}]
                                                },
                                                {$and:
                                                    [{userid:{$in:contacts}},
                                                    {userid:{$nin:blocked_list}},
                                                    {memberid:ObjectId(req.body.userid)}]  
                                                }]
                                            })
                                                    .populate('userid memberid messages.user')
                                                    .exec()
                                                    .then(docs =>{
                                                        if(docs.length < 1){
                                                                res.status(200).json({
                                                                    status: 'Ok',
                                                                    message: 'No chats.',
                                                                    total_pages: 1,
                                                                    current_page:1,
                                                                    total_contacts:0,
                                                                    userid:req.body.userid,
                                                                    contacts: []
                                                                });
                                                        }
                                                        else{

                                                            var test =[]
                                                            docs.map(doc =>{
                                                                var delete_user = doc.delete_user

                                                                var user_deleted = delete_user.find(o => String(o.user_id) === String(req.body.userid))

                                                                if(typeof user_deleted === 'undefined'){

                                                                    var msg = doc.messages
                                                                    var topics = doc.topic
                                                                      var title = String(topics).split("-")
                                                                      var sender = title[1]
                                                                      var rec = title[0]
                                                                      var title_vice = sender+"-"+rec

                                                                    msg.sort(function(a,b){
                                                                        return new Date(b.created_at) - new Date(a.created_at);
                                                                    });

                                                                    msg = msg.filter(o => !o.message.includes(topics) && !o.message.includes(title_vice))

                                                                    var unread_msgs = 0

                                                                    if(String(doc.userid._id) == String(req.body.userid)){

                                                                        var found = []

                                                                        if(doc.userid_read != null){
                                                                            found = msg.filter(o => new Date(o.created_at) > doc.userid_read && String(o.user._id) != String(req.body.userid))
                                                                        }

                                                                        if(found.length > 0){
                                                                            unread_msgs = found.length
                                                                        }
                                                                    }
                                                                    else{

                                                                        var found =[]

                                                                        if(doc.memberid_read != null){
                                                                            found = msg.filter(o => new Date(o.created_at) > doc.memberid_read && String(o.user._id) != String(req.body.userid))
                                                                        }
                                                                        
                                                                        if(found.length > 0){
                                                                            unread_msgs = found.length
                                                                        }
                                                                    }

                                                                        if(msg.length > 0){
                                                                            var last_msg =msg[0]
                                                                            var userid =""
                                                                            var username = ""
                                                                            var profileimage =""
                                                                            var fullname =""
                                                                            var mobile = ""

                                                                            if(String(last_msg.user._id) === String(req.body.userid)){

                                                                                if(String(doc.userid._id) === String(req.body.userid)){
                                                                                    username = doc.memberid.username
                                                                                    fullname = doc.memberid.fullname
                                                                                    userid = doc.memberid._id
                                                                                    mobile = doc.memberid.mobile
                                                                                    profileimage = doc.memberid.profileimage;

                                                                                    if(doc.memberid.profileimage === null){
                                                                                        profileimage = "uploads/userimage.png"
                                                                                    }
                                                                                }
                                                                                else{
                                                                                    username = doc.userid.username
                                                                                    fullname = doc.userid.fullname
                                                                                    userid = doc.userid._id
                                                                                    mobile = doc.userid.mobile
                                                                                    profileimage = doc.userid.profileimage;
                                                                                    
                                                                                    if(doc.userid.profileimage === null){
                                                                                        profileimage = "uploads/userimage.png"
                                                                                    }
                                                                                }

                                                                            }
                                                                            else{
                                                                                username = last_msg.user.username
                                                                                fullname = last_msg.user.fullname
                                                                                userid = last_msg.user._id
                                                                                mobile = last_msg.user.mobile
                                                                                profileimage = last_msg.user.profileimage;
                                                                                
                                                                                if(last_msg.user.profileimage === null){
                                                                                    profileimage = "uploads/userimage.png"
                                                                                }

                                                                            }
                                                                            
                                                                            var date1 = moment(last_msg.created_at).format("DD-MM-YYYY")
                                                                            var has_unread_messages = false

                                                                            if(unread_msgs > 0){
                                                                                has_unread_messages = true
                                                                            }

                                                                            var indiaTime = new Date(last_msg.created_at).toLocaleString("en-US", {timeZone: "Asia/Kolkata"});
                                                                            indiaTimes = new Date(indiaTime);
                                                                            var today = new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"});

                                                                            var splitTime= String(indiaTime).split(',')
                                                                            var splitTime_today= String(today).split(',')

                                                                            if(String(splitTime[0]) == String(splitTime_today[0])){
                                                                                //var new_time = String(splitTime[1]).split(':')
                                                                                var final_time = String(splitTime[1]).replace(' ','')
                                                                                var edited_time = final_time.split(' ')
                                                                                var new_edited_time = edited_time[0].split(':')
                                                                                indiaTime = new_edited_time[0]+":"+new_edited_time[1]+" "+edited_time[1]
                                                                            } 
                                                                            else{
                                                                                var new_time = String(indiaTime).split(',')
                                                                                
                                                                                indiaTime = new_time[0]
                                                                            }  
                                                                               
                                                                            var foe ={
                                                                                        "username": username,
                                                                                        "fullname":fullname,
                                                                                        "userid":userid,
                                                                                        "mobile":mobile,
                                                                                        "profileimage":constants.APIBASEURL+profileimage,
                                                                                        "message":last_msg.message,
                                                                                        "message_time":indiaTime,
                                                                                        "message_created_at":last_msg.created_at,
                                                                                        "unread_count":unread_msgs,
                                                                                        "has_unread_messages":has_unread_messages
                                                                            }
                                                                            test.push(foe)
                                                                        }
                                                                }
                                                                else{
                                                                    var msg = doc.messages
                                                                    var topics = doc.topic
                                                                      var title = String(topics).split("-")
                                                                      var sender = title[1]
                                                                      var rec = title[0]
                                                                      var title_vice = sender+"-"+rec
                                                                      var deleted_at = user_deleted.deleted_at

                                                                    msg.sort(function(a,b){
                                                                        return new Date(b.created_at) - new Date(a.created_at);
                                                                    });

                                                                    msg = msg.filter(o => o.created_at > deleted_at)

                                                                    msg = msg.filter(o => !o.message.includes(topics) && !o.message.includes(title_vice))

                                                                    var unread_msgs = 0

                                                                    if(String(doc.userid._id) == String(req.body.userid)){

                                                                        var found = []

                                                                        if(doc.userid_read != null){
                                                                            found = msg.filter(o => new Date(o.created_at) > doc.userid_read && String(o.user._id) != String(req.body.userid))
                                                                        }

                                                                        if(found.length > 0){
                                                                            unread_msgs = found.length
                                                                        }
                                                                    }
                                                                    else{

                                                                        var found =[]

                                                                        if(doc.memberid_read != null){
                                                                            found = msg.filter(o => new Date(o.created_at) > doc.memberid_read && String(o.user._id) != String(req.body.userid))
                                                                        }
                                                                        
                                                                        if(found.length > 0){
                                                                            unread_msgs = found.length
                                                                        }
                                                                    }

                                                                        if(msg.length > 0){
                                                                            var last_msg =msg[0]
                                                                            var userid =""
                                                                            var username = ""
                                                                            var profileimage =""
                                                                            var fullname =""
                                                                            var mobile = ""

                                                                            if(String(last_msg.user._id) === String(req.body.userid)){

                                                                                if(String(doc.userid._id) === String(req.body.userid)){
                                                                                    username = doc.memberid.username
                                                                                    fullname = doc.memberid.fullname
                                                                                    userid = doc.memberid._id
                                                                                    mobile = doc.memberid.mobile
                                                                                    profileimage = doc.memberid.profileimage;

                                                                                    if(doc.memberid.profileimage === null){
                                                                                        profileimage = "uploads/userimage.png"
                                                                                    }
                                                                                }
                                                                                else{
                                                                                    username = doc.userid.username
                                                                                    fullname = doc.userid.fullname
                                                                                    userid = doc.userid._id
                                                                                    mobile = doc.userid.mobile
                                                                                    profileimage = doc.userid.profileimage;
                                                                                    
                                                                                    if(doc.userid.profileimage === null){
                                                                                        profileimage = "uploads/userimage.png"
                                                                                    }
                                                                                }

                                                                            }
                                                                            else{
                                                                                username = last_msg.user.username
                                                                                fullname = last_msg.user.fullname
                                                                                userid = last_msg.user._id
                                                                                mobile = last_msg.user.mobile
                                                                                profileimage = last_msg.user.profileimage;
                                                                                
                                                                                if(last_msg.user.profileimage === null){
                                                                                    profileimage = "uploads/userimage.png"
                                                                                }

                                                                            }
                                                                            
                                                                            var date1 = moment(last_msg.created_at).format("DD-MM-YYYY")

                                                                            var has_unread_messages = false
                                                                            if(unread_msgs > 0){
                                                                                has_unread_messages = true
                                                                            }
                                                                            var indiaTime = new Date(last_msg.created_at).toLocaleString("en-US", {timeZone: "Asia/Kolkata"});
                                                                            indiaTimes = new Date(indiaTime);
                                                                            var today = new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"});

                                                                            console.log(String(indiaTime))

                                                                            var splitTime= String(indiaTime).split(',')
                                                                            var splitTime_today= String(today).split(',')

                                                                            if(String(splitTime[0]) == String(splitTime_today[0])){
                                                                                //var new_time = String(splitTime[1]).split(':')
                                                                                var final_time = String(splitTime[1]).replace(' ','')
                                                                                var edited_time = final_time.split(' ')
                                                                                var new_edited_time = edited_time[0].split(':')
                                                                                indiaTime = new_edited_time[0]+":"+new_edited_time[1]+" "+edited_time[1]
                                                                            }   
                                                                            else{
                                                                                var new_time = String(indiaTime).split(',')
                                                                                
                                                                                indiaTime = new_time[0]
                                                                            } 


                                                                            var foe ={
                                                                                        "username": username,
                                                                                        "fullname":fullname,
                                                                                        "userid":userid,
                                                                                        "mobile":mobile,
                                                                                        "profileimage":constants.APIBASEURL+profileimage,
                                                                                        "message":last_msg.message,
                                                                                        "message_time":indiaTime,
                                                                                        "message_created_at":last_msg.created_at,
                                                                                        "unread_count":unread_msgs,
                                                                                        "has_unread_messages":has_unread_messages
                                                                            }
                                                                            test.push(foe)
                                                                        }
                                                                }

                                                            })

                                                                test.sort(function(a,b){
                                                                    return new Date(b.message_created_at) - new Date(a.message_created_at);
                                                                });

                                                                   var totalPages= 1;
                                                                    const totalcontacts = test.length;
                                                                    if(test.length > perPage){
                                                                            totalPages = Math.ceil((test.length) / perPage);
                                                                            test = test.slice(skip,limit);
                                                                    }
                                                                    else{
                                                                            page=1;
                                                                    }

                                                                    test.forEach(function(ele){
                                                                        delete ele.message_created_at
                                                                    })

                                                            res.status(200).json({ 
                                                                    status: 'Ok',
                                                                    message:'list of chats',
                                                                    total_pages: totalPages,
                                                                    current_page:page,
                                                                    total_contacts:totalcontacts,
                                                                    userid:req.body.userid,
                                                                    contacts: test
                                                                });
                                                        }
                                                    }).catch(err => {
                                                        console.log(err)
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
})

router.post("/get_chat", (req, res, next) => {

  var keyArray = ["userid", "iv_token", "clientid", "page_no","chat_id"];
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

                        var topics = req.body.chat_id
                         var title = String(topics).split("-")
                        var sender = title[1]
                         var rec = title[0]
                         var title_vice = sender+"-"+rec

                            messageModel.find({$or:[{topic: topics },{topic: title_vice}]})
                                .populate('messages.user')
                                .exec()
                                .then(docs =>{
                                    if(docs.length < 1){
                                            res.status(200).json({
                                                status: 'Ok',
                                                message: 'No chats.',
                                                total_pages: 1,
                                                current_page:1,
                                                total_contacts:0,
                                                userid:req.body.userid,
                                                contacts: []
                                            });
                                    }
                                    else{

                                                var test =[]
                                                var msg = docs[0].messages

                                                    var delete_user = docs[0].delete_user

                                                    var user_deleted = delete_user.find(o => String(o.user_id) === String(req.body.userid))

                                                    if(typeof user_deleted === 'undefined'){
                                                        msg.sort(function(a,b){
                                                                return new Date(b.created_at) - new Date(a.created_at);
                                                            });

                                                            msg = msg.filter(o => !o.message.includes(topics) && !o.message.includes(title_vice))

                                                        msg.map(doc =>{
                                                            
                                                            var userid =""
                                                            var username = ""
                                                            var profileimage =""
                                                            var fullname =""
                                                            var mobile = ""

                                                                    userid =  doc.user._id
                                                                    profileimage =  doc.user.profileimage;
                                                                    if( doc.user.profileimage === null){
                                                                        profileimage = "uploads/userimage.png"
                                                                    }

                                                            var foe ={}
                                                            var contact = ""
                                                            if(String(req.body.userid) === String(docs[0].userid)){
                                                                contact = docs[0].memberid
                                                            }
                                                            else{
                                                                contact = docs[0].userid
                                                            }
                                                              var indiaTime = new Date(doc.created_at).toLocaleString("en-US", {timeZone: "Asia/Kolkata"});
                                                                indiaTime = new Date(indiaTime);
                                                                 indiaTime =  Date.parse(indiaTime)

                                                                if(String(userid) === String(docs[0].userid)){

                                                                    foe ={
                                                                        "receiverUserId":docs[0].memberid,
                                                                        "senderUserId":userid,
                                                                        "chatId":contact,
                                                                        "profileImg":"",
                                                                        "msg":doc.message,
                                                                        'msgId': doc.msg_id,
                                                                        "created_at":indiaTime
                                                                    }
                                                                }
                                                                else{
                                                                    foe ={
                                                                        "receiverUserId":docs[0].userid,
                                                                        "senderUserId":userid,
                                                                        "chatId":contact,
                                                                        "profileImg":"",
                                                                        "msg":doc.message,
                                                                        'msgId': doc.msg_id,
                                                                        "created_at":indiaTime
                                                                    }
                                                                }

                                                            test.push(foe)
                                                        })
                                            }
                                            else{
                                                    var deleted_at = user_deleted.deleted_at

                                                    msg = msg.filter(o => o.created_at > deleted_at)
                                                    msg.sort(function(a,b){
                                                        return new Date(b.created_at) - new Date(a.created_at);
                                                    });

                                                    msg = msg.filter(o => !o.message.includes(topics) && !o.message.includes(title_vice))

                                                    msg.map(doc =>{
                                                        
                                                        var userid =""
                                                        var username = ""
                                                        var profileimage =""
                                                        var fullname =""
                                                        var mobile = ""

                                                                userid =  doc.user._id
                                                                profileimage =  doc.user.profileimage;
                                                                if( doc.user.profileimage === null){
                                                                    profileimage = "uploads/userimage.png"
                                                                }

                                                        var foe ={}
                                                        var contact = ""
                                                        if(String(req.body.userid) === String(docs[0].userid)){
                                                            contact = docs[0].memberid
                                                        }
                                                        else{
                                                            contact = docs[0].userid
                                                        }

                                                       var indiaTime = new Date(doc.created_at).toLocaleString("en-US", {timeZone: "Asia/Kolkata"});
                                                                indiaTime = new Date(indiaTime);
                                                                 indiaTime =  Date.parse(indiaTime)

                                                            if(String(userid) === String(docs[0].userid)){

                                                                foe ={
                                                                    "receiverUserId":docs[0].memberid,
                                                                    "senderUserId":userid,
                                                                    "chatId":contact,
                                                                    "profileImg":"",
                                                                    "msg":doc.message,
                                                                    'msgId': doc.msg_id,
                                                                    "created_at":indiaTime
                                                                }
                                                            }
                                                            else{
                                                                foe ={
                                                                    "receiverUserId":docs[0].userid,
                                                                    "senderUserId":userid,
                                                                    "chatId":contact,
                                                                    "profileImg":"",
                                                                    "msg":doc.message,
                                                                    'msgId': doc.msg_id,
                                                                    "created_at":indiaTime
                                                                }
                                                            }

                                                        test.push(foe)
                                                    })
                                            }

                                               var totalPages= 1;
                                                const totalcontacts = test.length;
                                                if(test.length > perPage){
                                                        totalPages = Math.ceil((test.length) / perPage);
                                                        test = test.slice(skip,limit);
                                                }
                                                else{
                                                        page=1;
                                                }

                                             //   test.reverse()

                                        res.status(200).json({ 
                                                status: 'Ok',
                                                message:'list of chats',
                                                total_pages: totalPages,
                                                current_page:page,
                                                total_messages:totalcontacts,
                                                userid:req.body.userid,
                                                chat_messages: test
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

router.post("/consume_messages", (req, res, next) => {

  var keyArray = ["userid", "iv_token", "clientid", "receiverUserId"];
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
                        var sender = req.body.userid
                         var rec = req.body.receiverUserId
                         var topics = rec+"-"+sender
                         var title_vice = sender+"-"+rec

                            messageModel.find({$or:[{topic: topics },{topic: title_vice}]})
                                .populate('messages.user')
                                .exec()
                                .then(docs =>{
                                    if(docs.length > 0){
                                        var userid_read = ""
                                        var title = docs[0].topic

                                        if(String(docs[0].userid) === String(req.body.userid)){
                                            userid_read = req.body.userid

                                            messageModel.findOneAndUpdate({topic:title},
                                                                        {$set:{userid_read:Date.now()}})
                                                        .exec()
                                                        .then(data =>{
                                                            if(data != null){
                                                                return res.status(200).json({
                                                                    status:"Ok",
                                                                    message:"Consumed messages successfully."
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
                                        else{
                                            memberid_read = req.body.userid
                                               messageModel.findOneAndUpdate({topic:title},
                                                                        {$set:{memberid_read:Date.now()}})
                                                        .exec()
                                                        .then(data =>{
                                                            if(data != null){
                                                                return res.status(200).json({
                                                                    status:"Ok",
                                                                    message:"Consumed messages successfully."
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

router.post("/delete_chat", (req, res, next) => {

  var keyArray = ["userid", "iv_token", "clientid","chat_id"];
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

                        var topics = req.body.chat_id
                         var title = String(topics).split("-")
                        var sender = title[1]
                         var rec = title[0]
                         var title_vice = sender+"-"+rec

                            messageModel.find({$or:[{topic: topics },{topic: title_vice}]})
                                .exec()
                                .then(docs =>{
                                    if(docs.length < 1){
                                            res.status(200).json({
                                                status: 'Ok',
                                                message: 'No chats exists',
                                            });
                                    }
                                    else{

                                        var delete_user = docs[0].delete_user
                                        if(delete_user.length > 0){
                                            var found = delete_user.find(o => String(o.user_id) === String(req.body.userid))
                                            
                                            if(typeof found === 'undefined'){
                                                messageModel.findOneAndUpdate({topic:docs[0].topic},
                                                        {$push:{delete_user:
                                                            {user_id: ObjectId(req.body.userid),
                                                                deleted_at:Date.now()}}})
                                                    .exec()
                                                    .then(dex =>{

                                                        if(dex === null){
                                                            res.status(200).json({
                                                                status: 'Failed',
                                                                message: 'Error deleting the chat.',
                                                            });
                                                        }
                                                        else{
                                                            res.status(200).json({
                                                                status: 'Ok',
                                                                message: 'successfully deleted the chat.',
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
                                                messageModel.findOneAndUpdate({topic:docs[0].topic, 'delete_user.user_id':ObjectId(req.body.userid)},
                                                        {$set:{'delete_user.$.deleted_at':Date.now()}})
                                                    .exec()
                                                    .then(dex =>{

                                                        if(dex === null){
                                                            res.status(200).json({
                                                                status: 'Failed',
                                                                message: 'Error deleting the chat.',
                                                            });
                                                        }
                                                        else{
                                                            res.status(200).json({
                                                                status: 'Ok',
                                                                message: 'successfully deleted the chat.',
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
                                        }
                                        else{
                                             messageModel.findOneAndUpdate({topic:docs[0].topic},
                                                        {$push:{delete_user:
                                                            {user_id: ObjectId(req.body.userid),
                                                                deleted_at:Date.now()}}})
                                                    .exec()
                                                    .then(dex =>{

                                                        if(dex === null){
                                                            res.status(200).json({
                                                                status: 'Failed',
                                                                message: 'Error deleting the chat.',
                                                            });
                                                        }
                                                        else{
                                                            res.status(200).json({
                                                                status: 'Ok',
                                                                message: 'successfully deleted the chat.',
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
})

router.post("/get_unread_messages", (req, res, next) => {

  var keyArray = ["userid", "iv_token", "clientid", "chat_id"];
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

                        var topics = req.body.chat_id
                         var title = String(topics).split("-")
                        var sender = title[1]
                         var rec = title[0]
                         var title_vice = sender+"-"+rec

                            messageModel.find({$or:[{topic: topics },{topic: title_vice}]})
                                .populate('messages.user')
                                .exec()
                                .then(docs =>{
                                    if(docs.length < 1){
                                            res.status(200).json({
                                                status: 'Ok',
                                                message: 'No chats.',
                                                total_contacts:0,
                                                userid:req.body.userid,
                                                chat_messages: []
                                            });
                                    }
                                    else{

                                        var test =[]
                                        var msg = docs[0].messages
                                            msg.sort(function(a,b){
                                                return new Date(b.created_at) - new Date(a.created_at);
                                            });

                                            msg = msg.filter(o => !o.message.includes(topics) && !o.message.includes(title_vice))

                                            var delete_user = docs[0].delete_user

                                        if(delete_user.length > 0){
                                            var found = delete_user.find(o => String(o.user_id) === String(req.body.userid))
                                            
                                            if(typeof found === 'undefined'){
                                                    var unread_msgs = 0

                                                if(String(docs[0].userid) == String(req.body.userid)){

                                                        var found = []

                                                        if(docs[0].userid_read != null){
                                                            found = msg.filter(o => new Date(o.created_at) > docs[0].userid_read && String(o.user._id) != String(req.body.userid))
                                                        }

                                                        if(found.length > 0){
                                                            unread_msgs = found.length
                                                            msg = found
                                                        }
                                                    }
                                                    else{

                                                        var found =[]

                                                        if(docs[0].memberid_read != null){
                                                            found = msg.filter(o => new Date(o.created_at) > docs[0].memberid_read && String(o.user._id) != String(req.body.userid))
                                                        }
                                                        
                                                        if(found.length > 0){
                                                            unread_msgs = found.length
                                                            msg = found
                                                        }
                                                    }

                                                    msg.map(doc =>{
                                                        
                                                        var userid =""
                                                        var username = ""
                                                        var profileimage =""
                                                        var fullname =""
                                                        var mobile = ""

                                                        userid =  doc.user._id
                                                        profileimage =  doc.user.profileimage;
                                                        if( doc.user.profileimage === null){
                                                            profileimage = "uploads/userimage.png"
                                                        }

                                                        var foe ={}
                                                        var contact = ""
                                                        if(String(req.body.userid) === String(docs[0].userid)){
                                                            contact = docs[0].memberid
                                                        }
                                                        else{
                                                            contact = docs[0].userid
                                                        }

                                                         var indiaTime = new Date(doc.created_at).toLocaleString("en-US", {timeZone: "Asia/Kolkata"});
                                                                indiaTime = new Date(indiaTime);
                                                                indiaTime =  Date.parse(indiaTime)


                                                            if(String(userid) === String(docs[0].userid)){

                                                                foe ={
                                                                    "receiverUserId":docs[0].memberid,
                                                                    "senderUserId":userid,
                                                                    "chatId":contact,
                                                                    "profileImg":"",
                                                                    "msg":doc.message,
                                                                    'msgId': doc.msg_id,
                                                                    "created_at":indiaTime
                                                                }
                                                            }
                                                            else{
                                                                foe ={
                                                                    "receiverUserId":docs[0].userid,
                                                                    "senderUserId":userid,
                                                                    "chatId":contact,
                                                                    "profileImg":"",
                                                                    "msg":doc.message,
                                                                    'msgId': doc.msg_id,
                                                                    "created_at":indiaTime
                                                                }
                                                            }

                                                        test.push(foe)
                                                    })

                                                 //   test.reverse()

                                                res.status(200).json({ 
                                                    status: 'Ok',
                                                    message:'list of messages',
                                                    total_messages:test.length,
                                                    userid:req.body.userid,
                                                    chat_messages: test
                                                });
                                            }
                                            else{
                                                    var deleted_at = found.deleted_at
                                                    msg = msg.filter(o => o.created_at > deleted_at)
                                                    var unread_msgs = 0

                                                    if(String(docs[0].userid) == String(req.body.userid)){

                                                        var found = []

                                                        if(docs[0].userid_read != null){
                                                            found = msg.filter(o => new Date(o.created_at) > docs[0].userid_read && String(o.user._id) != String(req.body.userid))
                                                        }

                                                        if(found.length > 0){
                                                            unread_msgs = found.length
                                                            msg = found
                                                        }
                                                    }
                                                    else{

                                                        var found =[]

                                                        if(docs[0].memberid_read != null){
                                                            found = msg.filter(o => new Date(o.created_at) > docs[0].memberid_read && String(o.user._id) != String(req.body.userid))
                                                        }
                                                        
                                                        if(found.length > 0){
                                                            unread_msgs = found.length
                                                            msg = found
                                                        }
                                                    }

                                            msg.map(doc =>{
                                                
                                                var userid =""
                                                var username = ""
                                                var profileimage =""
                                                var fullname =""
                                                var mobile = ""

                                                        userid =  doc.user._id
                                                        profileimage =  doc.user.profileimage;
                                                        if( doc.user.profileimage === null){
                                                            profileimage = "uploads/userimage.png"
                                                        }

                                                var foe ={}
                                                var contact = ""
                                                if(String(req.body.userid) === String(docs[0].userid)){
                                                    contact = docs[0].memberid
                                                }
                                                else{
                                                    contact = docs[0].userid
                                                }
                                                var indiaTime = new Date(doc.created_at).toLocaleString("en-US", {timeZone: "Asia/Kolkata"});
                                                                indiaTime = new Date(indiaTime);
                                                                 indiaTime =  Date.parse(indiaTime)


                                                    if(String(userid) === String(docs[0].userid)){

                                                        foe ={
                                                            "receiverUserId":docs[0].memberid,
                                                            "senderUserId":userid,
                                                            "chatId":contact,
                                                            "profileImg":"",
                                                            "msg":doc.message,
                                                            'msgId': doc.msg_id,
                                                            "created_at":indiaTime
                                                        }
                                                    }
                                                    else{
                                                        foe ={
                                                            "receiverUserId":docs[0].userid,
                                                            "senderUserId":userid,
                                                            "chatId":contact,
                                                            "profileImg":"",
                                                            "msg":doc.message,
                                                            'msgId': doc.msg_id,
                                                            "created_at":indiaTime
                                                        }
                                                    }

                                                test.push(foe)
                                            })

                                                 //   test.reverse()

                                            res.status(200).json({ 
                                                    status: 'Ok',
                                                    message:'list of messages',
                                                    total_messages:test.length,
                                                    userid:req.body.userid,
                                                    chat_messages: test
                                                });
                                            }

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


module.exports = router;

