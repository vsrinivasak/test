const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const base64 = require('base-64');
const utf8 = require('utf8');
const constants = require("../constants/constants");
const User = require("../models/user");
const authModel = require("../models/auth");
const fcmModel = require("../models/fcmtoken");
const categoryModel = require("../models/iv_category");
const business_profile = require("../models/businessprofile");
const details = require("../models/userDetails");
const contactsModel = require("../models/contacts");
const notificationModel = require("../models/notifications");
const multer = require('multer');
const FCM = require('fcm-node');
const userDetails = require("../models/userDetails");
const UIDGenerator = require('uid-generator');
const uidgen = new UIDGenerator(UIDGenerator.BASE36); 
const isEmpty = require("is-empty");
const ObjectId = require('mongodb').ObjectID;
const PasswordModel = require("../models/otpverify")
const http = require('http');
const Jimp = require('jimp');
const compress_images = require('compress-images');
var randtoken = require('rand-token');
var nodemailer = require('nodemailer');
var htmlToText = require('nodemailer-html-to-text').htmlToText;
const randomstring = require('randomstring');
var fs = require("fs");

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

router.post("/signup", (req, res, next) => {
 var keyArray = [ 'email',
  'username',
  'fullname',
  'age',
  'mobile',
  'gender',
  'imei',
  'deviceid',
  'language',
  'password',
  'usertype',
  'fcmtoken',
  'refby',
  'clientid' ];

  var key = Object.keys(req.body);
  if (keyArray.length == key.length && keyArray.every((v) => key.indexOf(v) >= 0)) {
    
    if(constants.AndriodClientId === req.body.clientid || constants.IosClientId === req.body.clientid){

      if(req.body.usertype === "generaluser"){
                    User.find({$and:[{ email: req.body.email },{username: req.body.username},{mobile: req.body.mobile}]})
                    .exec()
                    .then(user => {
                      if (user.length >= 1) {
                        return res.status(200).json({
                          status:"Failed",
                          message:"Mail already exists"
                        });
                      } else {

                          const refercode = Math.floor(1000 + Math.random() * 9000);
                          var tempPassword = req.body.password;
                          var bytes = utf8.encode(tempPassword);
                          var hash = constants.ApiConstant+base64.encode(bytes);
                          var users = ""
                        var mobile =""
                        var profileimage = profileimages(req.body.username)
                        if(req.body.mobile === ""){
                          users = new User({
                              _id: new mongoose.Types.ObjectId(),
                              email: req.body.email,
                              username: req.body.username,
                              fullname: req.body.fullname,
                              age:req.body.age,
                              gender:req.body.gender,
                              usertype:req.body.usertype,
                              imei: req.body.imei,
                              deviceid:req.body.deviceid,
                              language:req.body.language,
                              ref_Code:req.body.username+refercode,
                              refby: req.body.refby,
                              password: hash,
                              profileimage:profileimage
                            });
                        }
                        else{
                          users =  new User({
                              _id: new mongoose.Types.ObjectId(),
                              email: req.body.email,
                              username: req.body.username,
                              fullname: req.body.fullname,
                              age:req.body.age,
                              mobile:req.body.mobile,
                              gender:req.body.gender,
                              usertype:req.body.usertype,
                              imei: req.body.imei,
                              deviceid:req.body.deviceid,
                              language:req.body.language,
                              ref_Code:req.body.username+refercode,
                              refby: req.body.refby,
                              password: hash,
                              profileimage:profileimage
                            });
                        }
                          
                            users
                              .save()
                              .then(userCheck => {

                                //userDetails schema save
                                const newUserDetails= new details({
                                  _id: new mongoose.Types.ObjectId(),
                                  userid:userCheck._id,
                                  talent_points:100
                                })

                                  newUserDetails.save()
                                        .then(del =>{
                                        }).catch(err => {
                                                var spliterror=err.message.split(":")
                                                res.status(500).json({ 
                                                  status: 'Failed',
                                                  message: spliterror[0]
                                                });
                                        });

                                //contacts schema save
                                const newContacts= new contactsModel({
                                  _id: new mongoose.Types.ObjectId(),
                                  userid:userCheck._id,
                                })

                                  newContacts.save()
                                        .then(del =>{
                                        }).catch(err => {
                                                var spliterror=err.message.split(":")
                                                res.status(500).json({ 
                                                  status: 'Failed',
                                                  message: spliterror[0]
                                                });
                                        });

                                //notifications schema save
                                const notify = new notificationModel({
                                  _id: new mongoose.Types.ObjectId(),
                                  userid:userCheck._id,
                                })

                                notify.save()
                                      .then(dely =>{
                                      }).catch(err => {
                                                var spliterror=err.message.split(":")
                                                res.status(500).json({ 
                                                  status: 'Failed',
                                                  message: spliterror[0]
                                                });
                                        });


                                        const secretToken = randomstring.generate();
 
                                        console.log(secretToken);

                                        User.findOneAndUpdate({_id:userCheck._id},
                                          {$set:{email_token:secretToken}})
                                          .exec()
                                          .then(newdata1 =>{
                                          }).catch(err => {
                                           var spliterror=err.message.split(":")
                                            res.status(500).json({ 
                                               status: 'Failed',
                                               message: spliterror[0]+ spliterror[1]
                                            });
                                        });
    

                                       let transporter = nodemailer.createTransport({
                                         host: 'email-smtp.us-east-1.amazonaws.com',
                                         port: 465,
                                         secureConnection: true, // upgrade later with STARTTLS
                                         auth: {
                                             user: 'AKIAUXODAPAAGIPOV6H6',
                                             pass: 'BPfCccx4weCniuXGaIXHaGB28u2GcO8u5x1RjR9oxE8T'
                                         }
                                        
                                     });
                                

                                     let HelperOptions = {
                                         from: 'contact@ivicatechnologies.com',
                                         to: req.body.email,
                                         subject: req.body.username + ', Welcome to fvmegear',
                                        html:`<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                                        <html>
                                        
                                        <head>
                                            <meta charset="UTF-8">
                                            <meta content="width=device-width, initial-scale=1" name="viewport">
                                            <meta name="x-apple-disable-message-reformatting">
                                            <meta http-equiv="X-UA-Compatible" content="IE=edge">
                                            <meta content="telephone=no" name="format-detection">
                                            <title></title>
                                            <!--[if (mso 16)]>
                                            <style type="text/css">
                                            a {text-decoration: none;}
                                            </style>
                                            <![endif]-->
                                            <!--[if gte mso 9]><style>sup { font-size: 100% !important; }</style><![endif]-->
                                        </head>
                                  
                                        
                                        <body>
                                            <div class="es-wrapper-color">
                                                <!--[if gte mso 9]>
                                              <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
                                                <v:fill type="tile" color="#FFFFFF"></v:fill>
                                              </v:background>
                                            <![endif]-->
                                                <table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0">
                                                    <tbody>
                                                        <tr>
                                                            <td class="esd-email-paddings" valign="top">
                                                                <table class="es-header es-preheader esd-header-popover" cellspacing="0" cellpadding="0" align="center">
                                                                    <tbody>
                                                                        <tr>
                                                                            <td class="es-adaptive esd-stripe" esd-custom-block-id="2995" align="center">
                                                                                <table class="es-content-body" style="background-color: transparent;" width="600" cellspacing="0" cellpadding="0" align="center">
                                                                                    <tbody>
                                                                                        <tr>
                                                                                            <td class="esd-structure es-p10" align="left">
                                                                                                <!--[if mso]><table width="580"><tr><td width="390" valign="top"><![endif]-->
                                                                                                <!-- <table class="es-left" cellspacing="0" cellpadding="0" align="left">
                                                                                                    <tbody>
                                                                                                        <tr>
                                                                                                            <td class="esd-container-frame" width="390" align="left">
                                                                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                                    <tbody>
                                                                                                                        <tr>
                                                                                                                            <td class="es-infoblock esd-block-text es-m-txt-c" align="left">
                                                                                                                                <p><span style="text-align: center;">Put your preheader text here</span></p>
                                                                                                                            </td>
                                                                                                                        </tr>
                                                                                                                    </tbody>
                                                                                                                </table>
                                                                                                            </td>
                                                                                                        </tr>
                                                                                                    </tbody>
                                                                                                </table> -->
                                                                                                <!--[if mso]></td><td width="20"></td><td width="170" valign="top"><![endif]-->
                                                                                                <!-- <table class="es-right" cellspacing="0" cellpadding="0" align="right">
                                                                                                    <tbody>
                                                                                                        <tr>
                                                                                                            <td class="esd-container-frame" width="170" align="left">
                                                                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                                    <tbody>
                                                                                                                        <tr>
                                                                                                                            <td class="es-infoblock esd-block-text es-m-txt-c" align="right">
                                                                                                                                <p><a href="http://#" target="_blank">View in browser</a></p>
                                                                                                                            </td>
                                                                                                                        </tr>
                                                                                                                    </tbody>
                                                                                                                </table>
                                                                                                            </td>
                                                                                                        </tr>
                                                                                                    </tbody>
                                                                                                </table> -->
                                                                                                <!--[if mso]></td></tr></table><![endif]-->
                                                                                            </td>
                                                                                        </tr>
                                                                                    </tbody>
                                                                                </table>
                                                                            </td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                                <table class="es-content" cellspacing="0" cellpadding="0" align="center">
                                                                    <tbody>
                                                                        <tr>
                                                                            <td class="esd-stripe" esd-custom-block-id="28181" align="center">
                                                                                <table class="es-content-body" width="600" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center">
                                                                                    <tbody>
                                                                                        <tr>
                                                                                            <td class="esd-structure es-p15t es-p15b es-p20r es-p20l esd-checked"  esd-custom-block-id="28206" bgcolor="#F2F2F4" align="left">
                                                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                    <tbody>
                                                                                                        <tr>
                                                                                                            <td class="esd-container-frame" width="560" valign="top" align="center">
                                                                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                                    <tbody>
                                                                                                                        <tr>
                                                                                                                            <td class="esd-block-image" align="center">
                                                                                                                                <a target="_blank"> <img src=" http://ivicatechnologies.com/uploads/fvmegearlogo.png " alt="Quick taxi logo" title="Quick taxi logo" style="display: block;" width="92"> </a>
                                                                                                                            </td>
                                                                                                                            <td class="esd-block-image">
                                                                                                                                <h2>fvmegear </h2>
                                                                                                                                <p>Thanks  For Signup</p>
                                                                                                                            </td>
                                                                                                                        </tr>
                                                                                                                    </tbody>
                                                                                                                </table>
                                                                                                            </td>
                                                                                                        </tr>
                                                                                                    </tbody>
                                                                                                </table>
                                                                                            </td>
                                                                                        </tr>
                                                                                        <tr>
                                                                                            <td class="esd-structure es-p10b" esd-general-paddings-checked="false" align="left">
                                                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                    <tbody>
                                                                                                        <tr>
                                                                                                            <td class="esd-container-frame" width="600" valign="top" align="center">
                                                                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                                    <tbody>
                                                                                                                        <tr>
                                                                                                                            <td class="esd-block-spacer es-p5b" align="center">
                                                                                                                                <table width="100%" height="100%" cellspacing="0" cellpadding="0" border="0">
                                                                                                                                    <tbody>
                                                                                                                                        <tr>
                                                                                                                                            <td style="border-bottom: 1px solid rgb(239, 239, 239); background: rgba(0, 0, 0, 0) none repeat scroll 0% 0%; height: 1px; width: 100%; margin: 0px;"></td>
                                                                                                                                        </tr>
                                                                                                                                    </tbody>
                                                                                                                                </table>
                                                                                                                            </td>
                                                                                                                        </tr>
                                                                                                                    </tbody>
                                                                                                                </table>
                                                                                                            </td>
                                                                                                        </tr>
                                                                                                    </tbody>
                                                                                                </table>
                                                                                            </td>    
                                                                                        </tr>
                                                                                        <tr>
                                                                                            <td class="esd-structure es-p20t es-p20b es-p20r es-p20l" esd-custom-block-id="2997" style="background-position: center top;" align="left">
                                                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                    <tbody>
                                                                                                        <tr>
                                                                                                            <td>
                                                                                                             <img src="http://ivicatechnologies.com/uploads/template.png" alt="Petshop logo" title="Petshop logo" width="600" height="250" style="display: block;">
                                                                                                            </td>
                                                                                                        </tr>
                                                                                                    </tbody>
                                                                                                </table>      
                                                                                            </td>
                                                                                        </tr>
                                                                                        <tr>
                                                                                            <td class="esd-structure es-p20t es-p20b es-p20r es-p20l" esd-custom-block-id="2997" style="background-position: center top;" bgcolor="#F2F2F4" align="left">
                                                                                                <table width="100%"  height="30%" cellspacing="0" cellpadding="0">
                                                                                                    <tbody>
                                                                                                        <tr>
                                                                                                            <td class="esd-block-text es-p5t" align="center">
                                                                                                                <h3>Please click below link to verify your E-mail address</h3>
                                                                                                               <a style=" background-color: #42daf5;
                                                                                                               border: none;
                                                                                                               color: white;
                                                                                                               padding: 10px 20px;
                                                                                                               text-align: center;
                                                                                                               text-decoration: none;
                                                                                                               display: inline-block;
                                                                                                               margin: 4px 2px;
                                                                                                               cursor: pointer;
                                                                                                               border-radius: 16px; " href="http://ivicatechnologies.com/verification.php?secretToken=${secretToken}" >click here</a>
                                                                                                                <p><br></p>
                                                                                                            </td>
                                                                                                        </tr>
                                                                                                    </tbody>
                                                                                                </table>
                                                                                            </td>
                                                                                        </tr>
                                                                                        <tr>
                                                                                            <td class="esd-structure es-p10t es-p10b es-p20r es-p20l" esd-general-paddings-checked="false" style="background-position: center center;" align="left">
                                                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                    <tbody>
                                                                                                        <tr>
                                                                                                            <td class="esd-container-frame" width="560" valign="top" align="center">
                                                                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                                    <tbody>
                                                                                                                        <tr>
                                                                                                                            <td class="esd-block-spacer es-p5t es-p5b" align="center">
                                                                                                                                <table width="100%" height="40%" cellspacing="0" cellpadding="0" border="0">
                                                                                                                                    <tbody>
                                                                                                                                        <tr>
                                                                                                                                            <td style="border-bottom: 1px solid rgb(239, 239, 239); background: rgba(0, 0, 0, 0) none repeat scroll 0% 0%; width: 100%; margin: 0px;"></td>
                                                                                                                                        </tr>
                                                                                                                                    </tbody>
                                                                                                                                </table>
                                                                                                                            </td>
                                                                                                                        </tr>
                                                                                                                    </tbody>
                                                                                                                </table>
                                                                                                            </td>
                                                                                                        </tr>
                                                                                                    </tbody>
                                                                                                </table>
                                                                                            </td>
                                                                                        </tr>
                                                                                    </tbody>
                                                                                </table>
                                                                            </td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                                <table class="es-footer esd-footer-popover" cellspacing="0" cellpadding="0" align="center" bgcolor="#c93939">
                                                                    <tbody>
                                                                        <tr> </tr>
                                                                        <tr>
                                                                            <td class="esd-stripe" esd-custom-block-id="3007" align="center">
                                                                                <table class="es-footer-body" width="600" cellspacing="0" cellpadding="0" align="center" bgcolor="#c93939">
                                                                                    <tbody>
                                                                                        <tr>
                                                                                            <td class="esd-structure es-p20" esd-general-paddings-checked="false" style="background-position: left top;" align="left" bgcolor="#c93939">
                                                                                                <!--[if mso]><table width="560" cellpadding="0" cellspacing="0"><tr><td width="178" valign="top"><![endif]-->
                                                                                                <table class="es-left" cellspacing="0" cellpadding="0" align="left">
                                                                                                    <tbody>
                                                                                                        <tr>
                                                                                                            <td class="es-m-p0r es-m-p20b esd-container-frame" width="150" align="center" bgcolor="#c93939">
                                                                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                                    <tbody>
                                                                                                                        <tr>
                                                                                                                            <br>
                                                                                                                            <td class="esd-block-image" align="center"><br>
                                                                                                                                <a target="_blank"> <img src="http://ivicatechnologies.com/uploads/ivica%20a4.png" alt="Quick taxi logo" title="Quick taxi logo" width="50" style="display: block;"> </a>
                                                                                                                            </td>
                                                                                                                            <br>
                                                                                                                        </tr>
                                                                                             
                                                                                                                    </tbody>
                                                                                                                </table>
                                                                                                            </td>
                                                                                                        </tr>
                                                                                                    </tbody>
                                                                                                </table>
                                                                                                <!--[if mso]></td><td width="20"></td><td width="362" valign="top"><![endif]-->
                                                                                                <table cellspacing="0" cellpadding="0" align="right">
                                                                                                    <tbody>
                                                                                                        <tr>
                                                                                                            <td class="esd-container-frame" width="362" align="left">
                                                                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                                    <tbody>
                                                                                                                        <tr>
                                                                                                                            <td class="esd-block-text es-p10b es-m-txt-c" align="left">
                                                                                                                                <h3>Contact us</h3>
                                                                                                                            </td>
                                                                                                                            <!-- <td class="es-p10r" valign="top" align="center"> 
                                                                                                                                <a target="_blank" href="https://www.linkedin.com/company/ivica-technologies-private-limited/about/?viewAsMember=true"><img title="LinkedIn" src="https://ivicatechnologies.in/uploads/linkedin.png" alt="Tw" width="24" height="24" hspace="20"> </a><br>
                                                                                                                            </td>
                                                                                                                            <td class="es-p10r" valign="top" align="right">
                                                                                                                                <a target="_blank" href="https://www.facebook.com/IvicaTechnologies/"><img title="Facebook" src="https://ivicatechnologies.in/uploads/facebook-logo-in-circular-button-outlined-social-symbol (1).png" alt="Fb" width="24" height="24"></a>
                                                                                                                            </td> -->
                                                                                                                        </tr>
                                                                                                                        <tr>
                                                                                                                            <td class="esd-block-text es-m-txt-c" esd-links-underline="none">
                                                                                                                                <font color="#333333"><span style="font-size: 14px;">IvicaTechnologies</span></font>
                                                                                                                            </td>
                                                                                                                           
                                                                                                                            
                                                                                                                        </tr>
                                                                                                                        <tr>
                                                                                                                            <td class="esd-block-text es-m-txt-c" esd-links-underline="none" align="left">
                                                                                                                                <font color="#333333"><span style="font-size: 14px;">contact@ivicatechnologies.com</span></font><br>
                                                                                                                                
                                                                                                                            </td>
                                                                                                                            
                                                                                                                        </tr>
                                                                                                                        <tr> 
                                                                                                                            <td class="esd-block-text es-m-txt-c" esd-links-underline="none" width="362" align="left">
                                                                                                                                <table class="es-social es-table-not-adapt" cellspacing="0" cellpadding="0">
                                                                                                                                    <tbody>
                                                                                                                                        <tr>
                                                                                                                                            <td class="esd-block-text es-m-txt-c" esd-links-underline="none" align="left"> <br>
                                                                                                                                                <a target="_blank" href="https://www.linkedin.com/company/ivica-technologies-private-limited/about/?viewAsMember=true"><img title="LinkedIn" src="http://ivicatechnologies.com/uploads/linkedin.png" alt="Tw" width="28" height="23" > </a><br>
                                                                                                                                            </td>
                                                                                                                                            <td class="es-p10r" valign="top" align="center"> <br>
                                                                                                                                                <a target="_blank" href="https://www.facebook.com/IvicaTechnologies/"><img title="Facebook" src=" http://ivicatechnologies.com/uploads/facebook-logo-in-circular-button-outlined-social-symbol(1).png" alt="Fb" width="28" height="23" hspace="30"></a>
                                                                                                                                            </td>
                                                                                                                                        </tr>  
                                                                                                                                    </tbody> 
                                                                                                                                </table>
                                                                                                                                <!-- <p><br></p> -->
                                                                                                                            </td>
                                                                                                                        </tr> 
                                                                                                                                                                              
                                                                                                                        <!-- <tr>
                                                                                                                            <td class="es-p10r" valign="top" align="center">
                                                                                                                                <a target="_blank" href="https://play.google.com/store/apps/details?id=ivicatechnologies.com.famegear"><img title="Facebook" src="https://ivicatechnologies.in/uploads/android.png" alt="Fb" width="100" height="30"></a>
                                                                                                                            </td>
                                                                                                                            <td class="es-p10r" valign="top" align="center">
                                                                                                                                <a target="_blank" href="https://itunes.apple.com/in/app/fvmegear/id1458770790?mt=8"><img title="Facebook" src="https://ivicatechnologies.in/uploads/ios.png" alt="Fb" width="100" height="30"></a>
                                                                                                                            </td>         
                                                                                                                        </tr>   -->
                                                                                                                        <tr>
                                                                                                                            <td class="esd-block-social es-p10t es-m-txt-c" align="left">
                                                                                                                                <table class="es-social es-table-not-adapt" cellspacing="0" cellpadding="0">
                                                                                                                                    <tbody>
                                                                                                                                        <tr>
                                                                                                                                            <td class="es-p10r" valign="top" align="center">
                                                                                                                                                <a target="_blank" href="https://play.google.com/store/apps/details?id=ivicatechnologies.com.famegear"><img title="Facebook" src=" http://ivicatechnologies.com/uploads/android.png" alt="Fb" width="100"></a>
                                                                                                                                            </td>
                                                                                                                                            <td class="es-p10r" valign="top" align="center">
                                                                                                                                                <a target="_blank" href="https://itunes.apple.com/in/app/fvmegear/id1458770790?mt=8"><img title="Facebook" src="http://ivicatechnologies.com/uploads/ios.png" alt="Fb" width="100" height="30" hspace="20"></a>
                                                                                                                                            </td> 
                                                                                                                                        </tr>  
                                                                                                                    
                                                                                                                                    </tbody> 
                                                                                                                                </table>
                                                                                                                                    <!-- <p><br></p> -->
                                                                                                                            </td>
                                                                                                                        </tr> 
                                                                                                                        <!-- <tr>
                                                                                                                            <td class="esd-block-text es-p10t es-m-txt-c" align="left">
                                                                                                                                <p style="font-size: 12px; line-height: 150%;">You are receiving this email because you subscribed to our site. Please note that you can&nbsp;<a target="_blank" style="font-size: 12px;">unsubscribe</a>&nbsp;at any time.</p>
                                                                                                                            </td>
                                                                                                                        </tr>  -->
                                                                                                                    </tbody>
                                                                                                                </table>
                                                                                                            </td>
                                                                                                        </tr>
                                                                                                    </tbody>
                                                                                                </table>
                                                                                                <!--[if mso]></td></tr></table><![endif]-->
                                                                                            </td>
                                                                                        </tr>
                                                                                    </tbody>
                                                                                </table>
                                                                            </td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                            <div style="position:absolute;left:-9999px;top:-9999px;"></div>
                                        </body>
                                        
                                        </html>`
                                       
                                     };
                                     transporter.use('compile', htmlToText(HelperOptions));
                                     
                                     transporter.sendMail(HelperOptions, (error, info) => {
                                         if (error) {
                                             return console.log(error);
                                         } else {
                                           //  console.log('The  message was sent!');
                                             return console.log(info);
                                         }
                                        
                                     });
                               
                                uidgen.generate((err, uid) => {
                                if (err) {
                                  var spliterror=err.message.split(":")
                                  res.status(500).json({ 
                                    status: 'Failed',
                                    message: spliterror[0]+spliterror[1]
                                  });
                                }
                                const token = uid;

                                // auth schema save
                                  const  authmodel= new authModel({
                                  _id: new mongoose.Types.ObjectId(),
                                  userid:userCheck._id,
                                  iv_token: token,
                                  imei: req.body.imei,
                                  deviceid:req.body.deviceid
                                });
                                authModel
                                  .find({userid:userCheck._id})
                                  .exec()
                                  .then(result => {
                                      if(result.length<1){
                                        authmodel.save()
                                        .then(data =>{
                                        }).catch(err => {
                                                var spliterror=err.message.split(":")
                                                res.status(500).json({ 
                                                  status: 'Failed',
                                                  message: spliterror[0]
                                                });
                                        });
                                      }
                                      else{
                                        authModel.findOneAndUpdate({userid:userCheck._id},
                                                      {$set:{iv_token:token,created_at:Date.now(),removed_at:null}})
                                                  .exec()
                                                  .then(newdata =>{
                                                  }).catch(err => {
                                                   var spliterror=err.message.split(":")
                                                    res.status(500).json({ 
                                                       status: 'Failed',
                                                       message: spliterror[0]+ spliterror[1]
                                                    });
                                                });
                                      }
                                        const newFcm = new fcmModel({
                                            _id: new mongoose.Types.ObjectId(),
                                            deviceid : req.body.deviceid,
                                            imei : req.body.imei,
                                            fcmtoken : req.body.fcmtoken,
                                            userid: userCheck._id,
                                            mobile:userCheck.mobile
                                          })
                                    newFcm.save()
                                      .then(newdata => {
                                          var emailcheck="";  
                                          var email_verified = false 
                                          if(userCheck.mobile_verified === 'true'){
                                              emailcheck=true;
                                          }else{
                                              emailcheck=false
                                          }
                                          if(userCheck.email_verified === 1){
                                                    email_verified=true;
                                                }else{
                                                    email_verified=false
                                                }

                                                    return res.status(200).json({
                                                            status: 'Ok',
                                                            message: 'Signed up successfully.',
                                                            userdetails:{
                                                              username: userCheck.username,
                                                              fullname: userCheck.fullname,
                                                              email:userCheck.email,
                                                              mobile:userCheck.mobile,
                                                              iv_token:token,
                                                              userid: userCheck._id,
                                                              is_verified: emailcheck,
                                                              email_verified:email_verified,
                                                              gender: userCheck.gender,
                                                              language: userCheck.language,
                                                              postscount: 0,
                                                              usertype: userCheck.usertype,
                                                              notificationcount: 0,
                                                              messagescount: 0,
                                                              bus_prof_id: userCheck.business_profile_id,
                                                              is_profile_completed: userCheck.is_profile_completed,
                                                              ref_Code:userCheck.ref_Code,
                                                              user_category:'Stellar',
                                                              email_token: secretToken
                                                            }
                                                          });
                                      }).catch(err => {
                                                var spliterror=err.message.split(":")
                                                res.status(500).json({ 
                                                  status: 'Failed',
                                                  message: spliterror[0]
                                                });
                                        });
                            }).catch(err => {                         // catch the auth schema save errors here 
                              if (err.code === 11000){
                                var error = err.errmsg;
                                 var spliterror = error.split(":")
                                  res.status(500).json({ 
                                    status: 'Failed',
                                    message: spliterror[2]
                                  })
                              }
                              else{
                              var spliterror=err.message.split(":")
                              res.status(500).json({ 
                                status: 'Failed',
                                message: spliterror[0]+spliterror[1]
                              });
                            }
                          });
                          });
                            }).catch(err => {                               // catch the user schema save errors here 
                              if (err.code === 11000){
                              var error = err.errmsg;
                              var spliterror = error.split(":")
                                  if(spliterror[2] === " email_1 dup key"){
                                      res.status(200).json({ 
                                        status: 'Failed',
                                        message: "Mail already exists"
                                      })
                                  }
                                  else if(spliterror[2] === " username_1 dup key"){
                                      res.status(200).json({ 
                                        status: 'Failed',
                                        message: "Username already exists"
                                      })
                                  }
                                  else if (spliterror[2] === " mobile_1 dup key"){
                                    if(req.body.mobile === ""){
                                      res.status(200).json({ 
                                        status: 'Failed',
                                        message: "Please provide the Mobile number"
                                      })
                                    }
                                    else{
                                      res.status(200).json({ 
                                        status: 'Failed',
                                        message: "Mobile number already exists"
                                      })
                                    }
                                      
                                  }
                                  else{
                                      res.status(500).json({ 
                                        status: 'Failed',
                                        message:spliterror[2]
                                      })
                                  }
                              }
                              else{
                              var spliterror=err.message.split(":")
                              res.status(500).json({ 
                                status: 'Failed',
                                message: spliterror[0]+spliterror[1]
                              });
                            }
                          });
                        } 
                    }).catch(err => {                               //catch for find email in the user table 
                        if (err.code === 11000){
                              var error = err.errmsg;
                              var spliterror = error.split(":")
                                  if(spliterror[2] === " email_1 dup key"){
                                      res.status(200).json({ 
                                        status: 'Failed',
                                        message: "Mail already exists"
                                      })
                                  }
                                  else if(spliterror[2] === " username_1 dup key"){
                                      res.status(200).json({ 
                                        status: 'Failed',
                                        message: "Username already exists"
                                      })
                                  }
                                  else if (spliterror[2] === " mobile_1 dup key"){
                                      if(req.body.mobile === ""){
                                      res.status(200).json({ 
                                        status: 'Failed',
                                        message: "Please provide the Mobile number"
                                      })
                                    }
                                    else{
                                      res.status(200).json({ 
                                        status: 'Failed',
                                        message: "Mobile number already exists"
                                      })
                                    }
                                  }
                                  else{
                                      res.status(500).json({ 
                                        status: 'Failed',
                                        message:spliterror[2]
                                      })
                                  }
                              }
                              else{
                              var spliterror=err.message.split(":")
                              res.status(500).json({ 
                                status: 'Failed',
                                message: spliterror[0]+spliterror[1]
                              });
                            }
                    });      
      }
      else if (req.body.usertype === "business"){                         //else if loop for usertype
                User.find({$and:[{ email: req.body.email },{username: req.body.username},{mobile: req.body.mobile}]})
                    .exec()
                    .then(user => {
                      if (user.length >= 1) {
                        return res.status(200).json({
                          status:"Failed",
                          message:"Mail already exists"
                        });
                      } else {
                          const code = Math.floor(1000 + Math.random() * 9000);
                          var tempPassword = req.body.password;
                          var bytes = utf8.encode(tempPassword);
                          var hash =  constants.ApiConstant+base64.encode(bytes);
                          const users = new User({
                              _id: new mongoose.Types.ObjectId(),
                              email: req.body.email,
                              username: req.body.username,
                              fullname: req.body.fullname,
                              age:req.body.age,
                              mobile:req.body.mobile,
                              gender:req.body.gender,
                              usertype:req.body.usertype,
                              imei: req.body.imei,
                              deviceid:req.body.deviceid,
                              language:req.body.language,
                              ref_Code:req.body.username+code,
                              refby: req.body.refby,
                              password: hash
                            });
                            users
                              .save()
                              .then(userCheck => {

                                //userDetails schema save
                                const dels= new details({
                                  _id: new mongoose.Types.ObjectId(),
                                  userid:userCheck._id,
                                })
                                
                                  dels.save()
                                        .then(data =>{
                                        }).catch(err => {
                                                var spliterror=err.message.split(":")
                                                res.status(500).json({ 
                                                  status: 'Failed',
                                                  message: spliterror[0]
                                                });
                                        });

                                //contacts schema save
                                const newCons= new contactsModel({
                                  _id: new mongoose.Types.ObjectId(),
                                  userid:userCheck._id,
                                })

                                  newCons.save()
                                        .then(del =>{
                                        }).catch(err => {
                                                var spliterror=err.message.split(":")
                                                res.status(500).json({ 
                                                  status: 'Failed',
                                                  message: spliterror[0]
                                                });
                                        });

                                   //notifications schema save
                                const notify = new notificationModel({
                                  _id: new mongoose.Types.ObjectId(),
                                  userid:userCheck._id,
                                })

                                notify.save()
                                      .then(dely =>{
                                      }).catch(err => {
                                                var spliterror=err.message.split(":")
                                                res.status(500).json({ 
                                                  status: 'Failed',
                                                  message: spliterror[0]
                                                });
                                        });


                                        const secretToken = randomstring.generate();
 
                                        console.log(secretToken);

                                        User.findOneAndUpdate({_id:userCheck._id},
                                          {$set:{email_token:secretToken}})
                                          .exec()
                                          .then(newdata1 =>{
                                          }).catch(err => {
                                           var spliterror=err.message.split(":")
                                            res.status(500).json({ 
                                               status: 'Failed',
                                               message: spliterror[0]+ spliterror[1]
                                            });
                                        });
    

                                       let transporter = nodemailer.createTransport({
                                         host: 'email-smtp.us-east-1.amazonaws.com',
                                         port: 465,
                                         secureConnection: true, // upgrade later with STARTTLS
                                         auth: {
                                             user: 'AKIAUXODAPAAGIPOV6H6',
                                             pass: 'BPfCccx4weCniuXGaIXHaGB28u2GcO8u5x1RjR9oxE8T'
                                         }
                                        
                                     });
                                

                                     let HelperOptions = {
                                         from: 'contact@ivicatechnologies.com',
                                         to: req.body.email,
                                         subject: req.body.username + ', Welcome to fvmegear',
                                        html:`<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                                        <html>
                                        
                                        <head>
                                            <meta charset="UTF-8">
                                            <meta content="width=device-width, initial-scale=1" name="viewport">
                                            <meta name="x-apple-disable-message-reformatting">
                                            <meta http-equiv="X-UA-Compatible" content="IE=edge">
                                            <meta content="telephone=no" name="format-detection">
                                            <title></title>
                                            <!--[if (mso 16)]>
                                            <style type="text/css">
                                            a {text-decoration: none;}
                                            </style>
                                            <![endif]-->
                                            <!--[if gte mso 9]><style>sup { font-size: 100% !important; }</style><![endif]-->
                                        </head>
                                  
                                        
                                        <body>
                                            <div class="es-wrapper-color">
                                                <!--[if gte mso 9]>
                                              <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
                                                <v:fill type="tile" color="#FFFFFF"></v:fill>
                                              </v:background>
                                            <![endif]-->
                                                <table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0">
                                                    <tbody>
                                                        <tr>
                                                            <td class="esd-email-paddings" valign="top">
                                                                <table class="es-header es-preheader esd-header-popover" cellspacing="0" cellpadding="0" align="center">
                                                                    <tbody>
                                                                        <tr>
                                                                            <td class="es-adaptive esd-stripe" esd-custom-block-id="2995" align="center">
                                                                                <table class="es-content-body" style="background-color: transparent;" width="600" cellspacing="0" cellpadding="0" align="center">
                                                                                    <tbody>
                                                                                        <tr>
                                                                                            <td class="esd-structure es-p10" align="left">
                                                                                                <!--[if mso]><table width="580"><tr><td width="390" valign="top"><![endif]-->
                                                                                                <!-- <table class="es-left" cellspacing="0" cellpadding="0" align="left">
                                                                                                    <tbody>
                                                                                                        <tr>
                                                                                                            <td class="esd-container-frame" width="390" align="left">
                                                                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                                    <tbody>
                                                                                                                        <tr>
                                                                                                                            <td class="es-infoblock esd-block-text es-m-txt-c" align="left">
                                                                                                                                <p><span style="text-align: center;">Put your preheader text here</span></p>
                                                                                                                            </td>
                                                                                                                        </tr>
                                                                                                                    </tbody>
                                                                                                                </table>
                                                                                                            </td>
                                                                                                        </tr>
                                                                                                    </tbody>
                                                                                                </table> -->
                                                                                                <!--[if mso]></td><td width="20"></td><td width="170" valign="top"><![endif]-->
                                                                                                <!-- <table class="es-right" cellspacing="0" cellpadding="0" align="right">
                                                                                                    <tbody>
                                                                                                        <tr>
                                                                                                            <td class="esd-container-frame" width="170" align="left">
                                                                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                                    <tbody>
                                                                                                                        <tr>
                                                                                                                            <td class="es-infoblock esd-block-text es-m-txt-c" align="right">
                                                                                                                                <p><a href="http://#" target="_blank">View in browser</a></p>
                                                                                                                            </td>
                                                                                                                        </tr>
                                                                                                                    </tbody>
                                                                                                                </table>
                                                                                                            </td>
                                                                                                        </tr>
                                                                                                    </tbody>
                                                                                                </table> -->
                                                                                                <!--[if mso]></td></tr></table><![endif]-->
                                                                                            </td>
                                                                                        </tr>
                                                                                    </tbody>
                                                                                </table>
                                                                            </td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                                <table class="es-content" cellspacing="0" cellpadding="0" align="center">
                                                                    <tbody>
                                                                        <tr>
                                                                            <td class="esd-stripe" esd-custom-block-id="28181" align="center">
                                                                                <table class="es-content-body" width="600" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center">
                                                                                    <tbody>
                                                                                        <tr>
                                                                                            <td class="esd-structure es-p15t es-p15b es-p20r es-p20l esd-checked"  esd-custom-block-id="28206" bgcolor="#F2F2F4" align="left">
                                                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                    <tbody>
                                                                                                        <tr>
                                                                                                            <td class="esd-container-frame" width="560" valign="top" align="center">
                                                                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                                    <tbody>
                                                                                                                        <tr>
                                                                                                                            <td class="esd-block-image" align="center">
                                                                                                                                <a target="_blank"> <img src=" http://ivicatechnologies.com/uploads/fvmegearlogo.png " alt="Quick taxi logo" title="Quick taxi logo" style="display: block;" width="92"> </a>
                                                                                                                            </td>
                                                                                                                            <td class="esd-block-image">
                                                                                                                                <h2>fvmegear </h2>
                                                                                                                                <p>Thanks  For Signup</p>
                                                                                                                            </td>
                                                                                                                        </tr>
                                                                                                                    </tbody>
                                                                                                                </table>
                                                                                                            </td>
                                                                                                        </tr>
                                                                                                    </tbody>
                                                                                                </table>
                                                                                            </td>
                                                                                        </tr>
                                                                                        <tr>
                                                                                            <td class="esd-structure es-p10b" esd-general-paddings-checked="false" align="left">
                                                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                    <tbody>
                                                                                                        <tr>
                                                                                                            <td class="esd-container-frame" width="600" valign="top" align="center">
                                                                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                                    <tbody>
                                                                                                                        <tr>
                                                                                                                            <td class="esd-block-spacer es-p5b" align="center">
                                                                                                                                <table width="100%" height="100%" cellspacing="0" cellpadding="0" border="0">
                                                                                                                                    <tbody>
                                                                                                                                        <tr>
                                                                                                                                            <td style="border-bottom: 1px solid rgb(239, 239, 239); background: rgba(0, 0, 0, 0) none repeat scroll 0% 0%; height: 1px; width: 100%; margin: 0px;"></td>
                                                                                                                                        </tr>
                                                                                                                                    </tbody>
                                                                                                                                </table>
                                                                                                                            </td>
                                                                                                                        </tr>
                                                                                                                    </tbody>
                                                                                                                </table>
                                                                                                            </td>
                                                                                                        </tr>
                                                                                                    </tbody>
                                                                                                </table>
                                                                                            </td>    
                                                                                        </tr>
                                                                                        <tr>
                                                                                            <td class="esd-structure es-p20t es-p20b es-p20r es-p20l" esd-custom-block-id="2997" style="background-position: center top;" align="left">
                                                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                    <tbody>
                                                                                                        <tr>
                                                                                                            <td>
                                                                                                             <img src="http://ivicatechnologies.com/uploads/template.png" alt="Petshop logo" title="Petshop logo" width="600" height="250" style="display: block;">
                                                                                                            </td>
                                                                                                        </tr>
                                                                                                    </tbody>
                                                                                                </table>      
                                                                                            </td>
                                                                                        </tr>
                                                                                        <tr>
                                                                                            <td class="esd-structure es-p20t es-p20b es-p20r es-p20l" esd-custom-block-id="2997" style="background-position: center top;" bgcolor="#F2F2F4" align="left">
                                                                                                <table width="100%"  height="30%" cellspacing="0" cellpadding="0">
                                                                                                    <tbody>
                                                                                                        <tr>
                                                                                                            <td class="esd-block-text es-p5t" align="center">
                                                                                                                <h3>Please click below link to verify your E-mail address</h3>
                                                                                                               <a style=" background-color: #42daf5;
                                                                                                               border: none;
                                                                                                               color: white;
                                                                                                               padding: 10px 20px;
                                                                                                               text-align: center;
                                                                                                               text-decoration: none;
                                                                                                               display: inline-block;
                                                                                                               margin: 4px 2px;
                                                                                                               cursor: pointer;
                                                                                                               border-radius: 16px; " href="http://ivicatechnologies.com/verification.php?secretToken=${secretToken}" >click here</a>
                                                                                                                <p><br></p>
                                                                                                            </td>
                                                                                                        </tr>
                                                                                                    </tbody>
                                                                                                </table>
                                                                                            </td>
                                                                                        </tr>
                                                                                        <tr>
                                                                                            <td class="esd-structure es-p10t es-p10b es-p20r es-p20l" esd-general-paddings-checked="false" style="background-position: center center;" align="left">
                                                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                    <tbody>
                                                                                                        <tr>
                                                                                                            <td class="esd-container-frame" width="560" valign="top" align="center">
                                                                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                                    <tbody>
                                                                                                                        <tr>
                                                                                                                            <td class="esd-block-spacer es-p5t es-p5b" align="center">
                                                                                                                                <table width="100%" height="40%" cellspacing="0" cellpadding="0" border="0">
                                                                                                                                    <tbody>
                                                                                                                                        <tr>
                                                                                                                                            <td style="border-bottom: 1px solid rgb(239, 239, 239); background: rgba(0, 0, 0, 0) none repeat scroll 0% 0%; width: 100%; margin: 0px;"></td>
                                                                                                                                        </tr>
                                                                                                                                    </tbody>
                                                                                                                                </table>
                                                                                                                            </td>
                                                                                                                        </tr>
                                                                                                                    </tbody>
                                                                                                                </table>
                                                                                                            </td>
                                                                                                        </tr>
                                                                                                    </tbody>
                                                                                                </table>
                                                                                            </td>
                                                                                        </tr>
                                                                                    </tbody>
                                                                                </table>
                                                                            </td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                                <table class="es-footer esd-footer-popover" cellspacing="0" cellpadding="0" align="center" bgcolor="#c93939">
                                                                    <tbody>
                                                                        <tr> </tr>
                                                                        <tr>
                                                                            <td class="esd-stripe" esd-custom-block-id="3007" align="center">
                                                                                <table class="es-footer-body" width="600" cellspacing="0" cellpadding="0" align="center" bgcolor="#c93939">
                                                                                    <tbody>
                                                                                        <tr>
                                                                                            <td class="esd-structure es-p20" esd-general-paddings-checked="false" style="background-position: left top;" align="left" bgcolor="#c93939">
                                                                                                <!--[if mso]><table width="560" cellpadding="0" cellspacing="0"><tr><td width="178" valign="top"><![endif]-->
                                                                                                <table class="es-left" cellspacing="0" cellpadding="0" align="left">
                                                                                                    <tbody>
                                                                                                        <tr>
                                                                                                            <td class="es-m-p0r es-m-p20b esd-container-frame" width="150" align="center" bgcolor="#c93939">
                                                                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                                    <tbody>
                                                                                                                        <tr>
                                                                                                                            <br>
                                                                                                                            <td class="esd-block-image" align="center"><br>
                                                                                                                                <a target="_blank"> <img src="http://ivicatechnologies.com/uploads/ivica%20a4.png" alt="Quick taxi logo" title="Quick taxi logo" width="50" style="display: block;"> </a>
                                                                                                                            </td>
                                                                                                                            <br>
                                                                                                                        </tr>
                                                                                             
                                                                                                                    </tbody>
                                                                                                                </table>
                                                                                                            </td>
                                                                                                        </tr>
                                                                                                    </tbody>
                                                                                                </table>
                                                                                                <!--[if mso]></td><td width="20"></td><td width="362" valign="top"><![endif]-->
                                                                                                <table cellspacing="0" cellpadding="0" align="right">
                                                                                                    <tbody>
                                                                                                        <tr>
                                                                                                            <td class="esd-container-frame" width="362" align="left">
                                                                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                                    <tbody>
                                                                                                                        <tr>
                                                                                                                            <td class="esd-block-text es-p10b es-m-txt-c" align="left">
                                                                                                                                <h3>Contact us</h3>
                                                                                                                            </td>
                                                                                                                            <!-- <td class="es-p10r" valign="top" align="center"> 
                                                                                                                                <a target="_blank" href="https://www.linkedin.com/company/ivica-technologies-private-limited/about/?viewAsMember=true"><img title="LinkedIn" src="https://ivicatechnologies.in/uploads/linkedin.png" alt="Tw" width="24" height="24" hspace="20"> </a><br>
                                                                                                                            </td>
                                                                                                                            <td class="es-p10r" valign="top" align="right">
                                                                                                                                <a target="_blank" href="https://www.facebook.com/IvicaTechnologies/"><img title="Facebook" src="https://ivicatechnologies.in/uploads/facebook-logo-in-circular-button-outlined-social-symbol (1).png" alt="Fb" width="24" height="24"></a>
                                                                                                                            </td> -->
                                                                                                                        </tr>
                                                                                                                        <tr>
                                                                                                                            <td class="esd-block-text es-m-txt-c" esd-links-underline="none">
                                                                                                                                <font color="#333333"><span style="font-size: 14px;">IvicaTechnologies</span></font>
                                                                                                                            </td>
                                                                                                                           
                                                                                                                            
                                                                                                                        </tr>
                                                                                                                        <tr>
                                                                                                                            <td class="esd-block-text es-m-txt-c" esd-links-underline="none" align="left">
                                                                                                                                <font color="#333333"><span style="font-size: 14px;">contact@ivicatechnologies.com</span></font><br>
                                                                                                                                
                                                                                                                            </td>
                                                                                                                            
                                                                                                                        </tr>
                                                                                                                        <tr> 
                                                                                                                            <td class="esd-block-text es-m-txt-c" esd-links-underline="none" width="362" align="left">
                                                                                                                                <table class="es-social es-table-not-adapt" cellspacing="0" cellpadding="0">
                                                                                                                                    <tbody>
                                                                                                                                        <tr>
                                                                                                                                            <td class="esd-block-text es-m-txt-c" esd-links-underline="none" align="left"> <br>
                                                                                                                                                <a target="_blank" href="https://www.linkedin.com/company/ivica-technologies-private-limited/about/?viewAsMember=true"><img title="LinkedIn" src="http://ivicatechnologies.com/uploads/linkedin.png" alt="Tw" width="28" height="23" > </a><br>
                                                                                                                                            </td>
                                                                                                                                            <td class="es-p10r" valign="top" align="center"> <br>
                                                                                                                                                <a target="_blank" href="https://www.facebook.com/IvicaTechnologies/"><img title="Facebook" src=" http://ivicatechnologies.com/uploads/facebook-logo-in-circular-button-outlined-social-symbol(1).png" alt="Fb" width="28" height="23" hspace="30"></a>
                                                                                                                                            </td>
                                                                                                                                        </tr>  
                                                                                                                                    </tbody> 
                                                                                                                                </table>
                                                                                                                                <!-- <p><br></p> -->
                                                                                                                            </td>
                                                                                                                        </tr> 
                                                                                                                                                                              
                                                                                                                        <!-- <tr>
                                                                                                                            <td class="es-p10r" valign="top" align="center">
                                                                                                                                <a target="_blank" href="https://play.google.com/store/apps/details?id=ivicatechnologies.com.famegear"><img title="Facebook" src="https://ivicatechnologies.in/uploads/android.png" alt="Fb" width="100" height="30"></a>
                                                                                                                            </td>
                                                                                                                            <td class="es-p10r" valign="top" align="center">
                                                                                                                                <a target="_blank" href="https://itunes.apple.com/in/app/fvmegear/id1458770790?mt=8"><img title="Facebook" src="https://ivicatechnologies.in/uploads/ios.png" alt="Fb" width="100" height="30"></a>
                                                                                                                            </td>         
                                                                                                                        </tr>   -->
                                                                                                                        <tr>
                                                                                                                            <td class="esd-block-social es-p10t es-m-txt-c" align="left">
                                                                                                                                <table class="es-social es-table-not-adapt" cellspacing="0" cellpadding="0">
                                                                                                                                    <tbody>
                                                                                                                                        <tr>
                                                                                                                                            <td class="es-p10r" valign="top" align="center">
                                                                                                                                                <a target="_blank" href="https://play.google.com/store/apps/details?id=ivicatechnologies.com.famegear"><img title="Facebook" src=" http://ivicatechnologies.com/uploads/android.png" alt="Fb" width="100"></a>
                                                                                                                                            </td>
                                                                                                                                            <td class="es-p10r" valign="top" align="center">
                                                                                                                                                <a target="_blank" href="https://itunes.apple.com/in/app/fvmegear/id1458770790?mt=8"><img title="Facebook" src="http://ivicatechnologies.com/uploads/ios.png" alt="Fb" width="100" height="30" hspace="20"></a>
                                                                                                                                            </td> 
                                                                                                                                        </tr>  
                                                                                                                    
                                                                                                                                    </tbody> 
                                                                                                                                </table>
                                                                                                                                    <!-- <p><br></p> -->
                                                                                                                            </td>
                                                                                                                        </tr> 
                                                                                                                        <!-- <tr>
                                                                                                                            <td class="esd-block-text es-p10t es-m-txt-c" align="left">
                                                                                                                                <p style="font-size: 12px; line-height: 150%;">You are receiving this email because you subscribed to our site. Please note that you can&nbsp;<a target="_blank" style="font-size: 12px;">unsubscribe</a>&nbsp;at any time.</p>
                                                                                                                            </td>
                                                                                                                        </tr>  -->
                                                                                                                    </tbody>
                                                                                                                </table>
                                                                                                            </td>
                                                                                                        </tr>
                                                                                                    </tbody>
                                                                                                </table>
                                                                                                <!--[if mso]></td></tr></table><![endif]-->
                                                                                            </td>
                                                                                        </tr>
                                                                                    </tbody>
                                                                                </table>
                                                                            </td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                            <div style="position:absolute;left:-9999px;top:-9999px;"></div>
                                        </body>
                                        
                                        </html>`
                                       
                                     };
                                     transporter.use('compile', htmlToText(HelperOptions));
                                     
                                     transporter.sendMail(HelperOptions, (error, info) => {
                                         if (error) {
                                             return console.log(error);
                                         } else {
                                           //  console.log('The  message was sent!');
                                             return console.log(info);
                                         }
                                        
                                     });
                               
                                uidgen.generate((err, uid) => {
                                if (err) {
                                  var spliterror=err.message.split(":")
                                  res.status(500).json({ 
                                    status: 'Failed',
                                    message: spliterror[0]+spliterror[1]
                                  });
                                }
                                const token = uid;

                                // auth schema save
                                  const  authmodel= new authModel({
                                  _id: new mongoose.Types.ObjectId(),
                                  userid:userCheck._id,
                                  iv_token: token,
                                  imei: req.body.imei,
                                  deviceid:req.body.deviceid
                                });
                                authModel
                                  .find({userid:userCheck._id})
                                  .exec()
                                  .then(result => {
                                      if(result.length<1){
                                        authmodel.save()
                                        .then(data =>{
                                        }).catch(err => {
                                                var spliterror=err.message.split(":")
                                                res.status(500).json({ 
                                                  status: 'Failed',
                                                  message: spliterror[0]
                                                });
                                        });
                                      }
                                      else{
                                        authModel.findOneAndUpdate({userid:userCheck._id},
                                                      {$set:{iv_token:token,created_at:Date.now(),removed_at:null}})
                                                  .exec()
                                                  .then(newdata =>{
                                                  }).catch(err => {
                                                   var spliterror=err.message.split(":")
                                                    res.status(500).json({ 
                                                       status: 'Failed',
                                                       message: spliterror[0]+ spliterror[1]
                                                    });
                                                });
                                      }
                                             var emailcheck=""; 
                                             var email_verified = false 
                                                if(userCheck.mobile_verified === 'true'){
                                                    emailcheck=true;
                                                }else{
                                                    emailcheck=false
                                                }

                                                if(userCheck.email_verified === 1){
                                                    email_verified=true;
                                                }else{
                                                    email_verified=false
                                                }

                                                      return res.status(200).json({
                                                            status: 'Ok',
                                                            message: 'Signed up successfully.',
                                                            userdetails:{
                                                              username: userCheck.username,
                                                              fullname: userCheck.fullname,
                                                              email:userCheck.email,
                                                              mobile:userCheck.mobile,
                                                              iv_token:token,
                                                              userid: userCheck._id,
                                                              is_verified: emailcheck,
                                                              email_verified:email_verified,
                                                              gender: userCheck.gender,
                                                              language: userCheck.language,
                                                              postscount: 0,
                                                              usertype: userCheck.usertype,
                                                              notificationcount: 0,
                                                              messagescount: 0,
                                                              bus_prof_id: userCheck.business_profile_id,
                                                              is_profile_completed: userCheck.is_profile_completed,
                                                              ref_Code:userCheck.ref_Code,
                                                              user_category:'Stellar',
                                                              email_token : secretToken
                                                            }
                                                          });
                            }).catch(err => {                         // catch the auth schema save errors here 
                              if (err.code === 11000){
                                var error = err.errmsg;
                                 var spliterror = error.split(":")
                                  res.status(500).json({ 
                                    status: 'Failed',
                                    message: spliterror[2]
                                  })
                              }
                              else{
                              var spliterror=err.message.split(":")
                              res.status(500).json({ 
                                status: 'Failed',
                                message: spliterror[0]+spliterror[1]
                              });
                            }
                          });
                          });
                            }).catch(err => {                               // catch the user schema save errors here 
                              if (err.code === 11000){
                              var error = err.errmsg;
                              var spliterror = error.split(":")
                                  if(spliterror[2] === " email_1 dup key"){
                                      res.status(200).json({ 
                                        status: 'Failed',
                                        message: "Mail already exists"
                                      })
                                  }
                                  else if(spliterror[2] === " username_1 dup key"){
                                      res.status(200).json({ 
                                        status: 'Failed',
                                        message: "Username already exists"
                                      })
                                  }
                                  else if (spliterror[2] === " mobile_1 dup key"){
                                      if(req.body.mobile === ""){
                                      res.status(200).json({ 
                                        status: 'Failed',
                                        message: "Please provide the Mobile number"
                                      })
                                    }
                                    else{
                                      res.status(200).json({ 
                                        status: 'Failed',
                                        message: "Mobile number already exists"
                                      })
                                    }
                                  }
                                  else{
                                      res.status(500).json({ 
                                        status: 'Failed',
                                        message:spliterror[2]
                                      })
                                  }
                              }
                              else{
                              var spliterror=err.message.split(":")
                              res.status(500).json({ 
                                status: 'Failed',
                                message: spliterror[0]+spliterror[1]
                              });
                            }
                          });
                        } 
                    }).catch(err => {                               //catch for find email in the user table 
                        if (err.code === 11000){
                              var error = err.errmsg;
                              var spliterror = error.split(":")
                                  if(spliterror[2] === " email_1 dup key"){
                                      res.status(200).json({ 
                                        status: 'Failed',
                                        message: "Mail already exists"
                                      })
                                  }
                                  else if(spliterror[2] === " username_1 dup key"){
                                      res.status(200).json({ 
                                        status: 'Failed',
                                        message: "Username already exists"
                                      })
                                  }
                                  else if (spliterror[2] === " mobile_1 dup key"){
                                      if(req.body.mobile === ""){
                                      res.status(200).json({ 
                                        status: 'Failed',
                                        message: "Please provide the Mobile number"
                                      })
                                    }
                                    else{
                                      res.status(200).json({ 
                                        status: 'Failed',
                                        message: "Mobile number already exists"
                                      })
                                    }
                                  }
                                  else{
                                      res.status(500).json({ 
                                        status: 'Failed',
                                        message:spliterror[2]
                                      })
                                  }
                              }
                              else{
                              var spliterror=err.message.split(":")
                              res.status(500).json({ 
                                status: 'Failed',
                                message: spliterror[0]+spliterror[1]
                              });
                            }
                    });
      }
      else{                               //else loop for usertype
        res.status(200).json({
            status: 'Failed',
            message: 'Bad Request. This usertype does not exist.'
        });
      }
    }                                           
    else {                                   // else for IMEI, DeviceId and clientid
        res.status(200).json({
            status: 'Failed',
            message: 'Bad Request. Please provide correct clientid.'
        });
      }
    }
  else{
       res.status(200).json({
           status: 'Failed',
           message: 'Bad Request. Please check your input parameters.'
       });
 }

});

router.post("/login", (req, res, next) => {
  
  var keyArray = ["email", "password","clientid", "fcmtoken"];
  var key = Object.keys(req.body);
  if (keyArray.length == key.length && keyArray.every((v) => key.indexOf(v) >= 0)) {
    
    var tempPassword = req.body.password;
    var bytes = utf8.encode(tempPassword);
    var hash =  constants.ApiConstant+base64.encode(bytes);

    if(constants.AndriodClientId === req.body.clientid || constants.IosClientId === req.body.clientid){

      User.find({$and:[
                {$or:
                  [{ email: req.body.email },
                  {username:req.body.email}]}
              ]})       
          .exec()
          .then(userCheck => {
              if (userCheck.length < 1) {
                  return res.status(200).json({
                    status:"Failed",
                    message: "Incorrect Username or Password!"
                  });
              }else{
                    if(userCheck[0].password === hash){

                        var emailcheck ="";
                        if(userCheck[0].mobile_verified === 'true'){

                          emailcheck=true;
                        }else{
                          emailcheck=false
                        }

                        var email_verified = false

                         if(userCheck[0].email_verified === 1){
                                                    email_verified=true;
                                                }else{
                                                    email_verified=false
                                                }

                        var has_selected_interests = true

                        if(userCheck[0].hobbies.length > 0){
                          has_selected_interests = true
                        }
                        else{
                          has_selected_interests = false
                        }
                          uidgen.generate((err, uid) => {
                          if (err) {
                            var spliterror=err.message.split(":")
                              res.status(500).json({ 
                                status: 'Failed',
                                message: spliterror[0]+spliterror[1]
                              });
                          }
                          const token = uid;

                          authModel.findOneAndUpdate({userid:userCheck[0]._id},
                                  {$set:{iv_token:token,created_at:Date.now(),removed_at:null}})
                                  .exec()
                                  .then(newdata =>{

                                    if(userCheck[0].usertype === "generaluser"){
                                    fcmModel.findOneAndUpdate({userid:userCheck[0]._id },
                                                                  {$set: {fcmtoken: req.body.fcmtoken}})
                                          .exec()
                                          .then(newdata => {

                                           }).catch(err => {
                                            var spliterror=err.message.split(":")
                                              res.status(500).json({ 
                                                status: 'Failed',
                                                message: spliterror[0]+ spliterror[1]
                                              });
                                          });
                                      }
                                    
                                      userDetails.find({userid:ObjectId(userCheck[0]._id)})
                                                  .exec()
                                                  .then(dex =>{
                                                    var user_category = dex[0].category_type
                                                    var selected_primary_offer = false;
                                                      if(dex[0].offer_details.length > 0){
                                                          var offers = dex[0].offer_details;
                                                          offers.every(function(ele){
                                                            if(ele.is_primary_offer === true){
                                                              selected_primary_offer = true
                                                              return false
                                                            }
                                                            else{
                                                              selected_primary_offer = false
                                                              return true
                                                            }
                                                          })
                                                      }
                                                      
                                    var profileimage = userCheck[0].profileimage;
                                      if(userCheck[0].profileimage === null){
                                        profileimage = "uploads/userimage.png"
                                      }
                                      if(userCheck[0].is_profile_completed === true){
                                          
                                          business_profile.find({iv_acountid:userCheck[0]._id})
                                                      .exec()
                                                      .then(result =>{
                                                          return res.status(200).json({
                                                            status: 'Ok',
                                                            message: 'logged in successfully.',
                                                            userdetails:{
                                                              username: userCheck[0].username,
                                                              fullname: userCheck[0].fullname,
                                                              email:userCheck[0].email,
                                                              mobile:userCheck[0].mobile,
                                                              iv_token:token,
                                                              userid: userCheck[0]._id,
                                                              is_verified: emailcheck,
                                                              email_verified:email_verified,
                                                              gender: userCheck[0].gender,
                                                              language: userCheck[0].language,
                                                              postscount: 0,
                                                              usertype: userCheck[0].usertype,
                                                              notificationcount: 0,
                                                              messagescount: 0,
                                                              bus_prof_id: result[0]._id,
                                                              is_profile_completed: userCheck[0].is_profile_completed,
                                                              ref_Code:userCheck[0].ref_Code,
                                                              profileimage: constants.APIBASEURL+profileimage,
                                                              has_primary_offer:selected_primary_offer,
                                                              has_selected_interests:has_selected_interests,
                                                              user_category:user_category
                                                            }
                                                          });
                                                      }).catch(err => {                 // catch statement for user.
                                                        var spliterror=err.message.split(":")
                                                          res.status(500).json({ 
                                                            status: 'Failed',
                                                            message: spliterror[0]
                                                        });
                                                    });
                                      }
                                      else{
                                                      return res.status(200).json({
                                                            status: 'Ok',
                                                            message: 'logged in successfully.',
                                                            userdetails:{
                                                              username: userCheck[0].username,
                                                              fullname: userCheck[0].fullname,
                                                              email:userCheck[0].email,
                                                              mobile:userCheck[0].mobile,
                                                              iv_token:token,
                                                              userid: userCheck[0]._id,
                                                              is_verified: emailcheck,
                                                              email_verified:email_verified,
                                                              gender: userCheck[0].gender,
                                                              language: userCheck[0].language,
                                                              postscount: 0,
                                                              usertype: userCheck[0].usertype,
                                                              notificationcount: 0,
                                                              messagescount: 0,
                                                              bus_prof_id: userCheck[0].business_profile_id,
                                                              is_profile_completed: userCheck[0].is_profile_completed,
                                                              ref_Code:userCheck[0].ref_Code,
                                                              profileimage: constants.APIBASEURL+profileimage,
                                                              has_primary_offer:selected_primary_offer,
                                                              has_selected_interests:has_selected_interests,
                                                              user_category:user_category
                                                            }
                                                          });
                                            }
                                        }).catch(err => {                 // catch statement for user.
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
                                            message: spliterror[0]+ spliterror[1]
                                        });
                                });
                          });
                    }
                    else{
                      return res.status(200).json({
                        status:"Failed",
                        message: "Please provide correct password."
                      });
                    }
                }
            }).catch(err => {                 // catch statement for user.
              var spliterror=err.message.split(":")
                res.status(500).json({ 
                  status: 'Failed',
                  message: spliterror[0]
                });
            });
        }else {
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

router.post("/username", (req, res, next) => {    
  
  var keyArray = ["username", "clientid"];
  var key = Object.keys(req.body);
  if (keyArray.length == key.length && keyArray.every((v) => key.indexOf(v) >= 0)) {

  if(constants.AndriodClientId === req.body.clientid || constants.IosClientId === req.body.clientid){

  User.find({username: req.body.username})       
    .exec()
    .then(user => { 
      if (user.length >= 1) {
          return res.status(200).json({
            status:"Failed",
            message:"User already exist"
          });
        } 
        else {
          return res.status(200).json({
            status:"OK",
            message:"Username available"
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


router.get("/getprofile/:clientid/:iv_token/:userid", (req, res, next) => {    

    if(constants.AndriodClientId === req.params.clientid || constants.IosClientId === req.body.clientid){
    authModel.find({iv_token: req.params.iv_token})       
      .exec()
      .then(user => { 
        if (user.length < 1) {
              return res.status(200).json({
                status:"Logout",
                message:"You are logged in other device."
              });
          } 
          else {
                userDetails.find({userid: ObjectId(user[0].userid)})
                            .exec()
                            .then(docs =>{
                                userDetails.find({userid: ObjectId(req.params.userid)})
                                .populate('userid')
                                .exec()
                                .then(userCheck=>{
                                    contactsModel.find({userid: ObjectId(user[0].userid)})
                                                .exec()
                                                .then(contacts=>{
                                                                    var is_following = false;
                                                                    var is_contact = false;
                                                                     
                                                                    var is_blocked = false;

                                                                    no_contacts = userCheck[0].no_contacts
                                                                    var is_mobile_verified = false
                                                                    var email_verified = false

                                                                    var mobile_verify = userCheck[0].userid.mobile_verified
                                                                    var email_verify = userCheck[0].userid.email_verified

                                                                    if(mobile_verify === 'false'){
                                                                      is_mobile_verified = false
                                                                    }
                                                                    else{
                                                                      is_mobile_verified = true
                                                                    }

                                                                    if(email_verify === 0){
                                                                      email_verified = false
                                                                    }
                                                                    else{
                                                                      email_verified = true
                                                                    }

                                                                    console.log("email verified "+email_verified)
                                                                          

                                                                          if(contacts[0].existing_contacts.length > 0){
                                                                            var cons = contacts[0].existing_contacts
                                                                            cons.forEach(function(elex){
                                                                              if(String(elex.contact._id) === String(req.params.userid)){
                                                                                  is_following = true
                                                                                  is_contact = true
                                                                              }
                                                                            })
                                                                          }

                                                                          if(contacts[0].blocked.length > 0){
                                                                            var cons = contacts[0].blocked
                                                                            cons.forEach(function(elex){
                                                                              if(String(elex) === String(req.params.userid)){
                                                                                  is_blocked = true
                                                                              }
                                                                            })
                                                                          }
                                                                    
                                                                    var following = userCheck[0].following;
                                                                    var followers = userCheck[0].followers
                                                                    var blocked_users = userCheck[0].blocked

                                                                    var found_following = following.filter(function(e) {
                                                                                                            return this.indexOf(e) < 0;
                                                                                                          },
                                                                                                          blocked_users);
                                                                    var found_followers = followers.filter(function(e) {
                                                                                                            return this.indexOf(e) < 0;
                                                                                                          },
                                                                                                          blocked_users);

                                                                    

                                                                    
                                                                      if(found_followers.length>0){
                                                                        
                                                                        found_followers.every(function(ele){
                                                                          if(String(docs[0]._id) === String(ele)){
                                                                            is_following = true;
                                                                            console.log(found_followers)
                                                                            return false
                                                                          }
                                                                          else{
                                                                            is_blocked = true
                                                                            return true
                                                                          }
                                                                        })
                                                                      }
                                                                    
                                                                    var coverimage = "";
                                                                    var profileimage = ""; 

                                                                    if(userCheck[0].userid.coverimage === null || typeof userCheck[0].userid.coverimage === "undefined"){
                                                                      coverimage = constants.APIBASEURL+'uploads/userimage.png'
                                                                    }
                                                                    else{
                                                                     coverimage = constants.APIBASEURL+userCheck[0].userid.coverimage
                                                                    }

                                                                    if(userCheck[0].userid.profileimage === null || typeof userCheck[0].userid.profileimage === "undefined" ){
                                                                      profileimage = constants.APIBASEURL+'uploads/userimage.png'
                                                                    }
                                                                    else{
                                                                     profileimage = constants.APIBASEURL+userCheck[0].userid.profileimage
                                                                    }

                                                                    var activity_status = 0;

                                                                    var coin = userCheck[0].coins_collected_today;
                                                                    console.log(coin)
                                                                    var value = (coin/20)*100

                                                                    if(value >= 100) {
                                                                       value = 100
                                                                    }

                                                                    if(userCheck[0].has_user_activity === true) {                                                                  
                                                                      activity_status = 100;
                                                                    }

                                                                    else {
                                                                      activity_status = parseInt(value);
                                                                    }

                                                                    var is_super_user = false

                                                                    if(String(req.params.userid) === '5d247fe5d4676f2d4b74e358'){
                                                                        is_super_user = true
                                                                    }

                                                                    console.log(activity_status)

                                                                    return res.status(200).json({
                                                                            status: 'Ok',
                                                                            message: 'Profile',
                                                                            profile_details:{
                                                                              username: userCheck[0].userid.username,
                                                                              fullname: userCheck[0].userid.fullname,
                                                                              email:userCheck[0].userid.email,
                                                                              userid: userCheck[0].userid._id,
                                                                              mobile: userCheck[0].userid.mobile,
                                                                              category_type: userCheck[0].category_type ,
                                                                              followers_count: found_followers.length,
                                                                              following_count: found_following.length,
                                                                              groups_count: userCheck[0].groups_count,
                                                                              contacts_count: no_contacts,
                                                                              talent_points: userCheck[0].talent_points,
                                                                              view_points: userCheck[0].view_points,
                                                                              is_blocked: is_blocked,
                                                                              is_following: is_following,
                                                                              is_contact:is_contact,
                                                                              talent_rating: parseInt(userCheck[0].talent_rating),
                                                                              coverimage: coverimage,
                                                                              profileimage: profileimage,
                                                                              ref_Code:userCheck[0].userid.ref_Code,
                                                                              activity_status:activity_status,
                                                                              is_mobile_verified:is_mobile_verified,
                                                                              has_email_verified:email_verified,
                                                                              is_super_user:is_super_user
                                                                            }
                                                                    });
                                                                
                                                }).catch(err => {
                                                  console.log(err)
                                                  // var spliterror=err.message.split("_")
                                                  // if(spliterror[1].indexOf("id")>=0){
                                                  //   res.status(200).json({ 
                                                  //     status: 'Failed',
                                                  //     message: "Please provide correct userid"
                                                  //   });
                                                  // }
                                                  // else{
                                                  //   res.status(500).json({ 
                                                  //     status: 'Failed',
                                                  //     message: err.message
                                                  //   });
                                                  // }
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
                            }).catch(err => {
                              console.log(err)
                              // var spliterror=err.message.split("_")
                              // if(spliterror[1].indexOf("id")>=0){
                              //   res.status(200).json({ 
                              //     status: 'Failed',
                              //     message: "Please provide correct userid"
                              //   });
                              // }
                              // else{
                              //   res.status(500).json({ 
                              //     status: 'Failed',
                              //     message: err.message
                              //   });
                              // }
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

});

router.put("/editprofile",upload.any(), (req, res, next) => {    
  
  var keyArray = ["fullname", "userid", "iv_token", "clientid", "email"];
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

                        var Split1 = req.files[i]['filename'].split('Z');
                        var split2 = Split1[1]
                        var SplitFileName = split2.split('.')
                          var VideoThumBaname = SplitFileName[0];
                          console.log(SplitFileName[1])

                          if(SplitFileName[1] == 'png' || SplitFileName[1] == 'PNG' )
                          {
                              console.log("in jimp")
                              var VideoPngThumBaname = SplitFileName[0]+tokenPng;
                              var PngFileName = 'uploads/'+req.files[i]['filename'];
                         
                                  Jimp.read(PngFileName, (err, lenna) => {
                   
                                  if (err) throw err;
                                  lenna
                                  //.resize(256, 256) // resize
                                  .quality(50) // set JPEG quality
                                  //.greyscale() // set greyscale
                                  .write("uploads_comprs/"+VideoPngThumBaname+".jpeg"); // save
                                  });
                  
                                  FeedFileSPath ="uploads_comprs/"+VideoPngThumBaname+".jpeg";
                                  inputprofile = FeedFileSPath;  

                            }
                            else if(SplitFileName[1] == 'jpg' || SplitFileName[1] == 'JPG' || SplitFileName[1] == 'jpeg'  || SplitFileName[1] == 'JPEG' )
                            {
                                   console.log("in jimp")
                                  var VideoPngThumBaname = SplitFileName[0]+tokenPng;
                                  var PngFileName = 'uploads/'+req.files[i]['filename'];
                         
                                  Jimp.read(PngFileName, (err, lenna) => {
                   
                                  if (err) throw err;
                                  lenna
                                  //.resize(256, 256) // resize
                                  .quality(50) // set JPEG quality
                                  //.greyscale() // set greyscale
                                  .write("uploads_comprs/"+VideoPngThumBaname+".jpeg"); // save
                                  });
                  
                                  FeedFileSPath ="uploads_comprs/"+VideoPngThumBaname+".jpeg";
                                  inputprofile = FeedFileSPath;  
                          }
                          else{
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

                    User.find({email: req.body.email})
                      .exec()
                      .then(email_user =>{

                            if (user.length < 1) {
                                return res.status(200).json({
                                  status:"Failed",
                                  message:"User does not exist"
                                });
                              } 
                            else {
                              var is_email_occupied = false

                              if(user[0].fullname != req.body.fullname || user[0].coverimage != inputcover || user[0].profileimage != inputprofile || user[0].email != req.body.email){  

                                                  var username = user[0].username
                                                  var secretToken = user[0].email_token

                                                  if(user[0].email != req.body.email){

                                                            if(email_user.length < 1 ){
                                                                
                                                                secretToken = randomstring.generate();

                                                                    let transporter = nodemailer.createTransport({
                                                                         host: 'email-smtp.us-east-1.amazonaws.com',
                                                                         port: 465,
                                                                         secureConnection: true, // upgrade later with STARTTLS
                                                                         auth: {
                                                                             user: 'AKIAUXODAPAAGIPOV6H6',
                                                                             pass: 'BPfCccx4weCniuXGaIXHaGB28u2GcO8u5x1RjR9oxE8T'
                                                                         }
                                                                        
                                                                     });
                                                                

                                                                     let HelperOptions = {
                                                                         from: 'contact@ivicatechnologies.com',
                                                                         to: req.body.email,
                                                                         subject: username + ', Welcome to fvmegear',
                                                                        html:`<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                                                                        <html>
                                                                        
                                                                        <head>
                                                                            <meta charset="UTF-8">
                                                                            <meta content="width=device-width, initial-scale=1" name="viewport">
                                                                            <meta name="x-apple-disable-message-reformatting">
                                                                            <meta http-equiv="X-UA-Compatible" content="IE=edge">
                                                                            <meta content="telephone=no" name="format-detection">
                                                                            <title></title>
                                                                            <!--[if (mso 16)]>
                                                                            <style type="text/css">
                                                                            a {text-decoration: none;}
                                                                            </style>
                                                                            <![endif]-->
                                                                            <!--[if gte mso 9]><style>sup { font-size: 100% !important; }</style><![endif]-->
                                                                        </head>
                                                                  
                                                                        
                                                                        <body>
                                                                            <div class="es-wrapper-color">
                                                                                <!--[if gte mso 9]>
                                                                              <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
                                                                                <v:fill type="tile" color="#FFFFFF"></v:fill>
                                                                              </v:background>
                                                                            <![endif]-->
                                                                                <table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0">
                                                                                    <tbody>
                                                                                        <tr>
                                                                                            <td class="esd-email-paddings" valign="top">
                                                                                                <table class="es-header es-preheader esd-header-popover" cellspacing="0" cellpadding="0" align="center">
                                                                                                    <tbody>
                                                                                                        <tr>
                                                                                                            <td class="es-adaptive esd-stripe" esd-custom-block-id="2995" align="center">
                                                                                                                <table class="es-content-body" style="background-color: transparent;" width="600" cellspacing="0" cellpadding="0" align="center">
                                                                                                                    <tbody>
                                                                                                                        <tr>
                                                                                                                            <td class="esd-structure es-p10" align="left">
                                                                                                                                <!--[if mso]><table width="580"><tr><td width="390" valign="top"><![endif]-->
                                                                                                                                <!-- <table class="es-left" cellspacing="0" cellpadding="0" align="left">
                                                                                                                                    <tbody>
                                                                                                                                        <tr>
                                                                                                                                            <td class="esd-container-frame" width="390" align="left">
                                                                                                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                                                                    <tbody>
                                                                                                                                                        <tr>
                                                                                                                                                            <td class="es-infoblock esd-block-text es-m-txt-c" align="left">
                                                                                                                                                                <p><span style="text-align: center;">Put your preheader text here</span></p>
                                                                                                                                                            </td>
                                                                                                                                                        </tr>
                                                                                                                                                    </tbody>
                                                                                                                                                </table>
                                                                                                                                            </td>
                                                                                                                                        </tr>
                                                                                                                                    </tbody>
                                                                                                                                </table> -->
                                                                                                                                <!--[if mso]></td><td width="20"></td><td width="170" valign="top"><![endif]-->
                                                                                                                                <!-- <table class="es-right" cellspacing="0" cellpadding="0" align="right">
                                                                                                                                    <tbody>
                                                                                                                                        <tr>
                                                                                                                                            <td class="esd-container-frame" width="170" align="left">
                                                                                                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                                                                    <tbody>
                                                                                                                                                        <tr>
                                                                                                                                                            <td class="es-infoblock esd-block-text es-m-txt-c" align="right">
                                                                                                                                                                <p><a href="http://#" target="_blank">View in browser</a></p>
                                                                                                                                                            </td>
                                                                                                                                                        </tr>
                                                                                                                                                    </tbody>
                                                                                                                                                </table>
                                                                                                                                            </td>
                                                                                                                                        </tr>
                                                                                                                                    </tbody>
                                                                                                                                </table> -->
                                                                                                                                <!--[if mso]></td></tr></table><![endif]-->
                                                                                                                            </td>
                                                                                                                        </tr>
                                                                                                                    </tbody>
                                                                                                                </table>
                                                                                                            </td>
                                                                                                        </tr>
                                                                                                    </tbody>
                                                                                                </table>
                                                                                                <table class="es-content" cellspacing="0" cellpadding="0" align="center">
                                                                                                    <tbody>
                                                                                                        <tr>
                                                                                                            <td class="esd-stripe" esd-custom-block-id="28181" align="center">
                                                                                                                <table class="es-content-body" width="600" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center">
                                                                                                                    <tbody>
                                                                                                                        <tr>
                                                                                                                            <td class="esd-structure es-p15t es-p15b es-p20r es-p20l esd-checked"  esd-custom-block-id="28206" bgcolor="#F2F2F4" align="left">
                                                                                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                                                    <tbody>
                                                                                                                                        <tr>
                                                                                                                                            <td class="esd-container-frame" width="560" valign="top" align="center">
                                                                                                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                                                                    <tbody>
                                                                                                                                                        <tr>
                                                                                                                                                            <td class="esd-block-image" align="center">
                                                                                                                                                                <a target="_blank"> <img src=" http://ivicatechnologies.com/uploads/fvmegearlogo.png " alt="Quick taxi logo" title="Quick taxi logo" style="display: block;" width="92"> </a>
                                                                                                                                                            </td>
                                                                                                                                                            <td class="esd-block-image">
                                                                                                                                                                <h2>fvmegear </h2>
                                                                                                                                                                <p>Thanks  For Signup</p>
                                                                                                                                                            </td>
                                                                                                                                                        </tr>
                                                                                                                                                    </tbody>
                                                                                                                                                </table>
                                                                                                                                            </td>
                                                                                                                                        </tr>
                                                                                                                                    </tbody>
                                                                                                                                </table>
                                                                                                                            </td>
                                                                                                                        </tr>
                                                                                                                        <tr>
                                                                                                                            <td class="esd-structure es-p10b" esd-general-paddings-checked="false" align="left">
                                                                                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                                                    <tbody>
                                                                                                                                        <tr>
                                                                                                                                            <td class="esd-container-frame" width="600" valign="top" align="center">
                                                                                                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                                                                    <tbody>
                                                                                                                                                        <tr>
                                                                                                                                                            <td class="esd-block-spacer es-p5b" align="center">
                                                                                                                                                                <table width="100%" height="100%" cellspacing="0" cellpadding="0" border="0">
                                                                                                                                                                    <tbody>
                                                                                                                                                                        <tr>
                                                                                                                                                                            <td style="border-bottom: 1px solid rgb(239, 239, 239); background: rgba(0, 0, 0, 0) none repeat scroll 0% 0%; height: 1px; width: 100%; margin: 0px;"></td>
                                                                                                                                                                        </tr>
                                                                                                                                                                    </tbody>
                                                                                                                                                                </table>
                                                                                                                                                            </td>
                                                                                                                                                        </tr>
                                                                                                                                                    </tbody>
                                                                                                                                                </table>
                                                                                                                                            </td>
                                                                                                                                        </tr>
                                                                                                                                    </tbody>
                                                                                                                                </table>
                                                                                                                            </td>    
                                                                                                                        </tr>
                                                                                                                        <tr>
                                                                                                                            <td class="esd-structure es-p20t es-p20b es-p20r es-p20l" esd-custom-block-id="2997" style="background-position: center top;" align="left">
                                                                                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                                                    <tbody>
                                                                                                                                        <tr>
                                                                                                                                            <td>
                                                                                                                                             <img src="http://ivicatechnologies.com/uploads/template.png" alt="Petshop logo" title="Petshop logo" width="600" height="250" style="display: block;">
                                                                                                                                            </td>
                                                                                                                                        </tr>
                                                                                                                                    </tbody>
                                                                                                                                </table>      
                                                                                                                            </td>
                                                                                                                        </tr>
                                                                                                                        <tr>
                                                                                                                            <td class="esd-structure es-p20t es-p20b es-p20r es-p20l" esd-custom-block-id="2997" style="background-position: center top;" bgcolor="#F2F2F4" align="left">
                                                                                                                                <table width="100%"  height="30%" cellspacing="0" cellpadding="0">
                                                                                                                                    <tbody>
                                                                                                                                        <tr>
                                                                                                                                            <td class="esd-block-text es-p5t" align="center">
                                                                                                                                                <h3>Please click below link to verify your E-mail address</h3>
                                                                                                                                               <a style=" background-color: #42daf5;
                                                                                                                                               border: none;
                                                                                                                                               color: white;
                                                                                                                                               padding: 10px 20px;
                                                                                                                                               text-align: center;
                                                                                                                                               text-decoration: none;
                                                                                                                                               display: inline-block;
                                                                                                                                               margin: 4px 2px;
                                                                                                                                               cursor: pointer;
                                                                                                                                               border-radius: 16px; " href="http://ivicatechnologies.com/verification.php?secretToken=${secretToken}" >click here</a>
                                                                                                                                                <p><br></p>
                                                                                                                                            </td>
                                                                                                                                        </tr>
                                                                                                                                    </tbody>
                                                                                                                                </table>
                                                                                                                            </td>
                                                                                                                        </tr>
                                                                                                                        <tr>
                                                                                                                            <td class="esd-structure es-p10t es-p10b es-p20r es-p20l" esd-general-paddings-checked="false" style="background-position: center center;" align="left">
                                                                                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                                                    <tbody>
                                                                                                                                        <tr>
                                                                                                                                            <td class="esd-container-frame" width="560" valign="top" align="center">
                                                                                                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                                                                    <tbody>
                                                                                                                                                        <tr>
                                                                                                                                                            <td class="esd-block-spacer es-p5t es-p5b" align="center">
                                                                                                                                                                <table width="100%" height="40%" cellspacing="0" cellpadding="0" border="0">
                                                                                                                                                                    <tbody>
                                                                                                                                                                        <tr>
                                                                                                                                                                            <td style="border-bottom: 1px solid rgb(239, 239, 239); background: rgba(0, 0, 0, 0) none repeat scroll 0% 0%; width: 100%; margin: 0px;"></td>
                                                                                                                                                                        </tr>
                                                                                                                                                                    </tbody>
                                                                                                                                                                </table>
                                                                                                                                                            </td>
                                                                                                                                                        </tr>
                                                                                                                                                    </tbody>
                                                                                                                                                </table>
                                                                                                                                            </td>
                                                                                                                                        </tr>
                                                                                                                                    </tbody>
                                                                                                                                </table>
                                                                                                                            </td>
                                                                                                                        </tr>
                                                                                                                    </tbody>
                                                                                                                </table>
                                                                                                            </td>
                                                                                                        </tr>
                                                                                                    </tbody>
                                                                                                </table>
                                                                                                <table class="es-footer esd-footer-popover" cellspacing="0" cellpadding="0" align="center" bgcolor="#c93939">
                                                                                                    <tbody>
                                                                                                        <tr> </tr>
                                                                                                        <tr>
                                                                                                            <td class="esd-stripe" esd-custom-block-id="3007" align="center">
                                                                                                                <table class="es-footer-body" width="600" cellspacing="0" cellpadding="0" align="center" bgcolor="#c93939">
                                                                                                                    <tbody>
                                                                                                                        <tr>
                                                                                                                            <td class="esd-structure es-p20" esd-general-paddings-checked="false" style="background-position: left top;" align="left" bgcolor="#c93939">
                                                                                                                                <!--[if mso]><table width="560" cellpadding="0" cellspacing="0"><tr><td width="178" valign="top"><![endif]-->
                                                                                                                                <table class="es-left" cellspacing="0" cellpadding="0" align="left">
                                                                                                                                    <tbody>
                                                                                                                                        <tr>
                                                                                                                                            <td class="es-m-p0r es-m-p20b esd-container-frame" width="150" align="center" bgcolor="#c93939">
                                                                                                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                                                                    <tbody>
                                                                                                                                                        <tr>
                                                                                                                                                            <br>
                                                                                                                                                            <td class="esd-block-image" align="center"><br>
                                                                                                                                                                <a target="_blank"> <img src="http://ivicatechnologies.com/uploads/ivica%20a4.png" alt="Quick taxi logo" title="Quick taxi logo" width="50" style="display: block;"> </a>
                                                                                                                                                            </td>
                                                                                                                                                            <br>
                                                                                                                                                        </tr>
                                                                                                                             
                                                                                                                                                    </tbody>
                                                                                                                                                </table>
                                                                                                                                            </td>
                                                                                                                                        </tr>
                                                                                                                                    </tbody>
                                                                                                                                </table>
                                                                                                                                <!--[if mso]></td><td width="20"></td><td width="362" valign="top"><![endif]-->
                                                                                                                                <table cellspacing="0" cellpadding="0" align="right">
                                                                                                                                    <tbody>
                                                                                                                                        <tr>
                                                                                                                                            <td class="esd-container-frame" width="362" align="left">
                                                                                                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                                                                    <tbody>
                                                                                                                                                        <tr>
                                                                                                                                                            <td class="esd-block-text es-p10b es-m-txt-c" align="left">
                                                                                                                                                                <h3>Contact us</h3>
                                                                                                                                                            </td>
                                                                                                                                                            <!-- <td class="es-p10r" valign="top" align="center"> 
                                                                                                                                                                <a target="_blank" href="https://www.linkedin.com/company/ivica-technologies-private-limited/about/?viewAsMember=true"><img title="LinkedIn" src="https://ivicatechnologies.in/uploads/linkedin.png" alt="Tw" width="24" height="24" hspace="20"> </a><br>
                                                                                                                                                            </td>
                                                                                                                                                            <td class="es-p10r" valign="top" align="right">
                                                                                                                                                                <a target="_blank" href="https://www.facebook.com/IvicaTechnologies/"><img title="Facebook" src="https://ivicatechnologies.in/uploads/facebook-logo-in-circular-button-outlined-social-symbol (1).png" alt="Fb" width="24" height="24"></a>
                                                                                                                                                            </td> -->
                                                                                                                                                        </tr>
                                                                                                                                                        <tr>
                                                                                                                                                            <td class="esd-block-text es-m-txt-c" esd-links-underline="none">
                                                                                                                                                                <font color="#333333"><span style="font-size: 14px;">IvicaTechnologies</span></font>
                                                                                                                                                            </td>
                                                                                                                                                           
                                                                                                                                                            
                                                                                                                                                        </tr>
                                                                                                                                                        <tr>
                                                                                                                                                            <td class="esd-block-text es-m-txt-c" esd-links-underline="none" align="left">
                                                                                                                                                                <font color="#333333"><span style="font-size: 14px;">contact@ivicatechnologies.com</span></font><br>
                                                                                                                                                                
                                                                                                                                                            </td>
                                                                                                                                                            
                                                                                                                                                        </tr>
                                                                                                                                                        <tr> 
                                                                                                                                                            <td class="esd-block-text es-m-txt-c" esd-links-underline="none" width="362" align="left">
                                                                                                                                                                <table class="es-social es-table-not-adapt" cellspacing="0" cellpadding="0">
                                                                                                                                                                    <tbody>
                                                                                                                                                                        <tr>
                                                                                                                                                                            <td class="esd-block-text es-m-txt-c" esd-links-underline="none" align="left"> <br>
                                                                                                                                                                                <a target="_blank" href="https://www.linkedin.com/company/ivica-technologies-private-limited/about/?viewAsMember=true"><img title="LinkedIn" src="http://ivicatechnologies.com/uploads/linkedin.png" alt="Tw" width="28" height="23" > </a><br>
                                                                                                                                                                            </td>
                                                                                                                                                                            <td class="es-p10r" valign="top" align="center"> <br>
                                                                                                                                                                                <a target="_blank" href="https://www.facebook.com/IvicaTechnologies/"><img title="Facebook" src=" http://ivicatechnologies.com/uploads/facebook-logo-in-circular-button-outlined-social-symbol(1).png" alt="Fb" width="28" height="23" hspace="30"></a>
                                                                                                                                                                            </td>
                                                                                                                                                                        </tr>  
                                                                                                                                                                    </tbody> 
                                                                                                                                                                </table>
                                                                                                                                                                <!-- <p><br></p> -->
                                                                                                                                                            </td>
                                                                                                                                                        </tr> 
                                                                                                                                                                                                              
                                                                                                                                                        <!-- <tr>
                                                                                                                                                            <td class="es-p10r" valign="top" align="center">
                                                                                                                                                                <a target="_blank" href="https://play.google.com/store/apps/details?id=ivicatechnologies.com.famegear"><img title="Facebook" src="https://ivicatechnologies.in/uploads/android.png" alt="Fb" width="100" height="30"></a>
                                                                                                                                                            </td>
                                                                                                                                                            <td class="es-p10r" valign="top" align="center">
                                                                                                                                                                <a target="_blank" href="https://itunes.apple.com/in/app/fvmegear/id1458770790?mt=8"><img title="Facebook" src="https://ivicatechnologies.in/uploads/ios.png" alt="Fb" width="100" height="30"></a>
                                                                                                                                                            </td>         
                                                                                                                                                        </tr>   -->
                                                                                                                                                        <tr>
                                                                                                                                                            <td class="esd-block-social es-p10t es-m-txt-c" align="left">
                                                                                                                                                                <table class="es-social es-table-not-adapt" cellspacing="0" cellpadding="0">
                                                                                                                                                                    <tbody>
                                                                                                                                                                        <tr>
                                                                                                                                                                            <td class="es-p10r" valign="top" align="center">
                                                                                                                                                                                <a target="_blank" href="https://play.google.com/store/apps/details?id=ivicatechnologies.com.famegear"><img title="Facebook" src=" http://ivicatechnologies.com/uploads/android.png" alt="Fb" width="100"></a>
                                                                                                                                                                            </td>
                                                                                                                                                                            <td class="es-p10r" valign="top" align="center">
                                                                                                                                                                                <a target="_blank" href="https://itunes.apple.com/in/app/fvmegear/id1458770790?mt=8"><img title="Facebook" src="http://ivicatechnologies.com/uploads/ios.png" alt="Fb" width="100" height="30" hspace="20"></a>
                                                                                                                                                                            </td> 
                                                                                                                                                                        </tr>  
                                                                                                                                                    
                                                                                                                                                                    </tbody> 
                                                                                                                                                                </table>
                                                                                                                                                                    <!-- <p><br></p> -->
                                                                                                                                                            </td>
                                                                                                                                                        </tr> 
                                                                                                                                                        <!-- <tr>
                                                                                                                                                            <td class="esd-block-text es-p10t es-m-txt-c" align="left">
                                                                                                                                                                <p style="font-size: 12px; line-height: 150%;">You are receiving this email because you subscribed to our site. Please note that you can&nbsp;<a target="_blank" style="font-size: 12px;">unsubscribe</a>&nbsp;at any time.</p>
                                                                                                                                                            </td>
                                                                                                                                                        </tr>  -->
                                                                                                                                                    </tbody>
                                                                                                                                                </table>
                                                                                                                                            </td>
                                                                                                                                        </tr>
                                                                                                                                    </tbody>
                                                                                                                                </table>
                                                                                                                                <!--[if mso]></td></tr></table><![endif]-->
                                                                                                                            </td>
                                                                                                                        </tr>
                                                                                                                    </tbody>
                                                                                                                </table>
                                                                                                            </td>
                                                                                                        </tr>
                                                                                                    </tbody>
                                                                                                </table>
                                                                                            </td>
                                                                                        </tr>
                                                                                    </tbody>
                                                                                </table>
                                                                            </div>
                                                                            <div style="position:absolute;left:-9999px;top:-9999px;"></div>
                                                                        </body>
                                                                        
                                                                        </html>`
                                                                       
                                                                     };
                                                                     transporter.use('compile', htmlToText(HelperOptions));
                                                                     
                                                                     transporter.sendMail(HelperOptions, (error, info) => {
                                                                         if (error) {
                                                                             return console.log(error);
                                                                         } else {
                                                                           //  console.log('The  message was sent!');
                                                                             return console.log(info);
                                                                         }
                                                                        
                                                                     });
                                                            }
                                                            else{
                                                                is_email_occupied = true
                                                            }

                                                  }
                                                  else{
                                                    secretToken = user[0].email_token
                                                  }

                                  if(is_email_occupied === false){
                                      if(!isEmpty(inputprofile) && isEmpty(inputcover) ){
                                            User.findOneAndUpdate({_id: req.body.userid},{$set:{fullname:req.body.fullname, 
                                                                                                profileimage:inputprofile,
                                                                                                email:req.body.email,
                                                                                                email_token:secretToken,
                                                                                                updated_on:Date.now()}})
                                              .exec()
                                              .then(userCheck => {
                                                return res.status(200).json({
                                                    status:"Ok",
                                                    message:"Profile updated successfully.",
                                                    profileimage:constants.APIBASEURL+inputprofile
                                                })
                                              }).catch(err => {
                                                    var spliterror=err.message.split(":")
                                                    res.status(500).json({ 
                                                      status: 'Failed',
                                                      message: spliterror[0]+spliterror[1]
                                                    });
                                              });
                                        }
                                        else if(isEmpty(inputprofile) && !isEmpty(inputcover)){
                                            User.findOneAndUpdate({_id: req.body.userid},{$set:{fullname:req.body.fullname, 
                                                                                                coverimage:inputcover,
                                                                                                   email:req.body.email,
                                                                                                email_token:secretToken,
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
                                                      message: spliterror[0]+spliterror[1]
                                                    });
                                              });
                                        }
                                        else if(!isEmpty(inputprofile) && !isEmpty(inputcover)){
                                            User.findOneAndUpdate({_id: req.body.userid},{$set:{fullname:req.body.fullname,
                                                                                                profileimage:inputprofile, 
                                                                                                coverimage:inputcover,
                                                                                                   email:req.body.email,
                                                                                                email_token:secretToken,
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
                                                      message: spliterror[0]+spliterror[1]
                                                    });

                                              });
                                      }
                                      else if(isEmpty(inputprofile) && isEmpty(inputcover) && user[0].fullname != req.body.fullname || user[0].email != req.body.email){ //&& user[0].email != req.body.email
                                        User.findOneAndUpdate({_id: req.body.userid},{$set:{fullname:req.body.fullname,
                                                                                                 email:req.body.email,
                                                                                                email_token:secretToken,
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
                                                      message: spliterror[0]+spliterror[1]
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
                                    console.log("email already exists")
                                      res.status(200).json({
                                            status: 'Failed',
                                            message: 'This Email is already registered to other user.'
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
                          console.log(err)
                              // var spliterror=err.message.split("_")
                              // if(spliterror[1].indexOf("id")>=0){
                              //   res.status(200).json({ 
                              //     status: 'Failed',
                              //     message: "Please provide correct userid"
                              //   });
                              // }
                              // else{
                              //   res.status(500).json({ 
                              //     status: 'Failed',
                              //     message: err.message
                              //   });
                              // }
                          });
                }).catch(err => {
                  console.log(err)
                      // var spliterror=err.message.split("_")
                      // if(spliterror[1].indexOf("id")>=0){
                      //   res.status(200).json({ 
                      //     status: 'Failed',
                      //     message: "Please provide correct userid"
                      //   });
                      // }
                      // else{
                      //   res.status(500).json({ 
                      //     status: 'Failed',
                      //     message: err.message
                      //   });
                      // }
                  }); 
            }
        }).catch(err => {
          console.log(err)
              // var spliterror=err.message.split("_")
              // if(spliterror[1].indexOf("id")>=0){
              //   res.status(200).json({ 
              //     status: 'Failed',
              //     message: "Please provide correct userid"
              //   });
              // }
              // else{
              //   res.status(500).json({ 
              //     status: 'Failed',
              //     message: err.message
              //   });
              // }
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

router.post("/fcmtoken", (req, res, next) => {

  var keyArray = [ 'deviceid', 'imei', 'clientid', 'fcmtoken'];
  var key = Object.keys(req.body);
  if (keyArray.length == key.length && keyArray.every((v) => key.indexOf(v) >= 0)) {

   if(constants.AndriodClientId === req.body.clientid || constants.IosClientId === req.body.clientid){
  
    const newFcm = new fcmModel({
      _id: new mongoose.Types.ObjectId(),
      deviceid : req.body.deviceid,
      imei : req.body.imei,
      fcmtoken : req.body.fcmtoken
    })

    newFcm.save()       
        .then(user => {
          return res.status(200).json({
              status: 'Ok',
              message: 'FCM Token uploaded',
           })
      }).catch(err => {
          var spliterror=err.message.split(":")
          if(spliterror[1] === " fcmtoken"){
              res.status(500).json({ 
                  status: 'Failed',
                  message: "Please provide fcmtoken."
            });
          }
          else if(spliterror[1] === " deviceid"){
              res.status(500).json({ 
                  status: 'Failed',
                  message: "Please provide deviceid."
            })
          }
          else if(spliterror[1] === " imei"){
              res.status(500).json({ 
                  status: 'Failed',
                  message: "Please provide imei."
            })
          }else{
            res.status(500).json({ 
                  status: 'Failed',
                  message: spliterror[0]+spliterror[1]
            });
          }
      });
    }else {
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

router.post("/fcmnotification", (req, res, next) => {

  var keyArray = ["userid", "iv_token", "clientid"];
  var key = Object.keys(req.body);

  if (keyArray.length == key.length && keyArray.every((v) => key.indexOf(v) >= 0)) {

    if(constants.AndriodClientId === req.body.clientid || constants.IosClientId === req.body.clientid){

      fcmModel.find({userid :{$in:[req.body.userid, '5c57f6fcff33c02f147541ed']}},{fcmtoken:1})     
        .select('-_id ')  
        .exec()
        .then(user => { 
          if (user.length < 1) {
              return res.status(200).json({
                status:"Failed",
                message:"Please provide correct userid."
              });
            } 
          else {
            console.log(user)
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


router.post("/logout",(req, res, next) => {    
  
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

            authModel.findOneAndUpdate({userid:req.body.userid},
                                  {$set:{iv_token:null,removed_at:Date.now()}})
                          .exec()
                          .then(newdata =>{
                            if(newdata === null){
                              res.status(200).json({
                                status: 'Failed',
                                message: 'Please provide correct userid.'
                              });
                            }
                            else{
                              fcmModel.findOneAndUpdate({userid:req.body.userid},
                                              {$set:{fcmtoken:""}})
                                      .exec()
                                      .then(data =>{
                                          return res.status(200).json({
                                             status: 'Ok',
                                              message: 'Logged out successfully.',
                                          });
                                      }).catch(err => {
                                        var spliterror=err.message.split(":")
                                        res.status(500).json({ 
                                          status: 'Failed',
                                          message: spliterror[0]
                                        });
                                      })
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

router.get("/getcategory/:clientid/:iv_token", (req, res, next) => {    

    if(constants.AndriodClientId === req.params.clientid || constants.IosClientId === req.body.clientid){
    authModel.find({iv_token: req.params.iv_token})       
      .exec()
      .then(user => { 
        if (user.length < 1) {
              return res.status(200).json({
                status:"Logout",
                message:"You are logged in other device."
              });
          } 
          else {
            categoryModel.find({})
                        .exec()
                        .then(data => {
                            if(data.length<1){
                              return res.status(200).json({
                                status:"Ok",
                                message:"No categories to display."
                              });
                            }
                            else{

                                var docs = data[0].category;
                                var test=[];

                               docs.sort(function(a, b){
                                  var nameA=a.name.toLowerCase(), nameB=b.name.toLowerCase()
                                  if (nameA < nameB) //sort string ascending
                                      return -1 
                                  if (nameA > nameB)
                                      return 1
                                  return 0 //default return value (no sorting)
                              })

                              docs.map(doc => {
                                  var foe = {
                                  "name": doc.name,
                                  "id":doc.category_id,
                                }
                              test.push(foe)
                              })
                              return res.status(200).json({
                                status:"Ok",
                                message:"Categories",
                                list: test
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
    }
    else{
        res.status(200).json({
            status: 'Failed',
            message: 'Bad Request. Please provide correct clientid.'
        });
    } 

});

router.post("/postcategory", (req, res, next) => {    

  var keyArray = [ 'category', 'clientid'];
  var key = Object.keys(req.body);
  if (keyArray.length == key.length && keyArray.every((v) => key.indexOf(v) >= 0)) {

    if(constants.AndriodClientId === req.body.clientid || constants.IosClientId === req.body.clientid){
            categoryModel.find({})
                          .exec()
                          .then(user =>{
                            if(user.length<1){
                              var newcategory= new categoryModel({
                                _id: new mongoose.Types.ObjectId(),
                                category:[{name:req.body.category,
                                            category_id:1}]
                              })
                              newcategory.save()
                                        .then(userCheck =>{
                                            return res.status(200).json({
                                                status:"Ok",
                                                message:"Updated new category"
                                            });
                                        }).catch(err => {
                                      if (err.code === 11000){
                                          var error = err.errmsg;
                                          var spliterror = error.split(":")
                                          res.status(500).json({ 
                                            status: 'Failed',
                                            message: spliterror[2]
                                          })
                                      }
                                      else{
                                        var spliterror=err.message.split(":")
                                        res.status(500).json({ 
                                          status: 'Failed',
                                          message: spliterror[0]
                                        });
                                      }
                                });
                            }
                            else{
                              var len= user[0].category.length+1;
                              console.log(len)
                              categoryModel.update({},{$push:{category:{name:req.body.category,category_id:len }}})
                                .exec()
                                .then(data => {
                                    return res.status(200).json({
                                      status:"Ok",
                                      message:"Updated new category"
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

router.post("/sendotp", (req, res, next) => {

 var keyArray = [ 'mobile',
  'clientid' ];

  var key = Object.keys(req.body);
  if (keyArray.length == key.length && keyArray.every((v) => key.indexOf(v) >= 0)) {

  if(constants.AndriodClientId === req.body.clientid || constants.IosClientId === req.body.clientid){
  // sending otp through sms
       
        const otpval = Math.floor(100000 + Math.random() * 900000);
        var msg =utf8.encode("Your OTP is:"+otpval+" Thank You for your interest in fvmegear. The OTP will be valid for 10 minutes.");
        var toNumber = req.body.mobile;
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
       console.log(typeof req.body.mobile)
       //saving otp to database
        PasswordModel.find({mobile:parseInt(req.body.mobile)})
                    .exec()
                    .then(userCheck =>{
                      if(userCheck.length<1){
                        const otp = new PasswordModel({
                        _id: new mongoose.Types.ObjectId(),
                          otp: otpval,
                          mobile: req.body.mobile,
                          otp_verified: 0
                        })
                        otp.save()
                              .then(result => {

                                  var time= setTimeout(function() {
                                      PasswordModel.findOneAndUpdate({$and:[{mobile: parseInt(req.body.mobile)},{otp_verified:0}]},{$set:{otp:null,updated_on:Date.now()}})
                                          .exec()
                                          .then(data =>{
                                              clearTimeout(time);
                                          }).catch(err => {
                                                var spliterror=err.message.split(":")
                                                    res.status(500).json({ 
                                                      status: 'Failed',
                                                      message: spliterror[0]+ spliterror[1]
                                                });
                                          });
                                  }, 600000);  //10 mnts expiry for otp
                                    return res.status(200).json({
                                      status: 'Ok',
                                      message: 'Otp sent successfully. Please check your mobile'
                                    });
                                }).catch(err => {
                                      if (err.code === 11000){
                                          var error = err.errmsg;
                                          var spliterror = error.split(":")
                                          res.status(500).json({ 
                                            status: 'Failed',
                                            message: spliterror[2]
                                          })
                                      }
                                      else{
                                        var spliterror=err.message.split(":")
                                        res.status(500).json({ 
                                          status: 'Failed',
                                          message: spliterror[0]
                                        });
                                      }
                                });
                        }
                        else{
                          PasswordModel.findOneAndUpdate({mobile:parseInt(req.body.mobile)},{$set:{otp:otpval, created_at:Date.now(),otp_verified: 0}})
                                        .exec()
                                        .then(newdata =>{

                                            var time = setTimeout(function() {
                                                PasswordModel.findOneAndUpdate({$and:[{mobile:parseInt(req.body.mobile)},{otp_verified:0}]},{$set:{otp:null,updated_on:Date.now()}})
                                                  .exec()
                                                  .then(data =>{
                                                    clearTimeout(time);
                                                }).catch(err => {
                                                    var spliterror=err.message.split(":")
                                                        res.status(500).json({ 
                                                          status: 'Failed',
                                                          message: spliterror[0]+ spliterror[1]
                                                    });
                                                });
                                            },600000);  //10 mnts expiry for otp
                      
                                            return res.status(200).json({
                                              status: 'Ok',
                                              message: 'Otp sent successfully. Please check your mobile'
                                            });
                                        }).catch(err => {
                                          var spliterror=err.message.split(":")
                                          res.status(500).json({ 
                                            status: 'Failed',
                                            message: spliterror[0]+ spliterror[1]
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

router.post("/verify_otp", (req, res, next) => {
  var keyArray = [ 'userid',
  'mobile',
  'otp',
  'clientid' ];

  var key = Object.keys(req.body);
  if (keyArray.length == key.length && keyArray.every((v) => key.indexOf(v) >= 0)) {

  if(constants.AndriodClientId === req.body.clientid || constants.IosClientId === req.body.clientid){

    PasswordModel.find({mobile: req.body.mobile})       
      .exec()
      .then(user => {
        if (user.length < 1) {
          return res.status(200).json({
            status:"Failed",
            message: "Please provide correct mobile number"
          });
        } else {
          if(user[0].otp === req.body.otp){

            User.find({_id:ObjectId(req.body.userid)})
                .exec()
                .then(dox =>{
                  var query =""
                  var condition = ""
                  if(String(dox[0].mobile) === String(req.body.mobile)){
                      query = {_id:ObjectId(req.body.userid)}
                      condition = {$set:{ mobile_verified:true}}
                  }
                  else{
                    query = {_id:ObjectId(req.body.userid)}
                    condition = {$set:{mobile:req.body.mobile, mobile_verified:true}}
                  }

                    User.findOneAndUpdate(query,condition)       
                      .exec()
                      .then(users => {
                            PasswordModel.findOneAndUpdate({$and:
                              [{mobile: parseInt(req.body.mobile)},
                              {otp: req.body.otp}]}, 
                              {$set:{otp_verified:1 ,updated_on:Date.now()}})       
                              .exec()
                              .then(data => {
                                      var msgbody ="Thank you for Signup!\nAn Appreciation token, Amazon gift card worth Rs.50/- will be sent your registered email id.\nAdd 50 friends to get another amazon gift voucher of worth Rs.450/-\n100 friends can win you 20000/- worth gifts."
                                          const note_no =Math.floor(10000000000 + Math.random() * 90000000000);
                                          notificationModel.findOneAndUpdate({userid:ObjectId(req.body.userid)},
                                              {$push:{notifications:{
                                                notification_data: msgbody,
                                                member_id: "",
                                                notification_type: 'home',
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
                                                        fcmModel.find({userid : req.body.userid})
                                                            .exec()
                                                            .then(user => {
                                                              console.log(user)
                                                              if (user.length < 1) {
                                                                  return res.status(200).json({
                                                                    status:"Failed",
                                                                    message:"Please provide correct userid."
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
                                                                          notification_slug: 'home',
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
                                                           //         res.status(200).json({
                                                                //  status: 'Ok',
                                                                //  message: "Sent successfully"
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

                                  res.status(200).json({ 
                                    status: 'Ok',
                                    message: "Mobile verified successfully",
                                    mobile: req.body.mobile
                                  });
                              }).catch(err => {
                                var spliterror=err.message.split(":")
                                      res.status(500).json({ 
                                         status: 'Failed',
                                         message: spliterror[0]+ spliterror[1]
                                      });
                              });

                        }).catch(err => {
                          if (err.code === 11000){
                            var error = err.errmsg;
                            var spliterror = error.split(":")
                             if (spliterror[2] === " mobile_1 dup key"){
                                res.status(200).json({ 
                                   status: 'Failed',
                                   message: "Mobile number already exists for other user."
                                })
                              }
                              else{
                                     res.status(500).json({ 
                                         status: 'Failed',
                                         message: spliterror[0]+ spliterror[1]
                                      });
                              }
                            }
                              else{
                                  var spliterror=err.message.split("_")
                                  if(spliterror[1].indexOf("id")>=0){
                                    res.status(500).json({ 
                                      status: 'Failed',
                                      message: "Please provide correct mobile number"
                                    });
                                  }
                                  else{
                                      res.status(500).json({ 
                                         status: 'Failed',
                                         message: spliterror[0]+ spliterror[1]
                                      });
                                  }
                              }
                      });
                }).catch(err =>{
                   var spliterror=err.message.split("_")
                          if(spliterror[1].indexOf("id")>=0){
                            res.status(500).json({ 
                              status: 'Failed',
                              message: "Please provide correct userid"
                            });
                          }
                          else{
                              res.status(500).json({ 
                                 status: 'Failed',
                                 message: spliterror[0]+ spliterror[1]
                              });
                          }
                })
            }
            else{
              return res.status(200).json({
                status:"Failed",
                message: "Invalid OTP"
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
    }else {
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

router.post("/signup_android", (req, res, next) => {
 var keyArray = [ 'email',
  'username',
  'fullname',
  'age',
  'mobile',
  'gender',
  'imei',
  'deviceid',
  'language',
  'password',
  'usertype',
  'fcmtoken',
  'refby',
  'clientid' ];

  var key = Object.keys(req.body);
  if (keyArray.length == key.length && keyArray.every((v) => key.indexOf(v) >= 0)) {
    
    if(constants.AndriodClientId === req.body.clientid || constants.IosClientId === req.body.clientid){

      if(req.body.usertype === "generaluser"){
                    User.find(//{$or:[{imei:req.body.imei, deviceid:req.body.deviceid},
                                    {$and:[{ email: req.body.email },
                                    {username: req.body.username},
                                    {mobile: req.body.mobile}]})
                                    //]})
                    .exec()
                    .then(user => {
                      if (user.length >= 1) {
                        return res.status(200).json({
                          status:"Failed",
                          message:"An account is already registered with this device."
                        });
                      } else {

                          const refercode = Math.floor(1000 + Math.random() * 9000);
                          var tempPassword = req.body.password;
                          var bytes = utf8.encode(tempPassword);
                          var hash = constants.ApiConstant+base64.encode(bytes);
                          var users = ""
                          var profileimage = profileimages(req.body.username)
                        var mobile =""
                        if(req.body.mobile === ""){
                          users = new User({
                              _id: new mongoose.Types.ObjectId(),
                              email: req.body.email,
                              username: req.body.username,
                              fullname: req.body.fullname,
                              age:req.body.age,
                              gender:req.body.gender,
                              usertype:req.body.usertype,
                              imei: req.body.imei,
                              deviceid:req.body.deviceid,
                              language:req.body.language,
                              ref_Code:req.body.username+refercode,
                              refby: req.body.refby,
                              password: hash,
                              profileimage:profileimage
                            });
                        }
                        else{
                          users =  new User({
                              _id: new mongoose.Types.ObjectId(),
                              email: req.body.email,
                              username: req.body.username,
                              fullname: req.body.fullname,
                              age:req.body.age,
                              mobile:req.body.mobile,
                              gender:req.body.gender,
                              usertype:req.body.usertype,
                              imei: req.body.imei,
                              deviceid:req.body.deviceid,
                              language:req.body.language,
                              ref_Code:req.body.username+refercode,
                              refby: req.body.refby,
                              password: hash,
                              profileimage:profileimage
                            });
                        }
                          
                            users
                              .save()
                              .then(userCheck => {

                                //userDetails schema save
                                const newUserDetails= new details({
                                  _id: new mongoose.Types.ObjectId(),
                                  userid:userCheck._id,
                                  talent_points:100
                                })

                                  newUserDetails.save()
                                        .then(del =>{
                                        }).catch(err => {
                                                var spliterror=err.message.split(":")
                                                res.status(500).json({ 
                                                  status: 'Failed',
                                                  message: spliterror[0]
                                                });
                                        });

                                //contacts schema save
                                const newContacts= new contactsModel({
                                  _id: new mongoose.Types.ObjectId(),
                                  userid:userCheck._id,
                                })

                                  newContacts.save()
                                        .then(del =>{
                                        }).catch(err => {
                                                var spliterror=err.message.split(":")
                                                res.status(500).json({ 
                                                  status: 'Failed',
                                                  message: spliterror[0]
                                                });
                                        });

                                //notifications schema save
                                const notify = new notificationModel({
                                  _id: new mongoose.Types.ObjectId(),
                                  userid:userCheck._id,
                                })

                                notify.save()
                                      .then(dely =>{
                                      }).catch(err => {
                                                var spliterror=err.message.split(":")
                                                res.status(500).json({ 
                                                  status: 'Failed',
                                                  message: spliterror[0]
                                                });
                                        });


                                        const secretToken = randomstring.generate();
 
                                        console.log(secretToken);

                                        User.findOneAndUpdate({_id:userCheck._id},
                                          {$set:{email_token:secretToken}})
                                          .exec()
                                          .then(newdata1 =>{
                                          }).catch(err => {
                                           var spliterror=err.message.split(":")
                                            res.status(500).json({ 
                                               status: 'Failed',
                                               message: spliterror[0]+ spliterror[1]
                                            });
                                        });
    

                                       let transporter = nodemailer.createTransport({
                                         host: 'email-smtp.us-east-1.amazonaws.com',
                                         port: 465,
                                         secureConnection: true, // upgrade later with STARTTLS
                                         auth: {
                                             user: 'AKIAUXODAPAAGIPOV6H6',
                                             pass: 'BPfCccx4weCniuXGaIXHaGB28u2GcO8u5x1RjR9oxE8T'
                                         }
                                        
                                     });
                                

                                     let HelperOptions = {
                                         from: 'contact@ivicatechnologies.com',
                                         to: req.body.email,
                                         subject: req.body.username + ', Welcome to fvmegear',
                                        html:`<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                                        <html>
                                        
                                        <head>
                                            <meta charset="UTF-8">
                                            <meta content="width=device-width, initial-scale=1" name="viewport">
                                            <meta name="x-apple-disable-message-reformatting">
                                            <meta http-equiv="X-UA-Compatible" content="IE=edge">
                                            <meta content="telephone=no" name="format-detection">
                                            <title></title>
                                            <!--[if (mso 16)]>
                                            <style type="text/css">
                                            a {text-decoration: none;}
                                            </style>
                                            <![endif]-->
                                            <!--[if gte mso 9]><style>sup { font-size: 100% !important; }</style><![endif]-->
                                        </head>
                                  
                                        
                                        <body>
                                            <div class="es-wrapper-color">
                                                <!--[if gte mso 9]>
                                              <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
                                                <v:fill type="tile" color="#FFFFFF"></v:fill>
                                              </v:background>
                                            <![endif]-->
                                                <table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0">
                                                    <tbody>
                                                        <tr>
                                                            <td class="esd-email-paddings" valign="top">
                                                                <table class="es-header es-preheader esd-header-popover" cellspacing="0" cellpadding="0" align="center">
                                                                    <tbody>
                                                                        <tr>
                                                                            <td class="es-adaptive esd-stripe" esd-custom-block-id="2995" align="center">
                                                                                <table class="es-content-body" style="background-color: transparent;" width="600" cellspacing="0" cellpadding="0" align="center">
                                                                                    <tbody>
                                                                                        <tr>
                                                                                            <td class="esd-structure es-p10" align="left">
                                                                                                <!--[if mso]><table width="580"><tr><td width="390" valign="top"><![endif]-->
                                                                                                <!-- <table class="es-left" cellspacing="0" cellpadding="0" align="left">
                                                                                                    <tbody>
                                                                                                        <tr>
                                                                                                            <td class="esd-container-frame" width="390" align="left">
                                                                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                                    <tbody>
                                                                                                                        <tr>
                                                                                                                            <td class="es-infoblock esd-block-text es-m-txt-c" align="left">
                                                                                                                                <p><span style="text-align: center;">Put your preheader text here</span></p>
                                                                                                                            </td>
                                                                                                                        </tr>
                                                                                                                    </tbody>
                                                                                                                </table>
                                                                                                            </td>
                                                                                                        </tr>
                                                                                                    </tbody>
                                                                                                </table> -->
                                                                                                <!--[if mso]></td><td width="20"></td><td width="170" valign="top"><![endif]-->
                                                                                                <!-- <table class="es-right" cellspacing="0" cellpadding="0" align="right">
                                                                                                    <tbody>
                                                                                                        <tr>
                                                                                                            <td class="esd-container-frame" width="170" align="left">
                                                                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                                    <tbody>
                                                                                                                        <tr>
                                                                                                                            <td class="es-infoblock esd-block-text es-m-txt-c" align="right">
                                                                                                                                <p><a href="http://#" target="_blank">View in browser</a></p>
                                                                                                                            </td>
                                                                                                                        </tr>
                                                                                                                    </tbody>
                                                                                                                </table>
                                                                                                            </td>
                                                                                                        </tr>
                                                                                                    </tbody>
                                                                                                </table> -->
                                                                                                <!--[if mso]></td></tr></table><![endif]-->
                                                                                            </td>
                                                                                        </tr>
                                                                                    </tbody>
                                                                                </table>
                                                                            </td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                                <table class="es-content" cellspacing="0" cellpadding="0" align="center">
                                                                    <tbody>
                                                                        <tr>
                                                                            <td class="esd-stripe" esd-custom-block-id="28181" align="center">
                                                                                <table class="es-content-body" width="600" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center">
                                                                                    <tbody>
                                                                                        <tr>
                                                                                            <td class="esd-structure es-p15t es-p15b es-p20r es-p20l esd-checked"  esd-custom-block-id="28206" bgcolor="#F2F2F4" align="left">
                                                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                    <tbody>
                                                                                                        <tr>
                                                                                                            <td class="esd-container-frame" width="560" valign="top" align="center">
                                                                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                                    <tbody>
                                                                                                                        <tr>
                                                                                                                            <td class="esd-block-image" align="center">
                                                                                                                                <a target="_blank"> <img src=" http://ivicatechnologies.com/uploads/fvmegearlogo.png " alt="Quick taxi logo" title="Quick taxi logo" style="display: block;" width="92"> </a>
                                                                                                                            </td>
                                                                                                                            <td class="esd-block-image">
                                                                                                                                <h2>fvmegear </h2>
                                                                                                                                <p>Thanks  For Signup</p>
                                                                                                                            </td>
                                                                                                                        </tr>
                                                                                                                    </tbody>
                                                                                                                </table>
                                                                                                            </td>
                                                                                                        </tr>
                                                                                                    </tbody>
                                                                                                </table>
                                                                                            </td>
                                                                                        </tr>
                                                                                        <tr>
                                                                                            <td class="esd-structure es-p10b" esd-general-paddings-checked="false" align="left">
                                                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                    <tbody>
                                                                                                        <tr>
                                                                                                            <td class="esd-container-frame" width="600" valign="top" align="center">
                                                                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                                    <tbody>
                                                                                                                        <tr>
                                                                                                                            <td class="esd-block-spacer es-p5b" align="center">
                                                                                                                                <table width="100%" height="100%" cellspacing="0" cellpadding="0" border="0">
                                                                                                                                    <tbody>
                                                                                                                                        <tr>
                                                                                                                                            <td style="border-bottom: 1px solid rgb(239, 239, 239); background: rgba(0, 0, 0, 0) none repeat scroll 0% 0%; height: 1px; width: 100%; margin: 0px;"></td>
                                                                                                                                        </tr>
                                                                                                                                    </tbody>
                                                                                                                                </table>
                                                                                                                            </td>
                                                                                                                        </tr>
                                                                                                                    </tbody>
                                                                                                                </table>
                                                                                                            </td>
                                                                                                        </tr>
                                                                                                    </tbody>
                                                                                                </table>
                                                                                            </td>    
                                                                                        </tr>
                                                                                        <tr>
                                                                                            <td class="esd-structure es-p20t es-p20b es-p20r es-p20l" esd-custom-block-id="2997" style="background-position: center top;" align="left">
                                                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                    <tbody>
                                                                                                        <tr>
                                                                                                            <td>
                                                                                                             <img src="http://ivicatechnologies.com/uploads/template.png" alt="Petshop logo" title="Petshop logo" width="600" height="250" style="display: block;">
                                                                                                            </td>
                                                                                                        </tr>
                                                                                                    </tbody>
                                                                                                </table>      
                                                                                            </td>
                                                                                        </tr>
                                                                                        <tr>
                                                                                            <td class="esd-structure es-p20t es-p20b es-p20r es-p20l" esd-custom-block-id="2997" style="background-position: center top;" bgcolor="#F2F2F4" align="left">
                                                                                                <table width="100%"  height="30%" cellspacing="0" cellpadding="0">
                                                                                                    <tbody>
                                                                                                        <tr>
                                                                                                            <td class="esd-block-text es-p5t" align="center">
                                                                                                                <h3>Please click below link to verify your E-mail address</h3>
                                                                                                               <a style=" background-color: #42daf5;
                                                                                                               border: none;
                                                                                                               color: white;
                                                                                                               padding: 10px 20px;
                                                                                                               text-align: center;
                                                                                                               text-decoration: none;
                                                                                                               display: inline-block;
                                                                                                               margin: 4px 2px;
                                                                                                               cursor: pointer;
                                                                                                               border-radius: 16px; " href="http://ivicatechnologies.com/verification.php?secretToken=${secretToken}" >click here</a>
                                                                                                                <p><br></p>
                                                                                                            </td>
                                                                                                        </tr>
                                                                                                    </tbody>
                                                                                                </table>
                                                                                            </td>
                                                                                        </tr>
                                                                                        <tr>
                                                                                            <td class="esd-structure es-p10t es-p10b es-p20r es-p20l" esd-general-paddings-checked="false" style="background-position: center center;" align="left">
                                                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                    <tbody>
                                                                                                        <tr>
                                                                                                            <td class="esd-container-frame" width="560" valign="top" align="center">
                                                                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                                    <tbody>
                                                                                                                        <tr>
                                                                                                                            <td class="esd-block-spacer es-p5t es-p5b" align="center">
                                                                                                                                <table width="100%" height="40%" cellspacing="0" cellpadding="0" border="0">
                                                                                                                                    <tbody>
                                                                                                                                        <tr>
                                                                                                                                            <td style="border-bottom: 1px solid rgb(239, 239, 239); background: rgba(0, 0, 0, 0) none repeat scroll 0% 0%; width: 100%; margin: 0px;"></td>
                                                                                                                                        </tr>
                                                                                                                                    </tbody>
                                                                                                                                </table>
                                                                                                                            </td>
                                                                                                                        </tr>
                                                                                                                    </tbody>
                                                                                                                </table>
                                                                                                            </td>
                                                                                                        </tr>
                                                                                                    </tbody>
                                                                                                </table>
                                                                                            </td>
                                                                                        </tr>
                                                                                    </tbody>
                                                                                </table>
                                                                            </td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                                <table class="es-footer esd-footer-popover" cellspacing="0" cellpadding="0" align="center" bgcolor="#c93939">
                                                                    <tbody>
                                                                        <tr> </tr>
                                                                        <tr>
                                                                            <td class="esd-stripe" esd-custom-block-id="3007" align="center">
                                                                                <table class="es-footer-body" width="600" cellspacing="0" cellpadding="0" align="center" bgcolor="#c93939">
                                                                                    <tbody>
                                                                                        <tr>
                                                                                            <td class="esd-structure es-p20" esd-general-paddings-checked="false" style="background-position: left top;" align="left" bgcolor="#c93939">
                                                                                                <!--[if mso]><table width="560" cellpadding="0" cellspacing="0"><tr><td width="178" valign="top"><![endif]-->
                                                                                                <table class="es-left" cellspacing="0" cellpadding="0" align="left">
                                                                                                    <tbody>
                                                                                                        <tr>
                                                                                                            <td class="es-m-p0r es-m-p20b esd-container-frame" width="150" align="center" bgcolor="#c93939">
                                                                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                                    <tbody>
                                                                                                                        <tr>
                                                                                                                            <br>
                                                                                                                            <td class="esd-block-image" align="center"><br>
                                                                                                                                <a target="_blank"> <img src="http://ivicatechnologies.com/uploads/ivica%20a4.png" alt="Quick taxi logo" title="Quick taxi logo" width="50" style="display: block;"> </a>
                                                                                                                            </td>
                                                                                                                            <br>
                                                                                                                        </tr>
                                                                                             
                                                                                                                    </tbody>
                                                                                                                </table>
                                                                                                            </td>
                                                                                                        </tr>
                                                                                                    </tbody>
                                                                                                </table>
                                                                                                <!--[if mso]></td><td width="20"></td><td width="362" valign="top"><![endif]-->
                                                                                                <table cellspacing="0" cellpadding="0" align="right">
                                                                                                    <tbody>
                                                                                                        <tr>
                                                                                                            <td class="esd-container-frame" width="362" align="left">
                                                                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                                    <tbody>
                                                                                                                        <tr>
                                                                                                                            <td class="esd-block-text es-p10b es-m-txt-c" align="left">
                                                                                                                                <h3>Contact us</h3>
                                                                                                                            </td>
                                                                                                                            <!-- <td class="es-p10r" valign="top" align="center"> 
                                                                                                                                <a target="_blank" href="https://www.linkedin.com/company/ivica-technologies-private-limited/about/?viewAsMember=true"><img title="LinkedIn" src="https://ivicatechnologies.in/uploads/linkedin.png" alt="Tw" width="24" height="24" hspace="20"> </a><br>
                                                                                                                            </td>
                                                                                                                            <td class="es-p10r" valign="top" align="right">
                                                                                                                                <a target="_blank" href="https://www.facebook.com/IvicaTechnologies/"><img title="Facebook" src="https://ivicatechnologies.in/uploads/facebook-logo-in-circular-button-outlined-social-symbol (1).png" alt="Fb" width="24" height="24"></a>
                                                                                                                            </td> -->
                                                                                                                        </tr>
                                                                                                                        <tr>
                                                                                                                            <td class="esd-block-text es-m-txt-c" esd-links-underline="none">
                                                                                                                                <font color="#333333"><span style="font-size: 14px;">IvicaTechnologies</span></font>
                                                                                                                            </td>
                                                                                                                           
                                                                                                                            
                                                                                                                        </tr>
                                                                                                                        <tr>
                                                                                                                            <td class="esd-block-text es-m-txt-c" esd-links-underline="none" align="left">
                                                                                                                                <font color="#333333"><span style="font-size: 14px;">contact@ivicatechnologies.com</span></font><br>
                                                                                                                                
                                                                                                                            </td>
                                                                                                                            
                                                                                                                        </tr>
                                                                                                                        <tr> 
                                                                                                                            <td class="esd-block-text es-m-txt-c" esd-links-underline="none" width="362" align="left">
                                                                                                                                <table class="es-social es-table-not-adapt" cellspacing="0" cellpadding="0">
                                                                                                                                    <tbody>
                                                                                                                                        <tr>
                                                                                                                                            <td class="esd-block-text es-m-txt-c" esd-links-underline="none" align="left"> <br>
                                                                                                                                                <a target="_blank" href="https://www.linkedin.com/company/ivica-technologies-private-limited/about/?viewAsMember=true"><img title="LinkedIn" src="http://ivicatechnologies.com/uploads/linkedin.png" alt="Tw" width="28" height="23" > </a><br>
                                                                                                                                            </td>
                                                                                                                                            <td class="es-p10r" valign="top" align="center"> <br>
                                                                                                                                                <a target="_blank" href="https://www.facebook.com/IvicaTechnologies/"><img title="Facebook" src=" http://ivicatechnologies.com/uploads/facebook-logo-in-circular-button-outlined-social-symbol(1).png" alt="Fb" width="28" height="23" hspace="30"></a>
                                                                                                                                            </td>
                                                                                                                                        </tr>  
                                                                                                                                    </tbody> 
                                                                                                                                </table>
                                                                                                                                <!-- <p><br></p> -->
                                                                                                                            </td>
                                                                                                                        </tr> 
                                                                                                                                                                              
                                                                                                                        <!-- <tr>
                                                                                                                            <td class="es-p10r" valign="top" align="center">
                                                                                                                                <a target="_blank" href="https://play.google.com/store/apps/details?id=ivicatechnologies.com.famegear"><img title="Facebook" src="https://ivicatechnologies.in/uploads/android.png" alt="Fb" width="100" height="30"></a>
                                                                                                                            </td>
                                                                                                                            <td class="es-p10r" valign="top" align="center">
                                                                                                                                <a target="_blank" href="https://itunes.apple.com/in/app/fvmegear/id1458770790?mt=8"><img title="Facebook" src="https://ivicatechnologies.in/uploads/ios.png" alt="Fb" width="100" height="30"></a>
                                                                                                                            </td>         
                                                                                                                        </tr>   -->
                                                                                                                        <tr>
                                                                                                                            <td class="esd-block-social es-p10t es-m-txt-c" align="left">
                                                                                                                                <table class="es-social es-table-not-adapt" cellspacing="0" cellpadding="0">
                                                                                                                                    <tbody>
                                                                                                                                        <tr>
                                                                                                                                            <td class="es-p10r" valign="top" align="center">
                                                                                                                                                <a target="_blank" href="https://play.google.com/store/apps/details?id=ivicatechnologies.com.famegear"><img title="Facebook" src=" http://ivicatechnologies.com/uploads/android.png" alt="Fb" width="100"></a>
                                                                                                                                            </td>
                                                                                                                                            <td class="es-p10r" valign="top" align="center">
                                                                                                                                                <a target="_blank" href="https://itunes.apple.com/in/app/fvmegear/id1458770790?mt=8"><img title="Facebook" src="http://ivicatechnologies.com/uploads/ios.png" alt="Fb" width="100" height="30" hspace="20"></a>
                                                                                                                                            </td> 
                                                                                                                                        </tr>  
                                                                                                                    
                                                                                                                                    </tbody> 
                                                                                                                                </table>
                                                                                                                                    <!-- <p><br></p> -->
                                                                                                                            </td>
                                                                                                                        </tr> 
                                                                                                                        <!-- <tr>
                                                                                                                            <td class="esd-block-text es-p10t es-m-txt-c" align="left">
                                                                                                                                <p style="font-size: 12px; line-height: 150%;">You are receiving this email because you subscribed to our site. Please note that you can&nbsp;<a target="_blank" style="font-size: 12px;">unsubscribe</a>&nbsp;at any time.</p>
                                                                                                                            </td>
                                                                                                                        </tr>  -->
                                                                                                                    </tbody>
                                                                                                                </table>
                                                                                                            </td>
                                                                                                        </tr>
                                                                                                    </tbody>
                                                                                                </table>
                                                                                                <!--[if mso]></td></tr></table><![endif]-->
                                                                                            </td>
                                                                                        </tr>
                                                                                    </tbody>
                                                                                </table>
                                                                            </td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                            <div style="position:absolute;left:-9999px;top:-9999px;"></div>
                                        </body>
                                        
                                        </html>`
                                       
                                     };
                                     transporter.use('compile', htmlToText(HelperOptions));
                                     
                                     transporter.sendMail(HelperOptions, (error, info) => {
                                         if (error) {
                                             return console.log(error);
                                         } else {
                                           //  console.log('The  message was sent!');
                                             return console.log(info);
                                         }
                                        
                                     });

                               
                                uidgen.generate((err, uid) => {
                                if (err) {
                                  var spliterror=err.message.split(":")
                                  res.status(500).json({ 
                                    status: 'Failed',
                                    message: spliterror[0]+spliterror[1]
                                  });
                                }
                                const token = uid;

                                // auth schema save
                                  const  authmodel= new authModel({
                                  _id: new mongoose.Types.ObjectId(),
                                  userid:userCheck._id,
                                  iv_token: token,
                                  imei: req.body.imei,
                                  deviceid:req.body.deviceid
                                });
                                authModel
                                  .find({userid:userCheck._id})
                                  .exec()
                                  .then(result => {
                                      if(result.length<1){
                                        authmodel.save()
                                        .then(data =>{
                                        }).catch(err => {
                                                var spliterror=err.message.split(":")
                                                res.status(500).json({ 
                                                  status: 'Failed',
                                                  message: spliterror[0]
                                                });
                                        });
                                      }
                                      else{
                                        authModel.findOneAndUpdate({userid:userCheck._id},
                                                      {$set:{iv_token:token,created_at:Date.now(),removed_at:null}})
                                                  .exec()
                                                  .then(newdata =>{
                                                  }).catch(err => {
                                                   var spliterror=err.message.split(":")
                                                    res.status(500).json({ 
                                                       status: 'Failed',
                                                       message: spliterror[0]+ spliterror[1]
                                                    });
                                                });
                                      }
                                        const newFcm = new fcmModel({
                                            _id: new mongoose.Types.ObjectId(),
                                            deviceid : req.body.deviceid,
                                            imei : req.body.imei,
                                            fcmtoken : req.body.fcmtoken,
                                            userid: userCheck._id,
                                            mobile:userCheck.mobile
                                          })
                                    newFcm.save()
                                      .then(newdata => {
                                          var emailcheck="";  
                                          var email_verified = false
                                          if(userCheck.mobile_verified === 'true'){
                                              emailcheck=true;
                                          }else{
                                              emailcheck=false
                                          }

                                          if(userCheck.email_verified === 1){
                                              email_verified=true;
                                          }else{
                                              email_verified=false
                                          }

                                          return res.status(200).json({
                                                            status: 'Ok',
                                                            message: 'Signed up successfully.',
                                                            userdetails:{
                                                              username: userCheck.username,
                                                              fullname: userCheck.fullname,
                                                              email:userCheck.email,
                                                              mobile:userCheck.mobile,
                                                              iv_token:token,
                                                              userid: userCheck._id,
                                                              is_verified: emailcheck,
                                                              email_verified: email_verified,
                                                              gender: userCheck.gender,
                                                              language: userCheck.language,
                                                              postscount: 0,
                                                              usertype: userCheck.usertype,
                                                              notificationcount: 0,
                                                              messagescount: 0,
                                                              bus_prof_id: userCheck.business_profile_id,
                                                              is_profile_completed: userCheck.is_profile_completed,
                                                              ref_Code:userCheck.ref_Code,
                                                              user_category:'Stellar',
                                                              email_token : secretToken
                                                            }
                                                          });
                                      }).catch(err => {
                                                var spliterror=err.message.split(":")
                                                res.status(500).json({ 
                                                  status: 'Failed',
                                                  message: spliterror[0]
                                                });
                                        });
                            }).catch(err => {                         // catch the auth schema save errors here 
                              if (err.code === 11000){
                                var error = err.errmsg;
                                 var spliterror = error.split(":")
                                  res.status(500).json({ 
                                    status: 'Failed',
                                    message: spliterror[2]
                                  })
                              }
                              else{
                              var spliterror=err.message.split(":")
                              res.status(500).json({ 
                                status: 'Failed',
                                message: spliterror[0]+spliterror[1]
                              });
                            }
                          });
                          });
                            }).catch(err => {                               // catch the user schema save errors here 
                              if (err.code === 11000){
                              var error = err.errmsg;
                              var spliterror = error.split(":")
                                  if(spliterror[2] === " email_1 dup key"){
                                      res.status(200).json({ 
                                        status: 'Failed',
                                        message: "Mail already exists"
                                      })
                                  }
                                  else if(spliterror[2] === " username_1 dup key"){
                                      res.status(200).json({ 
                                        status: 'Failed',
                                        message: "Username already exists"
                                      })
                                  }
                                  else if (spliterror[2] === " mobile_1 dup key"){
                                      if(req.body.mobile === ""){
                                      res.status(200).json({ 
                                        status: 'Failed',
                                        message: "Please provide the Mobile number"
                                      })
                                    }
                                    else{
                                      res.status(200).json({ 
                                        status: 'Failed',
                                        message: "Mobile number already exists"
                                      })
                                    }
                                  }
                                  else{
                                      res.status(500).json({ 
                                        status: 'Failed',
                                        message:spliterror[2]
                                      })
                                  }
                              }
                              else{
                              var spliterror=err.message.split(":")
                              res.status(500).json({ 
                                status: 'Failed',
                                message: spliterror[0]+spliterror[1]
                              });
                            }
                          });
                        } 
                    }).catch(err => {                               //catch for find email in the user table 
                        if (err.code === 11000){
                              var error = err.errmsg;
                              var spliterror = error.split(":")
                                  if(spliterror[2] === " email_1 dup key"){
                                      res.status(200).json({ 
                                        status: 'Failed',
                                        message: "Mail already exists"
                                      })
                                  }
                                  else if(spliterror[2] === " username_1 dup key"){
                                      res.status(200).json({ 
                                        status: 'Failed',
                                        message: "Username already exists"
                                      })
                                  }
                                  else if (spliterror[2] === " mobile_1 dup key"){
                                     if(req.body.mobile === ""){
                                      res.status(200).json({ 
                                        status: 'Failed',
                                        message: "Please provide the Mobile number"
                                      })
                                    }
                                    else{
                                      res.status(200).json({ 
                                        status: 'Failed',
                                        message: "Mobile number already exists"
                                      })
                                    }
                                  }
                                  else{
                                      res.status(500).json({ 
                                        status: 'Failed',
                                        message:spliterror[2]
                                      })
                                  }
                              }
                              else{
                              var spliterror=err.message.split(":")
                              res.status(500).json({ 
                                status: 'Failed',
                                message: spliterror[0]+spliterror[1]
                              });
                            }
                    });      
      }
      else if (req.body.usertype === "business"){                         //else if loop for usertype
                User.find({$or:[{imei:req.body.imei, deviceid:req.body.deviceid},
                                    {$and:[{ email: req.body.email },
                                    {username: req.body.username},
                                    {mobile: req.body.mobile}]}]})
                    .exec()
                    .then(user => {
                      if (user.length >= 1) {
                        return res.status(200).json({
                          status:"Failed",
                          message:"Mail already exists"
                        });
                      } else {
                          const code = Math.floor(1000 + Math.random() * 9000);
                          var tempPassword = req.body.password;
                          var bytes = utf8.encode(tempPassword);
                          var hash =  constants.ApiConstant+base64.encode(bytes);
                          const users = new User({
                              _id: new mongoose.Types.ObjectId(),
                              email: req.body.email,
                              username: req.body.username,
                              fullname: req.body.fullname,
                              age:req.body.age,
                              mobile:req.body.mobile,
                              gender:req.body.gender,
                              usertype:req.body.usertype,
                              imei: req.body.imei,
                              deviceid:req.body.deviceid,
                              language:req.body.language,
                              ref_Code:req.body.username+code,
                              refby: req.body.refby,
                              password: hash
                            });
                            users
                              .save()
                              .then(userCheck => {

                                //userDetails schema save
                                const dels= new details({
                                  _id: new mongoose.Types.ObjectId(),
                                  userid:userCheck._id,
                                })
                                
                                  dels.save()
                                        .then(data =>{
                                        }).catch(err => {
                                                var spliterror=err.message.split(":")
                                                res.status(500).json({ 
                                                  status: 'Failed',
                                                  message: spliterror[0]
                                                });
                                        });

                                //contacts schema save
                                const newCons= new contactsModel({
                                  _id: new mongoose.Types.ObjectId(),
                                  userid:userCheck._id,
                                })

                                  newCons.save()
                                        .then(del =>{
                                        }).catch(err => {
                                                var spliterror=err.message.split(":")
                                                res.status(500).json({ 
                                                  status: 'Failed',
                                                  message: spliterror[0]
                                                });
                                        });

                                   //notifications schema save
                                const notify = new notificationModel({
                                  _id: new mongoose.Types.ObjectId(),
                                  userid:userCheck._id,
                                })

                                notify.save()
                                      .then(dely =>{
                                      }).catch(err => {
                                                var spliterror=err.message.split(":")
                                                res.status(500).json({ 
                                                  status: 'Failed',
                                                  message: spliterror[0]
                                                });
                                        });


                                        const secretToken = randomstring.generate();
 
                                        console.log(secretToken);

                                        User.findOneAndUpdate({_id:userCheck._id},
                                          {$set:{email_token:secretToken}})
                                          .exec()
                                          .then(newdata1 =>{
                                          }).catch(err => {
                                           var spliterror=err.message.split(":")
                                            res.status(500).json({ 
                                               status: 'Failed',
                                               message: spliterror[0]+ spliterror[1]
                                            });
                                        });
    

                                       let transporter = nodemailer.createTransport({
                                         host: 'email-smtp.us-east-1.amazonaws.com',
                                         port: 465,
                                         secureConnection: true, // upgrade later with STARTTLS
                                         auth: {
                                             user: 'AKIAUXODAPAAGIPOV6H6',
                                             pass: 'BPfCccx4weCniuXGaIXHaGB28u2GcO8u5x1RjR9oxE8T'
                                         }
                                        
                                     });
                                

                                     let HelperOptions = {
                                         from: 'contact@ivicatechnologies.com',
                                         to: req.body.email,
                                         subject: req.body.username + ', Welcome to fvmegear',
                                        html:`<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                                        <html>
                                        
                                        <head>
                                            <meta charset="UTF-8">
                                            <meta content="width=device-width, initial-scale=1" name="viewport">
                                            <meta name="x-apple-disable-message-reformatting">
                                            <meta http-equiv="X-UA-Compatible" content="IE=edge">
                                            <meta content="telephone=no" name="format-detection">
                                            <title></title>
                                            <!--[if (mso 16)]>
                                            <style type="text/css">
                                            a {text-decoration: none;}
                                            </style>
                                            <![endif]-->
                                            <!--[if gte mso 9]><style>sup { font-size: 100% !important; }</style><![endif]-->
                                        </head>
                                  
                                        
                                        <body>
                                            <div class="es-wrapper-color">
                                                <!--[if gte mso 9]>
                                              <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
                                                <v:fill type="tile" color="#FFFFFF"></v:fill>
                                              </v:background>
                                            <![endif]-->
                                                <table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0">
                                                    <tbody>
                                                        <tr>
                                                            <td class="esd-email-paddings" valign="top">
                                                                <table class="es-header es-preheader esd-header-popover" cellspacing="0" cellpadding="0" align="center">
                                                                    <tbody>
                                                                        <tr>
                                                                            <td class="es-adaptive esd-stripe" esd-custom-block-id="2995" align="center">
                                                                                <table class="es-content-body" style="background-color: transparent;" width="600" cellspacing="0" cellpadding="0" align="center">
                                                                                    <tbody>
                                                                                        <tr>
                                                                                            <td class="esd-structure es-p10" align="left">
                                                                                                <!--[if mso]><table width="580"><tr><td width="390" valign="top"><![endif]-->
                                                                                                <!-- <table class="es-left" cellspacing="0" cellpadding="0" align="left">
                                                                                                    <tbody>
                                                                                                        <tr>
                                                                                                            <td class="esd-container-frame" width="390" align="left">
                                                                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                                    <tbody>
                                                                                                                        <tr>
                                                                                                                            <td class="es-infoblock esd-block-text es-m-txt-c" align="left">
                                                                                                                                <p><span style="text-align: center;">Put your preheader text here</span></p>
                                                                                                                            </td>
                                                                                                                        </tr>
                                                                                                                    </tbody>
                                                                                                                </table>
                                                                                                            </td>
                                                                                                        </tr>
                                                                                                    </tbody>
                                                                                                </table> -->
                                                                                                <!--[if mso]></td><td width="20"></td><td width="170" valign="top"><![endif]-->
                                                                                                <!-- <table class="es-right" cellspacing="0" cellpadding="0" align="right">
                                                                                                    <tbody>
                                                                                                        <tr>
                                                                                                            <td class="esd-container-frame" width="170" align="left">
                                                                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                                    <tbody>
                                                                                                                        <tr>
                                                                                                                            <td class="es-infoblock esd-block-text es-m-txt-c" align="right">
                                                                                                                                <p><a href="http://#" target="_blank">View in browser</a></p>
                                                                                                                            </td>
                                                                                                                        </tr>
                                                                                                                    </tbody>
                                                                                                                </table>
                                                                                                            </td>
                                                                                                        </tr>
                                                                                                    </tbody>
                                                                                                </table> -->
                                                                                                <!--[if mso]></td></tr></table><![endif]-->
                                                                                            </td>
                                                                                        </tr>
                                                                                    </tbody>
                                                                                </table>
                                                                            </td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                                <table class="es-content" cellspacing="0" cellpadding="0" align="center">
                                                                    <tbody>
                                                                        <tr>
                                                                            <td class="esd-stripe" esd-custom-block-id="28181" align="center">
                                                                                <table class="es-content-body" width="600" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center">
                                                                                    <tbody>
                                                                                        <tr>
                                                                                            <td class="esd-structure es-p15t es-p15b es-p20r es-p20l esd-checked"  esd-custom-block-id="28206" bgcolor="#F2F2F4" align="left">
                                                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                    <tbody>
                                                                                                        <tr>
                                                                                                            <td class="esd-container-frame" width="560" valign="top" align="center">
                                                                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                                    <tbody>
                                                                                                                        <tr>
                                                                                                                            <td class="esd-block-image" align="center">
                                                                                                                                <a target="_blank"> <img src=" http://ivicatechnologies.com/uploads/fvmegearlogo.png " alt="Quick taxi logo" title="Quick taxi logo" style="display: block;" width="92"> </a>
                                                                                                                            </td>
                                                                                                                            <td class="esd-block-image">
                                                                                                                                <h2>fvmegear </h2>
                                                                                                                                <p>Thanks  For Signup</p>
                                                                                                                            </td>
                                                                                                                        </tr>
                                                                                                                    </tbody>
                                                                                                                </table>
                                                                                                            </td>
                                                                                                        </tr>
                                                                                                    </tbody>
                                                                                                </table>
                                                                                            </td>
                                                                                        </tr>
                                                                                        <tr>
                                                                                            <td class="esd-structure es-p10b" esd-general-paddings-checked="false" align="left">
                                                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                    <tbody>
                                                                                                        <tr>
                                                                                                            <td class="esd-container-frame" width="600" valign="top" align="center">
                                                                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                                    <tbody>
                                                                                                                        <tr>
                                                                                                                            <td class="esd-block-spacer es-p5b" align="center">
                                                                                                                                <table width="100%" height="100%" cellspacing="0" cellpadding="0" border="0">
                                                                                                                                    <tbody>
                                                                                                                                        <tr>
                                                                                                                                            <td style="border-bottom: 1px solid rgb(239, 239, 239); background: rgba(0, 0, 0, 0) none repeat scroll 0% 0%; height: 1px; width: 100%; margin: 0px;"></td>
                                                                                                                                        </tr>
                                                                                                                                    </tbody>
                                                                                                                                </table>
                                                                                                                            </td>
                                                                                                                        </tr>
                                                                                                                    </tbody>
                                                                                                                </table>
                                                                                                            </td>
                                                                                                        </tr>
                                                                                                    </tbody>
                                                                                                </table>
                                                                                            </td>    
                                                                                        </tr>
                                                                                        <tr>
                                                                                            <td class="esd-structure es-p20t es-p20b es-p20r es-p20l" esd-custom-block-id="2997" style="background-position: center top;" align="left">
                                                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                    <tbody>
                                                                                                        <tr>
                                                                                                            <td>
                                                                                                             <img src="http://ivicatechnologies.com/uploads/template.png" alt="Petshop logo" title="Petshop logo" width="600" height="250" style="display: block;">
                                                                                                            </td>
                                                                                                        </tr>
                                                                                                    </tbody>
                                                                                                </table>      
                                                                                            </td>
                                                                                        </tr>
                                                                                        <tr>
                                                                                            <td class="esd-structure es-p20t es-p20b es-p20r es-p20l" esd-custom-block-id="2997" style="background-position: center top;" bgcolor="#F2F2F4" align="left">
                                                                                                <table width="100%"  height="30%" cellspacing="0" cellpadding="0">
                                                                                                    <tbody>
                                                                                                        <tr>
                                                                                                            <td class="esd-block-text es-p5t" align="center">
                                                                                                                <h3>Please click below link to verify your E-mail address</h3>
                                                                                                               <a style=" background-color: #42daf5;
                                                                                                               border: none;
                                                                                                               color: white;
                                                                                                               padding: 10px 20px;
                                                                                                               text-align: center;
                                                                                                               text-decoration: none;
                                                                                                               display: inline-block;
                                                                                                               margin: 4px 2px;
                                                                                                               cursor: pointer;
                                                                                                               border-radius: 16px; " href="http://ivicatechnologies.com/verification.php?secretToken=${secretToken}" >click here</a>
                                                                                                                <p><br></p>
                                                                                                            </td>
                                                                                                        </tr>
                                                                                                    </tbody>
                                                                                                </table>
                                                                                            </td>
                                                                                        </tr>
                                                                                        <tr>
                                                                                            <td class="esd-structure es-p10t es-p10b es-p20r es-p20l" esd-general-paddings-checked="false" style="background-position: center center;" align="left">
                                                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                    <tbody>
                                                                                                        <tr>
                                                                                                            <td class="esd-container-frame" width="560" valign="top" align="center">
                                                                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                                    <tbody>
                                                                                                                        <tr>
                                                                                                                            <td class="esd-block-spacer es-p5t es-p5b" align="center">
                                                                                                                                <table width="100%" height="40%" cellspacing="0" cellpadding="0" border="0">
                                                                                                                                    <tbody>
                                                                                                                                        <tr>
                                                                                                                                            <td style="border-bottom: 1px solid rgb(239, 239, 239); background: rgba(0, 0, 0, 0) none repeat scroll 0% 0%; width: 100%; margin: 0px;"></td>
                                                                                                                                        </tr>
                                                                                                                                    </tbody>
                                                                                                                                </table>
                                                                                                                            </td>
                                                                                                                        </tr>
                                                                                                                    </tbody>
                                                                                                                </table>
                                                                                                            </td>
                                                                                                        </tr>
                                                                                                    </tbody>
                                                                                                </table>
                                                                                            </td>
                                                                                        </tr>
                                                                                    </tbody>
                                                                                </table>
                                                                            </td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                                <table class="es-footer esd-footer-popover" cellspacing="0" cellpadding="0" align="center" bgcolor="#c93939">
                                                                    <tbody>
                                                                        <tr> </tr>
                                                                        <tr>
                                                                            <td class="esd-stripe" esd-custom-block-id="3007" align="center">
                                                                                <table class="es-footer-body" width="600" cellspacing="0" cellpadding="0" align="center" bgcolor="#c93939">
                                                                                    <tbody>
                                                                                        <tr>
                                                                                            <td class="esd-structure es-p20" esd-general-paddings-checked="false" style="background-position: left top;" align="left" bgcolor="#c93939">
                                                                                                <!--[if mso]><table width="560" cellpadding="0" cellspacing="0"><tr><td width="178" valign="top"><![endif]-->
                                                                                                <table class="es-left" cellspacing="0" cellpadding="0" align="left">
                                                                                                    <tbody>
                                                                                                        <tr>
                                                                                                            <td class="es-m-p0r es-m-p20b esd-container-frame" width="150" align="center" bgcolor="#c93939">
                                                                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                                    <tbody>
                                                                                                                        <tr>
                                                                                                                            <br>
                                                                                                                            <td class="esd-block-image" align="center"><br>
                                                                                                                                <a target="_blank"> <img src="http://ivicatechnologies.com/uploads/ivica%20a4.png" alt="Quick taxi logo" title="Quick taxi logo" width="50" style="display: block;"> </a>
                                                                                                                            </td>
                                                                                                                            <br>
                                                                                                                        </tr>
                                                                                             
                                                                                                                    </tbody>
                                                                                                                </table>
                                                                                                            </td>
                                                                                                        </tr>
                                                                                                    </tbody>
                                                                                                </table>
                                                                                                <!--[if mso]></td><td width="20"></td><td width="362" valign="top"><![endif]-->
                                                                                                <table cellspacing="0" cellpadding="0" align="right">
                                                                                                    <tbody>
                                                                                                        <tr>
                                                                                                            <td class="esd-container-frame" width="362" align="left">
                                                                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                                    <tbody>
                                                                                                                        <tr>
                                                                                                                            <td class="esd-block-text es-p10b es-m-txt-c" align="left">
                                                                                                                                <h3>Contact us</h3>
                                                                                                                            </td>
                                                                                                                            <!-- <td class="es-p10r" valign="top" align="center"> 
                                                                                                                                <a target="_blank" href="https://www.linkedin.com/company/ivica-technologies-private-limited/about/?viewAsMember=true"><img title="LinkedIn" src="https://ivicatechnologies.in/uploads/linkedin.png" alt="Tw" width="24" height="24" hspace="20"> </a><br>
                                                                                                                            </td>
                                                                                                                            <td class="es-p10r" valign="top" align="right">
                                                                                                                                <a target="_blank" href="https://www.facebook.com/IvicaTechnologies/"><img title="Facebook" src="https://ivicatechnologies.in/uploads/facebook-logo-in-circular-button-outlined-social-symbol (1).png" alt="Fb" width="24" height="24"></a>
                                                                                                                            </td> -->
                                                                                                                        </tr>
                                                                                                                        <tr>
                                                                                                                            <td class="esd-block-text es-m-txt-c" esd-links-underline="none">
                                                                                                                                <font color="#333333"><span style="font-size: 14px;">IvicaTechnologies</span></font>
                                                                                                                            </td>
                                                                                                                           
                                                                                                                            
                                                                                                                        </tr>
                                                                                                                        <tr>
                                                                                                                            <td class="esd-block-text es-m-txt-c" esd-links-underline="none" align="left">
                                                                                                                                <font color="#333333"><span style="font-size: 14px;">contact@ivicatechnologies.com</span></font><br>
                                                                                                                                
                                                                                                                            </td>
                                                                                                                            
                                                                                                                        </tr>
                                                                                                                        <tr> 
                                                                                                                            <td class="esd-block-text es-m-txt-c" esd-links-underline="none" width="362" align="left">
                                                                                                                                <table class="es-social es-table-not-adapt" cellspacing="0" cellpadding="0">
                                                                                                                                    <tbody>
                                                                                                                                        <tr>
                                                                                                                                            <td class="esd-block-text es-m-txt-c" esd-links-underline="none" align="left"> <br>
                                                                                                                                                <a target="_blank" href="https://www.linkedin.com/company/ivica-technologies-private-limited/about/?viewAsMember=true"><img title="LinkedIn" src="http://ivicatechnologies.com/uploads/linkedin.png" alt="Tw" width="28" height="23" > </a><br>
                                                                                                                                            </td>
                                                                                                                                            <td class="es-p10r" valign="top" align="center"> <br>
                                                                                                                                                <a target="_blank" href="https://www.facebook.com/IvicaTechnologies/"><img title="Facebook" src=" http://ivicatechnologies.com/uploads/facebook-logo-in-circular-button-outlined-social-symbol(1).png" alt="Fb" width="28" height="23" hspace="30"></a>
                                                                                                                                            </td>
                                                                                                                                        </tr>  
                                                                                                                                    </tbody> 
                                                                                                                                </table>
                                                                                                                                <!-- <p><br></p> -->
                                                                                                                            </td>
                                                                                                                        </tr> 
                                                                                                                                                                              
                                                                                                                        <!-- <tr>
                                                                                                                            <td class="es-p10r" valign="top" align="center">
                                                                                                                                <a target="_blank" href="https://play.google.com/store/apps/details?id=ivicatechnologies.com.famegear"><img title="Facebook" src="https://ivicatechnologies.in/uploads/android.png" alt="Fb" width="100" height="30"></a>
                                                                                                                            </td>
                                                                                                                            <td class="es-p10r" valign="top" align="center">
                                                                                                                                <a target="_blank" href="https://itunes.apple.com/in/app/fvmegear/id1458770790?mt=8"><img title="Facebook" src="https://ivicatechnologies.in/uploads/ios.png" alt="Fb" width="100" height="30"></a>
                                                                                                                            </td>         
                                                                                                                        </tr>   -->
                                                                                                                        <tr>
                                                                                                                            <td class="esd-block-social es-p10t es-m-txt-c" align="left">
                                                                                                                                <table class="es-social es-table-not-adapt" cellspacing="0" cellpadding="0">
                                                                                                                                    <tbody>
                                                                                                                                        <tr>
                                                                                                                                            <td class="es-p10r" valign="top" align="center">
                                                                                                                                                <a target="_blank" href="https://play.google.com/store/apps/details?id=ivicatechnologies.com.famegear"><img title="Facebook" src=" http://ivicatechnologies.com/uploads/android.png" alt="Fb" width="100"></a>
                                                                                                                                            </td>
                                                                                                                                            <td class="es-p10r" valign="top" align="center">
                                                                                                                                                <a target="_blank" href="https://itunes.apple.com/in/app/fvmegear/id1458770790?mt=8"><img title="Facebook" src="http://ivicatechnologies.com/uploads/ios.png" alt="Fb" width="100" height="30" hspace="20"></a>
                                                                                                                                            </td> 
                                                                                                                                        </tr>  
                                                                                                                    
                                                                                                                                    </tbody> 
                                                                                                                                </table>
                                                                                                                                    <!-- <p><br></p> -->
                                                                                                                            </td>
                                                                                                                        </tr> 
                                                                                                                        <!-- <tr>
                                                                                                                            <td class="esd-block-text es-p10t es-m-txt-c" align="left">
                                                                                                                                <p style="font-size: 12px; line-height: 150%;">You are receiving this email because you subscribed to our site. Please note that you can&nbsp;<a target="_blank" style="font-size: 12px;">unsubscribe</a>&nbsp;at any time.</p>
                                                                                                                            </td>
                                                                                                                        </tr>  -->
                                                                                                                    </tbody>
                                                                                                                </table>
                                                                                                            </td>
                                                                                                        </tr>
                                                                                                    </tbody>
                                                                                                </table>
                                                                                                <!--[if mso]></td></tr></table><![endif]-->
                                                                                            </td>
                                                                                        </tr>
                                                                                    </tbody>
                                                                                </table>
                                                                            </td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                            <div style="position:absolute;left:-9999px;top:-9999px;"></div>
                                        </body>
                                        
                                        </html>`
                                       
                                     };
                                     transporter.use('compile', htmlToText(HelperOptions));
                                     
                                     transporter.sendMail(HelperOptions, (error, info) => {
                                         if (error) {
                                             return console.log(error);
                                         } else {
                                           //  console.log('The  message was sent!');
                                             return console.log(info);
                                         }
                                        
                                     });


                               
                                uidgen.generate((err, uid) => {
                                if (err) {
                                  var spliterror=err.message.split(":")
                                  res.status(500).json({ 
                                    status: 'Failed',
                                    message: spliterror[0]+spliterror[1]
                                  });
                                }
                                const token = uid;

                                // auth schema save
                                  const  authmodel= new authModel({
                                  _id: new mongoose.Types.ObjectId(),
                                  userid:userCheck._id,
                                  iv_token: token,
                                  imei: req.body.imei,
                                  deviceid:req.body.deviceid
                                });
                                authModel
                                  .find({userid:userCheck._id})
                                  .exec()
                                  .then(result => {
                                      if(result.length<1){
                                        authmodel.save()
                                        .then(data =>{
                                        }).catch(err => {
                                                var spliterror=err.message.split(":")
                                                res.status(500).json({ 
                                                  status: 'Failed',
                                                  message: spliterror[0]
                                                });
                                        });
                                      }
                                      else{
                                        authModel.findOneAndUpdate({userid:userCheck._id},
                                                      {$set:{iv_token:token,created_at:Date.now(),removed_at:null}})
                                                  .exec()
                                                  .then(newdata =>{
                                                  }).catch(err => {
                                                   var spliterror=err.message.split(":")
                                                    res.status(500).json({ 
                                                       status: 'Failed',
                                                       message: spliterror[0]+ spliterror[1]
                                                    });
                                                });
                                      }
                                             var emailcheck=""; 
                                             var email_verified = false  
                                                if(userCheck.mobile_verified === 'true'){
                                                    emailcheck=true;
                                                }else{
                                                    emailcheck=false
                                                }

                                                if(userCheck.email_verified === 1){
                                                    email_verified=true;
                                                }else{
                                                    email_verified=false
                                                }
                                                      return res.status(200).json({
                                                            status: 'Ok',
                                                            message: 'Signed up successfully.',
                                                            userdetails:{
                                                              username: userCheck.username,
                                                              fullname: userCheck.fullname,
                                                              email:userCheck.email,
                                                              mobile:userCheck.mobile,
                                                              iv_token:token,
                                                              userid: userCheck._id,
                                                              is_verified: emailcheck,
                                                              email_verified:email_verified,
                                                              gender: userCheck.gender,
                                                              language: userCheck.language,
                                                              postscount: 0,
                                                              usertype: userCheck.usertype,
                                                              notificationcount: 0,
                                                              messagescount: 0,
                                                              bus_prof_id: userCheck.business_profile_id,
                                                              is_profile_completed: userCheck.is_profile_completed,
                                                              ref_Code:userCheck.ref_Code,
                                                              user_category:'Stellar',
                                                              email_token : secretToken
                                                            }
                                                          });
                            }).catch(err => {                         // catch the auth schema save errors here 
                              if (err.code === 11000){
                                var error = err.errmsg;
                                 var spliterror = error.split(":")
                                  res.status(500).json({ 
                                    status: 'Failed',
                                    message: spliterror[2]
                                  })
                              }
                              else{
                              var spliterror=err.message.split(":")
                              res.status(500).json({ 
                                status: 'Failed',
                                message: spliterror[0]+spliterror[1]
                              });
                            }
                          });
                          });
                            }).catch(err => {                               // catch the user schema save errors here 
                              if (err.code === 11000){
                              var error = err.errmsg;
                              var spliterror = error.split(":")
                                  if(spliterror[2] === " email_1 dup key"){
                                      res.status(200).json({ 
                                        status: 'Failed',
                                        message: "Mail already exists"
                                      })
                                  }
                                  else if(spliterror[2] === " username_1 dup key"){
                                      res.status(200).json({ 
                                        status: 'Failed',
                                        message: "Username already exists"
                                      })
                                  }
                                  else if (spliterror[2] === " mobile_1 dup key"){
                                      if(req.body.mobile === ""){
                                      res.status(200).json({ 
                                        status: 'Failed',
                                        message: "Please provide the Mobile number"
                                      })
                                    }
                                    else{
                                      res.status(200).json({ 
                                        status: 'Failed',
                                        message: "Mobile number already exists"
                                      })
                                    }
                                  }
                                  else{
                                      res.status(500).json({ 
                                        status: 'Failed',
                                        message:spliterror[2]
                                      })
                                  }
                              }
                              else{
                              var spliterror=err.message.split(":")
                              res.status(500).json({ 
                                status: 'Failed',
                                message: spliterror[0]+spliterror[1]
                              });
                            }
                          });
                        } 
                    }).catch(err => {                               //catch for find email in the user table 
                        if (err.code === 11000){
                              var error = err.errmsg;
                              var spliterror = error.split(":")
                                  if(spliterror[2] === " email_1 dup key"){
                                      res.status(200).json({ 
                                        status: 'Failed',
                                        message: "Mail already exists"
                                      })
                                  }
                                  else if(spliterror[2] === " username_1 dup key"){
                                      res.status(200).json({ 
                                        status: 'Failed',
                                        message: "Username already exists"
                                      })
                                  }
                                  else if (spliterror[2] === " mobile_1 dup key"){
                                      if(req.body.mobile === ""){
                                      res.status(200).json({ 
                                        status: 'Failed',
                                        message: "Please provide the Mobile number"
                                      })
                                    }
                                    else{
                                      res.status(200).json({ 
                                        status: 'Failed',
                                        message: "Mobile number already exists"
                                      })
                                    }
                                  }
                                  else{
                                      res.status(500).json({ 
                                        status: 'Failed',
                                        message:spliterror[2]
                                      })
                                  }
                              }
                              else{
                              var spliterror=err.message.split(":")
                              res.status(500).json({ 
                                status: 'Failed',
                                message: spliterror[0]+spliterror[1]
                              });
                            }
                    });
      }
      else{                               //else loop for usertype
        res.status(200).json({
            status: 'Failed',
            message: 'Bad Request. This usertype does not exist.'
        });
      }
    }                                           
    else {                                   // else for IMEI, DeviceId and clientid
        res.status(200).json({
            status: 'Failed',
            message: 'Bad Request. Please provide correct clientid.'
        });
      }
    }
  else{
       res.status(200).json({
           status: 'Failed',
           message: 'Bad Request. Please check your input parameters.'
       });
 }

});

router.post("/login_android", (req, res, next) => {
  
  var keyArray = ["email", "password","clientid", "fcmtoken", "imei", "deviceid"];
  var key = Object.keys(req.body);

  if (keyArray.length == key.length && keyArray.every((v) => key.indexOf(v) >= 0)) {
    
    var tempPassword = req.body.password;
    var bytes = utf8.encode(tempPassword);
    var hash =  constants.ApiConstant+base64.encode(bytes);

    if(constants.AndriodClientId === req.body.clientid || constants.IosClientId === req.body.clientid){

      User.find({$and:[
                {$or:
                  [{ email: req.body.email },
                  {username:req.body.email}]}
              ]})       
          .exec()
          .then(userCheck => {
              if (userCheck.length < 1) {
                  return res.status(200).json({
                    status:"Failed",
                    message: "Incorrect Username or Password!"
                  });
              }else{

                  // if(userCheck[0].imei != req.body.imei || userCheck[0].deviceid != req.body.deviceid){
                  //   return res.status(200).json({
                  //     status:"Failed",
                  //     message: "An account is already registered with this device."
                  //   });
                  // }
                //  else{

                    if(userCheck[0].password === hash){

                        var emailcheck ="";
                        if(userCheck[0].mobile_verified === 'true'){

                          emailcheck=true;
                        }else{
                          emailcheck=false
                        }
                                                var email_verified = false

                         if(userCheck[0].email_verified === 1){
                                                    email_verified=true;
                                                }else{
                                                    email_verified=false
                                                }

                        var has_selected_interests = true

                        if(userCheck[0].hobbies.length > 0){
                          has_selected_interests = true
                        }
                        else{
                          has_selected_interests = false
                        }
                          uidgen.generate((err, uid) => {
                          if (err) {
                            var spliterror=err.message.split(":")
                              res.status(500).json({ 
                                status: 'Failed',
                                message: spliterror[0]+spliterror[1]
                              });
                          }
                          const token = uid;

                          authModel.findOneAndUpdate({userid:userCheck[0]._id},
                                  {$set:{iv_token:token,created_at:Date.now(),removed_at:null}})
                                  .exec()
                                  .then(newdata =>{

                                    if(userCheck[0].usertype === "generaluser"){
                                    fcmModel.findOneAndUpdate({userid:userCheck[0]._id },
                                                                  {$set: {fcmtoken: req.body.fcmtoken}})
                                          .exec()
                                          .then(newdata => {

                                           }).catch(err => {
                                            var spliterror=err.message.split(":")
                                              res.status(500).json({ 
                                                status: 'Failed',
                                                message: spliterror[0]+ spliterror[1]
                                              });
                                          });
                                      }
                                    
                                      userDetails.find({userid:ObjectId(userCheck[0]._id)})
                                                  .exec()
                                                  .then(dex =>{
                                                    var user_category = dex[0].category_type
                                                    var selected_primary_offer = false;
                                                      if(dex[0].offer_details.length > 0){
                                                          var offers = dex[0].offer_details;
                                                          offers.every(function(ele){
                                                            if(ele.is_primary_offer === true){
                                                              selected_primary_offer = true
                                                              return false
                                                            }
                                                            else{
                                                              selected_primary_offer = false
                                                              return true
                                                            }
                                                          })
                                                      }

                                                      console.log(selected_primary_offer)
                                                      
                                    var profileimage = userCheck[0].profileimage;
                                      if(userCheck[0].profileimage === null){
                                        profileimage = "uploads/userimage.png"
                                      }
                                      if(userCheck[0].is_profile_completed === true){
                                          
                                          business_profile.find({iv_acountid:userCheck[0]._id})
                                                      .exec()
                                                      .then(result =>{
                                                          return res.status(200).json({
                                                            status: 'Ok',
                                                            message: 'logged in successfully.',
                                                            userdetails:{
                                                              username: userCheck[0].username,
                                                              fullname: userCheck[0].fullname,
                                                              email:userCheck[0].email,
                                                              mobile:userCheck[0].mobile,
                                                              iv_token:token,
                                                              userid: userCheck[0]._id,
                                                              is_verified: emailcheck,
                                                              email_verified:email_verified,
                                                              gender: userCheck[0].gender,
                                                              language: userCheck[0].language,
                                                              postscount: 0,
                                                              usertype: userCheck[0].usertype,
                                                              notificationcount: 0,
                                                              messagescount: 0,
                                                              bus_prof_id: result[0]._id,
                                                              is_profile_completed: userCheck[0].is_profile_completed,
                                                              ref_Code:userCheck[0].ref_Code,
                                                              profileimage: constants.APIBASEURL+profileimage,
                                                              has_primary_offer:selected_primary_offer,
                                                              has_selected_interests:has_selected_interests,
                                                              user_category:user_category
                                                            }
                                                          });
                                                      }).catch(err => {                 // catch statement for user.
                                                        var spliterror=err.message.split(":")
                                                          res.status(500).json({ 
                                                            status: 'Failed',
                                                            message: spliterror[0]
                                                        });
                                                    });
                                      }
                                      else{

                                        console.log(selected_primary_offer)
                                        console.log(emailcheck)
                                                      return res.status(200).json({
                                                            status: 'Ok',
                                                            message: 'logged in successfully.',
                                                            userdetails:{
                                                              username: userCheck[0].username,
                                                              fullname: userCheck[0].fullname,
                                                              email:userCheck[0].email,
                                                              mobile:userCheck[0].mobile,
                                                              iv_token:token,
                                                              userid: userCheck[0]._id,
                                                              is_verified: emailcheck,
                                                              email_verified:email_verified,
                                                              gender: userCheck[0].gender,
                                                              language: userCheck[0].language,
                                                              postscount: 0,
                                                              usertype: userCheck[0].usertype,
                                                              notificationcount: 0,
                                                              messagescount: 0,
                                                              bus_prof_id: userCheck[0].business_profile_id,
                                                              is_profile_completed: userCheck[0].is_profile_completed,
                                                              ref_Code:userCheck[0].ref_Code,
                                                              profileimage: constants.APIBASEURL+profileimage,
                                                              has_primary_offer:selected_primary_offer,
                                                              has_selected_interests:has_selected_interests,
                                                              user_category:user_category
                                                            }
                                                          });
                                            }
                                        }).catch(err => {                 // catch statement for user.
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
                                            message: spliterror[0]+ spliterror[1]
                                        });
                                });
                          });
                    }
                    else{
                      return res.status(200).json({
                        status:"Failed",
                        message: "Please provide correct password."
                      });
                    }
                 // }
                }
            }).catch(err => {                 // catch statement for user.
              var spliterror=err.message.split(":")
                res.status(500).json({ 
                  status: 'Failed',
                  message: spliterror[0]
                });
            });
        }else {
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

router.post("/email_verification", (req, res, next) => {
  var keyArray = [ 'userid',
  'email',
  'clientid' ];

  var key = Object.keys(req.body);
  if (keyArray.length == key.length && keyArray.every((v) => key.indexOf(v) >= 0)) {

  if(constants.AndriodClientId === req.body.clientid || constants.IosClientId === req.body.clientid){

            User.find({_id:ObjectId(req.body.userid)})
                .exec()
                .then(dox =>{
                  var query =""
                  var condition = ""
                  var username = dox[0].username

                  const secretToken = randomstring.generate();
 
                                        console.log(secretToken);

                                        User.findOneAndUpdate({_id:userCheck._id},
                                          {$set:{email_token:secretToken,email:req.body.email}})
                                          .exec()
                                          .then(newdata1 =>{

                                                         res.status(200).json({
                                                              status: 'Ok',
                                                              message: 'Verification link sent to your email'
                                                          });

                                                  let transporter = nodemailer.createTransport({
                                                   host: 'email-smtp.us-east-1.amazonaws.com',
                                                   port: 465,
                                                   secureConnection: true, // upgrade later with STARTTLS
                                                   auth: {
                                                       user: 'AKIAUXODAPAAGIPOV6H6',
                                                       pass: 'BPfCccx4weCniuXGaIXHaGB28u2GcO8u5x1RjR9oxE8T'
                                                   }
                                                  
                                               });
                                          

                                               let HelperOptions = {
                                                   from: 'contact@ivicatechnologies.com',
                                                   to: req.body.email,
                                                   subject: username + ', Welcome to fvmegear',
                                                  html:`<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                                                  <html>
                                                  
                                                  <head>
                                                      <meta charset="UTF-8">
                                                      <meta content="width=device-width, initial-scale=1" name="viewport">
                                                      <meta name="x-apple-disable-message-reformatting">
                                                      <meta http-equiv="X-UA-Compatible" content="IE=edge">
                                                      <meta content="telephone=no" name="format-detection">
                                                      <title></title>
                                                      <!--[if (mso 16)]>
                                                      <style type="text/css">
                                                      a {text-decoration: none;}
                                                      </style>
                                                      <![endif]-->
                                                      <!--[if gte mso 9]><style>sup { font-size: 100% !important; }</style><![endif]-->
                                                  </head>
                                            
                                                  
                                                  <body>
                                                      <div class="es-wrapper-color">
                                                          <!--[if gte mso 9]>
                                                        <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
                                                          <v:fill type="tile" color="#FFFFFF"></v:fill>
                                                        </v:background>
                                                      <![endif]-->
                                                          <table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0">
                                                              <tbody>
                                                                  <tr>
                                                                      <td class="esd-email-paddings" valign="top">
                                                                          <table class="es-header es-preheader esd-header-popover" cellspacing="0" cellpadding="0" align="center">
                                                                              <tbody>
                                                                                  <tr>
                                                                                      <td class="es-adaptive esd-stripe" esd-custom-block-id="2995" align="center">
                                                                                          <table class="es-content-body" style="background-color: transparent;" width="600" cellspacing="0" cellpadding="0" align="center">
                                                                                              <tbody>
                                                                                                  <tr>
                                                                                                      <td class="esd-structure es-p10" align="left">
                                                                                                          <!--[if mso]><table width="580"><tr><td width="390" valign="top"><![endif]-->
                                                                                                          <!-- <table class="es-left" cellspacing="0" cellpadding="0" align="left">
                                                                                                              <tbody>
                                                                                                                  <tr>
                                                                                                                      <td class="esd-container-frame" width="390" align="left">
                                                                                                                          <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                                              <tbody>
                                                                                                                                  <tr>
                                                                                                                                      <td class="es-infoblock esd-block-text es-m-txt-c" align="left">
                                                                                                                                          <p><span style="text-align: center;">Put your preheader text here</span></p>
                                                                                                                                      </td>
                                                                                                                                  </tr>
                                                                                                                              </tbody>
                                                                                                                          </table>
                                                                                                                      </td>
                                                                                                                  </tr>
                                                                                                              </tbody>
                                                                                                          </table> -->
                                                                                                          <!--[if mso]></td><td width="20"></td><td width="170" valign="top"><![endif]-->
                                                                                                          <!-- <table class="es-right" cellspacing="0" cellpadding="0" align="right">
                                                                                                              <tbody>
                                                                                                                  <tr>
                                                                                                                      <td class="esd-container-frame" width="170" align="left">
                                                                                                                          <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                                              <tbody>
                                                                                                                                  <tr>
                                                                                                                                      <td class="es-infoblock esd-block-text es-m-txt-c" align="right">
                                                                                                                                          <p><a href="http://#" target="_blank">View in browser</a></p>
                                                                                                                                      </td>
                                                                                                                                  </tr>
                                                                                                                              </tbody>
                                                                                                                          </table>
                                                                                                                      </td>
                                                                                                                  </tr>
                                                                                                              </tbody>
                                                                                                          </table> -->
                                                                                                          <!--[if mso]></td></tr></table><![endif]-->
                                                                                                      </td>
                                                                                                  </tr>
                                                                                              </tbody>
                                                                                          </table>
                                                                                      </td>
                                                                                  </tr>
                                                                              </tbody>
                                                                          </table>
                                                                          <table class="es-content" cellspacing="0" cellpadding="0" align="center">
                                                                              <tbody>
                                                                                  <tr>
                                                                                      <td class="esd-stripe" esd-custom-block-id="28181" align="center">
                                                                                          <table class="es-content-body" width="600" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center">
                                                                                              <tbody>
                                                                                                  <tr>
                                                                                                      <td class="esd-structure es-p15t es-p15b es-p20r es-p20l esd-checked"  esd-custom-block-id="28206" bgcolor="#F2F2F4" align="left">
                                                                                                          <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                              <tbody>
                                                                                                                  <tr>
                                                                                                                      <td class="esd-container-frame" width="560" valign="top" align="center">
                                                                                                                          <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                                              <tbody>
                                                                                                                                  <tr>
                                                                                                                                      <td class="esd-block-image" align="center">
                                                                                                                                          <a target="_blank"> <img src=" http://ivicatechnologies.com/uploads/fvmegearlogo.png " alt="Quick taxi logo" title="Quick taxi logo" style="display: block;" width="92"> </a>
                                                                                                                                      </td>
                                                                                                                                      <td class="esd-block-image">
                                                                                                                                          <h2>fvmegear </h2>
                                                                                                                                          <p>Thanks  For Signup</p>
                                                                                                                                      </td>
                                                                                                                                  </tr>
                                                                                                                              </tbody>
                                                                                                                          </table>
                                                                                                                      </td>
                                                                                                                  </tr>
                                                                                                              </tbody>
                                                                                                          </table>
                                                                                                      </td>
                                                                                                  </tr>
                                                                                                  <tr>
                                                                                                      <td class="esd-structure es-p10b" esd-general-paddings-checked="false" align="left">
                                                                                                          <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                              <tbody>
                                                                                                                  <tr>
                                                                                                                      <td class="esd-container-frame" width="600" valign="top" align="center">
                                                                                                                          <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                                              <tbody>
                                                                                                                                  <tr>
                                                                                                                                      <td class="esd-block-spacer es-p5b" align="center">
                                                                                                                                          <table width="100%" height="100%" cellspacing="0" cellpadding="0" border="0">
                                                                                                                                              <tbody>
                                                                                                                                                  <tr>
                                                                                                                                                      <td style="border-bottom: 1px solid rgb(239, 239, 239); background: rgba(0, 0, 0, 0) none repeat scroll 0% 0%; height: 1px; width: 100%; margin: 0px;"></td>
                                                                                                                                                  </tr>
                                                                                                                                              </tbody>
                                                                                                                                          </table>
                                                                                                                                      </td>
                                                                                                                                  </tr>
                                                                                                                              </tbody>
                                                                                                                          </table>
                                                                                                                      </td>
                                                                                                                  </tr>
                                                                                                              </tbody>
                                                                                                          </table>
                                                                                                      </td>    
                                                                                                  </tr>
                                                                                                  <tr>
                                                                                                      <td class="esd-structure es-p20t es-p20b es-p20r es-p20l" esd-custom-block-id="2997" style="background-position: center top;" align="left">
                                                                                                          <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                              <tbody>
                                                                                                                  <tr>
                                                                                                                      <td>
                                                                                                                       <img src="http://ivicatechnologies.com/uploads/template.png" alt="Petshop logo" title="Petshop logo" width="600" height="250" style="display: block;">
                                                                                                                      </td>
                                                                                                                  </tr>
                                                                                                              </tbody>
                                                                                                          </table>      
                                                                                                      </td>
                                                                                                  </tr>
                                                                                                  <tr>
                                                                                                      <td class="esd-structure es-p20t es-p20b es-p20r es-p20l" esd-custom-block-id="2997" style="background-position: center top;" bgcolor="#F2F2F4" align="left">
                                                                                                          <table width="100%"  height="30%" cellspacing="0" cellpadding="0">
                                                                                                              <tbody>
                                                                                                                  <tr>
                                                                                                                      <td class="esd-block-text es-p5t" align="center">
                                                                                                                          <h3>Please click below link to verify your E-mail address</h3>
                                                                                                                         <a style=" background-color: #42daf5;
                                                                                                                         border: none;
                                                                                                                         color: white;
                                                                                                                         padding: 10px 20px;
                                                                                                                         text-align: center;
                                                                                                                         text-decoration: none;
                                                                                                                         display: inline-block;
                                                                                                                         margin: 4px 2px;
                                                                                                                         cursor: pointer;
                                                                                                                         border-radius: 16px; " href="http://ivicatechnologies.com/verification.php?secretToken=${secretToken}" >click here</a>
                                                                                                                          <p><br></p>
                                                                                                                      </td>
                                                                                                                  </tr>
                                                                                                              </tbody>
                                                                                                          </table>
                                                                                                      </td>
                                                                                                  </tr>
                                                                                                  <tr>
                                                                                                      <td class="esd-structure es-p10t es-p10b es-p20r es-p20l" esd-general-paddings-checked="false" style="background-position: center center;" align="left">
                                                                                                          <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                              <tbody>
                                                                                                                  <tr>
                                                                                                                      <td class="esd-container-frame" width="560" valign="top" align="center">
                                                                                                                          <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                                              <tbody>
                                                                                                                                  <tr>
                                                                                                                                      <td class="esd-block-spacer es-p5t es-p5b" align="center">
                                                                                                                                          <table width="100%" height="40%" cellspacing="0" cellpadding="0" border="0">
                                                                                                                                              <tbody>
                                                                                                                                                  <tr>
                                                                                                                                                      <td style="border-bottom: 1px solid rgb(239, 239, 239); background: rgba(0, 0, 0, 0) none repeat scroll 0% 0%; width: 100%; margin: 0px;"></td>
                                                                                                                                                  </tr>
                                                                                                                                              </tbody>
                                                                                                                                          </table>
                                                                                                                                      </td>
                                                                                                                                  </tr>
                                                                                                                              </tbody>
                                                                                                                          </table>
                                                                                                                      </td>
                                                                                                                  </tr>
                                                                                                              </tbody>
                                                                                                          </table>
                                                                                                      </td>
                                                                                                  </tr>
                                                                                              </tbody>
                                                                                          </table>
                                                                                      </td>
                                                                                  </tr>
                                                                              </tbody>
                                                                          </table>
                                                                          <table class="es-footer esd-footer-popover" cellspacing="0" cellpadding="0" align="center" bgcolor="#c93939">
                                                                              <tbody>
                                                                                  <tr> </tr>
                                                                                  <tr>
                                                                                      <td class="esd-stripe" esd-custom-block-id="3007" align="center">
                                                                                          <table class="es-footer-body" width="600" cellspacing="0" cellpadding="0" align="center" bgcolor="#c93939">
                                                                                              <tbody>
                                                                                                  <tr>
                                                                                                      <td class="esd-structure es-p20" esd-general-paddings-checked="false" style="background-position: left top;" align="left" bgcolor="#c93939">
                                                                                                          <!--[if mso]><table width="560" cellpadding="0" cellspacing="0"><tr><td width="178" valign="top"><![endif]-->
                                                                                                          <table class="es-left" cellspacing="0" cellpadding="0" align="left">
                                                                                                              <tbody>
                                                                                                                  <tr>
                                                                                                                      <td class="es-m-p0r es-m-p20b esd-container-frame" width="150" align="center" bgcolor="#c93939">
                                                                                                                          <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                                              <tbody>
                                                                                                                                  <tr>
                                                                                                                                      <br>
                                                                                                                                      <td class="esd-block-image" align="center"><br>
                                                                                                                                          <a target="_blank"> <img src="http://ivicatechnologies.com/uploads/ivica%20a4.png" alt="Quick taxi logo" title="Quick taxi logo" width="50" style="display: block;"> </a>
                                                                                                                                      </td>
                                                                                                                                      <br>
                                                                                                                                  </tr>
                                                                                                       
                                                                                                                              </tbody>
                                                                                                                          </table>
                                                                                                                      </td>
                                                                                                                  </tr>
                                                                                                              </tbody>
                                                                                                          </table>
                                                                                                          <!--[if mso]></td><td width="20"></td><td width="362" valign="top"><![endif]-->
                                                                                                          <table cellspacing="0" cellpadding="0" align="right">
                                                                                                              <tbody>
                                                                                                                  <tr>
                                                                                                                      <td class="esd-container-frame" width="362" align="left">
                                                                                                                          <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                                              <tbody>
                                                                                                                                  <tr>
                                                                                                                                      <td class="esd-block-text es-p10b es-m-txt-c" align="left">
                                                                                                                                          <h3>Contact us</h3>
                                                                                                                                      </td>
                                                                                                                                      <!-- <td class="es-p10r" valign="top" align="center"> 
                                                                                                                                          <a target="_blank" href="https://www.linkedin.com/company/ivica-technologies-private-limited/about/?viewAsMember=true"><img title="LinkedIn" src="https://ivicatechnologies.in/uploads/linkedin.png" alt="Tw" width="24" height="24" hspace="20"> </a><br>
                                                                                                                                      </td>
                                                                                                                                      <td class="es-p10r" valign="top" align="right">
                                                                                                                                          <a target="_blank" href="https://www.facebook.com/IvicaTechnologies/"><img title="Facebook" src="https://ivicatechnologies.in/uploads/facebook-logo-in-circular-button-outlined-social-symbol (1).png" alt="Fb" width="24" height="24"></a>
                                                                                                                                      </td> -->
                                                                                                                                  </tr>
                                                                                                                                  <tr>
                                                                                                                                      <td class="esd-block-text es-m-txt-c" esd-links-underline="none">
                                                                                                                                          <font color="#333333"><span style="font-size: 14px;">IvicaTechnologies</span></font>
                                                                                                                                      </td>
                                                                                                                                     
                                                                                                                                      
                                                                                                                                  </tr>
                                                                                                                                  <tr>
                                                                                                                                      <td class="esd-block-text es-m-txt-c" esd-links-underline="none" align="left">
                                                                                                                                          <font color="#333333"><span style="font-size: 14px;">contact@ivicatechnologies.com</span></font><br>
                                                                                                                                          
                                                                                                                                      </td>
                                                                                                                                      
                                                                                                                                  </tr>
                                                                                                                                  <tr> 
                                                                                                                                      <td class="esd-block-text es-m-txt-c" esd-links-underline="none" width="362" align="left">
                                                                                                                                          <table class="es-social es-table-not-adapt" cellspacing="0" cellpadding="0">
                                                                                                                                              <tbody>
                                                                                                                                                  <tr>
                                                                                                                                                      <td class="esd-block-text es-m-txt-c" esd-links-underline="none" align="left"> <br>
                                                                                                                                                          <a target="_blank" href="https://www.linkedin.com/company/ivica-technologies-private-limited/about/?viewAsMember=true"><img title="LinkedIn" src="http://ivicatechnologies.com/uploads/linkedin.png" alt="Tw" width="28" height="23" > </a><br>
                                                                                                                                                      </td>
                                                                                                                                                      <td class="es-p10r" valign="top" align="center"> <br>
                                                                                                                                                          <a target="_blank" href="https://www.facebook.com/IvicaTechnologies/"><img title="Facebook" src=" http://ivicatechnologies.com/uploads/facebook-logo-in-circular-button-outlined-social-symbol(1).png" alt="Fb" width="28" height="23" hspace="30"></a>
                                                                                                                                                      </td>
                                                                                                                                                  </tr>  
                                                                                                                                              </tbody> 
                                                                                                                                          </table>
                                                                                                                                          <!-- <p><br></p> -->
                                                                                                                                      </td>
                                                                                                                                  </tr> 
                                                                                                                                                                                        
                                                                                                                                  <!-- <tr>
                                                                                                                                      <td class="es-p10r" valign="top" align="center">
                                                                                                                                          <a target="_blank" href="https://play.google.com/store/apps/details?id=ivicatechnologies.com.famegear"><img title="Facebook" src="https://ivicatechnologies.in/uploads/android.png" alt="Fb" width="100" height="30"></a>
                                                                                                                                      </td>
                                                                                                                                      <td class="es-p10r" valign="top" align="center">
                                                                                                                                          <a target="_blank" href="https://itunes.apple.com/in/app/fvmegear/id1458770790?mt=8"><img title="Facebook" src="https://ivicatechnologies.in/uploads/ios.png" alt="Fb" width="100" height="30"></a>
                                                                                                                                      </td>         
                                                                                                                                  </tr>   -->
                                                                                                                                  <tr>
                                                                                                                                      <td class="esd-block-social es-p10t es-m-txt-c" align="left">
                                                                                                                                          <table class="es-social es-table-not-adapt" cellspacing="0" cellpadding="0">
                                                                                                                                              <tbody>
                                                                                                                                                  <tr>
                                                                                                                                                      <td class="es-p10r" valign="top" align="center">
                                                                                                                                                          <a target="_blank" href="https://play.google.com/store/apps/details?id=ivicatechnologies.com.famegear"><img title="Facebook" src=" http://ivicatechnologies.com/uploads/android.png" alt="Fb" width="100"></a>
                                                                                                                                                      </td>
                                                                                                                                                      <td class="es-p10r" valign="top" align="center">
                                                                                                                                                          <a target="_blank" href="https://itunes.apple.com/in/app/fvmegear/id1458770790?mt=8"><img title="Facebook" src="http://ivicatechnologies.com/uploads/ios.png" alt="Fb" width="100" height="30" hspace="20"></a>
                                                                                                                                                      </td> 
                                                                                                                                                  </tr>  
                                                                                                                              
                                                                                                                                              </tbody> 
                                                                                                                                          </table>
                                                                                                                                              <!-- <p><br></p> -->
                                                                                                                                      </td>
                                                                                                                                  </tr> 
                                                                                                                                  <!-- <tr>
                                                                                                                                      <td class="esd-block-text es-p10t es-m-txt-c" align="left">
                                                                                                                                          <p style="font-size: 12px; line-height: 150%;">You are receiving this email because you subscribed to our site. Please note that you can&nbsp;<a target="_blank" style="font-size: 12px;">unsubscribe</a>&nbsp;at any time.</p>
                                                                                                                                      </td>
                                                                                                                                  </tr>  -->
                                                                                                                              </tbody>
                                                                                                                          </table>
                                                                                                                      </td>
                                                                                                                  </tr>
                                                                                                              </tbody>
                                                                                                          </table>
                                                                                                          <!--[if mso]></td></tr></table><![endif]-->
                                                                                                      </td>
                                                                                                  </tr>
                                                                                              </tbody>
                                                                                          </table>
                                                                                      </td>
                                                                                  </tr>
                                                                              </tbody>
                                                                          </table>
                                                                      </td>
                                                                  </tr>
                                                              </tbody>
                                                          </table>
                                                      </div>
                                                      <div style="position:absolute;left:-9999px;top:-9999px;"></div>
                                                  </body>
                                                  
                                                  </html>`
                                                 
                                               };
                                               transporter.use('compile', htmlToText(HelperOptions));
                                               
                                               transporter.sendMail(HelperOptions, (error, info) => {
                                                   if (error) {
                                                       return console.log(error);
                                                   } else {
                                                     //  console.log('The  message was sent!');
                                                       return console.log(info);
                                                   }
                                                  
                                               });
                                          }).catch(err => {
                                           var spliterror=err.message.split(":")
                                            res.status(500).json({ 
                                               status: 'Failed',
                                               message: spliterror[0]+ spliterror[1]
                                            });
                                        });

                }).catch(err =>{
                   var spliterror=err.message.split("_")
                          if(spliterror[1].indexOf("id")>=0){
                            res.status(500).json({ 
                              status: 'Failed',
                              message: "Please provide correct userid"
                            });
                          }
                          else{
                              res.status(500).json({ 
                                 status: 'Failed',
                                 message: spliterror[0]+ spliterror[1]
                              });
                          }
                })

    }else {
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


router.post("/email_changes_verification", (req, res, next) => {
  var keyArray = [ 'userid',
  'clientid' ];

  var key = Object.keys(req.body);
  if (keyArray.length == key.length && keyArray.every((v) => key.indexOf(v) >= 0)) {

  if(constants.AndriodClientId === req.body.clientid || constants.IosClientId === req.body.clientid){

            User.find({_id:ObjectId(req.body.userid)})
                .exec()
                .then(dox =>{
                  var query =""
                  var condition = ""
                  var username = dox[0].username

                  if(dox[0].email_verified === 0){
                        res.status(200).json({ 
                              status: 'Failed',
                              message: "Please verify your email address."
                            });
                  }
                  else{
                            res.status(500).json({ 
                              status: 'Ok',
                              message: "Email verified!!"
                            });
                  }

                }).catch(err =>{
                   var spliterror=err.message.split("_")
                          if(spliterror[1].indexOf("id")>=0){
                            res.status(500).json({ 
                              status: 'Failed',
                              message: "Please provide correct userid"
                            });
                          }
                          else{
                              res.status(500).json({ 
                                 status: 'Failed',
                                 message: spliterror[0]+ spliterror[1]
                              });
                          }
                })

    }else {
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


router.get('/verify_email/:secretToken', (req, res) => {

 User.find({'email_token' : req.params.secretToken})
      .exec()
      .then((user) => {


        if(user.length > 0){
          User.findOneAndUpdate({_id:ObjectId(user[0]._id)},{$set:{email_verified:1}}).exec()
              res.send(`<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                          <html>

                          <head>
                              <meta charset="UTF-8">
                              <meta content="width=device-width, initial-scale=1" name="viewport">
                              <meta name="x-apple-disable-message-reformatting">
                              <meta http-equiv="X-UA-Compatible" content="IE=edge">
                              <meta content="telephone=no" name="format-detection">
                              <title></title>
                              <!--[if (mso 16)]>
                              <style type="text/css">
                              a {text-decoration: none;}
                              </style>
                              <![endif]-->
                              <!--[if gte mso 9]><style>sup { font-size: 100% !important; }</style><![endif]-->
                          </head>
                          <style>
                                  .button {
                                    background-color: #42daf5;
                                    /* #07468D */
                                    border: none;
                                    color: white;
                                    padding: 10px 20px;
                                    text-align: center;
                                    text-decoration: none;
                                    display: inline-block;
                                    /* font-size: 12px; */
                                    margin: 4px 2px;
                                    cursor: pointer;
                                    border-radius: 16px;
                                  }
                              button:hover {
                                  background-color: #f1f1f1;
                              }
                          </style>

                          <body>
                              <div class="es-wrapper-color">
                                  <!--[if gte mso 9]>
                                <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
                                  <v:fill type="tile" color="#f6f6f6"></v:fill>
                                </v:background>
                              <![endif]-->
                                  <table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0">
                                      <tbody>
                                          <tr>
                                              <td class="esd-email-paddings" valign="top">
                                                  <table class="es-header es-preheader esd-header-popover" cellspacing="0" cellpadding="0" align="center">
                                                      <tbody>
                                                          <tr>
                                                              <td class="es-adaptive esd-stripe" esd-custom-block-id="2995" align="center">
                                                                  <table class="es-content-body" style="background-color: transparent;" width="600" cellspacing="0" cellpadding="0" align="center">
                                                                      <tbody>
                                                                          <tr>
                                                                              <td class="esd-structure es-p10" align="left">
                                                                                  <!--[if mso]><table width="580"><tr><td width="390" valign="top"><![endif]-->
                                                                                  <!-- <table class="es-left" cellspacing="0" cellpadding="0" align="left">
                                                                                      <tbody>
                                                                                          <tr>
                                                                                              <td class="esd-container-frame" width="390" align="left">
                                                                                                  <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                      <tbody>
                                                                                                          <tr>
                                                                                                              <td class="es-infoblock esd-block-text es-m-txt-c" align="left">
                                                                                                                  <p><span style="text-align: center;">Put your preheader text here</span></p>
                                                                                                              </td>
                                                                                                          </tr>
                                                                                                      </tbody>
                                                                                                  </table>
                                                                                              </td>
                                                                                          </tr>
                                                                                      </tbody>
                                                                                  </table> -->
                                                                                  <!--[if mso]></td><td width="20"></td><td width="170" valign="top"><![endif]-->
                                                                                  <!-- <table class="es-right" cellspacing="0" cellpadding="0" align="right">
                                                                                      <tbody>
                                                                                          <tr>
                                                                                              <td class="esd-container-frame" width="170" align="left">
                                                                                                  <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                      <tbody>
                                                                                                          <tr>
                                                                                                              <td class="es-infoblock esd-block-text es-m-txt-c" align="right">
                                                                                                                  <p><a href="http://#" target="_blank">View in browser</a></p>
                                                                                                              </td>
                                                                                                          </tr>
                                                                                                      </tbody>
                                                                                                  </table>
                                                                                              </td>
                                                                                          </tr>
                                                                                      </tbody>
                                                                                  </table> -->
                                                                                  <!--[if mso]></td></tr></table><![endif]-->
                                                                              </td>
                                                                          </tr>
                                                                      </tbody>
                                                                  </table>
                                                              </td>
                                                          </tr>
                                                      </tbody>
                                                  </table>
                                                  <table class="es-content" cellspacing="0" cellpadding="0" align="center">
                                                      <tbody>
                                                          <tr>
                                                              <td class="esd-stripe" esd-custom-block-id="28181" align="center">
                                                                  <table class="es-content-body" width="600" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center">
                                                                      <tbody>
                                                                          <tr>
                                                                              <td class="esd-structure es-p15t es-p15b es-p20r es-p20l esd-checked"  esd-custom-block-id="28206" bgcolor="#c93939" align="left">
                                                                                  <table width="100%" cellspacing="0" cellpadding="0">
                                                                                      <tbody>
                                                                                          <tr>
                                                                                              <td class="esd-container-frame" width="560" valign="top" align="center">
                                                                                                  <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                      <tbody>
                                                                                                          <tr>
                                                                                                              <td class="esd-block-image" align="center">
                                                                                                                  <a target="_blank"> <img src="https://zknkh.stripocdn.email/content/guids/1e8b497b-3862-46e4-8307-26d2998bc616/images/29761561116127326.png" alt="Quick taxi logo" title="Quick taxi logo" style="display: block;" width="92"> </a>
                                                                                                              </td>
                                                                                                              <!-- <td class="esd-block-image">
                                                                                                                  <h2>fvmegear </h2>
                                                                                                                  <p>Thanks  For Signup</p>
                                                                                                              </td> -->
                                                                                                          </tr>
                                                                                                      </tbody>
                                                                                                  </table>
                                                                                              </td>
                                                                                          </tr>
                                                                                      </tbody>
                                                                                  </table>
                                                                              </td>
                                                                          </tr>
                                                                          <tr>
                                                                              <td class="esd-structure es-p10b" esd-general-paddings-checked="false" align="left">
                                                                                  <table width="100%" cellspacing="0" cellpadding="0">
                                                                                      <tbody>
                                                                                          <tr>
                                                                                              <td class="esd-container-frame" width="600" valign="top" align="center">
                                                                                                  <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                      <tbody>
                                                                                                          <tr>
                                                                                                              <td class="esd-block-spacer es-p5b" align="center">
                                                                                                                  <table width="100%" height="100%" cellspacing="0" cellpadding="0" border="0">
                                                                                                                      <tbody>
                                                                                                                          <tr>
                                                                                                                              <td style="border-bottom: 1px solid rgb(239, 239, 239); background: rgba(0, 0, 0, 0) none repeat scroll 0% 0%; height: 1px; width: 100%; margin: 0px;"></td>
                                                                                                                          </tr>
                                                                                                                      </tbody>
                                                                                                                  </table>
                                                                                                              </td>
                                                                                                          </tr>
                                                                                                      </tbody>
                                                                                                  </table>
                                                                                              </td>
                                                                                          </tr>
                                                                                      </tbody>
                                                                                  </table>
                                                                              </td>    
                                                                          </tr>
                                                                          <!-- <tr>
                                                                              <td class="esd-structure es-p20t es-p20b es-p20r es-p20l" esd-custom-block-id="2997" style="background-position: center top;" align="left">
                                                                                  <table width="100%" cellspacing="0" cellpadding="0">
                                                                                      <tbody>
                                                                                          <tr>
                                                                                              <td>
                                                                                               <img src="https://ivicatechnologies.in/uploads/template.png" alt="Petshop logo" title="Petshop logo" width="600" height="250" style="display: block;">
                                                                                              </td>
                                                                                          </tr>
                                                                                      </tbody>
                                                                                  </table>      
                                                                              </td>
                                                                          </tr> -->
                                                                          <tr>
                                                                              <td class="esd-structure es-p20t es-p20b es-p20r es-p20l" esd-custom-block-id="2997" style="background-position: center top;" bgcolor="#F2F2F4" align="left">
                                                                                  <table width="100%"  height="30%" cellspacing="0" cellpadding="0">
                                                                                      <tbody>
                                                                                          <tr>
                                                                                              <td class="esd-block-text es-p5t" align="center">
                                                                                                  <h3>Your email verified successfully !!</h3>

                                                                                                 
                                                                                                  <!-- <tr>
                                                                                                      <p> <a href="http://ivicatechnologies.com/verification.php?secretToken="+secretToken>Click here to verify your account</a></p>
                                                                                                  </tr> -->
                                                                                                  <!-- <p><br></p> -->
                                                                                              </td>
                                                                                          </tr>
                                                                                          <tr>
                                                                                          <td class="esd-block-image" align="center">
                                                                                              <a target="_blank"> <img src="https://ivicatechnologies.in/uploads/valid.png" alt="Quick taxi logo" title="Quick taxi logo" style="display: block;" width="92"> </a>
                                                                                          </td>
                                                                                          </tr>
                                                                                      </tbody>
                                                                                  </table>
                                                                              </td>
                                                                          </tr>
                                                                          <tr>
                                                                              <td class="esd-structure es-p10t es-p10b es-p20r es-p20l" esd-general-paddings-checked="false" style="background-position: center center;" align="left">
                                                                                  <table width="100%" cellspacing="0" cellpadding="0">
                                                                                      <tbody>
                                                                                          <tr>
                                                                                              <td class="esd-container-frame" width="560" valign="top" align="center">
                                                                                                  <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                      <tbody>
                                                                                                          <tr>
                                                                                                              <td class="esd-block-spacer es-p5t es-p5b" align="center">
                                                                                                                  <table width="100%" height="40%" cellspacing="0" cellpadding="0" border="0">
                                                                                                                      <tbody>
                                                                                                                          <tr>
                                                                                                                              <td style="border-bottom: 1px solid rgb(239, 239, 239); background: rgba(0, 0, 0, 0) none repeat scroll 0% 0%; width: 100%; margin: 0px;"></td>
                                                                                                                          </tr>
                                                                                                                      </tbody>
                                                                                                                  </table>
                                                                                                              </td>
                                                                                                          </tr>
                                                                                                      </tbody>
                                                                                                  </table>
                                                                                              </td>
                                                                                          </tr>
                                                                                      </tbody>
                                                                                  </table>
                                                                              </td>
                                                                          </tr>
                                                                      </tbody>
                                                                  </table>
                                                              </td>
                                                          </tr>
                                                      </tbody>
                                                  </table>
                                                  <table class="es-footer esd-footer-popover" cellspacing="0" cellpadding="0" align="center" bgcolor="#c93939">
                                                      <tbody>
                                                          <tr> </tr>
                                                          <tr>
                                                              <td class="esd-stripe" esd-custom-block-id="3007" align="center">
                                                                  <table class="es-footer-body" width="600" cellspacing="0" cellpadding="0" align="center" bgcolor="#c93939">
                                                                      <tbody>
                                                                          <tr>
                                                                              <td class="esd-structure es-p20" esd-general-paddings-checked="false" style="background-position: left top;" align="left" bgcolor="#c93939">
                                                                                  <!--[if mso]><table width="560" cellpadding="0" cellspacing="0"><tr><td width="178" valign="top"><![endif]-->
                                                                                  <table class="es-left" cellspacing="0" cellpadding="0" align="left">
                                                                                      <tbody>
                                                                                          <tr>
                                                                                              <td class="es-m-p0r es-m-p20b esd-container-frame" width="178" valign="top" align="center" bgcolor="#c93939">
                                                                                                  <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                      <tbody>
                                                                                                          <tr>
                                                                                                              <br>
                                                                                                              <td class="esd-block-image" align="center">
                                                                                                                  <a target="_blank"> <img src="https://ivicatechnologies.in/uploads/ivica a4.png" alt="Quick taxi logo" title="Quick taxi logo" width="50" style="display: block;"> </a>
                                                                                                              </td>
                                                                                                          </tr>
                                                                                                          <!-- <tr>
                                                                                                             
                                                                                                              <td>
                                                                                                                 <br> <font color="#333333"><span style="font-size: 14px;" align="center">Â© 2018 Ivica Technologies Private Limited. All Rights Reserved.</span></font>
                                                                                                              </td>
                                                                                                             
                                                                                                          </tr> -->
                                                                                                      </tbody>
                                                                                                  </table>
                                                                                              </td>
                                                                                          </tr>
                                                                                      </tbody>
                                                                                  </table>
                                                                                  <!--[if mso]></td><td width="20"></td><td width="362" valign="top"><![endif]-->
                                                                                  <table cellspacing="0" cellpadding="0" align="right">
                                                                                      <tbody>
                                                                                          <tr>
                                                                                              <td class="esd-container-frame" width="362" align="left">
                                                                                                  <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                      <tbody>
                                                                                                          <tr>
                                                                                                              <td class="esd-block-text es-p10b es-m-txt-c" align="left">
                                                                                                                  <h3>Contact us</h3>
                                                                                                              </td>
                                                                                                              <!-- <td class="es-p10r" valign="top" align="center"> 
                                                                                                                  <a target="_blank" href="https://www.linkedin.com/company/ivica-technologies-private-limited/about/?viewAsMember=true"><img title="LinkedIn" src="https://ivicatechnologies.in/uploads/linkedin.png" alt="Tw" width="24" height="24" hspace="20"> </a><br>
                                                                                                              </td>
                                                                                                              <td class="es-p10r" valign="top" align="right">
                                                                                                                  <a target="_blank" href="https://www.facebook.com/IvicaTechnologies/"><img title="Facebook" src="https://ivicatechnologies.in/uploads/facebook-logo-in-circular-button-outlined-social-symbol (1).png" alt="Fb" width="24" height="24"></a>
                                                                                                              </td> -->
                                                                                                          </tr>
                                                                                                          <tr>
                                                                                                              <td class="esd-block-text es-m-txt-c" esd-links-underline="none">
                                                                                                                  <font color="#333333"><span style="font-size: 14px;">IvicaTechnologies</span></font>
                                                                                                              </td>
                                                                                                             
                                                                                                              
                                                                                                          </tr>
                                                                                                          <tr>
                                                                                                              <td class="esd-block-text es-m-txt-c" esd-links-underline="none" align="left">
                                                                                                                  <font color="#333333"><span style="font-size: 14px;">contact@ivicatechnologies.com</span></font><br>
                                                                                                                  <!-- <p><a target="_blank" href="mailto:contact@ivicatechnologies.com" color="#333333">contact@ivicatechnologies.com</a></p> -->
                                                                                                              </td>
                                                                                                              
                                                                                                          </tr>
                                                                                                          <tr> 
                                                                                                              <td class="esd-block-text es-m-txt-c" esd-links-underline="none" width="362" align="left">
                                                                                                                  <table class="es-social es-table-not-adapt" cellspacing="0" cellpadding="0">
                                                                                                                      <tbody>
                                                                                                                          <tr>
                                                                                                                              <td class="esd-block-text es-m-txt-c" esd-links-underline="none" align="left"> <br>
                                                                                                                                  <a target="_blank" href="https://www.linkedin.com/company/ivica-technologies-private-limited/about/?viewAsMember=true"><img title="LinkedIn" src="https://ivicatechnologies.in/uploads/linkedin.png" alt="Tw" width="28" height="23" > </a><br>
                                                                                                                              </td>
                                                                                                                              <td class="es-p10r" valign="top" align="center"> <br>
                                                                                                                                  <a target="_blank" href="https://www.facebook.com/IvicaTechnologies/"><img title="Facebook" src="https://ivicatechnologies.in/uploads/facebook-logo-in-circular-button-outlined-social-symbol (1).png" alt="Fb" width="28" height="23" hspace="30"></a>
                                                                                                                              </td>
                                                                                                                          </tr>  
                                                                                                                      </tbody> 
                                                                                                                  </table>
                                                                                                                  <!-- <p><br></p> -->
                                                                                                              </td>
                                                                                                          </tr> 
                                                                                                                                                                
                                                                                                          <!-- <tr>
                                                                                                              <td class="es-p10r" valign="top" align="center">
                                                                                                                  <a target="_blank" href="https://play.google.com/store/apps/details?id=ivicatechnologies.com.famegear"><img title="Facebook" src="https://ivicatechnologies.in/uploads/android.png" alt="Fb" width="100" height="30"></a>
                                                                                                              </td>
                                                                                                              <td class="es-p10r" valign="top" align="center">
                                                                                                                  <a target="_blank" href="https://itunes.apple.com/in/app/fvmegear/id1458770790?mt=8"><img title="Facebook" src="https://ivicatechnologies.in/uploads/ios.png" alt="Fb" width="100" height="30"></a>
                                                                                                              </td>         
                                                                                                          </tr>   -->
                                                                                                          <tr>
                                                                                                              <td class="esd-block-social es-p10t es-m-txt-c" align="left">
                                                                                                                  <table class="es-social es-table-not-adapt" cellspacing="0" cellpadding="0">
                                                                                                                      <tbody>
                                                                                                                          <tr>
                                                                                                                              <td class="es-p10r" valign="top" align="center">
                                                                                                                                  <a target="_blank" href="https://play.google.com/store/apps/details?id=ivicatechnologies.com.famegear"><img title="Facebook" src="https://ivicatechnologies.in/uploads/android.png" alt="Fb" width="100"></a>
                                                                                                                              </td>
                                                                                                                              <td class="es-p10r" valign="top" align="center">
                                                                                                                                  <a target="_blank" href="https://itunes.apple.com/in/app/fvmegear/id1458770790?mt=8"><img title="Facebook" src="https://ivicatechnologies.in/uploads/ios.png" alt="Fb" width="100" height="30" hspace="20"></a>
                                                                                                                              </td> 
                                                                                                                          </tr>  
                                                                                                      
                                                                                                                      </tbody> 
                                                                                                                  </table>
                                                                                                                      <!-- <p><br></p> -->
                                                                                                              </td>
                                                                                                          </tr> 
                                                                                                          <!-- <tr>
                                                                                                              <td class="esd-block-text es-p10t es-m-txt-c" align="left">
                                                                                                                  <p style="font-size: 12px; line-height: 150%;">You are receiving this email because you subscribed to our site. Please note that you can&nbsp;<a target="_blank" style="font-size: 12px;">unsubscribe</a>&nbsp;at any time.</p>
                                                                                                              </td>
                                                                                                          </tr>  -->
                                                                                                      </tbody>
                                                                                                  </table>
                                                                                              </td>
                                                                                          </tr>
                                                                                      </tbody>
                                                                                  </table>
                                                                                  <!--[if mso]></td></tr></table><![endif]-->
                                                                              </td>
                                                                          </tr>
                                                                      </tbody>
                                                                  </table>
                                                              </td>
                                                          </tr>
                                                      </tbody>
                                                  </table>
                                              </td>
                                          </tr>
                                      </tbody>
                                  </table>
                              </div>
                              <div style="position:absolute;left:-9999px;top:-9999px;"></div>
                          </body>

                          </html>`)
        }
        else{
            res.send(`<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                      <html>

                      <head>
                          <meta charset="UTF-8">
                          <meta content="width=device-width, initial-scale=1" name="viewport">
                          <meta name="x-apple-disable-message-reformatting">
                          <meta http-equiv="X-UA-Compatible" content="IE=edge">
                          <meta content="telephone=no" name="format-detection">
                          <title></title>
                          <!--[if (mso 16)]>
                          <style type="text/css">
                          a {text-decoration: none;}
                          </style>
                          <![endif]-->
                          <!--[if gte mso 9]><style>sup { font-size: 100% !important; }</style><![endif]-->
                      </head>
                      <style>
                              .button {
                                background-color: #42daf5;
                                /* #07468D */
                                border: none;
                                color: white;
                                padding: 10px 20px;
                                text-align: center;
                                text-decoration: none;
                                display: inline-block;
                                /* font-size: 12px; */
                                margin: 4px 2px;
                                cursor: pointer;
                                border-radius: 16px;
                              }
                          button:hover {
                              background-color: #f1f1f1;
                          }
                      </style>

                      <body>
                          <div class="es-wrapper-color">
                              <!--[if gte mso 9]>
                            <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
                              <v:fill type="tile" color="#FFFFFF"></v:fill>
                            </v:background>
                          <![endif]-->
                              <table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0">
                                  <tbody>
                                      <tr>
                                          <td class="esd-email-paddings" valign="top">
                                              <table class="es-header es-preheader esd-header-popover" cellspacing="0" cellpadding="0" align="center">
                                                  <tbody>
                                                      <tr>
                                                          <td class="es-adaptive esd-stripe" esd-custom-block-id="2995" align="center">
                                                              <table class="es-content-body" style="background-color: transparent;" width="600" cellspacing="0" cellpadding="0" align="center">
                                                                  <tbody>
                                                                      <tr>
                                                                          <td class="esd-structure es-p10" align="left">
                                                                              <!--[if mso]><table width="580"><tr><td width="390" valign="top"><![endif]-->
                                                                              <!-- <table class="es-left" cellspacing="0" cellpadding="0" align="left">
                                                                                  <tbody>
                                                                                      <tr>
                                                                                          <td class="esd-container-frame" width="390" align="left">
                                                                                              <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                  <tbody>
                                                                                                      <tr>
                                                                                                          <td class="es-infoblock esd-block-text es-m-txt-c" align="left">
                                                                                                              <p><span style="text-align: center;">Put your preheader text here</span></p>
                                                                                                          </td>
                                                                                                      </tr>
                                                                                                  </tbody>
                                                                                              </table>
                                                                                          </td>
                                                                                      </tr>
                                                                                  </tbody>
                                                                              </table> -->
                                                                              <!--[if mso]></td><td width="20"></td><td width="170" valign="top"><![endif]-->
                                                                              <!-- <table class="es-right" cellspacing="0" cellpadding="0" align="right">
                                                                                  <tbody>
                                                                                      <tr>
                                                                                          <td class="esd-container-frame" width="170" align="left">
                                                                                              <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                  <tbody>
                                                                                                      <tr>
                                                                                                          <td class="es-infoblock esd-block-text es-m-txt-c" align="right">
                                                                                                              <p><a href="http://#" target="_blank">View in browser</a></p>
                                                                                                          </td>
                                                                                                      </tr>
                                                                                                  </tbody>
                                                                                              </table>
                                                                                          </td>
                                                                                      </tr>
                                                                                  </tbody>
                                                                              </table> -->
                                                                              <!--[if mso]></td></tr></table><![endif]-->
                                                                          </td>
                                                                      </tr>
                                                                  </tbody>
                                                              </table>
                                                          </td>
                                                      </tr>
                                                  </tbody>
                                              </table>
                                              <table class="es-content" cellspacing="0" cellpadding="0" align="center">
                                                  <tbody>
                                                      <tr>
                                                          <td class="esd-stripe" esd-custom-block-id="28181" align="center">
                                                              <table class="es-content-body" width="600" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center">
                                                                  <tbody>
                                                                      <tr>
                                                                          <td class="esd-structure es-p15t es-p15b es-p20r es-p20l esd-checked"  esd-custom-block-id="28206" bgcolor="#c93939" align="left">
                                                                              <table width="100%" cellspacing="0" cellpadding="0">
                                                                                  <tbody>
                                                                                      <tr>
                                                                                          <td class="esd-container-frame" width="560" valign="top" align="center">
                                                                                              <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                  <tbody>
                                                                                                      <tr>
                                                                                                          <td class="esd-block-image" align="center">
                                                                                                              <a target="_blank"> <img src="https://zknkh.stripocdn.email/content/guids/1e8b497b-3862-46e4-8307-26d2998bc616/images/29761561116127326.png" alt="Quick taxi logo" title="Quick taxi logo" style="display: block;" width="92"> </a>
                                                                                                          </td>
                                                                                                          <!-- <td class="esd-block-image">
                                                                                                              <h2>fvmegear </h2>
                                                                                                              <p>Thanks  For Signup</p>
                                                                                                          </td> -->
                                                                                                      </tr>
                                                                                                  </tbody>
                                                                                              </table>
                                                                                          </td>
                                                                                      </tr>
                                                                                  </tbody>
                                                                              </table>
                                                                          </td>
                                                                      </tr>
                                                                      <tr>
                                                                          <td class="esd-structure es-p10b" esd-general-paddings-checked="false" align="left">
                                                                              <table width="100%" cellspacing="0" cellpadding="0">
                                                                                  <tbody>
                                                                                      <tr>
                                                                                          <td class="esd-container-frame" width="600" valign="top" align="center">
                                                                                              <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                  <tbody>
                                                                                                      <tr>
                                                                                                          <td class="esd-block-spacer es-p5b" align="center">
                                                                                                              <table width="100%" height="100%" cellspacing="0" cellpadding="0" border="0">
                                                                                                                  <tbody>
                                                                                                                      <tr>
                                                                                                                          <td style="border-bottom: 1px solid rgb(239, 239, 239); background: rgba(0, 0, 0, 0) none repeat scroll 0% 0%; height: 1px; width: 100%; margin: 0px;"></td>
                                                                                                                      </tr>
                                                                                                                  </tbody>
                                                                                                              </table>
                                                                                                          </td>
                                                                                                      </tr>
                                                                                                  </tbody>
                                                                                              </table>
                                                                                          </td>
                                                                                      </tr>
                                                                                  </tbody>
                                                                              </table>
                                                                          </td>    
                                                                      </tr>
                                                                      <!-- <tr>
                                                                          <td class="esd-structure es-p20t es-p20b es-p20r es-p20l" esd-custom-block-id="2997" style="background-position: center top;" align="left">
                                                                              <table width="100%" cellspacing="0" cellpadding="0">
                                                                                  <tbody>
                                                                                      <tr>
                                                                                          <td>
                                                                                           <img src="https://ivicatechnologies.in/uploads/template.png" alt="Petshop logo" title="Petshop logo" width="600" height="250" style="display: block;">
                                                                                          </td>
                                                                                      </tr>
                                                                                  </tbody>
                                                                              </table>      
                                                                          </td>
                                                                      </tr> -->
                                                                      <tr>
                                                                          <td class="esd-structure es-p20t es-p20b es-p20r es-p20l" esd-custom-block-id="2997" style="background-position: center top;" bgcolor="#F2F2F4" align="left">
                                                                              <table width="100%"  height="30%" cellspacing="0" cellpadding="0">
                                                                                  <tbody>
                                                                                      <tr>
                                                                                          <td class="esd-block-text es-p5t" align="center">
                                                                                              <h3>Your token is expired !! Please reverify.</h3>

                                                                                             
                                                                                              <!-- <tr>
                                                                                                  <p> <a href="http://ivicatechnologies.com/verification.php?secretToken="+secretToken>Click here to verify your account</a></p>
                                                                                              </tr> -->
                                                                                              <!-- <p><br></p> -->
                                                                                          </td>
                                                                                      </tr>
                                                                                      <tr>
                                                                                      <td class="esd-block-image" align="center">
                                                                                          <a target="_blank"> <img src="https://ivicatechnologies.in/uploads/not_valid.png" alt="Quick taxi logo" title="Quick taxi logo" style="display: block;" width="92"> </a>
                                                                                      </td>
                                                                                      </tr>
                                                                                  </tbody>
                                                                              </table>
                                                                          </td>
                                                                      </tr>
                                                                      <tr>
                                                                          <td class="esd-structure es-p10t es-p10b es-p20r es-p20l" esd-general-paddings-checked="false" style="background-position: center center;" align="left">
                                                                              <table width="100%" cellspacing="0" cellpadding="0">
                                                                                  <tbody>
                                                                                      <tr>
                                                                                          <td class="esd-container-frame" width="560" valign="top" align="center">
                                                                                              <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                  <tbody>
                                                                                                      <tr>
                                                                                                          <td class="esd-block-spacer es-p5t es-p5b" align="center">
                                                                                                              <table width="100%" height="40%" cellspacing="0" cellpadding="0" border="0">
                                                                                                                  <tbody>
                                                                                                                      <tr>
                                                                                                                          <td style="border-bottom: 1px solid rgb(239, 239, 239); background: rgba(0, 0, 0, 0) none repeat scroll 0% 0%; width: 100%; margin: 0px;"></td>
                                                                                                                      </tr>
                                                                                                                  </tbody>
                                                                                                              </table>
                                                                                                          </td>
                                                                                                      </tr>
                                                                                                  </tbody>
                                                                                              </table>
                                                                                          </td>
                                                                                      </tr>
                                                                                  </tbody>
                                                                              </table>
                                                                          </td>
                                                                      </tr>
                                                                  </tbody>
                                                              </table>
                                                          </td>
                                                      </tr>
                                                  </tbody>
                                              </table>
                                              <table class="es-footer esd-footer-popover" cellspacing="0" cellpadding="0" align="center" bgcolor="#c93939">
                                                  <tbody>
                                                      <tr> </tr>
                                                      <tr>
                                                          <td class="esd-stripe" esd-custom-block-id="3007" align="center">
                                                              <table class="es-footer-body" width="600" cellspacing="0" cellpadding="0" align="center" bgcolor="#c93939">
                                                                  <tbody>
                                                                      <tr>
                                                                          <td class="esd-structure es-p20" esd-general-paddings-checked="false" style="background-position: left top;" align="left" bgcolor="#c93939">
                                                                              <!--[if mso]><table width="560" cellpadding="0" cellspacing="0"><tr><td width="178" valign="top"><![endif]-->
                                                                              <table class="es-left" cellspacing="0" cellpadding="0" align="left">
                                                                                  <tbody>
                                                                                      <tr>
                                                                                          <td class="es-m-p0r es-m-p20b esd-container-frame" width="178" valign="top" align="center" bgcolor="#c93939">
                                                                                              <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                  <tbody>
                                                                                                      <tr>
                                                                                                          <br>
                                                                                                          <td class="esd-block-image" align="center">
                                                                                                              <a target="_blank"> <img src="https://ivicatechnologies.in/uploads/ivica a4.png" alt="Quick taxi logo" title="Quick taxi logo" width="50" style="display: block;"> </a>
                                                                                                          </td>
                                                                                                      </tr>
                                                                                                      <!-- <tr>
                                                                                                         
                                                                                                          <td>
                                                                                                             <br> <font color="#333333"><span style="font-size: 14px;" align="center">Â© 2018 Ivica Technologies Private Limited. All Rights Reserved.</span></font>
                                                                                                          </td>
                                                                                                         
                                                                                                      </tr> -->
                                                                                                  </tbody>
                                                                                              </table>
                                                                                          </td>
                                                                                      </tr>
                                                                                  </tbody>
                                                                              </table>
                                                                              <!--[if mso]></td><td width="20"></td><td width="362" valign="top"><![endif]-->
                                                                              <table cellspacing="0" cellpadding="0" align="right">
                                                                                  <tbody>
                                                                                      <tr>
                                                                                          <td class="esd-container-frame" width="362" align="left">
                                                                                              <table width="100%" cellspacing="0" cellpadding="0">
                                                                                                  <tbody>
                                                                                                      <tr>
                                                                                                          <td class="esd-block-text es-p10b es-m-txt-c" align="left">
                                                                                                              <h3>Contact us</h3>
                                                                                                          </td>
                                                                                                          <!-- <td class="es-p10r" valign="top" align="center"> 
                                                                                                              <a target="_blank" href="https://www.linkedin.com/company/ivica-technologies-private-limited/about/?viewAsMember=true"><img title="LinkedIn" src="https://ivicatechnologies.in/uploads/linkedin.png" alt="Tw" width="24" height="24" hspace="20"> </a><br>
                                                                                                          </td>
                                                                                                          <td class="es-p10r" valign="top" align="right">
                                                                                                              <a target="_blank" href="https://www.facebook.com/IvicaTechnologies/"><img title="Facebook" src="https://ivicatechnologies.in/uploads/facebook-logo-in-circular-button-outlined-social-symbol (1).png" alt="Fb" width="24" height="24"></a>
                                                                                                          </td> -->
                                                                                                      </tr>
                                                                                                      <tr>
                                                                                                          <td class="esd-block-text es-m-txt-c" esd-links-underline="none">
                                                                                                              <font color="#333333"><span style="font-size: 14px;">IvicaTechnologies</span></font>
                                                                                                          </td>
                                                                                                         
                                                                                                          
                                                                                                      </tr>
                                                                                                      <tr>
                                                                                                          <td class="esd-block-text es-m-txt-c" esd-links-underline="none" align="left">
                                                                                                              <font color="#333333"><span style="font-size: 14px;">contact@ivicatechnologies.com</span></font><br>
                                                                                                              <!-- <p><a target="_blank" href="mailto:contact@ivicatechnologies.com" color="#333333">contact@ivicatechnologies.com</a></p> -->
                                                                                                          </td>
                                                                                                          
                                                                                                      </tr>
                                                                                                      <tr> 
                                                                                                          <td class="esd-block-text es-m-txt-c" esd-links-underline="none" width="362" align="left">
                                                                                                              <table class="es-social es-table-not-adapt" cellspacing="0" cellpadding="0">
                                                                                                                  <tbody>
                                                                                                                      <tr>
                                                                                                                          <td class="esd-block-text es-m-txt-c" esd-links-underline="none" align="left"> <br>
                                                                                                                              <a target="_blank" href="https://www.linkedin.com/company/ivica-technologies-private-limited/about/?viewAsMember=true"><img title="LinkedIn" src="https://ivicatechnologies.in/uploads/linkedin.png" alt="Tw" width="28" height="23" > </a><br>
                                                                                                                          </td>
                                                                                                                          <td class="es-p10r" valign="top" align="center"> <br>
                                                                                                                              <a target="_blank" href="https://www.facebook.com/IvicaTechnologies/"><img title="Facebook" src="https://ivicatechnologies.in/uploads/facebook-logo-in-circular-button-outlined-social-symbol (1).png" alt="Fb" width="28" height="23" hspace="30"></a>
                                                                                                                          </td>
                                                                                                                      </tr>  
                                                                                                                  </tbody> 
                                                                                                              </table>
                                                                                                              <!-- <p><br></p> -->
                                                                                                          </td>
                                                                                                      </tr> 
                                                                                                                                                            
                                                                                                      <!-- <tr>
                                                                                                          <td class="es-p10r" valign="top" align="center">
                                                                                                              <a target="_blank" href="https://play.google.com/store/apps/details?id=ivicatechnologies.com.famegear"><img title="Facebook" src="https://ivicatechnologies.in/uploads/android.png" alt="Fb" width="100" height="30"></a>
                                                                                                          </td>
                                                                                                          <td class="es-p10r" valign="top" align="center">
                                                                                                              <a target="_blank" href="https://itunes.apple.com/in/app/fvmegear/id1458770790?mt=8"><img title="Facebook" src="https://ivicatechnologies.in/uploads/ios.png" alt="Fb" width="100" height="30"></a>
                                                                                                          </td>         
                                                                                                      </tr>   -->
                                                                                                      <tr>
                                                                                                          <td class="esd-block-social es-p10t es-m-txt-c" align="left">
                                                                                                              <table class="es-social es-table-not-adapt" cellspacing="0" cellpadding="0">
                                                                                                                  <tbody>
                                                                                                                      <tr>
                                                                                                                          <td class="es-p10r" valign="top" align="center">
                                                                                                                              <a target="_blank" href="https://play.google.com/store/apps/details?id=ivicatechnologies.com.famegear"><img title="Facebook" src="https://ivicatechnologies.in/uploads/android.png" alt="Fb" width="100"></a>
                                                                                                                          </td>
                                                                                                                          <td class="es-p10r" valign="top" align="center">
                                                                                                                              <a target="_blank" href="https://itunes.apple.com/in/app/fvmegear/id1458770790?mt=8"><img title="Facebook" src="https://ivicatechnologies.in/uploads/ios.png" alt="Fb" width="100" height="30" hspace="20"></a>
                                                                                                                          </td> 
                                                                                                                      </tr>  
                                                                                                  
                                                                                                                  </tbody> 
                                                                                                              </table>
                                                                                                                  <!-- <p><br></p> -->
                                                                                                          </td>
                                                                                                      </tr> 
                                                                                                      <!-- <tr>
                                                                                                          <td class="esd-block-text es-p10t es-m-txt-c" align="left">
                                                                                                              <p style="font-size: 12px; line-height: 150%;">You are receiving this email because you subscribed to our site. Please note that you can&nbsp;<a target="_blank" style="font-size: 12px;">unsubscribe</a>&nbsp;at any time.</p>
                                                                                                          </td>
                                                                                                      </tr>  -->
                                                                                                  </tbody>
                                                                                              </table>
                                                                                          </td>
                                                                                      </tr>
                                                                                  </tbody>
                                                                              </table>
                                                                              <!--[if mso]></td></tr></table><![endif]-->
                                                                          </td>
                                                                      </tr>
                                                                  </tbody>
                                                              </table>
                                                          </td>
                                                      </tr>
                                                  </tbody>
                                              </table>
                                          </td>
                                      </tr>
                                  </tbody>
                              </table>
                          </div>
                          <div style="position:absolute;left:-9999px;top:-9999px;"></div>
                      </body>

                      </html>`)
        }

                 
           
      }).catch(err =>{

                              res.status(500).json({ 
                                 status: 'Failed',
                                 message: spliterror[0]+ spliterror[1]
                              });
                })
})


var profileimages = function(user){
                    var username = (user.charAt(0)).toLowerCase();

                    var profileimage = ""

                    if(username === 'a'){
                        profileimage = "uploads/A.png"
                    }
                    else if(username === 'b'){
                        profileimage = "uploads/B.png"
                    }
                     else if(username === 'c'){
                        profileimage = "uploads/C.png"

                    }
                     else if(username === 'd'){
                        profileimage = "uploads/D.png"

                    }
                     else if(username === 'e'){
                        profileimage = "uploads/E.png"

                    }
                     else if(username === 'f'){
                        profileimage = "uploads/F.png"

                    }
                     else if(username === 'g'){
                        profileimage = "uploads/G.png"

                    }
                     else if(username === 'h'){
                        profileimage = "uploads/H.png"

                    }
                     else if(username === 'i'){
                        profileimage = "uploads/I.png"

                    }
                     else if(username === 'j'){
                        profileimage = "uploads/J.png"

                    }
                     else if(username === 'k'){
                        profileimage = "uploads/K.png"

                    }
                     else if(username === 'l'){
                        profileimage = "uploads/L.png"

                    }
                     else if(username === 'm'){
                        profileimage = "uploads/M.png"

                    }
                     else if(username === 'n'){
                        profileimage = "uploads/N.png"

                    }
                     else if(username === 'o'){
                        profileimage = "uploads/O.png"

                    }
                     else if(username === 'p'){
                        profileimage = "uploads/P.png"

                    }
                     else if(username === 'q'){
                        profileimage = "uploads/Q.png"

                    }
                     else if(username === 'r'){
                        profileimage = "uploads/R.png"

                    }
                     else if(username === 's'){
                        profileimage = "uploads/S.png"

                    }
                     else if(username === 't'){
                        profileimage = "uploads/T.png"

                    }
                     else if(username === 'u'){
                        profileimage = "uploads/U.png"

                    }
                     else if(username === 'v'){
                        profileimage = "uploads/V.png"

                    }
                     else if(username === 'w'){
                        profileimage = "uploads/W.png"

                    }
                     else if(username === 'x'){
                        profileimage = "uploads/X.png"

                    }
                     else if(username === 'y'){
                        profileimage = "uploads/Y.png"

                    }
                     else if(username === 'z'){
                        profileimage = "uploads/Z.png"

                    }
                     else{
                        profileimage= "uploads/userimage.png"
                    }

                    return profileimage

}

module.exports = router;
