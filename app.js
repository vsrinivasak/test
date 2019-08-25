const express = require("express");
const app = express();
const morgan = require("morgan");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const requestIp = require('request-ip');
const proxy = require('http-proxy-middleware');

const businessRoutes = require("./api/routes/business");
const businessProfileRoutes = require("./api/routes/businessProfile");
const adsTypeRoutes = require("./api/routes/adstype");
const adsPreferencesRoutes = require("./api/routes/adspreferences");
const countrypriceRoutes = require("./api/routes/countryprice");
const statespriceRoutes = require("./api/routes/statesprice");
const citiespriceRoutes = require("./api/routes/citiesprice");
const arealocalitypriceRoutes = require("./api/routes/arealocalityprice");

const bspostRoutes = require("./api/routes/bspost");

const countrylistRoutes = require("./api/routes/countrylist");
const stateslistRoutes = require("./api/routes/stateslist");
const citieslistRoutes = require("./api/routes/citieslist");
const arealocalitylistRoutes = require("./api/routes/arealocalitylist");
const agelistRoutes = require("./api/routes/agelist");
const professionlistRoutes = require("./api/routes/professionlist");
const genderlistRoutes = require("./api/routes/genderlist");
const agelistpriceRoutes = require("./api/routes/agelistprice");
const professionlistpriceRoutes = require("./api/routes/professionlistprice");
const genderlistpriceRouts = require("./api/routes/genderlistprice");
const adspriceverificationRouts = require("./api/routes/adspriceverification");
const reviewQuestionPriceRouts = require("./api/routes/reviewQuestionPrice");

const userRoutes = require('./api/routes/user');
const passwordRoutes = require('./api/routes/password');
const contentRoutes = require('./api/routes/content');
const offerRoutes = require('./api/routes/offers');
const contactsRoutes = require('./api/routes/contacts');
const feedRoutes = require('./api/routes/feeds')
const searchRoutes = require('./api/routes/search')
const giftRoutes = require('./api/routes/gifts')
const userDetailsRoutes = require('./api/routes/userDetails')
const challengeRoutes = require('./api/routes/challenge')
const notificationRoutes = require('./api/routes/notifications')
const hobbiesRoutes = require('./api/routes/interests')
const messageRoutes = require('./api/routes/messages')
const soundRoutes = require('./api/routes/sounds')
const staticFeedsRoutes = require('./api/routes/staticfeeds');
const winston = require('./winston')
const mqtt     = require('mqtt');
const messages = require("./api/models/iv_message");
const UsersModel = require("./api/models/user");
const notificationModel = require("./api/models/notifications");
const FCM = require('fcm-node');
const fcmModel = require("./api/models/fcmtoken");
const constants = require("./api/constants/constants");
//const compressRoutes = require('./api/routes/compression')

const namespace = process.env.MQTT_NAMESPACE || '\#';
const hostname  = process.env.MQTT_HOSTNAME  || '13.233.154.164';
const mqtt_port      = process.env.MQTT_PORT      || 1883;
const collectiony = require('./api/models/iv_message')
const ObjectId = require('mongodb').ObjectID;

const mqttUri  = 'tcp://' + hostname + ':' + mqtt_port;
	const client   = mqtt.connect(mqttUri,{
        username: "ivica",
        password: "ivica"
    });
	client.on('connect', function (data) {
   client.subscribe(namespace);
});


//const getBusinessRoutes = require("./api/routes/getBusiness");
/*app.use((req, res, next) => {
	res.status(200).json({
		message: 'It works!'
	});
  
});*/

mongoose.connect('mongodb://52.66.235.10:27017/testserver',{ useNewUrlParser: true }, function(err,data){


    client.on('message', function (topic,message) {
      console.log(message.toString())
      //console.log(topic)
      //console.log(clientid)
          var topics = topic.toString()
          var title = String(topic).split("-")
          var sender = title[1]
          var rec = title[0]
          var title_vice = sender+"-"+rec
          var mes = message.toString()
          var msg_id = "msg-id-"+sender+ Math.floor(100000000000000 + Math.random() * 900000000000000);

          collectiony.find({$or:[{topic: topics },{topic: title_vice}]})
                      .exec()
                      .then(docs =>{
                          if(docs.length <1){
                            if(!mes.includes(topics) && !mes.includes(title_vice)){

                              var colls = new collectiony({
                                  _id:new mongoose.Types.ObjectId(),
                                  topic:topics,
                                  userid: ObjectId(rec),
                                  memberid: ObjectId(sender),
                                  messages:[{
                                      user:ObjectId(sender),
                                      message: mes,
                                      created_at: Date.now(),
                                      msg_id: msg_id
                                  }],
                                  user_offline:[rec]
                              })

                              colls.save()
                                    .then(docy =>{

                                        UsersModel.find({_id:ObjectId(sender)})
                                          .exec()
                                          .then(doc => {
                                              var username = doc[0].username
                                              var profileimage = doc[0].profileimage
                                               notificationModel.aggregate([
                                                                                                {$match: {userid: ObjectId(rec)}},
                                                                                                {$unwind: "$notifications"},
                                                                                                {
                                                                                                    $match: {
                                                                                                        $and: [{"notifications.notification_type": 'new_message'},
                                                                                                            {
                                                                                                                "notifications.view_status": false
                                                                                                            }]
                                                                                                    }
                                                                                                },
                                                                                                {
                                                                                                    $group: {
                                                                                                        _id: "$notifications.username",
                                                                                                        notifications: {$addToSet: {msg_count:"$notifications.msg_count", total_notes:"$notifications"}},
                                                                                                        count: {$sum: 1}
                                                                                                    }
                                                                                                }
                                                                                            ])
                                                                                                .exec()
                                                                                                .then(orange => {
                                                                                                  //console.log(orange)
                                                                                                  var notify_names = []
                                                                                                      var msg_count = 1
                                                                                                      var total_messages = 1
                                                                                                      var total_chats = 1

                                                                                                    if (orange.length > 0) {

                                                                                                      orange.map(ress =>{
                                                                                                            notify_names.push({'name':ress._id,
                                                                                                                                'msg_count':ress.notifications[0].msg_count})
                                                                                                            total_messages = total_messages +ress.notifications[0].msg_count
                                                                                                            
                                                                                                            var notify_ids = []
                                                                                                            var notify_dates = []

                                                                                                            var user_notify = []
                                                                                                            user_notify.push(ress.notifications[0].total_notes)

                                                                                                            if(username == ress._id){
                                                                                                              msg_count = parseInt(msg_count)+parseInt(ress.notifications[0].msg_count)
                                                                                                              var notifications = ress.notifications[0].total_notes

                                                                                                                    notify_ids.push(ObjectId(notifications._id))
                                                                                                                

                                                                                                                notificationModel.findOneAndUpdate({userid: ObjectId(ele)},
                                                                                                                    {$pull: {notifications: {_id: {$in: notify_ids}}}})
                                                                                                                    .exec()
                                                                                                              
                                                                                                            }
                                                                                                      })
                                                                                                    }

                                                                                                            var msgbody = ""
                                                                                                            //console.log(notify_names)

                                                                                                            if(typeof notify_names === 'undefined'){
                                                                                                              msgbody = "New message from "+username
                                                                                                                      total_chats = total_chats
                                                                                                            }
                                                                                                            else{
                                                                                                                if (notify_names.length === 1) {
                                                                                                                  if (String(username) === String(notify_names[0].name)) {
                                                                                                                      msgbody = "New message from "+username
                                                                                                                      total_chats = total_chats
                                                                                                                  } else {
                                                                                                                      var tex = notify_names.length - 1
                                                                                                                      if (notify_names.length == 1 && username != notify_names[0].name) {
                                                                                                                          msgbody = "New message from "+username +"\n"+ "New message from "+notify_names[0].name
                                                                                                                          total_chats = total_chats+1
                                                                                                                      } else {
                                                                                                                          if (notify_names.length == 0 || notify_names.length == 1 && username == notify_names[0].name) {
                                                                                                                              msgbody = "New message from "+username
                                                                                                                              total_chats = total_chats

                                                                                                                              
                                                                                                                          } else {
                                                                                                                              msgbody = "New message from "+username
                                                                                                                              for(var i= 0; i<notify_names.length; i++){

                                                                                                                                if(username != notify_names[i].name){
                                                                                                                                  msgbody = msgbody + "\nNew message from "+notify_names[i].name
                                                                                                                                  total_chats = total_chats + 1
                                                                                                                                }
                                                                                                                              }
                                                                                                                          }

                                                                                                                      }

                                                                                                                  }
                                                                                                              } else {
                                                                                                                  var tex = notify_names.length - 1
                                                                                                                  if (notify_names.length == 1 && username != notify_names[0].name) {
                                                                                                                      msgbody = "New message from "+username +"\n"+ "New message from "+notify_names[0].name
                                                                                                                      total_chats = total_chats + 1
                                                                                                                  } else {
                                                                                                                      if (notify_names.length == 0 || notify_names.length == 1 && username == notify_names[0].name) {
                                                                                                                          msgbody = "New message from "+username
                                                                                                                          total_chats = total_chats
                                                                                                                      } else {
                                                                                                                              msgbody = "New message from "+username
                                                                                                                              for(var i= 0; i<notify_names.length; i++){

                                                                                                                                if(username != notify_names[i].name){
                                                                                                                                  msgbody = msgbody + "\nNew message from "+notify_names[i].name
                                                                                                                                  total_chats = total_chats + 1
                                                                                                                                }
                                                                                                                              }
                                                                                                                          }

                                                                                                                  }
                                                                                                              }
                                                                                                            }

                                                                                                            

                                                                                                            const note_no = Math.floor(10000 + Math.random() * 90000);
                                                                                                            var msgs = "New message from "+username+"\n"+mes
                                                                                                             notificationModel.findOneAndUpdate({userid:ObjectId(rec)},
                                                                                                                                      {$push:{notifications:{
                                                                                                                                        notification_data: msgs,
                                                                                                                                        member_id: rec,
                                                                                                                                        notification_type: 'new_message',
                                                                                                                                        notification_number:note_no,
                                                                                                                                        username:username,
                                                                                                                                        item_id: sender,
                                                                                                                                        sender:ObjectId(sender),
                                                                                                                                        title:topics,
                                                                                                                                        msg_id: msg_id,
                                                                                                                                        msg_count: parseInt(msg_count),
                                                                                                                                        msg_created_at:Date.now(),
                                                                                                                                        msg: mes,
                                                                                                                                        profileimage:ObjectId(sender),
                                                                                                                                        created_at:Date.now()
                                                                                                                                      }}})
                                                                                                                            .exec()
                                                                                                                            .then(dasy =>{
                                                                                                                              fcmModel.find({userid : rec})       
                                                                                                                              .exec()
                                                                                                                              .then(user => { 
                                                                                                                                if (user.length < 1) {
                                                                                                                                    return res.status(200).json({
                                                                                                                                      status:"Failed",
                                                                                                                                      message:"Please provide correct userid."
                                                                                                                                    });
                                                                                                                                  } 
                                                                                                                                else {
                                                                                                                                    var serverKey = constants.FCMServerKey; 
                                                                                                                                    var fcm = new FCM(serverKey);
                                                                                                                                    var title_mas = ""

                                                                                                                                    if(total_messages == 1 || total_chats == 1){
                                                                                                                                      title_mas = ""
                                                                                                                                    }
                                                                                                                                    else{
                                                                                                                                       title_mas = total_messages+" messages from "+total_chats+" chats"
                                                                                                                                    }
                                                                                                                                    
                                                                                                                                    
                                                                                                                                    var message = { 
                                                                                                                                        to : user[0].fcmtoken,
                                                                                                                                        collapse_key: 'exit',
                                                                                                                                        
                                                                                                                                        notification: {
                                                                                                                                            title: title_mas, 
                                                                                                                                            body: msgbody,
                                                                                                                                            tag:"chat"
                                                                                                                                        } ,
                                                                                                                                        data : {
                                                                                                                                          notification_id : note_no,
                                                                                                                                          message: msgbody,
                                                                                                                                          notification_slug: 'new_message',
                                                                                                                                          url: constants.APIBASEURL+profileimage,
                                                                                                                                          username:username,
                                                                                                                                          item_id: sender,
                                                                                                                                          userid:"",
                                                                                                                                          feed_id:"",
                                                                                                                                          member_feed_id:"",
                                                                                                                                          sender:sender,
                                                                                                                                          msg: mes,
                                                                                                                                          msg_id: msg_id,
                                                                                                                                          msg_created_at: Date.now(),
                                                                                                                                          title:topics,
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
                                                                                                                                    
                                                                                                                                    fcm.send(message, function(err, response){
                                                                                                                                    });

                                                                                                                                    console.log("message sent")
                                                                                                                              }
                                                                                                                          }).catch(err => {
                                                                                                                              console.log(err)
                                                                                                                          });
                                                                                                         }).catch(err => {
                                                                                                              console.log(err)
                                                                                                         });

                                                                                                        
                                                                                                    
                                                                                                }).catch(err => {
                                                                                                  console.log(err)
                                                                                                // var spliterror = err.message.split(":")
                                                                                                // res.status(500).json({
                                                                                                //     status: 'Failed',
                                                                                                //     message: spliterror[0]
                                                                                                // });
                                                                                            });
                                              // const note_no = Math.floor(10000000000 + Math.random() * 90000000000)
                                              // var msgbody = "New message from "+username
                                              // notificationModel.findOneAndUpdate({userid:ObjectId(rec)},
                                              //                                         {$push:{notifications:{
                                              //                                           notification_data: msgbody,
                                              //                                           member_id: rec,
                                              //                                           notification_type: 'new_message',
                                              //                                           notification_number:note_no,
                                              //                                           username:username,
                                              //                                           item_id: sender,
                                              //                                           sender:ObjectId(sender),
                                              //                                           title:topics,
                                              //                                           msg_created_at:Date.now(),
                                              //                                           msg: mes,
                                              //                                           msg_count: 1,
                                              //                                           msg_id: msg_id,
                                              //                                           profileimage:ObjectId(sender),
                                              //                                           created_at:Date.now()
                                              //                                         }}})
                                              //                               .exec()
                                              //                               .then(dasy =>{
                                              //                                 fcmModel.find({userid : rec})       
                                              //                                 .exec()
                                              //                                 .then(user => { 
                                              //                                   if (user.length < 1) {
                                              //                                       return res.status(200).json({
                                              //                                         status:"Failed",
                                              //                                         message:"Please provide correct userid."
                                              //                                       });
                                              //                                     } 
                                              //                                   else {
                                              //                                       var serverKey = constants.FCMServerKey; 
                                              //                                       var fcm = new FCM(serverKey);
                                                                                 
                                              //                                       var message = { 
                                              //                                           to : user[0].fcmtoken,
                                              //                                           collapse_key: 'exit',
                                                                                        
                                              //                                           notification: {
                                              //                                               title: 'FvmeGear', 
                                              //                                               body: msgbody,
                                              //                                               tag :"chat"
                                              //                                           } ,
                                              //                                           data : {
                                              //                                             notification_id : note_no,
                                              //                                             message: msgbody,
                                              //                                             notification_slug: 'new_message',
                                              //                                             url: constants.APIBASEURL+profileimage,
                                              //                                             username:username,
                                              //                                             item_id: sender,
                                              //                                             userid:"",
                                              //                                             feed_id:"",
                                              //                                             sender:sender,
                                              //                                             msg: mes,
                                              //                                             msg_id: msg_id,
                                              //                                             msg_created_at: Date.now(),
                                              //                                             title:topics,
                                              //                                             member_feed_id:"",
                                              //                                             member_id:"",
                                              //                                             is_from_push:true
                                                                                      
                                              //                                           },
                                              //                                           android:{
                                              //                                             priority:"high"
                                              //                                           },
                                              //                                            webpush: {
                                              //                                             headers: {
                                              //                                               "Urgency": "high"
                                              //                                             }
                                              //                                           }
                                              //                                       };
                                                                                    
                                              //                                       fcm.send(message, function(err, response){
                                              //                                       });

                                              //                                       console.log("message sent")
                                              //                                 }
                                              //                             }).catch(err => {
                                              //                                 console.log(err)
                                              //                             });
                                                         // }).catch(err => {
                                                         //      console.log(err)
                                                         // });
                                          }).catch(err => {
                                              console.log(err)
                                          });

                                    }).catch(err => {
                                        console.log(err)
                                    });
                            }
                          }
                          else{
                            console.log("in else")
                                if(mes.includes(topics) || mes.includes(title_vice)){
                                      var text = mes.split('/')
                                      var user_offline = text[1]
                                      var is_offline = text[3]
                                      console.log(typeof is_offline)
                                      if(String(is_offline) === "1"){
                                          collectiony.find({topic:docs[0].topic})
                                                    .exec()
                                                    .then(dog => {
                                                        if(dog[0].user_offline.length > 0){
                                                            var user_found = dog[0].user_offline
                                                            var offline_found = user_found.find(o => String(o) === String(user_offline))

                                                            if(typeof offline_found != 'undefined'){
                                                                collectiony.findOneAndUpdate({topic:docs[0].topic},
                                                                  {$pullAll:{user_offline:[user_offline]}})
                                                                   .exec()
                                                                  }
                                                        }
                                                    })
                                           
                                      }
                                      else{
                                        collectiony.find({topic:docs[0].topic})
                                                    .exec()
                                                    .then(dog => {
                                                            if(dog[0].user_offline.length > 0){
                                                              var user_found = dog[0].user_offline
                                                              var offline_found = user_found.find(o => String(o) === String(user_offline))

                                                                if(typeof offline_found === 'undefined'){
                                                                  collectiony.findOneAndUpdate({topic:docs[0].topic},
                                                                  {$push:{user_offline:user_offline}})
                                                                   .exec()
                                                                  }

                                                            }
                                                            else{
                                                              collectiony.findOneAndUpdate({topic:docs[0].topic},
                                                                {$push:{user_offline:user_offline}})
                                                                 .exec()
                                                            }

                                                            if(String(docs[0].userid) === String(user_offline)){
                                                                userid_read = user_offline

                                                                collectiony.findOneAndUpdate({topic:docs[0].topic},
                                                                                            {$set:{userid_read:Date.now()}})
                                                                            .exec()

                                                            }
                                                            else{
                                                                memberid_read = user_offline
                                                                   collectiony.findOneAndUpdate({topic:docs[0].topic},
                                                                                            {$set:{memberid_read:Date.now()}})
                                                                            .exec()
                                                            }
                                                     })
                                      }

                                      
                                }
                                else{
                                  console.log("message loop")
                                      collectiony.findOneAndUpdate({topic:docs[0].topic},
                                                    {$push:{messages:{message:mes,
                                                            user:ObjectId(sender), created_at:Date.now(),msg_id:msg_id}}},{new:true})
                                            .exec()
                                            .then(dex =>{
                                                  console.log("done upate")
                                                  if(dex != null){
                                                      if(dex.user_offline.length > 0){
                                                        var offline = dex.user_offline
                                                        offline.forEach(function(ele){
                                                           UsersModel.find({_id:ObjectId(sender)})
                                                                     .exec()
                                                                     .then(docy => {
                                                                          var username = docy[0].username
                                                                          var profileimage = docy[0].profileimage

                                                                              notificationModel.aggregate([
                                                                                                {$match: {userid: ObjectId(ele)}},
                                                                                                {$unwind: "$notifications"},
                                                                                                {
                                                                                                    $match: {
                                                                                                        $and: [{"notifications.notification_type": 'new_message'},
                                                                                                            {
                                                                                                                "notifications.view_status": false
                                                                                                            }]
                                                                                                    }
                                                                                                },
                                                                                                {
                                                                                                    $group: {
                                                                                                        _id: "$notifications.username",
                                                                                                        notifications: {$addToSet: {msg_count:"$notifications.msg_count", total_notes:"$notifications"}},
                                                                                                        count: {$sum: 1}
                                                                                                    }
                                                                                                }
                                                                                            ])
                                                                                                .exec()
                                                                                                .then(orange => {
                                                                                                  //console.log(orange)
                                                                                                     var notify_names = []
                                                                                                      var msg_count = 1
                                                                                                      var total_messages = 1
                                                                                                      var total_chats = 1
                                                                                                    if (orange.length > 0) {

                                                                                                      orange.map(ress =>{
                                                                                                            notify_names.push({'name':ress._id,
                                                                                                                                'msg_count':ress.notifications[0].msg_count})
                                                                                                            total_messages = total_messages +ress.notifications[0].msg_count
                                                                                                            
                                                                                                            var notify_ids = []
                                                                                                            var notify_dates = []

                                                                                                            if(username == ress._id){
                                                                                                              msg_count = parseInt(msg_count)+parseInt(ress.notifications[0].msg_count)
                                                                                                              var notifications = ress.notifications[0].total_notes

                                                                                                                    notify_ids.push(ObjectId(notifications._id))
                                                                                                                

                                                                                                                notificationModel.findOneAndUpdate({userid: ObjectId(ele)},
                                                                                                                    {$pull: {notifications: {_id: {$in: notify_ids}}}})
                                                                                                                    .exec()
                                                                                                              
                                                                                                            }
                                                                                                      })
                                                                                                    }

                                                                                                            var msgbody = ""
                                                                                                            //console.log(notify_names)

                                                                                                            if(typeof notify_names === 'undefined'){
                                                                                                              msgbody = "New message from "+username
                                                                                                                      total_chats = total_chats
                                                                                                            }
                                                                                                            else{
                                                                                                                if (notify_names.length === 1) {
                                                                                                                  if (String(username) === String(notify_names[0].name)) {
                                                                                                                      msgbody = "New message from "+username
                                                                                                                      total_chats = total_chats
                                                                                                                  } else {
                                                                                                                      var tex = notify_names.length - 1
                                                                                                                      if (notify_names.length == 1 && username != notify_names[0].name) {
                                                                                                                          msgbody = "New message from "+username +"\n"+ "New message from "+notify_names[0].name
                                                                                                                          total_chats = total_chats+1
                                                                                                                      } else {
                                                                                                                          if (notify_names.length == 0 || notify_names.length == 1 && username == notify_names[0].name) {
                                                                                                                              msgbody = "New message from "+username
                                                                                                                              total_chats = total_chats

                                                                                                                              
                                                                                                                          } else {
                                                                                                                              msgbody = "New message from "+username
                                                                                                                              for(var i= 0; i<notify_names.length; i++){

                                                                                                                                if(username != notify_names[i].name){
                                                                                                                                  msgbody = msgbody + "\nNew message from "+notify_names[i].name
                                                                                                                                  total_chats = total_chats + 1
                                                                                                                                }
                                                                                                                              }
                                                                                                                          }

                                                                                                                      }

                                                                                                                  }
                                                                                                              } else {
                                                                                                                  var tex = notify_names.length - 1
                                                                                                                  if (notify_names.length == 1 && username != notify_names[0].name) {
                                                                                                                      msgbody = "New message from "+username +"\n"+ "New message from "+notify_names[0].name
                                                                                                                      total_chats = total_chats + 1
                                                                                                                  } else {
                                                                                                                      if (notify_names.length == 0 || notify_names.length == 1 && username == notify_names[0].name) {
                                                                                                                          msgbody = "New message from "+username
                                                                                                                          total_chats = total_chats
                                                                                                                          
                                                                                                                      } else {
                                                                                                                              msgbody = "New message from "+username
                                                                                                                              for(var i= 0; i<notify_names.length; i++){

                                                                                                                                if(username != notify_names[i].name){
                                                                                                                                  msgbody = msgbody + "\nNew message from "+notify_names[i].name
                                                                                                                                  total_chats = total_chats + 1
                                                                                                                                }
                                                                                                                              }
                                                                                                                          }

                                                                                                                  }
                                                                                                              }
                                                                                                            }

                                                                                                            

                                                                                                            const note_no = Math.floor(10000 + Math.random() * 90000);
                                                                                                            var msgs = "New message from "+username+"\n"+mes
                                                                                                             notificationModel.findOneAndUpdate({userid:ObjectId(ele)},
                                                                                                                                      {$push:{notifications:{
                                                                                                                                        notification_data: msgs,
                                                                                                                                        member_id: rec,
                                                                                                                                        notification_type: 'new_message',
                                                                                                                                        notification_number:note_no,
                                                                                                                                        username:username,
                                                                                                                                        item_id: sender,
                                                                                                                                        sender:ObjectId(sender),
                                                                                                                                        title:topics,
                                                                                                                                        msg_id: msg_id,
                                                                                                                                        msg_count: parseInt(msg_count),
                                                                                                                                        msg_created_at:Date.now(),
                                                                                                                                        msg: mes,
                                                                                                                                        profileimage:ObjectId(sender),
                                                                                                                                        created_at:Date.now()
                                                                                                                                      }}})
                                                                                                                            .exec()
                                                                                                                            .then(dasy =>{
                                                                                                                              fcmModel.find({userid : ele})       
                                                                                                                              .exec()
                                                                                                                              .then(user => { 
                                                                                                                                if (user.length < 1) {
                                                                                                                                    return res.status(200).json({
                                                                                                                                      status:"Failed",
                                                                                                                                      message:"Please provide correct userid."
                                                                                                                                    });
                                                                                                                                  } 
                                                                                                                                else {
                                                                                                                                    var serverKey = constants.FCMServerKey; 
                                                                                                                                    var fcm = new FCM(serverKey);
                                                                                                                                    if(total_messages == 1 || total_chats == 1){
                                                                                                                                      title_mas = ""
                                                                                                                                    }
                                                                                                                                    else{
                                                                                                                                       title_mas = total_messages+" messages from "+total_chats+" chats"
                                                                                                                                    }

                                                                                                                                    var message = { 
                                                                                                                                        to : user[0].fcmtoken,
                                                                                                                                        collapse_key: 'exit',
                                                                                                                                        
                                                                                                                                        notification: {
                                                                                                                                            title: title_mas, 
                                                                                                                                            body: msgbody,
                                                                                                                                            tag:"chat"
                                                                                                                                        } ,
                                                                                                                                        data : {
                                                                                                                                          notification_id : note_no,
                                                                                                                                          message: msgbody,
                                                                                                                                          notification_slug: 'new_message',
                                                                                                                                          url: constants.APIBASEURL+profileimage,
                                                                                                                                          username:username,
                                                                                                                                          item_id: sender,
                                                                                                                                          userid:"",
                                                                                                                                          feed_id:"",
                                                                                                                                          member_feed_id:"",
                                                                                                                                          sender:sender,
                                                                                                                                          msg: mes,
                                                                                                                                          msg_id: msg_id,
                                                                                                                                          msg_created_at: Date.now(),
                                                                                                                                          title:topics,
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
                                                                                                                                    
                                                                                                                                    fcm.send(message, function(err, response){
                                                                                                                                    });

                                                                                                                                    console.log("message sent")
                                                                                                                              }
                                                                                                                          }).catch(err => {
                                                                                                                              console.log(err)
                                                                                                                          });
                                                                                                         }).catch(err => {
                                                                                                              console.log(err)
                                                                                                         });

                                                                                                        
                                                                                                    
                                                                                                }).catch(err => {
                                                                                                  console.log(err)
                                                                                                // var spliterror = err.message.split(":")
                                                                                                // res.status(500).json({
                                                                                                //     status: 'Failed',
                                                                                                //     message: spliterror[0]
                                                                                                // });
                                                                                            });
                                                                          
                                                                
                                                                                          
                                                                                
                                                               }).catch(err => {
                                                                   console.log(err)
                                                               });     
                                                        })
                                                      }
                                                  }
                                             }).catch(err => {
                                                  console.log(err)
                                              });
                                }
                              }
                      }).catch(err => {
                          console.log(err)
                      });


    });
});

mongoose.Promise = global.Promise;

app.use("/compression",proxy({              //setup proxy to redirect all '/api' requests
  target: 'http://52.66.219.233:8080',
  changeOrigin: true
}))

app.use(morgan('combined', { stream: winston.stream }));
//app.use(morgan("dev"));
app.use('/uploads', express.static('uploads'));
app.use('/uplad_business_ads', express.static('uplad_business_ads'));
app.use('/business_posts', express.static('business_posts'));
app.use('/feeds_files', express.static('feeds_files'));
app.use('/feeds_files_comprs', express.static('feeds_files_comprs'));
app.use('/thumbnail', express.static('thumbnail'));
app.use('/thumbnails', express.static('thumbnails'));
app.use('/uploads_comprs', express.static('uploads_comprs'));
app.use('/sounds', express.static('sounds'));
app.use('/watermark', express.static('watermark'));
app.use('/Nanonets', express.static('Nanonets'));
app.use('/static_feed_files', express.static('static_feed_files'));
app.use('/static_feeds_files_comprs', express.static('static_feeds_files_comprs'));
app.use('/static_thumbnails', express.static('static_thumbnails'));
app.use('/static_files', express.static('static_files'));
app.use('/static_output', express.static('static_output'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(bodyParser.json({limit: '4000mb'}));
app.use(bodyParser.urlencoded({limit: '4000mb', extended: false}));
/*
app.use((req, res, next) => {
  res.status(200).json({
	  message: 'It works'
  });
});
*/
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
    return res.status(200).json({});
  }
  next();
});

// Routes which should handle requests
app.use("/Business", businessRoutes);
app.use("/BusinessProfile", businessProfileRoutes);
//app.use("/listOfBusiness", businessRoutes);
app.use("/businessAds", adsTypeRoutes);
app.use("/preferencesAds", adsPreferencesRoutes);
app.use("/country", countrylistRoutes);

app.use("/state", stateslistRoutes);
app.use("/cities", citieslistRoutes);
app.use("/locality", arealocalitylistRoutes);
app.use("/businessPost", bspostRoutes);
app.use("/age", agelistRoutes);
app.use("/profession", professionlistRoutes);
app.use("/gender", genderlistRoutes);

/* Prices */
app.use("/countryPrice", countrypriceRoutes);
app.use("/statePrice", statespriceRoutes);
app.use("/citiesPrice", citiespriceRoutes);
app.use("/localityPrice", arealocalitypriceRoutes);
app.use("/ageWisePrice", agelistpriceRoutes);
app.use("/professionPrice",professionlistpriceRoutes);
app.use("/genderPrice", genderlistpriceRouts);
app.use("/adsprice", adspriceverificationRouts);
app.use("/review", reviewQuestionPriceRouts);

app.use("/user", userRoutes);
app.use("/password", passwordRoutes);
app.use("/content", contentRoutes);
app.use("/offers", offerRoutes);
app.use("/contacts", contactsRoutes);
app.use("/feeds", feedRoutes);
app.use("/search", searchRoutes);
app.use("/userdetails",userDetailsRoutes);
app.use("/challenge",challengeRoutes);
app.use("/notifications",notificationRoutes);
app.use("/hobbies",hobbiesRoutes);
app.use("/chat",messageRoutes);
app.use("/trending",giftRoutes);
app.use("/sounds",soundRoutes);
app.use("/staticfeeds",staticFeedsRoutes);
app.use("/%20offers", offerRoutes);

//app.use("/compression",compressRoutes);



/* End Prices */

//app.use("/getBusinessProfiles/:iv_acountid", businessRoutes);

app.use((req, res, next) => {
  const error = new Error("FvmeGear Not found");
   const clientIp = requestIp.getClientIp(req); 
   console.log(clientIp);
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  res.status(error.status || 500);
  //winston.error(`${error.status || 500} - ${error.stack} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  res.json({
    error: {
      message: error.message
    }
  });
});

/*app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message
    }
  });
});*/

module.exports = app;
/*var mongoose = require('mongoose');
var db = mongoose.createConnection('mongodb://127.0.0.1:27017/ivicatech_business');
db.on('error', function (err) {
console.log('connection error', err);
});
db.once('open', function () {
console.log('connected.');
});

// create a schema
var businessprofileSchema = mongoose.Schema({
iv_acountid: Number,
bus_prof_name: String,
bus_prof_location: String,
bus_prof_mobile: Number,
bus_prof_email: String,
bus_prof_gst: String,
bus_prof_pan: String,
bus_prof_typeofbusiness: String,
bus_prof_menu: String,
bus_prof_create:{ type: Date, default: Date.now },
bus_prof_update: Date
});

// we need to create a business_profile model using it
var business_profile = db.model('business_profile', businessprofileSchema,'business_profile');


var express = require("express");
var cors = require("cors");
var app = express();
var http = require('http');
app.use(express.static('./'));

app.listen(3699, function(){
    console.log('listening on port 3699')
})
//var router = express.Router();
var session = require("express-session");

var bodyParser = require('body-parser');
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(cors());
*/

/*
var business_profileSave = new business_profile({
iv_acountid: 12345,
bus_prof_name: 'Hema',
bus_prof_location: 'Hyderabad',
bus_prof_mobile: 7993874286,
bus_prof_email: 'vsrinivasa.rk@gmail.com',
bus_prof_gst: '123wer234',
bus_prof_pan: 'CAPGK1',
bus_prof_typeofbusiness: 'feed',
bus_prof_menu: 'Menu'
});

business_profileSave.save(function (err,data){
console.log(data);
});
*/

/* Create Business Profile API */

// Create Api for Book
/*
app.post('/createBusinessProfile/add', function(req,res) {
	//:bookName/:quantity/:branch/:author
	//res.send(req.body);
	     if(req.body.forfactor) {
			 console.log(req.body.forfactor);
		 } else {
			 console.log('No form factor');
		 }
		 
		 var iv_acountid = req.body.iv_acountid;
		 var bussiness_name = req.body.bussiness_name;
		 var bussiness_location = req.body.bussiness_location;
		 var bussiness_mobile = req.body.bussiness_mobile;
		 var bussiness_email = req.body.bussiness_email;
		 var bussiness_gst = req.body.bussiness_gst;
		 var bussiness_pancard = req.body.bussiness_pancard;
		 var bussiness_menu = req.body.bussiness_menu;
		 
		 //var date = req.params.date;
		 
		 var newBusiness_profileSave = new business_profileSave();
		 
		 //newBook.bookName = bookName;
		 newBusiness_profileSave.iv_acountid = iv_acountid;
		 newBusiness_profileSave.bussiness_name = bussiness_name;
		 newBusiness_profileSave.bussiness_location = bussiness_location;
		 newBusiness_profileSave.bussiness_mobile = bussiness_mobile;
		 newBusiness_profileSave.bussiness_email = bussiness_email;
		 newBusiness_profileSave.bussiness_gst = bussiness_gst;
		 newBusiness_profileSave.bussiness_pancard = bussiness_pancard;
		 newBusiness_profileSave.bussiness_menu = bussiness_menu;
		 //newBook.date = new Date();
		 
		 newBusiness_profileSave.save(function(err, saveBsProfile) {
			 if(err) {
				 console.log(err);
				 res.status(500).send();
			 } else {
				 
				 res.send(saveBsProfile);
			 }
		 })
});
*/
/* End API for Create Business Profile API */
/*
// create a schema
var userSchema = mongoose.Schema({
firstname: String,
lastname: String
});
// we need to create a model using it
var User = db.model('User', userSchema);
var u1 = new User({
firstname: 'Manish',
lastname: 'Prakash',
});
u1.save(function (err,data){
console.log(data);
});

var mongoose = require('mongoose');
 
mongoose.connect('mongodb://127.0.0.1:27017/kvsr	', function (err) {
 
   if (err) throw err;
 
   console.log('Successfully connected');
 
});
var mongoose = require('mongoose');
var conn = mongoose.createConnection('mongodb://localhost/admin');

    if (conn) {
		console.log("successfully connected to the database");
        
    } else {
        console.log("doesn't connected DB");
    }
   */