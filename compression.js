const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const isEmpty = require('is-empty');
const math = require('mathjs');
const multer = require('multer');
/* Video Thumb Image */
const imagemin = require('imagemin');
const pngquant = require('imagemin-pngquant');
const mozjpeg = require('imagemin-mozjpeg');
const notificationModel = require("../models/notifications");
var image_moderation = require('image-moderation');
/* Multiply ScreenShots */
var mkdirp = require("mkdirp");
var rimraf = require("rimraf");
var countFiles = require('count-files')
var unique = require('array-unique');
var request = require("request");

const tinify = require("tinify");
tinify.key = "r4d9YGRXk7SqjRxSGHvLf8KscFphqxP8";
const fs = require("fs");
var Jimp = require('jimp');
var randtoken = require('rand-token');
const compress_images = require('compress-images');
const ffprobe = require('ffprobe')
const ffprobePath  = require('@ffprobe-installer/ffprobe').path;
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmScreen = require('fluent-ffmpeg');
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);
var path = require('path');// Default node module
const ThumbnailGenerator = require('video-thumbnail-generator').default;
// const ThumbnailGenerator = require('video-thumbnail-generator').default;
const FCM = require('fcm-node');
const fcmModel = require("../models/fcmtoken");
var command = ffmpeg();
var spawn = require('child_process').spawn;
/* Video Thumb Image */

/* nudity*/
var nudity = require('nudity');

/* nudity*/
const constants = require("../constants/constants");
const authModel = require("../models/auth");
const iv_feeds = require("../models/iv_feeds");
const User = require("../models/user");
const UserMdl = require("../models/user");
var dateTime = require('node-datetime');
var dt = dateTime.create();
const bsOffers = require("../models/bsOffers");
const estimateadsprice = require("../models/estimateadsprice");
const FsEstimateadsprice = require("../models/estimateadsprice");
const BupAdsEstimateadsprice = require("../models/estimateadsprice");
const BupAdsEstimateadspriceList = require("../models/estimateadsprice");
const businessGenderList = require("../models/genderlist");
const agelist = require("../models/agelist");
const feedtags = require("../models/feedtag");
const contactsModel = require("../models/contacts");
const userDetails = require("../models/userDetails");
const countrylist = require("../models/countrylist");
const stateslist = require("../models/stateslist");
const citieslist = require("../models/citieslist");
const arealocalitylist = require("../models/arealocalitylist");
const adsManagement = require("../models/adsManagement");

const scpFile = require('scp2')
var geocoding = new require('reverse-geocoding');
 //5000

const googleMapsClient = require('@google/maps').createClient({
  key: 'AIzaSyCejxweMt1zcWCYIqEqqYdGkttnFqMj30Y'
});

//999
/*
const googleMapsClient = require('@google/maps').createClient({
  key: 'AIzaSyBDo_8AJAdFzK1fKScPgxRQ7pbyIHqtkg4'
});
*/

var isodate = require("isodate");
var moment = require("moment");
const ObjectId = require('mongodb').ObjectID;

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './uploads/');
  },
  filename: function(req, file, cb) {
    var FileName = String(file.originalname).replace(/ /g,"");
    cb(null, new Date().toISOString() + FileName);
  }
});
var FtokenPng = randtoken.generate(10);
const storage2 = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './feeds_files/');
  },
  filename: function(req, file, cb) {

    var FileName = String(file.originalname).replace(/ /g,"");
    cb(null, new Date().toISOString()+FileName);
  }
});

const fileFilter = (req, file, cb) => {
  // reject a file
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 4000
  },
 // fileFilter: fileFilter
});

const upload2 = multer({
  storage: storage2,
  limits: {
    fileSize: 1024 * 1024 * 4000
  },
 // fileFilter: fileFilter
});

router.put("/editprofile",upload.any(), (req, res, next) => {

  var keyArray = ["fullname", "userid", "iv_token", "clientid"];
  var key = Object.keys(req.body);
  var inputcover = "";
  var inputprofile = "";

    if(key.indexOf("coverimage")>=0){
      inputcover = req.body.coverimage;
      keyArray.push("coverimage");
    }
    if(key.indexOf("profileimage")>=0){
      inputprofile = req.body.profileimage;
      keyArray.push("profileimage");
    }

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

              if(req.files.length === 0){
                    inputcover = "";
                    inputprofile = "";
              }

              for(var i=0; i<req.files.length; i++){
                if (req.files[i].fieldname === 'coverimage'){
                    inputcover = req.files[i]['path'];
                    if(inputcover.includes(constants.APIBASEURL)){
                        var splitcover = inputcover.split(constants.APIBASEURL);
                        inputcover = splitcover[1];
                    }
                }
                else if (req.files[i].fieldname === 'profileimage'){
                    inputprofile = req.files[i]['filename'];
                    if(inputprofile.includes(constants.APIBASEURL)){
                        var splitprofile = inputprofile.split(constants.APIBASEURL);
                        inputprofile = splitprofile[1];
                    }
                    var INPUT_path_to_your_images, OUTPUT_path;
                    var FeedFileSPath;
                    var tokenPng = randtoken.generate(9);
                    var VideoThumBanameRandom = new Date().toISOString()+tokenPng+'xhdpi-atseconds.jpg';

                var SplitFileName = req.files[0]['originalname'].split('.');
                var VideoThumBaname = String(SplitFileName[0]).replace(/ /g,"");


                          if(SplitFileName[1] == 'png' || SplitFileName[1] == 'PNG' )
                          {

                              var VideoPngThumBaname = VideoThumBaname+tokenPng;
                              var PngFileName = 'uploads/'+req.files[i]['filename'];

                                  Jimp.read(PngFileName, (err, lenna) => {

                                  if (err) throw err;
                                  lenna
                                  //.resize(256, 256) // resize
                                  .quality(50) // set JPEG quality
                                  //.greyscale() // set greyscale
                                  .write("uploads/"+VideoPngThumBaname+".jpeg"); // save

                                                                    FeedFileSPath ="uploads/"+VideoPngThumBaname+".jpeg";
                                       scpFile.scp(FeedFileSPath, {
                                              host: '13.232.245.216',
                                              port:'22',
                                              username: 'ubuntu',
                                              password: 'feedget@9999',
                                              path: '/home/ubuntu/fvmeGear_FeedGet/uploads/'
                                          }, function(err) {
                                            if(err)

                                              fs.unlink(FeedFileSPath, (err) => {
                                                if (err) throw err;
                                                console.log('successfully deleted '+FeedFileSPath);
                                              });
                                          });
                                  });

                                  FeedFileSPath ="uploads/"+VideoPngThumBaname+".jpeg";

                                  inputprofile = FeedFileSPath;

                            }
                            else if(SplitFileName[1] == 'jpg' || SplitFileName[1] == 'JPG' || SplitFileName[1] == 'jpeg'  || SplitFileName[1] == 'JPEG' )
                            {

                                     var VideoPngThumBaname = VideoThumBaname+tokenPng;
                                      var PngFileName = 'uploads/'+req.files[0]['filename'];
                                    Jimp.read(PngFileName, (err, lenna) => {

                                                  if (err) throw err;
                                                  lenna
                                      //.resize(256, 256) // resize
                                      .quality(20) // set JPEG quality
                                      //.greyscale() // set greyscale
                                      .write("uploads/"+VideoPngThumBaname+".jpeg"); // save
                                                 FeedFileSPath ="uploads/"+VideoPngThumBaname+".jpeg";
                                                             scpFile.scp(FeedFileSPath, {
                                                                        host: '13.232.245.216',
                                                                        username: 'ubuntu',
                                                                        password: 'feedget@9999',
                                                                        path: '/home/ubuntu/fvmeGear_FeedGet/uploads/'
                                                                    }, function(err) {
                                                                      if(err)

                                                                        fs.unlink(FeedFileSPath, (err) => {
                                                                          if (err) throw err;
                                                                          console.log('successfully deleted '+FeedFileSPath);
                                                                        });
                                                                    });
                                      });
                                                 FeedFileSPath ="uploads/"+VideoPngThumBaname+".jpeg";
                                                 inputprofile = FeedFileSPath;

                          }
                          else{
                            FeedFileSPath = 'uploads/'+req.files[i]['filename']
                            scpFile.scp(FeedFileSPath, {
                                              host: '13.232.245.216',
                                              username: 'ubuntu',
                                              password: 'feedget@9999',
                                              path: '/home/ubuntu/fvmeGear_FeedGet/uploads/'
                                          }, function(err) {
                                            if(err)

                                              fs.unlink(FeedFileSPath, (err) => {
                                                if (err) throw err;
                                                console.log('successfully deleted '+FeedFileSPath);
                                              });
                                          });
                              inputprofile = 'uploads/'+req.files[i]['filename']
                          }

                }
                else{
                    res.status(200).json({
                      status: 'Failed',
                      message: 'Bad Request. please check profileimage parameter.'
                    });
                }
              }

              User.find({_id: req.body.userid})
                .exec()
                .then(user => {
                  if (user.length < 1) {
                      return res.status(200).json({
                        status:"Failed",
                        message:"User does not exist"
                      });
                    }
                  else {
                    if(user[0].fullname != req.body.fullname || user[0].coverimage != inputcover || user[0].profileimage != inputprofile){

                      if(!isEmpty(inputprofile) && isEmpty(inputcover)){
                        User.findOneAndUpdate({_id: req.body.userid},{$set:{fullname:req.body.fullname,
                                                                            profileimage:inputprofile,
                                                                            updated_on:Date.now()}})
                          .exec()
                          .then(userCheck => {
                            return res.status(200).json({
                                status:"Ok",
                                message:"Profile updated successfully in ivicatest",
                                profileimage:constants.APIBASEURL+inputprofile
                            })
                          }).catch(err => {
                             var spliterror=err.message.split(":")
                              res.status(500).json({
                                 status: 'Failed',
                                 message: spliterror[0]+ spliterror[1]
                              });
                          });
                    }
                    else if(isEmpty(inputprofile) && !isEmpty(inputcover)){
                        User.findOneAndUpdate({_id: req.body.userid},{$set:{fullname:req.body.fullname,
                                                                            coverimage:inputcover,
                                                                          updated_on:Date.now()}})
                          .exec()
                          .then(userCheck => {
                            return res.status(200).json({
                                status:"Ok",
                                message:"Profile updated successfully",
                                profileimage: ""
                            })
                          }).catch(err => {
                             var spliterror=err.message.split(":")
                              res.status(500).json({
                                 status: 'Failed',
                                 message: spliterror[0]+ spliterror[1]
                              });
                          });
                    }
                    else if(!isEmpty(inputprofile) && !isEmpty(inputcover)){
                        User.findOneAndUpdate({_id: req.body.userid},{$set:{fullname:req.body.fullname,
                                                                            profileimage:inputprofile,
                                                                            coverimage:inputcover,
                                                                          updated_on:Date.now()}})
                          .exec()
                          .then(userCheck => {
                            return res.status(200).json({
                                status:"Ok",
                                message:"Profile updated successfully",
                                profileimage: constants.APIBASEURL+inputprofile
                            })
                          }).catch(err => {
                             var spliterror=err.message.split(":")
                              res.status(500).json({
                                 status: 'Failed',
                                 message: spliterror[0]+ spliterror[1]
                              });
                          });
                  }
                  else if(isEmpty(inputprofile) && isEmpty(inputcover) && user[0].fullname != req.body.fullname){
                    User.findOneAndUpdate({_id: req.body.userid},{$set:{fullname:req.body.fullname,updated_on:Date.now()}})
                          .exec()
                          .then(userCheck => {
                            return res.status(200).json({
                                status:"Ok",
                                message:"Profile updated successfully",
                                profileimage: ""
                            })
                          }).catch(err => {
                             var spliterror=err.message.split(":")
                              res.status(500).json({
                                 status: 'Failed',
                                 message: spliterror[0]+ spliterror[1]
                              });
                          });
                  }
                    else{
                      res.status(200).json({
                        status: 'Failed',
                        message: 'Bad Request. Same data available in database.'
                      });
                    }
                  }
                    else{
                      res.status(200).json({
                        status: 'Failed',
                        message: 'Bad Request. Same data available in database.'
                      });
                    }
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


router.post("/create",upload2.any(), (req, res, next) => {

var keyArray = ["userid", "iv_token", "clientid", "feed_type", "feed_desc", "privacy_mode","comments_privacy", "feed_hash_tags"];
var datetime = new Date();
    //console.log(datetime.toISOString().slice(0,10));
    //console.log(datetime.toISOString().slice(0, 19).replace('T', ' '););
var key = Object.keys(req.body);
var feed_file_path  = "";
var feed_file_path1 = [];
var createDate = dt.format('Y-m-d H:M:S');

    if(key.indexOf("feed_file")>=0){

      feed_file_path = req.body.feed_file;
      keyArray.push("feed_file");
    }
    var nanonetsResponse;
			var nanonetsVerificationStatus;
			var nanonetsSfwStatus = [];
			var nanonetsNSfwStatus = [];
			var Directoryname = randtoken.generate(5);
     if(req.files)
       {

      var filesLength = req.files.length;

     for(i=0;i<filesLength;i++)
       {

        //console.log(req.files);

          var INPUT_path_to_your_images, OUTPUT_path;
          var FeedFileSPath;
		  var tokenPng = randtoken.generate(9);
		  var VideoThumBanameRandom = new Date().toISOString()+tokenPng+'xhdpi-atseconds.jpg';

      if(req.body.feed_type == 'image')
      {
		 /* Nudity Image Verfication Code Start */
		/*
		var imagePath = 'feeds_files/'+req.files[0]['filename'];

        nudity.scanFile(imagePath, function(err, Nudityresult) {

                if(Nudityresult == false)
			     {
					 */


                var SplitFileName = req.files[0]['originalname'].split('.');
                var VideoThumBaname = String(SplitFileName[0]).replace(/ /g,"");
                // console.log(SplitFileName[1]);
                if(SplitFileName[1] == 'png' || SplitFileName[1] == 'PNG' )
                {
       // console.log('png');
						var VideoPngThumBaname = VideoThumBaname+tokenPng;
						var PngFileName = 'feeds_files/'+req.files[0]['filename'];

                        Jimp.read(PngFileName, (err, lenna) => {

                        if (err) throw err;
                        lenna
						//.resize(256, 256) // resize
						.quality(50) // set JPEG quality
						//.greyscale() // set greyscale
						.write("feeds_files/"+VideoPngThumBaname+".jpeg"); // save

                      FeedFileSPath ="feeds_files/"+VideoPngThumBaname+".jpeg";
                                  scpFile.scp(FeedFileSPath, {
                                              host: '13.232.245.216',
                                              username: 'ubuntu',
                                              password: 'feedget@9999',
                                              path: '/home/ubuntu/fvmeGear_FeedGet/feeds_files/'
                                          }, function(err) {
                                            if(err)

                                              fs.unlink(FeedFileSPath, (err) => {
                                                if (err) throw err;
                                                console.log('successfully deleted '+FeedFileSPath);
                                              });
                                          });

					  });
                        FeedFileSPath ="feeds_files/"+VideoPngThumBaname+".jpeg";
                      feed_file_path1.push(FeedFileSPath);

                }
                else if(SplitFileName[1] == 'jpg' || SplitFileName[1] == 'JPG' || SplitFileName[1] == 'jpeg'  || SplitFileName[1] == 'JPEG' )
                {
					//console.log('jpg');
                        var VideoPngThumBaname = VideoThumBaname+tokenPng;
						var PngFileName = 'feeds_files/'+req.files[0]['filename'];
					Jimp.read(PngFileName, (err, lenna) => {

                        if (err) throw err;
                        lenna
						//.resize(256, 256) // resize
						.quality(50) // set JPEG quality
						//.greyscale() // set greyscale
						.write("feeds_files/"+VideoPngThumBaname+".jpeg"); // save
                       FeedFileSPath ="feeds_files/"+VideoPngThumBaname+".jpeg";
                                   scpFile.scp(FeedFileSPath, {
                                              host: '13.232.245.216',
                                              username: 'ubuntu',
                                              password: 'feedget@9999',
                                              path: '/home/ubuntu/fvmeGear_FeedGet/feeds_files/'
                                          }, function(err) {
                                            if(err)

                                              fs.unlink(FeedFileSPath, (err) => {
                                                if (err) throw err;
                                                console.log('successfully deleted '+FeedFileSPath);
                                              });
                                          });
					  });
                       FeedFileSPath ="feeds_files/"+VideoPngThumBaname+".jpeg";
                      feed_file_path1.push(FeedFileSPath);
					  /*
                        INPUT_path_to_your_images = 'feeds_files/'+req.files[i]['filename'];
                        OUTPUT_path = 'feeds_files_comprs/';
                        FeedFileSPath = 'feeds_files_comprs/'+req.files[i]['filename'];
                        compress_images(INPUT_path_to_your_images, OUTPUT_path, {compress_force: false, statistic: true, autoupdate: true}, false,
                            {jpg: {engine: 'mozjpeg', command: ['-quality', '20']}},
                             //{png: {engine: 'optipng', command: false}},
                            {png: {engine: 'pngcrush', command: ['-reduce', '-brute']}},
                            {svg: {engine: 'svgo', command: '--multipass'}},
                            {gif: {engine: 'gifsicle', command: ['--colors', '64', '--use-col=web']}}, function(error, completed, statistic){

                        });

                        feed_file_path1.push(FeedFileSPath);  */
                }
            feed_file_path = feed_file_path1.toString();
		//	console.log(feed_file_path);
         // Image Insert Code Start


   if (keyArray.length == key.length && keyArray.every((v) => key.indexOf(v) >= 0))
   {

            if(constants.AndriodClientId === req.body.clientid || constants.IosClientId === req.body.clientid)
            {

                  authModel.find({$and:[{
            iv_token: req.body.iv_token
        },{
            userid: req.body.userid
  }]})
                  .exec()
                  .then(user => {

                   if (user.length < 1)
                   {
                      return res.status(200).json({
                        status:"Logout",
                        message:"You are logged in other device."
                      });
                   }
                   else
                   {
                      var feed_hash_tags = req.body.feed_hash_tags;
                      var SplitHasTags = feed_hash_tags.split(',');
                      var tagsarr = [];
                      if (feed_hash_tags.indexOf(',') != -1)
                      {

                      for(var i=0;i<SplitHasTags.length;i++)
                      {
                        tagsarr.push(SplitHasTags[i]);

                      }

                      }
                      else
                      {

                        tagsarr.push(feed_hash_tags);
                      }
/*var current = new Date();
var date1 = new Date(current.getTime() + 86400000);*/
var date = new Date()
var date1 = date.setTime(date.getTime() + 259200000);


 // add a day date.setDate(date.getDate() + 1);
var feeds_expiry_time = new Date(date1).toISOString();
//var isdate =feeds_expiry_time

                      const Iv_feeds = new iv_feeds({

                        _id: new mongoose.Types.ObjectId(),
                        iv_acountid: req.body.userid,
                      feed_file_path: feed_file_path,
                      feed_type: req.body.feed_type,
                      feed_desc: req.body.feed_desc,
                      privacy_mode:req.body.privacy_mode,
                      comments_privacy:req.body.comments_privacy,
                      has_sensitive_content:true,
                      //preview_url:feed_file_path[0],
                      feeds_hash_tags: tagsarr,
                      profile_url: req.body.userid,
                      feeds_expiry_time_: feeds_expiry_time,
                      feed_post_create:createDate


                      });
                      Iv_feeds
                        .save()
                        .then(result => {

                         var lastinsertid = result._id;

                           iv_feeds.find({_id: lastinsertid})
                            .populate('iv_acountid profile_url','profileimage _id username')
                           .exec()
                           .then(docs => {

                              if(String(docs[0].iv_acountid._id) == String(req.body.userid))
                                {
                                   var is_self_feed = true;
                                }
                                else
                                {
                                  var is_self_feed = false;
                                }
                                if(!isEmpty(docs[0].profile_url.profileimage) && docs[0].profile_url.profileimage != null)
                                {
                                 var profileimage = constants.APIBASEURL+docs[0].profile_url.profileimage;
                                }
                                else
                                {

                                var profileimage = constants.APIBASEURL+'uploads/userimage.png';
                                }

                                const username = docs[0].iv_acountid.username



                       var date = new Date()
                       var date1 = date.setTime(date.getTime());



                      var dateNow = new Date(date1).toISOString();


                      var dateB = moment(dateNow);
                      var dateC = moment(docs[0].feeds_expiry_time_);

                      var t = Date.parse(docs[0].feeds_expiry_time_) - Date.parse(dateNow);
                          var seconds1 = Math.floor( (t/1000) % 60 );
                          var minutes1 = Math.floor( (t/1000/60) % 60 );
                          var hours1 = Math.floor( (t/(1000*60*60)) % 24 );
                          var days1 = Math.floor( t/(1000*60*60*24) );

              if(seconds1 == 0)
              {
                var seconds = '00';
              }
              else
                          if(seconds1 < 0)
                          {
                               var seconds = '00';
                          }
                          else
                          {
                              var seconds = seconds1;

                          }

              if(minutes1 == 0)
              {
                var minutes = '00';
              }
              else
                          if(minutes1 < 0)
                          {
                               var minutes = '00';
                          }
                          else
                          {
                              var minutes = minutes1;

                          }

              if(hours1 == 0)
              {
                var hours = '00';
              }
              else
                          if(hours1 < 0)
                          {
                               var hours = '00';
                          }
                          else
                          {
                              var hours = hours1;

                          }

              if(days1 == 0)
              {
                var days = '00';
              }
              else
                          if(days1 < 0)
                          {
                               var days = '00';
                          }
                          else
                          {
                              var days = days1;

                          }

                    feedtags.find({feedTag_name:{$in:tagsarr}})
                                 .exec()
                                 .then(doc =>{
                                   if(doc.length>0){
                                     doc.forEach(function(ele){
                                       tagsarr.forEach(function(elem){
                                         if(ele.feedTag_name === elem){

                                          var date1 = new Date()
                                          var date2 = ele.feedTag_today

                                          var today = date1.setHours(0, 0, 0, 0);
                                          var feed_date = date2.setHours(0, 0, 0, 0);

                                          if(today != feed_date){
                                                feedtags.findOneAndUpdate({_id:ObjectId(ele._id)},{$inc:{feedTag_used:1,feedTag_used_today:1},$set:{feedTag_today:Date.now()}})                                                    .exec()
                                                    .then(ress =>{
                                                   }).catch(err => {               //catch for offer_id find.
                                                         var spliterror=err.message.split("_")
                                                     if(spliterror[1].indexOf("id")>=0){
                                                       /*  res.status(200).json({
                                                           status: 'Failed',
                                                           message: "Please provide correct Tag _id"
                                                         }); */
                                                     }
                                                      else{
                                                       /*  res.status(500).json({
                                                             status: 'Failed',
                                                            message: err.message
                                                        }); */
                                                     }
                                                   });
                                          }
                                          else{
                                              feedtags.findOneAndUpdate({_id:ObjectId(ele._id)},{$inc:{feedTag_used:1, feedTag_used_today:1}})                                                    .exec()
                                                    .then(ress =>{
                                                      console.log(ress)
                                                   }).catch(err => {               //catch for offer_id find.
                                                         var spliterror=err.message.split("_")
                                                     if(spliterror[1].indexOf("id")>=0){
                                                       /*  res.status(200).json({
                                                           status: 'Failed',
                                                           message: "Please provide correct Tag _id"
                                                         }); */
                                                     }
                                                      else{
                                                       /*  res.status(500).json({
                                                             status: 'Failed',
                                                            message: err.message
                                                        }); */
                                                     }
                                                   });
                                          }
                                          }
                                         else{
                                           var fTags = new feedtags({
                                               _id: new mongoose.Types.ObjectId(),
                                              feedTag_name: elem,
                                            feedTag_used: 1,
                                            feedTag_today:Date.now(),
                                            feedTag_used_today:1
                                          })
                                            fTags.save()
                                                  .then(reqq =>{
                                                  }).catch(err => {
												  //console.log(err);
												  // catch the tags schema save errors here
                                                 /*  var spliterror=err.message.split(":")
                                                   res.status(500).json({
                                                      status: 'Failed',
                                                    message: spliterror[0]+spliterror[1]
                                                  });*/
                                                });
                                        }
                                       })
                                      })
                                   }
                                    else{
                                      tagsarr.forEach(function(elem){
                                        var fTag = new feedtags({
                                           _id: new mongoose.Types.ObjectId(),
                                             feedTag_name: elem,
                                             feedTag_used: 1,
                                             feedTag_today:Date.now(),
                                            feedTag_used_today:1
                                           })
                                           fTag.save()
                                                 .then(reqq =>{
                                                 }).catch(err => {                         // catch the tags schema save errors here
                                                   var spliterror=err.message.split(":")
                                                 /*   res.status(500).json({
                                                     status: 'Failed',
                                                      message: spliterror[0]+spliterror[1]
                                                    }); */
                                                  });
                                    })

                                   }
                                  }).catch(err => {
                                      var spliterror=err.message.split(":")
                                    /*    res.status(500).json({
                                          status: 'Failed',
                        message: spliterror[0]+spliterror[1]
                                                    });
													*/
                                                  });


                      var calculatetime = hours+':'+minutes+':'+days;

                     var duration = Date.parse(docs[0].feeds_expiry_time_);



                          if(docs[0].feed_type === 'video')
                          {
                              if(!isEmpty(docs[0].feed_file_path) && docs[0].feed_file_path != null)
                                  {


                                    var video_streaming_url = constants.APIBASEURL+docs[0].feed_file_path;
                                  }
                                  else
                                  {
                                    var video_streaming_url = "";
                                  }
                    var preview_url
                  if(isEmpty(docs[0].preview_url))
                  {

                     preview_url = constants.APIBASEURL+'feeds_files/2019-03-06T11_28_33.969Zxhdpi-at-3-seconds.png';
                  }
                  else
                  {

                     preview_url = constants.APIBASEURL+docs[0].preview_url;

                     //preview_url = constants.APIBASEURL+'thumbnail/480x320.png';
                  }


                          }
                          else
                          {
                                if(!isEmpty(docs[0].feed_file_path) && docs[0].feed_file_path != null)
                                  {
                                        var string = docs[0].feed_file_path;
                                        var array = string.split(",");

                                        var files = [];
                                        if (array.indexOf(',') != -1)
                                         {
                                        for(i=0;i<array.length;i++)
                                        {
                                           var filePath = constants.APIBASEURL+array[i];
                                           files.push(filePath)
                                        }
                     }
                     else
                     {
                       files.push(constants.APIBASEURL+docs[0].feed_file_path)
                     }

                                    var video_streaming_url = files;
                                  }
                                  else
                                  {
                                    var video_streaming_url = [];
                                  }
                                 var preview_url = video_streaming_url[0];
                          }

                                feedinfo= {

                                        "feed_id": docs[0]._id,
                                        "feed_desc": docs[0].feed_desc,
                                        "feeds_tags": docs[0].feeds_hash_tags,
                                        "feed_type": docs[0].feed_file_type,
                                        "userid": docs[0].iv_acountid._id,
                                        "expiry_time": duration,
                                        "rating": docs[0].no_rating,
                                        "no_shares": docs[0].no_shares,
                                        "no_likes" : docs[0].no_likes,
                                        "no_views": docs[0].no_views,
                                        "comments_privacy":docs[0].comments_privacy,
                                        "privacy_mode":docs[0].privacy_mode,
                                        "profile_url": profileimage,
                                        "preview_url":preview_url,
                                        "has_sensitive_content": docs[0].has_verified_content,
                                        "is_under_challenge":"",
                                        "challenge_details":{
                                          "challenged_by":"",
                                          "challenged_feed_id":""
                                        },
                                        "is_self_feed": is_self_feed,
                                        "ad_details":{
                                          "ad_type":  "",
                                          "ad_files": [],
                                          "offer_id": "",
                                          "ads_price_id" : ""
                                        },
                                        "comment_privacy":0,
                                        "repost_details":{
                                          "original_userid": "",
                                          "original_feed_id": "",
                                           "original_user_img_url": ""

                                        }

                         }
						        /* notification Start */

                         		var msgbody = 'Your post will be live soon'
                         		const note_no = Math.floor(10000000000 + Math.random() * 90000000000);
									notificationModel.findOneAndUpdate({userid:ObjectId(req.body.userid)},
												{$push:{notifications:{
													notification_data: msgbody,
													member_id: req.body.userid,
													notification_type: '',
													notification_number:note_no,
													username:docs[0].iv_acountid.username,
													item_id: docs[0]._id,
													profileimage:ObjectId(req.body.userid),
													created_at:Date.now(),
													feed_type:docs[0].feed_type
												}}})
													.exec()
													.then(dosy =>{
														if(dosy === null){
													/*return res.status(200).json({
														status:"Failed",
														message:"Please provide correct userid."
												  });
												  */
												}
												else{


											fcmModel.find({userid : req.body.userid})
																.exec()
																.then(user => {
																  if (user.length < 1) {
																	 /* return res.status(200).json({
																		status:"Failed",
																		message:"Please provide correct userid."
																	  }); */
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
																																					notification_slug: '',
																																					url: constants.APIBASEURL+profileimage,
																																					username:docs[0].iv_acountid.username,
																																					item_id: docs[0]._id,
																																					preview_url:constants.APIBASEURL+docs[0].feed_file_path,
																																							userid:"",
																																							feed_id:"",
																																							member_feed_id:"",
																																							member_id:"",
																																					   is_from_push:true,
																																					   feed_type:docs[0].feed_type
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

					/*																					    userDetails.find({userid:ObjectId(req.body.userid)})
																										          				.populate("followers")
																										          				.exec()
																												.then(dex =>{
																														var followers = dex[0].followers
																														var Object_followers = []
																														var follow = []
																														if(followers.length > 0){
																															followers.forEach(function(efe){
																																Object_followers.push(ObjectId(efe.userid))
																																follow.push(efe.userid)
																															})
																														}

																														contactsModel.distinct("existing_contacts.contact",{userid:ObjectId(req.body.userid)})
																																	.exec()
																																	.then(dot =>{
																																		var no_contacts = []
																																		var object_contacts = []
																																			if(dot.length>0){
																																				no_contacts = dot
																																					no_contacts.forEach(function(ele){
																																						object_contacts.push(ObjectId(ele))
																																				})
																																			}
																																			if(follow.length > 0){
																																				no_contacts = no_contacts.concat(follow)
																																				object_contacts = object_contacts.concat(Object_followers)
																																			}

																																			const note_nos = Math.floor(10000 + Math.random() * 90000);
																																			var msgbody_new = docs[0].iv_acountid.username + " added new feed."
																																			notificationModel.updateMany({userid:{$in:object_contacts}},
																																	{$push:{notifications:{
																																						notification_data: msgbody_new,
																																						member_id: req.body.userid,
																																						notification_type: 'feed_details',
																																						notification_number:note_nos,
																																						username:docs[0].iv_acountid.username,
																																						item_id: docs[0]._id,
																																						profileimage:ObjectId(req.body.userid),
																																						feed_type:docs[0].feed_type,
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
																																					fcmModel.find({userid:{$in:no_contacts}})
																																							.exec()
																																							.then(user => {
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
																																					body: msgbody_new ,
																																				} ,
																																				data : {
																																				  notification_id : note_nos,
																																					message: msgbody_new,
																																					notification_slug: 'feed_details',
																																					url: constants.APIBASEURL+profileimage,
																																					username:docs[0].iv_acountid.username,
																																					item_id: docs[0]._id,
																																				   preview_url:constants.APIBASEURL+docs[0].feed_file_path,
																																							userid:"",
																																							feed_id:"",
																																							member_feed_id:"",
																																							member_id:"",
																																					   is_from_push:true,
																																					   feed_type:docs[0].feed_type
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



																																	}).catch(err => {
																																			var spliterror=err.message.split(":")
																																			res.status(500).json({
																																			status: 'Failed',
																																			message: spliterror[0]
																																			});
																																		});
																										          				}).catch(err => {
																														        	var spliterror=err.message.split(":")
																														       	 	res.status(500).json({
																														            status: 'Failed',
																														            message: spliterror[0]
																														        	});
																														    	}); */
																																res.status(200).json({
																																	status: "Ok",
																																	message: "Successfully Created Feed",
																																	feeds: feedinfo
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
/*																										res.status(500).json({
																										   	status: 'Failed',
																										    message: spliterror[0]
																										}); */
});


/* Notification End */



                         });

                        })
                        .catch(err => {                         // catch the auth schema save errors here
                         //conosle.log(err)
						 /*
                              var spliterror=err.message.split(":")
                              res.status(500).json({
                                status: 'Failed',
                                message: spliterror[0]+spliterror[1]
                              });
							  */

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
              else
              {
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
        /*
		}
         else
			{
				res.status(200).json({
					        status: "Failed",
							message: "Your post violates our Terms & Conditions. So we can not publish your post. Please write back to us in case of any queries.",
							feeds: {}

						});
			}  */
        // Image Insert code Ending
       // }) // Nano Nets Image Verifications Using Nudity
       }
       else
       {


                  var FName = 'feeds_files/'+req.files[i]['filename'];



					// Video thumbnails

		          ffmpeg.ffprobe(FName, function(err, metadata){
					  console.log(metadata)
			       var display_aspect_ratio = metadata.streams[0].display_aspect_ratio;
			       var video_duration = metadata.streams[0].duration;

				   /* Directory Names Creating , We are taken Multiple Screen Shorts */
           if(video_duration <=30)
           {
				   var AverageSnds = video_duration;
           }
           else
           {
             var AverageSnds = math.divide(video_duration,3);
           }
				   var ScreenShotsCount = AverageSnds;
					//var ScreenShotsCount = math.divide(video_duration,AverageSnds);

					var FinalScreenShotsCount = ScreenShotsCount.toFixed(0);


                   //mkdirp('feeds_files/'+Directoryname, 0777);

					/*mkdirp('feeds_files/'+Directoryname, 0777);
				    var ffmScreenShots = ffmpeg(FName)
				  .on('end', function() {

				  })
				  .on('error', function(err) {
					console.error(err);
				  })
				  .screenshots({

					count: FinalScreenShotsCount,
					folder: 'feeds_files/'+Directoryname
				  });
				 */
                /* End Directory Names Creating , We are taken Multiple Screen Shorts */


                 // var SplitFileName = req.files[i]['originalname'].split('.');

                    ffmpeg(FName)
                     .screenshots({
                    filename: VideoThumBanameRandom,
                    timestamps: ['3'],
				          	q:'v 1',
                    folder: 'thumbnails/',
                    size: '640x?'
                    })
                         .on('end',function(){
                var preview_urlPath = 'thumbnails/'+VideoThumBanameRandom;
                scpFile.scp(preview_urlPath, {
                          host: '13.232.245.216',
                          username: 'ubuntu',
                          password: 'feedget@9999',
                          path: '/home/ubuntu/fvmeGear_FeedGet/thumbnails/'
                      }, function(err) {
                        if(err)

                          fs.unlink(preview_urlPath, (err) => {
                            if (err) throw err;
                            console.log('successfully deleted '+preview_urlPath);
                          });
                      });
               })



                  FeedFileSPath = 'thumbnails/'+VideoThumBanameRandom;


                var preview_urlPath = 'thumbnails/'+VideoThumBanameRandom;
             //   feed_file_path1.push(req.files[i]['path']);

			 // video compression

                  	var cmd = ffmpegPath;
                    //   '-crf','29',
                    // '-preset','ultrafast',
				 	var fmps = req.files[0]['filename'];
				 	var output = 'feeds_files_comprs/'+fmps

		/* Video File Size Script */
          const stats = fs.statSync(FName)
          const fileSizeInBytes = stats.size;
          console.log(fileSizeInBytes);
          console.log('fileSizeInBytes');
        //  Convert the file size to megabytes (optional)
          const fileSizeInMegabytes = fileSizeInBytes / 1000000.0
          console.log(fileSizeInMegabytes.toFixed(0));
          console.log(fileSizeInMegabytes);
          var VideoFileSize = fileSizeInMegabytes.toFixed(0);

          /* End Video File Size Script */
		    if(VideoFileSize > 11)
            {

					var feed_file = FName
					var args = [
              '-y',
              '-i', FName,
              '-codec:a', 'aac',
              '-profile:v', 'high',
              '-level', '4.2',
              '-r', '15',
              '-b:v', '48000k',
              //'-maxrate', '1M',
              '-c:v','libx264',
              //'-bufsize', '2M',
              '-pass', '1',
              '-preset','superfast',
              '-movflags', 'faststart',
              '-crf','32',
              '-f', 'mp4',

					    output

					];
					var proc = spawn(cmd, args);
					proc.stdout.on('data', function(data) {
						});

						proc.stderr.on('data', function(data) {
						});

						proc.on('close', function() {

							feed_file_path1.push(output);
							feed_file_path = feed_file_path1.toString();
							fs.unlink(FName, (err) => {
							  if (err) throw err;
							  console.log('successfully deleted '+FName);
							});
                    scpFile.scp(output, {
                          host: '13.232.245.216',
                          username: 'ubuntu',
                          password: 'feedget@9999',
                          path: '/home/ubuntu/fvmeGear_FeedGet/feeds_files_comprs/'
                      }, function(err) {
                        if(err)

                          fs.unlink(output, (err) => {
                            if (err) throw err;
                            console.log('successfully deleted '+output);
                          });
                      });

							// Video Insert Code Start

   if (keyArray.length == key.length && keyArray.every((v) => key.indexOf(v) >= 0))
   {

            if(constants.AndriodClientId === req.body.clientid || constants.IosClientId === req.body.clientid)
            {

                  authModel.find({$and:[  {
            iv_token: req.body.iv_token
        },{
            userid: req.body.userid
  }]})
                  .exec()
                  .then(user => {

                   if (user.length < 1)
                   {
                      return res.status(200).json({
                        status:"Logout",
                        message:"You are logged in other device."
                      });
                   }
                   else
                   {
                      var feed_hash_tags = req.body.feed_hash_tags;
                      var SplitHasTags = feed_hash_tags.split(',');
                      var tagsarr = [];
                      if (feed_hash_tags.indexOf(',') != -1)
                      {

                      for(var i=0;i<SplitHasTags.length;i++)
                      {
                        tagsarr.push(SplitHasTags[i]);

                      }

                      }
                      else
                      {

                        tagsarr.push(feed_hash_tags);
                      }
/*var current = new Date();
var date1 = new Date(current.getTime() + 86400000);*/
var date = new Date()
var date1 = date.setTime(date.getTime() + 259200000);


 // add a day date.setDate(date.getDate() + 1);
var feeds_expiry_time = new Date(date1).toISOString();
//var isdate =feeds_expiry_time

                      const Iv_feeds = new iv_feeds({

                        _id: new mongoose.Types.ObjectId(),
                        iv_acountid: req.body.userid,
                      feed_file_path: feed_file_path,
                      feed_type: req.body.feed_type,
                      feed_desc: req.body.feed_desc,
                       privacy_mode:req.body.privacy_mode,
                       comments_privacy:req.body.comments_privacy,
                       has_sensitive_content:true,
					   video_duration: video_duration,
                      //screen_directory: Directoryname,
                     screen_shot_count: FinalScreenShotsCount,
                     //screen_directory_status:1,
                      preview_url:preview_urlPath,
                      feeds_hash_tags: tagsarr,
                      profile_url: req.body.userid,
                      feeds_expiry_time_: feeds_expiry_time,
                      feed_post_create:createDate


                      });
                      Iv_feeds
                        .save()
                        .then(result => {

                         var lastinsertid = result._id;

                           iv_feeds.find({_id: lastinsertid})
                            .populate('iv_acountid profile_url','profileimage _id username')
                           .exec()
                           .then(docs => {

                              if(String(docs[0].iv_acountid._id) == String(req.body.userid))
                                {
                                   var is_self_feed = true;
                                }
                                else
                                {
                                  var is_self_feed = false;
                                }
                                if(!isEmpty(docs[0].profile_url.profileimage) && docs[0].profile_url.profileimage != null)
                                {
                                 var profileimage = constants.APIBASEURL+docs[0].profile_url.profileimage;
                                }
                                else
                                {

                                var profileimage = constants.APIBASEURL+'uploads/userimage.png';
                                }

                                const username = docs[0].iv_acountid.username


                       var date = new Date()
                       var date1 = date.setTime(date.getTime());



                      var dateNow = new Date(date1).toISOString();


                      var dateB = moment(dateNow);
                      var dateC = moment(docs[0].feeds_expiry_time_);

                      var t = Date.parse(docs[0].feeds_expiry_time_) - Date.parse(dateNow);
                          var seconds1 = Math.floor( (t/1000) % 60 );
                          var minutes1 = Math.floor( (t/1000/60) % 60 );
                          var hours1 = Math.floor( (t/(1000*60*60)) % 24 );
                          var days1 = Math.floor( t/(1000*60*60*24) );

              if(seconds1 == 0)
              {
                var seconds = '00';
              }
              else
                          if(seconds1 < 0)
                          {
                               var seconds = '00';
                          }
                          else
                          {
                              var seconds = seconds1;

                          }

              if(minutes1 == 0)
              {
                var minutes = '00';
              }
              else
                          if(minutes1 < 0)
                          {
                               var minutes = '00';
                          }
                          else
                          {
                              var minutes = minutes1;

                          }

              if(hours1 == 0)
              {
                var hours = '00';
              }
              else
                          if(hours1 < 0)
                          {
                               var hours = '00';
                          }
                          else
                          {
                              var hours = hours1;

                          }

              if(days1 == 0)
              {
                var days = '00';
              }
              else
                          if(days1 < 0)
                          {
                               var days = '00';
                          }
                          else
                          {
                              var days = days1;

                          }

                    feedtags.find({feedTag_name:{$in:tagsarr}})
                                 .exec()
                                 .then(doc =>{
                                   if(doc.length>0){
                                     doc.forEach(function(ele){
                                       tagsarr.forEach(function(elem){
                                         if(ele.feedTag_name === elem){

                                          var date1 = new Date()
                                          var date2 = ele.feedTag_today

                                          var today = date1.setHours(0, 0, 0, 0);
                                          var feed_date = date2.setHours(0, 0, 0, 0);

                                          if(today != feed_date){
                                                feedtags.findOneAndUpdate({_id:ObjectId(ele._id)},{$inc:{feedTag_used:1,feedTag_used_today:1},$set:{feedTag_today:Date.now()}})                                                    .exec()
                                                    .then(ress =>{
                                                   }).catch(err => {               //catch for offer_id find.
                                                         var spliterror=err.message.split("_")
                                                     if(spliterror[1].indexOf("id")>=0){
                                                       /*  res.status(200).json({
                                                           status: 'Failed',
                                                           message: "Please provide correct Tag _id"
                                                         }); */
                                                     }
                                                      else{
                                                       /*  res.status(500).json({
                                                             status: 'Failed',
                                                            message: err.message
                                                        }); */
                                                     }
                                                   });
                                          }
                                          else{
                                              feedtags.findOneAndUpdate({_id:ObjectId(ele._id)},{$inc:{feedTag_used:1, feedTag_used_today:1}})                                                    .exec()
                                                    .then(ress =>{
                                                      console.log(ress)
                                                   }).catch(err => {               //catch for offer_id find.
                                                         var spliterror=err.message.split("_")
                                                     if(spliterror[1].indexOf("id")>=0){
                                                       /*  res.status(200).json({
                                                           status: 'Failed',
                                                           message: "Please provide correct Tag _id"
                                                         }); */
                                                     }
                                                      else{
                                                       /*  res.status(500).json({
                                                             status: 'Failed',
                                                            message: err.message
                                                        }); */
                                                     }
                                                   });
                                          }
                                          }
                                         else{
                                           var fTags = new feedtags({
                                               _id: new mongoose.Types.ObjectId(),
                                              feedTag_name: elem,
                                            feedTag_used: 1,
                                            feedTag_today:Date.now(),
                                            feedTag_used_today:1
                                          })
                                            fTags.save()
                                                  .then(reqq =>{
                                                  }).catch(err => {                         // catch the tags schema save errors here
                                               /*    var spliterror=err.message.split(":")
                                                   res.status(500).json({
                                                      status: 'Failed',
                                                    message: spliterror[0]+spliterror[1]
                                                  });*/
                                                });
                                        }
                                       })
                                      })
                                   }
                                    else{
                                      tagsarr.forEach(function(elem){
                                        var fTag = new feedtags({
                                           _id: new mongoose.Types.ObjectId(),
                                             feedTag_name: elem,
                                             feedTag_used: 1,
                                             feedTag_today:Date.now(),
                                            feedTag_used_today:1
                                           })
                                           fTag.save()
                                                 .then(reqq =>{
                                                 }).catch(err => {                         // catch the tags schema save errors here
                                                   var spliterror=err.message.split(":")
                                                  /*  res.status(500).json({
                                                     status: 'Failed',
                                                      message: spliterror[0]+spliterror[1]
                                                    }); */
                                                  });
                                    })

                                   }
                                  }).catch(err => {
                                      var spliterror=err.message.split(":")
                                       /* res.status(500).json({
                                          status: 'Failed',
                        message: spliterror[0]+spliterror[1]
                                                    }); */
                                                  });


                      var calculatetime = hours+':'+minutes+':'+days;

                     var duration = Date.parse(docs[0].feeds_expiry_time_);



                          if(docs[0].feed_type === 'video')
                          {
                              if(!isEmpty(docs[0].feed_file_path) && docs[0].feed_file_path != null)
                                  {


                                    var video_streaming_url = constants.APIBASEURL+docs[0].feed_file_path;
                                  }
                                  else
                                  {
                                    var video_streaming_url = "";
                                  }
                    var preview_url
                  if(isEmpty(docs[0].preview_url))
                  {

                     preview_url = constants.APIBASEURL+'feeds_files/2019-03-06T11_28_33.969Zxhdpi-at-3-seconds.png';
                  }
                  else
                  {

                     preview_url = constants.APIBASEURL+docs[0].preview_url;

                     //preview_url = constants.APIBASEURL+'thumbnail/480x320.png';
                  }


                          }
                          else
                          {
                                if(!isEmpty(docs[0].feed_file_path) && docs[0].feed_file_path != null)
                                  {
                                        var string = docs[0].feed_file_path;
                                        var array = string.split(",");

                                        var files = [];
                                        if (array.indexOf(',') != -1)
                                         {
                                        for(i=0;i<array.length;i++)
                                        {
                                           var filePath = constants.APIBASEURL+array[i];
                                           files.push(filePath)
                                        }
                     }
                     else
                     {
                       files.push(constants.APIBASEURL+docs[0].feed_file_path)
                     }

                                    var video_streaming_url = files;
                                  }
                                  else
                                  {
                                    var video_streaming_url = [];
                                  }
                                 var preview_url = video_streaming_url[0];
                          }

                                feedinfo= {

                                        "feed_id": docs[0]._id,
                                        "feed_desc": docs[0].feed_desc,
                                        "feeds_tags": docs[0].feeds_hash_tags,
                                        "feed_type": docs[0].feed_file_type,
                                        "userid": docs[0].iv_acountid._id,
                                        "expiry_time": duration,
                                        "rating": docs[0].no_rating,
                                        "no_shares": docs[0].no_shares,
                                        "no_likes" : docs[0].no_likes,
                                        "no_views": docs[0].no_views,
                                        "comments_privacy":docs[0].comments_privacy,
                                        "privacy_mode":docs[0].privacy_mode,
                                        "profile_url": profileimage,
                                        "preview_url":preview_url,
                                        "has_sensitive_content": docs[0].has_verified_content,
                                        "is_under_challenge":"",
                                        "challenge_details":{
                                          "challenged_by":"",
                                          "challenged_feed_id":""
                                        },
                                        "is_self_feed": is_self_feed,
                                        "ad_details":{
                                          "ad_type":  "",
                                          "ad_files": [],
                                          "offer_id": "",
                                          "ads_price_id" : ""
                                        },
                                        "comment_privacy":0,
                                        "repost_details":{
                                          "original_userid": "",
                                          "original_feed_id": "",
                                           "original_user_img_url": ""

                                        }

                         } //feed_details
                         		var msgbody = 'Your post will be live soon'
                         		    const note_no = Math.floor(10000000000 + Math.random() * 90000000000);
									notificationModel.findOneAndUpdate({userid:ObjectId(req.body.userid)},
										{$push:{notifications:{
											notification_data: msgbody,
											member_id: req.body.userid,
											notification_type: '',
											notification_number:note_no,
											username:docs[0].iv_acountid.username,
											item_id: docs[0]._id,
											profileimage:ObjectId(req.body.userid),
											created_at:Date.now(),
											feed_type:docs[0].feed_type
										}}})
											.exec()
											.then(dosy =>{
												if(dosy === null){
												/*	return res.status(200).json({
														status:"Failed",
														message:"Please provide correct userid."
												  }); */
												}
												else{


											fcmModel.find({userid : req.body.userid})
													.exec()
													.then(user => {
													  if (user.length < 1) {
														/*  return res.status(200).json({
															status:"Failed",
															message:"Please provide correct userid."
														  }); */
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
														notification_slug: '',
														url: constants.APIBASEURL+profileimage,
														username:docs[0].iv_acountid.username,
														item_id: docs[0]._id,
													   preview_url:constants.APIBASEURL+docs[0].preview_url,
																userid:"",
																feed_id:"",
																member_feed_id:"",
																member_id:"",
														   is_from_push:true,
														   feed_type:docs[0].feed_type
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
                                                /*
												userDetails.find({userid:ObjectId(req.body.userid)})
												.populate("followers")
												.exec()
												.then(dex =>{
												var followers = dex[0].followers
												var Object_followers = []
												var follow = []
												followers.forEach(function(efe){
												Object_followers.push(ObjectId(efe.userid))
												follow.push(efe.userid)
												})
												contactsModel.distinct("existing_contacts.contact",{userid:ObjectId(req.body.userid)})
												.exec()
												.then(dot =>{
												var no_contacts = []
												var object_contacts = []
												if(dot.length>0){
												no_contacts = dot
												no_contacts.forEach(function(ele){
												object_contacts.push(ObjectId(ele))
												})
												}
												no_contacts = no_contacts.concat(follow)
												object_contacts = object_contacts.concat(Object_followers)
												const note_nos = Math.floor(10000 + Math.random() * 90000);
												var msgbody_new = docs[0].iv_acountid.username + " added a new feed."
												notificationModel.updateMany({userid:{$in:object_contacts}},
												{$push:{notifications:{
												notification_data: msgbody_new,
												member_id: req.body.userid,
												notification_type: 'feed_details',
												notification_number:note_nos,
												username:docs[0].iv_acountid.username,
												item_id: docs[0]._id,
												profileimage:ObjectId(req.body.userid),
												created_at:Date.now(),
												feed_type:docs[0].feed_type
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
												fcmModel.find({userid:{$in:no_contacts}})
												.exec()
												.then(user => {
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
																body: msgbody_new ,
															} ,
															data : {
															  notification_id : note_nos,
																message: msgbody_new,
																notification_slug: 'feed_details',
																url: constants.APIBASEURL+profileimage,
																username:username,
																item_id: docs[0]._id,
																preview_url:constants.APIBASEURL+docs[0].preview_url,
																		userid:"",
																		feed_id:"",
																		member_feed_id:"",
																		member_id:"",
																   is_from_push:true,
																   feed_type:docs[0].feed_type
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



												}).catch(err => {
												var spliterror=err.message.split(":")
												res.status(500).json({
												status: 'Failed',
												message: spliterror[0]
												});
												});
												}).catch(err => {
												var spliterror=err.message.split(":")
												res.status(500).json({
												status: 'Failed',
												message: spliterror[0]
												});
												});
												*/
											res.status(200).json({
												status: "Ok",
												message: "Successfully Created Feed",
												feeds: feedinfo
											  });

											}
											}).catch(err => {
											var spliterror=err.message.split(":")
											/*
											res.status(500).json({
											status: 'Failed',
											message: spliterror[0]
											}); */
											});
											}
											}).catch(err => {
											var spliterror=err.message.split(":")
										/*	res.status(500).json({
											status: 'Failed',
											message: spliterror[0]
											}); */
											});



                         });

                        })
                        .catch(err => {                         // catch the auth schema save errors here

                              var spliterror=err.message.split(":")
                              res.status(500).json({
                                status: 'Failed',
                                message: spliterror[0]+spliterror[1]
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
              else
              {
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
							// Video End COde

						})

						} // Video Size Morethan 11 MB Conditions End
						else //kvsr
						{

							feed_file_path1.push(FName);
							feed_file_path = feed_file_path1.toString();

                    scpFile.scp(FName, {
                          host: '13.232.245.216',
                          username: 'ubuntu',
                          password: 'feedget@9999',
                          path: '/home/ubuntu/fvmeGear_FeedGet/feeds_files/'
                      }, function(err) {
                        if(err)

                          fs.unlink(FName, (err) => {
                            if (err) throw err;
                            console.log('successfully deleted '+output);
                          });
                      });

							// Video Insert Code Start

   if (keyArray.length == key.length && keyArray.every((v) => key.indexOf(v) >= 0))
   {

            if(constants.AndriodClientId === req.body.clientid || constants.IosClientId === req.body.clientid)
            {

                  authModel.find({$and:[  {
            iv_token: req.body.iv_token
        },{
            userid: req.body.userid
  }]})
                  .exec()
                  .then(user => {

                   if (user.length < 1)
                   {
                      return res.status(200).json({
                        status:"Logout",
                        message:"You are logged in other device."
                      });
                   }
                   else
                   {
                      var feed_hash_tags = req.body.feed_hash_tags;
                      var SplitHasTags = feed_hash_tags.split(',');
                      var tagsarr = [];
                      if (feed_hash_tags.indexOf(',') != -1)
                      {

                      for(var i=0;i<SplitHasTags.length;i++)
                      {
                        tagsarr.push(SplitHasTags[i]);

                      }

                      }
                      else
                      {

                        tagsarr.push(feed_hash_tags);
                      }
/*var current = new Date();
var date1 = new Date(current.getTime() + 86400000);*/
var date = new Date()
var date1 = date.setTime(date.getTime() + 86400000);


 // add a day date.setDate(date.getDate() + 1);
var feeds_expiry_time = new Date(date1).toISOString();
//var isdate =feeds_expiry_time

                      const Iv_feeds = new iv_feeds({

                        _id: new mongoose.Types.ObjectId(),
                        iv_acountid: req.body.userid,
                      feed_file_path: feed_file_path,
                      feed_type: req.body.feed_type,
                      feed_desc: req.body.feed_desc,
                      privacy_mode:req.body.privacy_mode,
                      comments_privacy:req.body.comments_privacy,
                      has_sensitive_content:true,
					            video_duration: video_duration,
                      //screen_directory: Directoryname,
                     screen_shot_count: FinalScreenShotsCount,
                     //screen_directory_status:1,
                      preview_url:preview_urlPath,
                      feeds_hash_tags: tagsarr,
                      profile_url: req.body.userid,
                      feeds_expiry_time_: feeds_expiry_time,
                      feed_post_create:createDate


                      });
                      Iv_feeds
                        .save()
                        .then(result => {

                         var lastinsertid = result._id;

                           iv_feeds.find({_id: lastinsertid})
                            .populate('iv_acountid profile_url','profileimage _id username')
                           .exec()
                           .then(docs => {

                              if(String(docs[0].iv_acountid._id) == String(req.body.userid))
                                {
                                   var is_self_feed = true;
                                }
                                else
                                {
                                  var is_self_feed = false;
                                }
                                if(!isEmpty(docs[0].profile_url.profileimage) && docs[0].profile_url.profileimage != null)
                                {
                                 var profileimage = constants.APIBASEURL+docs[0].profile_url.profileimage;
                                }
                                else
                                {

                                var profileimage = constants.APIBASEURL+'uploads/userimage.png';
                                }

                                const username = docs[0].iv_acountid.username


                       var date = new Date()
                       var date1 = date.setTime(date.getTime());



                      var dateNow = new Date(date1).toISOString();


                      var dateB = moment(dateNow);
                      var dateC = moment(docs[0].feeds_expiry_time_);

                      var t = Date.parse(docs[0].feeds_expiry_time_) - Date.parse(dateNow);
                          var seconds1 = Math.floor( (t/1000) % 60 );
                          var minutes1 = Math.floor( (t/1000/60) % 60 );
                          var hours1 = Math.floor( (t/(1000*60*60)) % 24 );
                          var days1 = Math.floor( t/(1000*60*60*24) );

              if(seconds1 == 0)
              {
                var seconds = '00';
              }
              else
                          if(seconds1 < 0)
                          {
                               var seconds = '00';
                          }
                          else
                          {
                              var seconds = seconds1;

                          }

              if(minutes1 == 0)
              {
                var minutes = '00';
              }
              else
                          if(minutes1 < 0)
                          {
                               var minutes = '00';
                          }
                          else
                          {
                              var minutes = minutes1;

                          }

              if(hours1 == 0)
              {
                var hours = '00';
              }
              else
                          if(hours1 < 0)
                          {
                               var hours = '00';
                          }
                          else
                          {
                              var hours = hours1;

                          }

              if(days1 == 0)
              {
                var days = '00';
              }
              else
                          if(days1 < 0)
                          {
                               var days = '00';
                          }
                          else
                          {
                              var days = days1;

                          }

                    feedtags.find({feedTag_name:{$in:tagsarr}})
                                 .exec()
                                 .then(doc =>{
                                   if(doc.length>0){
                                     doc.forEach(function(ele){
                                       tagsarr.forEach(function(elem){
                                         if(ele.feedTag_name === elem){

                                          var date1 = new Date()
                                          var date2 = ele.feedTag_today

                                          var today = date1.setHours(0, 0, 0, 0);
                                          var feed_date = date2.setHours(0, 0, 0, 0);

                                          if(today != feed_date){
                                                feedtags.findOneAndUpdate({_id:ObjectId(ele._id)},{$inc:{feedTag_used:1,feedTag_used_today:1},$set:{feedTag_today:Date.now()}})                                                    .exec()
                                                    .then(ress =>{
                                                   }).catch(err => {               //catch for offer_id find.
                                                         var spliterror=err.message.split("_")
                                                     if(spliterror[1].indexOf("id")>=0){
                                                       /*  res.status(200).json({
                                                           status: 'Failed',
                                                           message: "Please provide correct Tag _id"
                                                         }); */
                                                     }
                                                      else{
                                                       /*  res.status(500).json({
                                                             status: 'Failed',
                                                            message: err.message
                                                        }); */
                                                     }
                                                   });
                                          }
                                          else{
                                              feedtags.findOneAndUpdate({_id:ObjectId(ele._id)},{$inc:{feedTag_used:1, feedTag_used_today:1}})                                                    .exec()
                                                    .then(ress =>{
                                                      console.log(ress)
                                                   }).catch(err => {               //catch for offer_id find.
                                                         var spliterror=err.message.split("_")
                                                     if(spliterror[1].indexOf("id")>=0){
                                                       /*  res.status(200).json({
                                                           status: 'Failed',
                                                           message: "Please provide correct Tag _id"
                                                         }); */
                                                     }
                                                      else{
                                                       /*  res.status(500).json({
                                                             status: 'Failed',
                                                            message: err.message
                                                        }); */
                                                     }
                                                   });
                                          }
                                          }
                                         else{
                                           var fTags = new feedtags({
                                               _id: new mongoose.Types.ObjectId(),
                                              feedTag_name: elem,
                                            feedTag_used: 1,
                                            feedTag_today:Date.now(),
                                            feedTag_used_today:1
                                          })
                                            fTags.save()
                                                  .then(reqq =>{
                                                  }).catch(err => {                         // catch the tags schema save errors here
                                               /*    var spliterror=err.message.split(":")
                                                   res.status(500).json({
                                                      status: 'Failed',
                                                    message: spliterror[0]+spliterror[1]
                                                  });*/
                                                });
                                        }
                                       })
                                      })
                                   }
                                    else{
                                      tagsarr.forEach(function(elem){
                                        var fTag = new feedtags({
                                           _id: new mongoose.Types.ObjectId(),
                                             feedTag_name: elem,
                                             feedTag_used: 1,
                                             feedTag_today:Date.now(),
                                            feedTag_used_today:1
                                           })
                                           fTag.save()
                                                 .then(reqq =>{
                                                 }).catch(err => {                         // catch the tags schema save errors here
                                                   var spliterror=err.message.split(":")
                                                  /*  res.status(500).json({
                                                     status: 'Failed',
                                                      message: spliterror[0]+spliterror[1]
                                                    }); */
                                                  });
                                    })

                                   }
                                  }).catch(err => {
                                      var spliterror=err.message.split(":")
                                       /* res.status(500).json({
                                          status: 'Failed',
                        message: spliterror[0]+spliterror[1]
                                                    }); */
                                                  });


                      var calculatetime = hours+':'+minutes+':'+days;

                     var duration = Date.parse(docs[0].feeds_expiry_time_);



                          if(docs[0].feed_type === 'video')
                          {
                              if(!isEmpty(docs[0].feed_file_path) && docs[0].feed_file_path != null)
                                  {


                                    var video_streaming_url = constants.APIBASEURL+docs[0].feed_file_path;
                                  }
                                  else
                                  {
                                    var video_streaming_url = "";
                                  }
                    var preview_url
                  if(isEmpty(docs[0].preview_url))
                  {

                     preview_url = constants.APIBASEURL+'feeds_files/2019-03-06T11_28_33.969Zxhdpi-at-3-seconds.png';
                  }
                  else
                  {

                     preview_url = constants.APIBASEURL+docs[0].preview_url;

                     //preview_url = constants.APIBASEURL+'thumbnail/480x320.png';
                  }


                          }
                          else
                          {
                                if(!isEmpty(docs[0].feed_file_path) && docs[0].feed_file_path != null)
                                  {
                                        var string = docs[0].feed_file_path;
                                        var array = string.split(",");

                                        var files = [];
                                        if (array.indexOf(',') != -1)
                                         {
                                        for(i=0;i<array.length;i++)
                                        {
                                           var filePath = constants.APIBASEURL+array[i];
                                           files.push(filePath)
                                        }
                     }
                     else
                     {
                       files.push(constants.APIBASEURL+docs[0].feed_file_path)
                     }

                                    var video_streaming_url = files;
                                  }
                                  else
                                  {
                                    var video_streaming_url = [];
                                  }
                                 var preview_url = video_streaming_url[0];
                          }

                                feedinfo= {

                                        "feed_id": docs[0]._id,
                                        "feed_desc": docs[0].feed_desc,
                                        "feeds_tags": docs[0].feeds_hash_tags,
                                        "feed_type": docs[0].feed_file_type,
                                        "userid": docs[0].iv_acountid._id,
                                        "expiry_time": duration,
                                        "rating": docs[0].no_rating,
                                        "no_shares": docs[0].no_shares,
                                        "no_likes" : docs[0].no_likes,
                                        "no_views": docs[0].no_views,
                                        "comments_privacy":docs[0].comments_privacy,
                                        "privacy_mode":docs[0].privacy_mode,
                                        "profile_url": profileimage,
                                        "preview_url":preview_url,
                                        "has_sensitive_content": docs[0].has_verified_content,
                                        "is_under_challenge":"",
                                        "challenge_details":{
                                          "challenged_by":"",
                                          "challenged_feed_id":""
                                        },
                                        "is_self_feed": is_self_feed,
                                        "ad_details":{
                                          "ad_type":  "",
                                          "ad_files": [],
                                          "offer_id": "",
                                          "ads_price_id" : ""
                                        },
                                        "comment_privacy":0,
                                        "repost_details":{
                                          "original_userid": "",
                                          "original_feed_id": "",
                                           "original_user_img_url": ""

                                        }

                         } //feed_details
                         		var msgbody = 'Your post will be live soon'
                         		    const note_no = Math.floor(10000000000 + Math.random() * 90000000000);
									notificationModel.findOneAndUpdate({userid:ObjectId(req.body.userid)},
										{$push:{notifications:{
											notification_data: msgbody,
											member_id: req.body.userid,
											notification_type: '',
											notification_number:note_no,
											username:docs[0].iv_acountid.username,
											item_id: docs[0]._id,
											profileimage:ObjectId(req.body.userid),
											created_at:Date.now(),
											feed_type:docs[0].feed_type
										}}})
											.exec()
											.then(dosy =>{
												if(dosy === null){
												/*	return res.status(200).json({
														status:"Failed",
														message:"Please provide correct userid."
												  }); */
												}
												else{


											fcmModel.find({userid : req.body.userid})
													.exec()
													.then(user => {
													  if (user.length < 1) {
														/*  return res.status(200).json({
															status:"Failed",
															message:"Please provide correct userid."
														  }); */
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
														notification_slug: '',
														url: constants.APIBASEURL+profileimage,
														username:docs[0].iv_acountid.username,
														item_id: docs[0]._id,
													   preview_url:constants.APIBASEURL+docs[0].preview_url,
																userid:"",
																feed_id:"",
																member_feed_id:"",
																member_id:"",
														   is_from_push:true,
														   feed_type:docs[0].feed_type
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
                                                /*
												userDetails.find({userid:ObjectId(req.body.userid)})
												.populate("followers")
												.exec()
												.then(dex =>{
												var followers = dex[0].followers
												var Object_followers = []
												var follow = []
												followers.forEach(function(efe){
												Object_followers.push(ObjectId(efe.userid))
												follow.push(efe.userid)
												})
												contactsModel.distinct("existing_contacts.contact",{userid:ObjectId(req.body.userid)})
												.exec()
												.then(dot =>{
												var no_contacts = []
												var object_contacts = []
												if(dot.length>0){
												no_contacts = dot
												no_contacts.forEach(function(ele){
												object_contacts.push(ObjectId(ele))
												})
												}
												no_contacts = no_contacts.concat(follow)
												object_contacts = object_contacts.concat(Object_followers)
												const note_nos = Math.floor(10000 + Math.random() * 90000);
												var msgbody_new = docs[0].iv_acountid.username + " added a new feed."
												notificationModel.updateMany({userid:{$in:object_contacts}},
												{$push:{notifications:{
												notification_data: msgbody_new,
												member_id: req.body.userid,
												notification_type: 'feed_details',
												notification_number:note_nos,
												username:docs[0].iv_acountid.username,
												item_id: docs[0]._id,
												profileimage:ObjectId(req.body.userid),
												created_at:Date.now(),
												feed_type:docs[0].feed_type
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
												fcmModel.find({userid:{$in:no_contacts}})
												.exec()
												.then(user => {
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
																body: msgbody_new ,
															} ,
															data : {
															  notification_id : note_nos,
																message: msgbody_new,
																notification_slug: 'feed_details',
																url: constants.APIBASEURL+profileimage,
																username:username,
																item_id: docs[0]._id,
																preview_url:constants.APIBASEURL+docs[0].preview_url,
																		userid:"",
																		feed_id:"",
																		member_feed_id:"",
																		member_id:"",
																   is_from_push:true,
																   feed_type:docs[0].feed_type
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



												}).catch(err => {
												var spliterror=err.message.split(":")
												res.status(500).json({
												status: 'Failed',
												message: spliterror[0]
												});
												});
												}).catch(err => {
												var spliterror=err.message.split(":")
												res.status(500).json({
												status: 'Failed',
												message: spliterror[0]
												});
												});
												*/
											res.status(200).json({
												status: "Ok",
												message: "Successfully Created Feed",
												feeds: feedinfo
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



                         });

                        })
                        .catch(err => {                         // catch the auth schema save errors here

                              var spliterror=err.message.split(":")
                              res.status(500).json({
                                status: 'Failed',
                                message: spliterror[0]+spliterror[1]
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
              else
              {
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
							// Video End COde


						}

			 }); // Video Metadata get duration





       }





     }
    }



});

router.post("/watermark", (req, res, next) => {

    var keyArray = ["userid", "iv_token", "clientid", "feed_id"];
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

                        iv_feeds.findOne(
                            {_id: ObjectId(req.body.feed_id)})
                            .populate('iv_acountid')
                            .exec()
                            .then((doc) => {
                                var feed_file_path = doc.feed_file_path;
                                var username = '@' + doc.iv_acountid.fullname;
                                var FName = constants.APIBASEURL + feed_file_path;

                                var filename = feed_file_path.split('/')[1];
                                var cmd = ffmpegPath;
                                var output = 'watermark/temp_' + filename;
                                var final_output = 'watermark/' + filename;
                                var watermarkImage = 'watermark/watermark_hdpi.png';
                                var starting_point = 2;
                                var middle_point = '';
                                var ending_point = '';

                                try {
                                    if (!fs.existsSync(final_output)) {
                                        function get_videoDuration(callback) {
                                            var a = Date.now()
                                            var startDate = new Date(a);
                                            var startDate_str = startDate.getHours() + ":" + startDate.getMinutes() + ":" + startDate.getSeconds()

                                            require('get-video-duration').getVideoDurationInSeconds(FName).then((duration) => {
                                              //  console.log("duration", duration);
                                                ending_point = duration;
                                                middle_point = duration / 2;
                                               // console.log("video durations", starting_point, middle_point, ending_point);
                                                callback(null, startDate_str);
                                            }).catch(err => {
                                                console.log('error get_video duration', err);
                                            })
                                        }

                                        function add_watermark(callback) {
                                            var waterMarkArgs = [
                                                '-i', FName, '-i', watermarkImage, '-i', watermarkImage, '-y',
                                                '-filter_complex', `[0:v]scale=640:360 [bg0]; [bg0][1:v]overlay=0:0:enable='between(t,${starting_point},${middle_point})' [bg1]; [bg1][2:v]overlay='x=(main_w-overlay_w)/2:y=(main_h-overlay_h)/2':enable='between(t,1,2)' [bg1];[bg1][2:v]overlay=W-w-5:H-h-5:enable='between(t,${middle_point},${ending_point})'`,
                                                output
                                            ];
                                            var proc = spawn(cmd, waterMarkArgs);

                                            proc.stdout.on('error', function (error) {
                                                // console.log("error", error.toString());
                                              //  console.log("add watermark");
                                            });

                                            proc.stderr.on('data', function (data) {
                                                // console.log("data", data.toString());
                                               // console.log("add watermark1", data.toString());
                                            });

                                            proc.on('close', function () {
                                                console.log("water mark added successfully");
                                                callback(null, "watermarkArg");
                                            });
                                        }

                                        function add_text(callback) {
                                            var text_top_left = `drawtext=fontfile='watermark/font.ttf':fontsize=12:text='${username}':fontcolor=white:x=40:y=30:enable='between(t,${starting_point},${middle_point})'`
                                            var text_middle = `drawtext=fontfile='watermark/font.ttf':fontsize=12:text='${username}':fontcolor=white:x=(w-text_w)/2+10:y=(h-text_h)/2+20:enable='between(t,1,2)'`
                                            var text_bottom_right = `drawtext=fontfile='watermark/font.ttf':fontsize=12:text='${username}':fontcolor=white:x=(w-text_w)-18:y=(h-text_h)-8:enable='between(t,${middle_point},${ending_point})'`
                                            var add_text_args = [
                                                '-i', output,
                                                '-y', '-vf', text_bottom_right + ',' + text_middle + ',' + text_top_left,
                                                final_output
                                            ];
                                            var proc = spawn(cmd, add_text_args);
                                            proc.stdout.on('error', function (error) {
                                                // console.log("error", error.toString());
                                                //console.log("add text1");
                                            });

                                            proc.stderr.on('data', function (data) {
                                                // console.log("data", data.toString());
                                               // console.log("add text2", data.toString())
                                            });

                                            proc.on('close', function () {
                                              //  console.log("text added successfully");
                                                fs.unlink(output, (err) => {
                                                    if (!err) {
                                                        console.log(output + 'deleted_successfully');
                                                    }
                                                })
                                                callback(null, "textArg");
                                            });
                                        }

                                        async.series([
                                            get_videoDuration,
                                            add_watermark,
                                            add_text
                                        ], function (err, result) {
                                           // console.log("result", result);
                                           // console.log("allprocesses done");
                                            res.send({
                                                status: "OK",
                                                file_download_url: final_output
                                            })

                                        });
                                    } else {
                                        res.send({
                                            status: "OK",
                                            file_download_url: final_output
                                        })
                                    }
                                } catch (err) {
                                    console.error(err);
                                }
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
