const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const math = require('mathjs');
const multer = require('multer');
const isEmpty = require('is-empty');
const constants = require("../constants/constants");
const authModel = require("../models/auth");

const reviewQuestions = require("../models/reviewQuestions");
const reviewqtsprice = require("../models/reviewqtsprice");

/* Create Review Question Price */
router.post("/createPrice",(req, res, next) => {


const Reviewqtsprice = new reviewqtsprice({
    _id: new mongoose.Types.ObjectId(),
    price: req.body.questionprice,
    status: req.body.status
  
  });
  Reviewqtsprice
    .save()
    .then(result => {
      res.json({
      status: "Ok",
      message: "Successfully Created Review Question Price",
      createdReviewQuestionPrice: result
      });
    })
    .catch(err => {
      
      res.status(500).json({
        error: err
      });
    });

  
 
});

/* Review Questions Pice Done API */
router.post("/verify",(req, res, next) => {

   if(constants.AndriodClientId === req.body[0].clientid){
	   
	   authModel.find({iv_token: req.body[0].iv_token})       
      .exec()
      .then(auth => { 
        if (auth.length < 1) {
              return res.status(200).json({
                status:"Logout",
                message:"You are logged in other device."
              });
        } 
        else {
	   
   var questionsarray = req.body;
   var totalQuestions = questionsarray.length;

       
         reviewqtsprice.find({'status':1})
          .select("price")
          .exec()
          .then(docs => {
            if(isEmpty(docs[0]['price']))
            {
              const questionPriceDetails = {
                        totalQuestions : totalQuestions,
                        eachQuestionPrice : 'Database not available question price',
                        totalQuestionsPrice : 'Database not available question price'
                       }
                       res.json({
              status: "Failed",
            message: "Please contacte Administrator",
            QusionsPriceDetails: questionPriceDetails
              
             });
            }
            else
            {
                var finalQuestionPrice = math.multiply(docs[0]['price'], totalQuestions)
                const questionPriceDetails = {
                        totalQuestions : totalQuestions,
                        eachQuestionPrice : docs[0]['price'],
                        totalQuestionsPrice : finalQuestionPrice
                       }
                       res.json({
              status: "Ok",
            message: "Just Review Questions Price Information",
            QusionsPriceDetails: questionPriceDetails
              
             });
            }
                
                
              
            
          })
          .catch(err => {
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
		  else {
			   res.json({
				  status: 'Failed',
				  message: 'Bad Request. Please provide clientid.'
			  });
		  }

});

/* Review Questions Pice Done API */
router.post("/done",(req, res, next) => {

 if(constants.AndriodClientId === req.body[0].clientid){
	 
	  authModel.find({iv_token: req.body[0].iv_token})       
      .exec()
      .then(auth => { 
        if (auth.length < 1) {
              return res.status(200).json({
                status:"Logout",
                message:"You are logged in other device."
              });
        } 
        else {
	 
   var questionsarray = req.body;
   var totalQuestions = questionsarray.length;
   
     // console.log(questionsarray);
           for(var i = 0; i < questionsarray.length; i++)
           {

              var QuestonsObj = questionsarray[i];
             // console.log(QuestonsObj);
              const ReviewQuestions = new reviewQuestions({
                _id: new mongoose.Types.ObjectId(),
                userid: QuestonsObj['userid'],
              business_prof_id: QuestonsObj['business_prof_id'],
              review_question: QuestonsObj['question']
              
              });
        ReviewQuestions
          .save();
          }
    
   
         reviewqtsprice.find({'status':1})
          .select("price")
          .exec()
          .then(docs => {
                
            if(isEmpty(docs[0]['price']))
            {
              const questionPriceDetails = {
                        totalQuestions : totalQuestions,
                        eachQuestionPrice : 'Database not available question price',
                        totalQuestionsPrice : 'Database not available question price'
                       }
                       res.json({
              status: "Failed",
            message: "Please contacte Administrator",
            QusionsPriceDetails: questionPriceDetails
              
             });
            }
            else
            {
                var finalQuestionPrice = math.multiply(docs[0]['price'], totalQuestions)
                const questionPriceDetails = {
                        totalQuestions : totalQuestions,
                        eachQuestionPrice : docs[0]['price'],
                        totalQuestionsPrice : finalQuestionPrice
                       }
                
                res.json({
              status: "Ok",
            message: "Successfully Created Questions",
            QusionsPriceDetails: questionPriceDetails
              
             });
          }
            
          })
          .catch(err => {
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
		  else {
			   res.json({
				  status: 'Failed',
				  message: 'Bad Request. Please provide clientid.'
			  });
		  }


});

module.exports = router;