express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const isEmpty = require('is-empty');
var shuffle = require('shuffle-array');
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
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmScreen = require('fluent-ffmpeg');
const scpFile = require('scp2');
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);
var path = require('path'); // Default node module
const ThumbnailGenerator = require('video-thumbnail-generator').default;
// const ThumbnailGenerator = require('video-thumbnail-generator').default;
const FCM = require('fcm-node');
const fcmModel = require("../models/fcmtoken");
var command = ffmpeg();
var spawn = require('child_process').spawn;
/* Video Thumb Image */

/* nudity*/
var nudity = require('nudity');
var async = require('async');
var request = require('request');
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
const challenges = require("../models/challenge");
const userTransactions = require("../models/user_transactions")
const trackingTags = require("../models/trackingtags");
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

//var path = require('path');

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        //global.filePath = req.file;
        cb(null, './static_feed_files/');
    },
    filename: function(req, file, cb) {

        cb(null, new Date().toISOString() + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    // reject a file
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg') {

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

    //fileFilter: fileFilter
});


router.post("/create", (req, res, next) => {

    const { getVideoDurationInSeconds } = require('get-video-duration')
 
        // From a local path...


    //const path = require('path');
    //const fs = require('fs');
    //joining path of directory 
    const directoryPath = path.join('/home/ubuntu/FvmeGear/', 'static_files');
    //passsing directoryPath and callback function
    fs.readdir(directoryPath, function(err, files) {
        //handling error
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        }
        //listing all files using forEach
        files.forEach(function(file) {
            // Do whatever you want to do with the file
            var keyArray = [];
            var datetime = new Date();
            //console.log(datetime.toISOString().slice(0,10));
            //console.log(datetime.toISOString().slice(0, 19).replace('T', ' '););
            var key = Object.keys(req.body);
            var feed_file_path = "";
            var feed_file_path1 = [];
            var createDate = dt.format('Y-m-d H:M:S');

            User.find({ _id: ObjectId('5d135ad0a061df3a1512da3d') })
                .exec()
                .then(email_details => {
                       

                        var nanonetsResponse;
                        var nanonetsVerificationStatus;
                        var nanonetsSfwStatus = [];
                        var nanonetsNSfwStatus = [];
                        var Directoryname = randtoken.generate(5);


                                //console.log(req.files);

                                var INPUT_path_to_your_images, OUTPUT_path;
                                var FeedFileSPath;
                                var tokenPng = randtoken.generate(9);
                                var VideoThumBanameRandom = new Date().toISOString() + tokenPng + 'xhdpi-atseconds.jpg';
                                var moment_test = moment().format('Z')
                                console.log(moment_test)



                                var FName = 'static_files/' + file


                                // Video thumbnails

                                ffmpeg.ffprobe(FName, function(err, metadata) {

                                    var display_aspect_ratio = '16:9'
                                    var video_duration = 0
                                    getVideoDurationInSeconds(constants.APIBASEURL+"static_files/"+file).then((duration) => {
                                          console.log(duration)
                                          video_duration = duration
                                        })

                                    /* Directory Names Creating , We are taken Multiple Screen Shorts */
                                    // var AverageSnds = math.divide(video_duration, 3);
                                    //var ScreenShotsCount = AverageSnds;
                                    //var ScreenShotsCount = math.divide(video_duration,AverageSnds);

                                    var FinalScreenShotsCount = 0


                                    // mkdirp('feeds_files/' + Directoryname, 0777);
                                    // var ffmScreenShots = ffmpeg(FName)
                                    //     .on('end', function () {

                                    //     })
                                    //     .on('error', function (err) {
                                    //         console.error(err);
                                    //     })
                                    //     .screenshots({
                                    //         // Will take screenshots at 20%, 40%, 60% and 80% of the video
                                    //         count: FinalScreenShotsCount,
                                    //         folder: 'feeds_files/' + Directoryname
                                    //     });

                                    /* End Directory Names Creating , We are taken Multiple Screen Shorts */
                                    if (display_aspect_ratio == '16:9') {

                                        //  var SplitFileName = req.files[i]['originalname'].split('.');
                                        if (video_duration <= 3) {
                                            var timeSeconds = 1
                                            ffmpeg(FName)
                                                .screenshots({
                                                    filename: VideoThumBanameRandom,
                                                    timestamps: [timeSeconds],
                                                    folder: 'static_thumbnails/',
                                                    size: '640x?'
                                                })
                                            // var cmds = ffmpegPath;
                                            // var outputs = 'static_thumbnails/' + VideoThumBanameRandom
                                            // var feed_files = 'static_thumbnails/' + VideoThumBanameRandom
                                            // var args1 = [
                                            //     '-y',
                                            //     '-i', feed_files,
                                            //     //   '-vframes', '1',
                                            //     '-q:v', '1',
                                            //     '-vf', 'eq=gamma=1.5:saturation=2',
                                            //     //  '-vf', 'scale=-1:120:title=100*1',
                                            //     //  '-vf', 'scale=192:168',
                                            //     outputs

                                            // ];
                                            // var proc = spawn(cmds, args1);
                                            // proc.stdout.on('data', function (data) {
                                            // });

                                            // proc.stderr.on('data', function (data) {
                                            // });
                                            // proc.on('close', function () {
                                            // })

                                        } else {

                                            ffmpeg(FName)
                                                .screenshots({
                                                    filename: VideoThumBanameRandom,
                                                    timestamps: ['3'],
                                                    folder: 'static_thumbnails/',
                                                    size: '640x?'
                                                })
                                            // var cmds = ffmpegPath;
                                            // var outputs = 'static_thumbnails/' + VideoThumBanameRandom
                                            // var feed_files = 'static_thumbnails/' + VideoThumBanameRandom
                                            // var args1 = [
                                            //     '-y',
                                            //     '-i', feed_files,
                                            //     //   '-vframes', '1',
                                            //     '-q:v', '1',
                                            //     '-vf', 'eq=gamma=1.5:saturation=2',
                                            //     //  '-vf', 'scale=-1:120:title=100*1',
                                            //     //  '-vf', 'scale=192:168',
                                            //     outputs

                                            // ];
                                            // var proc = spawn(cmds, args1);
                                            // proc.stdout.on('data', function (data) {
                                            // });

                                            // proc.stderr.on('data', function (data) {
                                            // });
                                            // proc.on('close', function () {
                                            // })

                                        }


                                        FeedFileSPath = 'static_thumbnails/' + VideoThumBanameRandom;
                                        /*

                                                                INPUT_path_to_your_images = 'thumbnail/'+VideoThumBanameRandom;
                                             OUTPUT_path = 'thumbnails/';compress_images(INPUT_path_to_your_images, OUTPUT_path, {compress_force: false, statistic: true, autoupdate: true}, false,
                                            {jpg: {engine: 'mozjpeg', command: ['-quality', '20']}},
                                             //{png: {engine: 'optipng', command: false}},
                                            {png: {engine: 'pngcrush', command: ['-reduce', '-brute']}},
                                            {svg: {engine: 'svgo', command: '--multipass'}},
                                            {gif: {engine: 'gifsicle', command: ['--colors', '64', '--use-col=web']}}, function(error, completed, statistic){

                                            });
                                                    */
                                    } else {

                                        // var SplitFileName = req.files[i]['originalname'].split('.');
                                        if (video_duration <= 3) {
                                            var timeSeconds = 1
                                            ffmpeg(FName)
                                                .screenshots({
                                                    filename: VideoThumBanameRandom,
                                                    timestamps: [timeSeconds],
                                                    folder: 'static_thumbnails/',
                                                    size: '640x?'
                                                })
                                            // var cmds = ffmpegPath;
                                            // var outputs = 'static_thumbnails/' + VideoThumBanameRandom
                                            // var feed_files = 'static_thumbnails/' + VideoThumBanameRandom
                                            // var args1 = [
                                            //     '-y',
                                            //     '-i', feed_files,
                                            //     //   '-vframes', '1',
                                            //     '-q:v', '1',
                                            //     '-vf', 'eq=gamma=1.5:saturation=2',
                                            //     //  '-vf', 'scale=-1:120:title=100*1',
                                            //     //  '-vf', 'scale=192:168',
                                            //     outputs

                                            // ];
                                            // var proc = spawn(cmds, args1);
                                            // proc.stdout.on('data', function (data) {
                                            // });

                                            // proc.stderr.on('data', function (data) {
                                            // });
                                            // proc.on('close', function () {
                                            // })

                                        } else {
                                            ffmpeg(FName)
                                                .screenshots({
                                                    filename: VideoThumBanameRandom,
                                                    timestamps: ['3'],
                                                    folder: 'static_thumbnails/',
                                                    size: '640x?'
                                                })
                                            // var cmds = ffmpegPath;
                                            // var outputs = 'static_thumbnails/' + VideoThumBanameRandom
                                            // var feed_files = 'static_thumbnails/' + VideoThumBanameRandom
                                            // var args1 = [
                                            //     '-y',
                                            //     '-i', feed_files,
                                            //     //   '-vframes', '1',
                                            //     '-q:v', '1',
                                            //     '-vf', 'eq=gamma=1.5:saturation=2',
                                            //     //  '-vf', 'scale=-1:120:title=100*1',
                                            //     //  '-vf', 'scale=192:168',
                                            //     outputs

                                            // ];
                                            // var proc = spawn(cmds, args1);
                                            // proc.stdout.on('data', function (data) {
                                            // });

                                            // proc.stderr.on('data', function (data) {
                                            // });
                                            // proc.on('close', function () {
                                            // })

                                        }


                                        FeedFileSPath = 'static_thumbnails/' + VideoThumBanameRandom;


                                    }


                                    var preview_urlPath = 'static_thumbnails/' + VideoThumBanameRandom;

                                    //   feed_file_path1.push(req.files[i]['path']);

                                    // video compression

                                    var cmd = ffmpegPath;
                                    var fmps = file;
                                    var output = 'static_feeds_files_comprs/' + fmps
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
                                        '-c:v', 'libx264',
                                        //'-bufsize', '2M',
                                        '-pass', '1',
                                        '-preset', 'veryfast',
                                        '-movflags', 'faststart',
                                        '-crf', '30',
                                        '-f', 'mp4',

                                        output
                                    ];
                                    var proc = spawn(cmd, args);
                                    proc.stdout.on('data', function(data) {});

                                    proc.stderr.on('data', function(data) {});

                                    proc.on('close', function() {

                                        feed_file_path1.push(output);
                                        feed_file_path = feed_file_path1.toString();
                                        // fs.unlink(FName, (err) => {
                                        //     if (err) throw err;
                                        //     console.log('successfully deleted ' + FName);
                                        // });
                                        // Video Insert Code Start

                                                            var feed_hash_tags = 'diy'
                                                            var SplitHasTags = feed_hash_tags.split(',');
                                                            var tagsarr = [];
                                                            if (feed_hash_tags.indexOf(',') != -1) {

                                                                for (var i = 0; i < SplitHasTags.length; i++) {
                                                                    tagsarr.push(SplitHasTags[i]);

                                                                }

                                                            } else {

                                                                tagsarr.push(feed_hash_tags);
                                                            }
                                                            /*var current = new Date();
                                                            var date1 = new Date(current.getTime() + 86400000);*/
                                                            var date = new Date()
                                                            var date1 = date.setFullYear(date.getFullYear() + 20)


                                                            // add a day date.setDate(date.getDate() + 1);
                                                            var feeds_expiry_time = new Date(date1).toISOString();
                                                            //var isdate =feeds_expiry_time

                                                            const Iv_feeds = new iv_feeds({

                                                                _id: new mongoose.Types.ObjectId(),
                                                                iv_acountid: ObjectId("5d135ad0a061df3a1512da3d"),
                                                                feed_file_path: feed_file_path,
                                                                feed_type: 'video',
                                                                feed_desc: 'Trending on fvmegear',
                                                                privacy_mode: 1,
                                                                comments_privacy: 2,
                                                                video_duration: video_duration,
                                                                screen_directory: "",
                                                                screen_shot_count: 0,
                                                                screen_directory_status: 1,
                                                                preview_url: preview_urlPath,
                                                                feeds_hash_tags: tagsarr,
                                                                profile_url: ObjectId("5d135ad0a061df3a1512da3d"),
                                                                feeds_expiry_time_: feeds_expiry_time,
                                                                feed_post_create: createDate,
                                                                is_static_feed: true


                                                            });
                                                            Iv_feeds
                                                                .save()
                                                                .then(result => {

                                                                    var lastinsertid = result._id;

                                                                    /* Tracking Tags End */

                                                                    iv_feeds.find({ _id: lastinsertid })
                                                                        .populate('iv_acountid profile_url', 'profileimage _id username')
                                                                        .exec()
                                                                        .then(docs => {

                                                                            if (String(docs[0].iv_acountid._id) == String('5d135ad0a061df3a1512da3d')) {
                                                                                var is_self_feed = true;
                                                                            } else {
                                                                                var is_self_feed = false;
                                                                            }
                                                                            if (!isEmpty(docs[0].profile_url.profileimage) && docs[0].profile_url.profileimage != null) {
                                                                                var profileimage = constants.APIBASEURL + docs[0].profile_url.profileimage;
                                                                            } else {

                                                                                var profileimage = constants.APIBASEURL + 'uploads/userimage.png';
                                                                            }

                                                                            const username = docs[0].iv_acountid.username


                                                                            var date = new Date()
                                                                            var date1 = date.setTime(date.getTime());


                                                                            var dateNow = new Date(date1).toISOString();


                                                                            var dateB = moment(dateNow);
                                                                            var dateC = moment(docs[0].feeds_expiry_time_);

                                                                            var t = Date.parse(docs[0].feeds_expiry_time_) - Date.parse(dateNow);
                                                                            var seconds1 = Math.floor((t / 1000) % 60);
                                                                            var minutes1 = Math.floor((t / 1000 / 60) % 60);
                                                                            var hours1 = Math.floor((t / (1000 * 60 * 60)) % 24);
                                                                            var days1 = Math.floor(t / (1000 * 60 * 60 * 24));

                                                                            if (seconds1 == 0) {
                                                                                var seconds = '00';
                                                                            } else if (seconds1 < 0) {
                                                                                var seconds = '00';
                                                                            } else {
                                                                                var seconds = seconds1;

                                                                            }

                                                                            if (minutes1 == 0) {
                                                                                var minutes = '00';
                                                                            } else if (minutes1 < 0) {
                                                                                var minutes = '00';
                                                                            } else {
                                                                                var minutes = minutes1;

                                                                            }

                                                                            if (hours1 == 0) {
                                                                                var hours = '00';
                                                                            } else if (hours1 < 0) {
                                                                                var hours = '00';
                                                                            } else {
                                                                                var hours = hours1;

                                                                            }

                                                                            if (days1 == 0) {
                                                                                var days = '00';
                                                                            } else if (days1 < 0) {
                                                                                var days = '00';
                                                                            } else {
                                                                                var days = days1;

                                                                            }

                                                                            feedtags.find({ feedTag_name: { $in: tagsarr } })
                                                                                .exec()
                                                                                .then(doc => {
                                                                                    if (doc.length > 0) {
                                                                                        doc.forEach(function(ele) {
                                                                                            tagsarr.forEach(function(elem) {
                                                                                                if (ele.feedTag_name === elem) {
                                                                                                    var date1 = new Date()
                                                                                                    var date2 = ele.feedTag_today

                                                                                                    var today = date1.setHours(0, 0, 0, 0);
                                                                                                    var feed_date = date2.setHours(0, 0, 0, 0);

                                                                                                    if (today != feed_date) {
                                                                                                        feedtags.findOneAndUpdate({ _id: ObjectId(ele._id) }, {
                                                                                                                $inc: {
                                                                                                                    feedTag_used: 1,
                                                                                                                    feedTag_used_today: 1
                                                                                                                },
                                                                                                                $set: { feedTag_today: Date.now() }
                                                                                                            }).exec()
                                                                                                            .then(ress => {}).catch(err => { //catch for offer_id find.
                                                                                                                var spliterror = err.message.split("_")
                                                                                                                if (spliterror[1].indexOf("id") >= 0) {
                                                                                                                    /*  res.status(200).json({
                                                                                                                        status: 'Failed',
                                                                                                                        message: "Please provide correct Tag _id"
                                                                                                                      }); */
                                                                                                                } else {
                                                                                                                    res.status(500).json({
                                                                                                                        status: 'Failed',
                                                                                                                        message: err.message
                                                                                                                    });
                                                                                                                }
                                                                                                            });
                                                                                                    } else {
                                                                                                        feedtags.findOneAndUpdate({ _id: ObjectId(ele._id) }, {
                                                                                                                $inc: {
                                                                                                                    feedTag_used: 1,
                                                                                                                    feedTag_used_today: 1
                                                                                                                }
                                                                                                            }).exec()
                                                                                                            .then(ress => {}).catch(err => { //catch for offer_id find.
                                                                                                                var spliterror = err.message.split("_")
                                                                                                                if (spliterror[1].indexOf("id") >= 0) {
                                                                                                                    /*  res.status(200).json({
                                                                                                                        status: 'Failed',
                                                                                                                        message: "Please provide correct Tag _id"
                                                                                                                      }); */
                                                                                                                } else {
                                                                                                                    /*  res.status(500).json({
                                                                                                                          status: 'Failed',
                                                                                                                         message: err.message
                                                                                                                     }); */
                                                                                                                }
                                                                                                            });
                                                                                                    }
                                                                                                } else {
                                                                                                    var fTags = new feedtags({
                                                                                                        _id: new mongoose.Types.ObjectId(),
                                                                                                        feedTag_name: elem,
                                                                                                        feedTag_used: 1,
                                                                                                        feedTag_today: Date.now(),
                                                                                                        feedTag_used_today: 1
                                                                                                    })
                                                                                                    fTags.save()
                                                                                                        .then(reqq => {}).catch(err => { // catch the tags schema save errors here
                                                                                                            /*    var spliterror=err.message.split(":")
                                                               res.status(500).json({
                                                                  status: 'Failed',
                                                                message: spliterror[0]+spliterror[1]
                                                              });*/
                                                                                                        });
                                                                                                }
                                                                                            })
                                                                                        })
                                                                                    } else {
                                                                                        tagsarr.forEach(function(elem) {
                                                                                            var fTag = new feedtags({
                                                                                                _id: new mongoose.Types.ObjectId(),
                                                                                                feedTag_name: elem,
                                                                                                feedTag_used: 1,
                                                                                                feedTag_today: Date.now(),
                                                                                                feedTag_used_today: 1
                                                                                            })
                                                                                            fTag.save()
                                                                                                .then(reqq => {}).catch(err => { // catch the tags schema save errors here
                                                                                                    var spliterror = err.message.split(":")
                                                                                                    res.status(500).json({
                                                                                                        status: 'Failed',
                                                                                                        message: spliterror[0] + spliterror[1]
                                                                                                    });
                                                                                                });
                                                                                        })

                                                                                    }
                                                                                }).catch(err => {
                                                                                    var spliterror = err.message.split(":")
                                                                                    res.status(500).json({
                                                                                        status: 'Failed',
                                                                                        message: spliterror[0] + spliterror[1]
                                                                                    });
                                                                                });


                                                                            var calculatetime = hours + ':' + minutes + ':' + days;

                                                                            var duration = Date.parse(docs[0].feeds_expiry_time_);


                                                                            if (docs[0].feed_type === 'video') {
                                                                                if (!isEmpty(docs[0].feed_file_path) && docs[0].feed_file_path != null) {


                                                                                    var video_streaming_url = constants.APIBASEURL + docs[0].feed_file_path;
                                                                                } else {
                                                                                    var video_streaming_url = "";
                                                                                }
                                                                                var preview_url
                                                                                if (isEmpty(docs[0].preview_url)) {

                                                                                    preview_url = constants.APIBASEURL + 'feeds_files/2019-03-06T11_28_33.969Zxhdpi-at-3-seconds.png';
                                                                                } else {

                                                                                    preview_url = constants.APIBASEURL + docs[0].preview_url;

                                                                                    //preview_url = constants.APIBASEURL+'thumbnail/480x320.png';
                                                                                }


                                                                            } else {
                                                                                if (!isEmpty(docs[0].feed_file_path) && docs[0].feed_file_path != null) {
                                                                                    var string = docs[0].feed_file_path;
                                                                                    var array = string.split(",");

                                                                                    var files = [];
                                                                                    if (array.indexOf(',') != -1) {
                                                                                        for (i = 0; i < array.length; i++) {
                                                                                            var filePath = constants.APIBASEURL + array[i];
                                                                                            files.push(filePath)
                                                                                        }
                                                                                    } else {
                                                                                        files.push(constants.APIBASEURL + docs[0].feed_file_path)
                                                                                    }

                                                                                    var video_streaming_url = files;
                                                                                } else {
                                                                                    var video_streaming_url = [];
                                                                                }
                                                                                var preview_url = video_streaming_url[0];
                                                                            }

                                                                            feedinfo = {

                                                                                "feed_id": docs[0]._id,
                                                                                "feed_desc": docs[0].feed_desc,
                                                                                "feeds_tags": docs[0].feeds_hash_tags,
                                                                                "feed_type": docs[0].feed_file_type,
                                                                                "userid": docs[0].iv_acountid._id,
                                                                                "expiry_time": duration,
                                                                                "rating": docs[0].no_rating,
                                                                                "no_shares": docs[0].no_shares,
                                                                                "no_likes": docs[0].no_likes,
                                                                                "no_views": docs[0].no_views,
                                                                                "comments_privacy": docs[0].comments_privacy,
                                                                                "privacy_mode": docs[0].privacy_mode,
                                                                                "profile_url": profileimage,
                                                                                "preview_url": preview_url,
                                                                                "has_sensitive_content": false,
                                                                                "is_under_challenge": "",
                                                                                "challenge_details": {
                                                                                    "challenged_by": "",
                                                                                    "challenged_feed_id": ""
                                                                                },
                                                                                "is_self_feed": is_self_feed,
                                                                                "ad_details": {
                                                                                    "ad_type": "",
                                                                                    "ad_files": [],
                                                                                    "offer_id": "",
                                                                                    "ads_price_id": ""
                                                                                },
                                                                                "comment_privacy": 0,
                                                                                "repost_details": {
                                                                                    "original_userid": "",
                                                                                    "original_feed_id": "",
                                                                                    "original_user_img_url": ""

                                                                                }

                                                                            }
                                                                            var msgbody = 'Your post is live now'
                                                                            const note_no = Math.floor(10000000000 + Math.random() * 90000000000);
                                                                            notificationModel.findOneAndUpdate({ userid: ObjectId("5d135ad0a061df3a1512da3d") }, {
                                                                                    $push: {
                                                                                        notifications: {
                                                                                            notification_data: msgbody,
                                                                                            member_id: ObjectId("5d135ad0a061df3a1512da3d"),
                                                                                            notification_type: 'feed_details',
                                                                                            notification_number: note_no,
                                                                                            username: docs[0].iv_acountid.username,
                                                                                            item_id: docs[0]._id,
                                                                                            profileimage: ObjectId("5d135ad0a061df3a1512da3d"),
                                                                                            created_at: Date.now(),
                                                                                            feed_type: docs[0].feed_type
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


                                                                                        fcmModel.find({ userid: "5d135ad0a061df3a1512da3d" })
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
                                                                                                            notification_slug: 'feed_details',
                                                                                                            url: constants.APIBASEURL + profileimage,
                                                                                                            username: docs[0].iv_acountid.username,
                                                                                                            item_id: docs[0]._id,
                                                                                                            preview_url: constants.APIBASEURL + docs[0].preview_url,
                                                                                                            userid: "",
                                                                                                            feed_id: "",
                                                                                                            member_feed_id: "",
                                                                                                            member_id: "",
                                                                                                            is_from_push: true,
                                                                                                            feed_type: docs[0].feed_type
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
                                                                                                    // res.status(200).json({
                                                                                                    //     status: "Ok",
                                                                                                    //     message: "Successfully Created Feed",
                                                                                                    //     feeds: feedinfo
                                                                                                    // });

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


                                                                        });

                                                                })
                                                                .catch(err => { // catch the auth schema save errors here
                                                                    console.log(err)
                                                                    // var spliterror = err.message.split(":")
                                                                    // res.status(500).json({
                                                                    //     status: 'Failed',
                                                                    //     message: spliterror[0] + spliterror[1]
                                                                    // });

                                                                });

                                                        

                                        // Video End COde

                                    })

                                }); // Video Metadata get duration





                            
                       
                    
                }).catch(err => {
                    var spliterror = err.message.split(":")
                    res.status(500).json({
                        status: 'Failed',
                        message: spliterror[0]
                    });
                });

        });
    });


});


router.get("/compress_files", (req, res, next) => {

   // const { getVideoDurationInSeconds } = require('get-video-duration')
 
        // From a local path...


    //const path = require('path');
    //const fs = require('fs');
    //joining path of directory 
    const directoryPath = path.join('/home/ubuntu/FvmeGear/', 'static_files');
    //passsing directoryPath and callback function
    fs.readdir(directoryPath, function(err, files) {
        //handling error
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        }
        //listing all files using forEach
        files.forEach(function(file) {
            // Do whatever you want to do with the file
            //var keyArray = [];
            var datetime = new Date();
            //console.log(datetime.toISOString().slice(0,10));
            //console.log(datetime.toISOString().slice(0, 19).replace('T', ' '););
           // var key = Object.keys(req.body);
            var feed_file_path = "";
            var feed_file_path1 = [];
            var createDate = dt.format('Y-m-d H:M:S');

          //  User.find({ _id: ObjectId('5d135ad0a061df3a1512da3d') })
         //       .exec()
          //      .then(email_details => {
                       

                        var nanonetsResponse;
                        var nanonetsVerificationStatus;
                        var nanonetsSfwStatus = [];
                        var nanonetsNSfwStatus = [];
                        var Directoryname = randtoken.generate(5);


                                //console.log(req.files);

                                var INPUT_path_to_your_images, OUTPUT_path;
                                var FeedFileSPath;
                                var tokenPng = randtoken.generate(9);
                                var VideoThumBanameRandom = new Date().toISOString() + tokenPng + 'xhdpi-atseconds.jpg';
                                var moment_test = moment().format('Z')
                                console.log(moment_test)



                                var FName = 'static_files/' + file


                                // Video thumbnails

                                ffmpeg.ffprobe(FName, function(err, metadata) {

                                    // var display_aspect_ratio = '16:9'
                                    // var video_duration = 0
                                    // getVideoDurationInSeconds(constants.APIBASEURL+"static_files/"+file).then((duration) => {
                                    //       console.log(duration)
                                    //       video_duration = duration
                                    //     })

                                    /* Directory Names Creating , We are taken Multiple Screen Shorts */
                                    // var AverageSnds = math.divide(video_duration, 3);
                                    //var ScreenShotsCount = AverageSnds;
                                    //var ScreenShotsCount = math.divide(video_duration,AverageSnds);

                                    //var FinalScreenShotsCount = 0


                                    // mkdirp('feeds_files/' + Directoryname, 0777);
                                    // var ffmScreenShots = ffmpeg(FName)
                                    //     .on('end', function () {

                                    //     })
                                    //     .on('error', function (err) {
                                    //         console.error(err);
                                    //     })
                                    //     .screenshots({
                                    //         // Will take screenshots at 20%, 40%, 60% and 80% of the video
                                    //         count: FinalScreenShotsCount,
                                    //         folder: 'feeds_files/' + Directoryname
                                    //     });

                                    /* End Directory Names Creating , We are taken Multiple Screen Shorts */
                                    // if (display_aspect_ratio == '16:9') {

                                    //     //  var SplitFileName = req.files[i]['originalname'].split('.');
                                    //     if (video_duration <= 3) {
                                    //         var timeSeconds = 1
                                    //         ffmpeg(FName)
                                    //             .screenshots({
                                    //                 filename: VideoThumBanameRandom,
                                    //                 timestamps: [timeSeconds],
                                    //                 folder: 'static_thumbnails/',
                                    //                 size: '640x?'
                                    //             })
                                    //         // var cmds = ffmpegPath;
                                    //         // var outputs = 'static_thumbnails/' + VideoThumBanameRandom
                                    //         // var feed_files = 'static_thumbnails/' + VideoThumBanameRandom
                                    //         // var args1 = [
                                    //         //     '-y',
                                    //         //     '-i', feed_files,
                                    //         //     //   '-vframes', '1',
                                    //         //     '-q:v', '1',
                                    //         //     '-vf', 'eq=gamma=1.5:saturation=2',
                                    //         //     //  '-vf', 'scale=-1:120:title=100*1',
                                    //         //     //  '-vf', 'scale=192:168',
                                    //         //     outputs

                                    //         // ];
                                    //         // var proc = spawn(cmds, args1);
                                    //         // proc.stdout.on('data', function (data) {
                                    //         // });

                                    //         // proc.stderr.on('data', function (data) {
                                    //         // });
                                    //         // proc.on('close', function () {
                                    //         // })

                                    //     } else {

                                    //         ffmpeg(FName)
                                    //             .screenshots({
                                    //                 filename: VideoThumBanameRandom,
                                    //                 timestamps: ['3'],
                                    //                 folder: 'static_thumbnails/',
                                    //                 size: '640x?'
                                    //             })
                                    //         // var cmds = ffmpegPath;
                                    //         // var outputs = 'static_thumbnails/' + VideoThumBanameRandom
                                    //         // var feed_files = 'static_thumbnails/' + VideoThumBanameRandom
                                    //         // var args1 = [
                                    //         //     '-y',
                                    //         //     '-i', feed_files,
                                    //         //     //   '-vframes', '1',
                                    //         //     '-q:v', '1',
                                    //         //     '-vf', 'eq=gamma=1.5:saturation=2',
                                    //         //     //  '-vf', 'scale=-1:120:title=100*1',
                                    //         //     //  '-vf', 'scale=192:168',
                                    //         //     outputs

                                    //         // ];
                                    //         // var proc = spawn(cmds, args1);
                                    //         // proc.stdout.on('data', function (data) {
                                    //         // });

                                    //         // proc.stderr.on('data', function (data) {
                                    //         // });
                                    //         // proc.on('close', function () {
                                    //         // })

                                    //     }


                                    //     FeedFileSPath = 'static_thumbnails/' + VideoThumBanameRandom;
                                        

                                    //                             INPUT_path_to_your_images = 'thumbnail/'+VideoThumBanameRandom;
                                    //          OUTPUT_path = 'thumbnails/';compress_images(INPUT_path_to_your_images, OUTPUT_path, {compress_force: false, statistic: true, autoupdate: true}, false,
                                    //         {jpg: {engine: 'mozjpeg', command: ['-quality', '20']}},
                                    //          //{png: {engine: 'optipng', command: false}},
                                    //         {png: {engine: 'pngcrush', command: ['-reduce', '-brute']}},
                                    //         {svg: {engine: 'svgo', command: '--multipass'}},
                                    //         {gif: {engine: 'gifsicle', command: ['--colors', '64', '--use-col=web']}}, function(error, completed, statistic){

                                    //         });
                                                    
                                    // } else {

                                    //     // var SplitFileName = req.files[i]['originalname'].split('.');
                                    //     if (video_duration <= 3) {
                                    //         var timeSeconds = 1
                                    //         ffmpeg(FName)
                                    //             .screenshots({
                                    //                 filename: VideoThumBanameRandom,
                                    //                 timestamps: [timeSeconds],
                                    //                 folder: 'static_thumbnails/',
                                    //                 size: '640x?'
                                    //             })
                                    //         // var cmds = ffmpegPath;
                                    //         // var outputs = 'static_thumbnails/' + VideoThumBanameRandom
                                    //         // var feed_files = 'static_thumbnails/' + VideoThumBanameRandom
                                    //         // var args1 = [
                                    //         //     '-y',
                                    //         //     '-i', feed_files,
                                    //         //     //   '-vframes', '1',
                                    //         //     '-q:v', '1',
                                    //         //     '-vf', 'eq=gamma=1.5:saturation=2',
                                    //         //     //  '-vf', 'scale=-1:120:title=100*1',
                                    //         //     //  '-vf', 'scale=192:168',
                                    //         //     outputs

                                    //         // ];
                                    //         // var proc = spawn(cmds, args1);
                                    //         // proc.stdout.on('data', function (data) {
                                    //         // });

                                    //         // proc.stderr.on('data', function (data) {
                                    //         // });
                                    //         // proc.on('close', function () {
                                    //         // })

                                    //     } else {
                                    //         ffmpeg(FName)
                                    //             .screenshots({
                                    //                 filename: VideoThumBanameRandom,
                                    //                 timestamps: ['3'],
                                    //                 folder: 'static_thumbnails/',
                                    //                 size: '640x?'
                                    //             })
                                    //         // var cmds = ffmpegPath;
                                    //         // var outputs = 'static_thumbnails/' + VideoThumBanameRandom
                                    //         // var feed_files = 'static_thumbnails/' + VideoThumBanameRandom
                                    //         // var args1 = [
                                    //         //     '-y',
                                    //         //     '-i', feed_files,
                                    //         //     //   '-vframes', '1',
                                    //         //     '-q:v', '1',
                                    //         //     '-vf', 'eq=gamma=1.5:saturation=2',
                                    //         //     //  '-vf', 'scale=-1:120:title=100*1',
                                    //         //     //  '-vf', 'scale=192:168',
                                    //         //     outputs

                                    //         // ];
                                    //         // var proc = spawn(cmds, args1);
                                    //         // proc.stdout.on('data', function (data) {
                                    //         // });

                                    //         // proc.stderr.on('data', function (data) {
                                    //         // });
                                    //         // proc.on('close', function () {
                                    //         // })

                                    //     }


                                    //     FeedFileSPath = 'static_thumbnails/' + VideoThumBanameRandom;


                                    // }


                                   // var preview_urlPath = 'static_thumbnails/' + VideoThumBanameRandom;

                                    //   feed_file_path1.push(req.files[i]['path']);

                                    // video compression

                                    var cmd = ffmpegPath;
                                    var fmps = file;
                                    var output = 'static_output/' + fmps
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
                                        '-c:v', 'libx264',
                                        //'-bufsize', '2M',
                                        '-pass', '1',
                                        '-preset', 'veryfast',
                                        '-movflags', 'faststart',
                                        '-crf', '30',
                                        '-f', 'mp4',

                                        output
                                    ];
                                    var proc = spawn(cmd, args);
                                    proc.stdout.on('data', function(data) {});

                                    proc.stderr.on('data', function(data) {});

                                    proc.on('close', function() {

                                        console.log("done")

                                                        

                                        // Video End COde

                                    })

                                }); // Video Metadata get duration





                            
                       
                    
                // }).catch(err => {
                //     var spliterror = err.message.split(":")
                //     res.status(500).json({
                //         status: 'Failed',
                //         message: spliterror[0]
                //     });
                // });

        });
    });


});


module.exports = router;