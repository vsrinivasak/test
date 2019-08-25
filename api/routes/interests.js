const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const isEmpty = require('is-empty');
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
const hobbies = require("../models/interests");

router.post("/store_interests", (req, res, next) => {

	hobbies.findOneAndUpdate({title:req.body.title},{$push:{items:[{
		items_name:req.body.item_name}
	]
}},{upsert:true}).exec()


			.then(docs =>{
					return res.status(200).json({
                        status: 'Ok',
                        message: 'added successfully.'
                    })
				 }).catch(err => {
                    var spliterror=err.message.split(":")
                     res.status(500).json({ 
                        status: 'Failed',
                        message: spliterror[0]
                     });
                });

});

router.get("/get_interests_list", (req, res, next) => {

	hobbies.find({})
			.exec()
			.then(docs =>{
				var test =[];
					docs.map(doc =>{
						var items = doc.items;
						var item_array=[];
						items.map(ele =>{
							var foo ={
								"item_id":ele._id,
								"item_name":ele.items_name	
							}
							item_array.push(foo)
						})
						var foe = {
							"title_id":doc._id,
							"title":doc.title,
							"items":item_array
						}
						test.push(foe)
					})
					test.sort()
					return res.status(200).json({
                        status: 'Ok',
                        message: 'List of Interests',
                        List:test
                    })
				 }).catch(err => {
                    var spliterror=err.message.split(":")
                     res.status(500).json({ 
                        status: 'Failed',
                        message: spliterror[0]
                     });
                });

});

router.post("/select_interests", (req, res, next) => {

var keyArray = ["userid", "iv_token", "clientid", "items"];
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
			var reqbody = req.body.items;
			var bodyreq = reqbody.split(",");
			var objectMembers =  [];
			// reqbody.forEach(function(ele){
			// 	objectMembers.push(ObjectId(ele))
			// })
			for(var i=0;i<bodyreq.length;i++){
				objectMembers.push(ObjectId(bodyreq[i]))
			}
			hobbies.find({'items._id':{$in:objectMembers}},{"items.$":1})
				.exec()
				.then(docs =>{
					var items = [];
					docs.forEach(function(doc){
						var foo ={
							'item_name':doc.items[0].items_name,
							'item_id':doc.items[0]._id
						} 
						items.push(foo)
					})
					User.findOneAndUpdate({_id:req.body.userid},
											{$push:{hobbies:items}})
						.exec()
						.then(data =>{
							return res.status(200).json({
		                        status: 'Ok',
		                        message: 'Hobbies saved successfully.'
		                    })
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
});



module.exports = router;