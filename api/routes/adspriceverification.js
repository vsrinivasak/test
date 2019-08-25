const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const isEmpty = require('is-empty');
const math = require('mathjs');
const multer = require('multer');


const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './uplad_business_ads/');
  },
  filename: function(req, file, cb) {
   cb(null, new Date().toISOString() + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {

 if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/mp4') {

   cb(null, true);
 } else {
  cb(null, false);
 }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 20
  }
});



const businessCitiesList = require("../models/citieslist");
const genderlistprice = require("../models/genderlistprice");
const professionlistprice = require("../models/professionlistprice");
const agelistprice = require("../models/agelistprice");
const arealocalityprice = require("../models/arealocalityprice");
const citiesprice = require("../models/citiesprice");
const statesprice = require("../models/statesprice");
const countryprice = require("../models/countryprice");
const estimateadsprice = require("../models/estimateadsprice");
const authModel = require("../models/auth");
const constants = require("../constants/constants");
/* Business Ads Cost Verification API */
router.post("/verification",(req, res, next) => {
   if(constants.AndriodClientId === req.body.clientid)
   {
     
    authModel.find({iv_token: req.body.iv_token})       
      .exec()
      .then(auth => { 
        if (auth.length < 1) {
              return res.status(200).json({
                status:"Failed",
                message:"Please provide correct iv_token."
              });
        } 
        else {	 
		
    const typesOfAdId = req.body.typesofads_id;
    const adsPrefrencePage = req.body.ads_prefrence_id;
    const splitCountry = req.body.country_id;
    const splitState = req.body.state_id;
    const splitCity = req.body.city_id;
    const splitLocation = req.body.locatin_id;
    const splitAge = req.body.age_id;
    const splitProfession = req.body.profession_id;
    const splitGender = req.body.gender_id;
    const cpm = req.body.cpm;
    
    
                                         /* States Split ',' */
     if (splitState.indexOf(',') != -1) 
     {

      var stateId = splitState.split(",");
	  

     }
     else if(splitState)
     {

      var stateId = splitState;

     }
     else
     {
      var stateId = "5c5971c64cf4d4296a07207d";
     }
                                    /* States Split ',' */
     if (splitCity.indexOf(',') != -1) 
     {

      var cityId = splitCity.split(",");

     }
     else if(splitCity)
     {

      var cityId = splitCity;

     }else 
     {
      var cityId = "5c5971c64cf4d4296a07207d";
     }

                                    /* Locations Split ',' */
     if (splitLocation.indexOf(',') != -1) 
     {

      var locatinId = splitLocation.split(",");

     }
     else if(splitLocation)
     {

      var locatinId = splitLocation;

     }
     else
     {
      var locatinId = "5c5971c64cf4d4296a07207d";
     }

                                   /* Country Split ',' */
     if (splitCountry.indexOf(',') != -1) 
     {

      var countryId = splitCountry.split(",");

     }
     else if(splitCountry)
     {

      var countryId = splitCountry;

     }
     else
     {
      var countryId = "5c5971c64cf4d4296a07207d";
     }

                                   /* Age Split ',' */
     if (splitAge.indexOf(',') != -1) 
     {

      var ageId = splitAge.split(",");

     }
     else if(splitAge)
     {

      var ageId = splitAge;

     }
     else
     {
      var ageId = "5c5971c64cf4d4296a07207d";
     }
    
                                  /* Profession Split ',' */
     if (splitProfession.indexOf(',') != -1) 
     {

      var professionId = splitProfession.split(",");

     }
     else if(splitProfession)
     {

      var professionId = splitProfession;

     }
     else
     {
      var professionId = "5c5971c64cf4d4296a07207d";
     }
         
                                 /* Gender Split ',' */
     if (splitGender.indexOf(',') != -1) 
     {

      var genderId = splitGender.split(",");

     }
     else if(splitGender)
     {

      var genderId = splitGender;

     }
      else
     {
      var genderId = "5c5971c64cf4d4296a07207d";
     }
    
    var verificationPriceArray = [];
    var FinalPrice = {
                     
                      price : []
            
                     };

    /* Gender Wise Businees Price Calculation */
       genderlistprice.find({
        $and : [
                   { 
                     'ads_id':typesOfAdId
                   },
                   { 'gender_id': { $in: genderId } }
                 ]
       })
        .select("gender_business_price")
        .exec()
        .then(docs => {
         
   
       docs.map(docg => {
          genderReslt = {
                "genderprice": docg.gender_business_price
      
              };
          if(genderId)
          { 
          verificationPriceArray.push(genderReslt);
          }
          });
   
          /* Profession Wise Businees Price Calculation */

             professionlistprice.find({
              $and : [
                         { 
                           'ads_id':typesOfAdId
                         },
                         { 'profession_id': { $in: professionId } }
                         
                       ]
             })
            .select("profession_price")
            .exec()
            .then(docsPf => { 
              
              docsPf.map(docPf => {
              PrfsReslt = {
                    "professinprice": docPf.profession_price
          
                  };
              if(professionId)
              {
              verificationPriceArray.push(PrfsReslt);
              }
              });


              /* Age Wise Businees Price Calculation */

               agelistprice.find({
            $and : [
                       { 
                         'ads_id':typesOfAdId
                       },
                       { 'age_id': { $in: ageId } }
                       
                     ]
           })
          .select("age_business_price")
          .exec()
          .then(docsAge => {  
            

            docsAge.map(docAg => {
            AgeReslt = {
                  "AgeWiseprice": docAg.age_business_price
        
                };
            if(ageId)
            {
             
            verificationPriceArray.push(AgeReslt);
            }
            });

             /* Area Location Wise Businees Price Calculation */
             
             arealocalityprice.find({
          $and : [
                     { 
                       'ads_id':typesOfAdId
                     },
                     { 'c_id': { $in: countryId } },
                     { 'st_id': { $in: stateId } },
                    { 'city_id': { $in: cityId } },
                    { 'arealocality_id': { $in: locatinId } }
                     
                   ]
         })
        .select("arealocality_business_price")
        .exec()
        .then(docsLocalty => {  

           docsLocalty.map(docLocalty => {
          LocalityReslt = {
                "LocalityWiseprice": docLocalty.arealocality_business_price
      
              };

          if(countryId != '5c5971c64cf4d4296a07207d' && stateId != '5c5971c64cf4d4296a07207d' && cityId != '5c5971c64cf4d4296a07207d' && locatinId != '5c5971c64cf4d4296a07207d')
          { 
              
          verificationPriceArray.push(LocalityReslt);
          }

          });

          /* City Wise Businees Price Calculation */

                 citiesprice.find({
              $and : [
                         { 
                           'ads_id':typesOfAdId
                         },
                         { 'c_id': { $in: countryId } },
                         { 'st_id': { $in: stateId } },
                         { 'city_id': { $in: cityId } }
                         
                       ]
             })
            .select("city_business_price")
            .exec()
            .then(docsCity => {  

               docsCity.map(docCity => {
              CityReslt = {
                    "CityWiseprice": docCity.city_business_price
          
                  };

              if(countryId != '5c5971c64cf4d4296a07207d' && stateId != '5c5971c64cf4d4296a07207d' && cityId != '5c5971c64cf4d4296a07207d' && locatinId == '5c5971c64cf4d4296a07207d')
              { 
                
              verificationPriceArray.push(CityReslt);

              }
              });
              
              /* State Wise Businees Price Calculation 
              { 
                         'st_id':stateId
                       }

                       { 'st_id': { $in: [ stateId ] } }*/

               statesprice.find({
            $and : [
                       { 
                         'ads_id':typesOfAdId
                       },
                       { 'c_id': { $in: countryId } },
                       { 'st_id': { $in: stateId } }
                       
                       
                       
                     ]
           })
          .select("states_bs_price")
          .exec()
          .then(docsState => {  

             docsState.map(docState => {
            StateReslt = {
                  "StateWiseprice": docState.states_bs_price
        
                };

            if(countryId != '5c5971c64cf4d4296a07207d' && stateId != '5c5971c64cf4d4296a07207d' && cityId == '5c5971c64cf4d4296a07207d' && locatinId == '5c5971c64cf4d4296a07207d')
            {
              
            verificationPriceArray.push(StateReslt);

            }
            });
           /* Country Wise Businees Price Calculation */

                 countryprice.find({
              $and : [
                         { 
                           'ads_id':typesOfAdId
                         },
                         { 'c_id': { $in: countryId } }
                         
                       ]
             })
            .select("country_bs_price")
            .exec()
            .then(docsCity => {  

               docsCity.map(docCity => {
              StateReslt = {
                    "CoutntyWiseprice": docCity.country_bs_price
          
                  };

              if(countryId != '5c5971c64cf4d4296a07207d' && stateId == '5c5971c64cf4d4296a07207d' && cityId == '5c5971c64cf4d4296a07207d' && locatinId == '5c5971c64cf4d4296a07207d')
              {
              verificationPriceArray.push(StateReslt);
              }
              });

              let Priceresults = [];
              for(var i = 0; i < verificationPriceArray.length; i++){
                var BsPriceObj = verificationPriceArray[i];
                var BsPriceKey = Object.keys(BsPriceObj);
                var BsPriceValue = verificationPriceArray[i][BsPriceKey];  
                Priceresults.push(BsPriceValue);
                           
              }
              var SumPrice = math.sum(Priceresults);
              var cpmvalue = 1000;
              var total_impressions = math.multiply(cpm, cpmvalue)
              var finalPrice = math.multiply(total_impressions, SumPrice)
              
              FinalPrice.price.push(finalPrice)
              
           res.status(200).json({
              status : "Ok",
              message : "Sucess",
              FinalPrice : finalPrice
             });
               });
             });
            });
            });
            });
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
			   res.status(200).json({
				  status: 'Failed',
				  message: 'Bad Request. Please provide clientid.'
				});
		  }

});


/* Business Ads Pice Done API */
router.post("/done",upload.single('uplad_business_ads'),(req, res, next) => {
	
	if(constants.AndriodClientId === req.body.clientid){
		
		authModel.find({iv_token: req.body.iv_token})       
      .exec()
      .then(auth => { 
        if (auth.length < 1) {
              return res.status(200).json({
                status:"Failed",
                message:"Please provide correct iv_token."
              });
        } 
        else {
   
       if(isEmpty(req.file))
       {
          var adspath = "";
       }
       else
       {
         var adspath = req.file.path;
       }
    const userid = req.body.userid;
    const typesofad = req.body.typesofad;
    const typesOfAdId = req.body.typesofads_id;
    const adsPrefrencePage = req.body.ads_prefrence_id;
    const splitCountry = req.body.country_id;
    const splitState = req.body.state_id;
    const splitCity = req.body.city_id;
    const splitLocation = req.body.locatin_id;
    const splitAge = req.body.age_id;
    const splitProfession = req.body.profession_id;
    const splitGender = req.body.gender_id;
    const cpm = req.body.cpm;
    
    var verificationPriceArray = [];
    var FinalPrice = [];
      
                                           /* States Split ',' */
     if (splitState.indexOf(',') != -1) 
     {

      var stateId = splitState.split(",");

     }
     else if(splitState)
     {

      var stateId = splitState;

     }else
     {
      var stateId = "5c5971c64cf4d4296a07207d";
     }
                                    /* States Split ',' */
     if (splitCity.indexOf(',') != -1) 
     {

      var cityId = splitCity.split(",");

     }
     else if(splitCity)
     {

      var cityId = splitCity;

     }
     else
     {
      var cityId = "5c5971c64cf4d4296a07207d";
     }

                                    /* Locations Split ',' */
     if (splitLocation.indexOf(',') != -1) 
     {

      var locatinId = splitLocation.split(",");

     }
     else if(splitLocation)
     {

      var locatinId = splitLocation;

     }
     else
     {
      var locatinId = "5c5971c64cf4d4296a07207d";
     }

                                   /* Country Split ',' */
     if (splitCountry.indexOf(',') != -1) 
     {

      var countryId = splitCountry.split(",");

     }
     else if(splitCountry)
     {

      var countryId = splitCountry;

     }
     else
     {
      var countryId = "5c5971c64cf4d4296a07207d";
     }

                                   /* Age Split ',' */
     if (splitAge.indexOf(',') != -1) 
     {

      var ageId = splitAge.split(",");

     }
     else if(splitAge)
     {

      var ageId = splitAge;

     }
     else
     {
      var ageId = "5c5971c64cf4d4296a07207d";
     }
    
                                  /* Profession Split ',' */
     if (splitProfession.indexOf(',') != -1) 
     {

      var professionId = splitProfession.split(",");

     }
     else if(splitProfession)
     {

      var professionId = splitProfession;

     }
     else
     {
      var professionId = "5c5971c64cf4d4296a07207d";
     }
                                 /* Gender Split ',' */
     if (splitGender.indexOf(',') != -1) 
     {

      var genderId = splitGender.split(",");

     }
     else if(splitGender)
     {

      var genderId = splitGender;

     }
     else
     {
      var genderId = "5c5971c64cf4d4296a07207d";
     }
    

    /* Gender Wise Businees Price Calculation */
       genderlistprice.find({
        $and : [
                   { 
                     'ads_id':typesOfAdId
                   },
                   { 'gender_id': { $in: genderId } }
                   
                 ]
       })
        .select("gender_business_price")
        .exec()
        .then(docs => {
         
   
       docs.map(docg => {
          genderReslt = {
                "genderprice": docg.gender_business_price
      
              };
          if(genderId)
          { 
          verificationPriceArray.push(genderReslt);
          }
          });
   
          /* Profession Wise Businees Price Calculation */

             professionlistprice.find({
              $and : [
                         { 
                           'ads_id':typesOfAdId
                         },
                         { 'profession_id': { $in: professionId } }
                        
                       ]
             })
            .select("profession_price")
            .exec()
            .then(docsPf => { 
              
              docsPf.map(docPf => {
              PrfsReslt = {
                    "professinprice": docPf.profession_price
          
                  };
              if(professionId)
              {
              verificationPriceArray.push(PrfsReslt);
              }
              });


              /* Age Wise Businees Price Calculation */

               agelistprice.find({
            $and : [
                       { 
                         'ads_id':typesOfAdId
                       },
                       { 'age_id': { $in: ageId } }
                     ]
           })
          .select("age_business_price")
          .exec()
          .then(docsAge => {  
            

            docsAge.map(docAg => {
            AgeReslt = {
                  "AgeWiseprice": docAg.age_business_price
        
                };
            if(ageId)
            {
            verificationPriceArray.push(AgeReslt);
            }
            });

             /* Area Location Wise Businees Price Calculation */

             arealocalityprice.find({
          $and : [
                     { 
                       'ads_id':typesOfAdId
                     },
                     { 'c_id': { $in: countryId } },
                     { 'st_id': { $in: stateId } },
                     { 'city_id': { $in: cityId } },
                     { 'arealocality_id': { $in: locatinId } }
                     
                   ]
         })
        .select("arealocality_business_price")
        .exec()
        .then(docsLocalty => {  

           docsLocalty.map(docLocalty => {
          LocalityReslt = {
                "LocalityWiseprice": docLocalty.arealocality_business_price
      
              };

          if(countryId != '5c5971c64cf4d4296a07207d' && stateId != '5c5971c64cf4d4296a07207d' && cityId != '5c5971c64cf4d4296a07207d' && locatinId != '5c5971c64cf4d4296a07207d')
          { 
              
          verificationPriceArray.push(LocalityReslt);
         }

          });

          /* City Wise Businees Price Calculation */

                 citiesprice.find({
              $and : [
                         { 
                           'ads_id':typesOfAdId
                         },
                         { 'c_id': { $in: countryId } },
                         { 'st_id': { $in: stateId } },
                         { 'city_id': { $in: cityId } }
                         
                         
                       ]
             })
            .select("city_business_price")
            .exec()
            .then(docsCity => {  

               docsCity.map(docCity => {
              CityReslt = {
                    "CityWiseprice": docCity.city_business_price
          
                  };

              if(countryId != '5c5971c64cf4d4296a07207d' && stateId != '5c5971c64cf4d4296a07207d' && cityId != '5c5971c64cf4d4296a07207d' && locatinId == '5c5971c64cf4d4296a07207d')
              { 
                
              verificationPriceArray.push(CityReslt);

              }
              });
              
              /* State Wise Businees Price Calculation */

               statesprice.find({
            $and : [
                       { 
                         'ads_id':typesOfAdId
                       },
                       { 'c_id': { $in: countryId } },
                        { 'st_id': { $in: stateId } }
                       
                     ]
           })
          .select("states_bs_price")
          .exec()
          .then(docsState => {  

             docsState.map(docState => {
            StateReslt = {
                  "StateWiseprice": docState.states_bs_price
        
                };

            if(countryId != '5c5971c64cf4d4296a07207d' && stateId != '5c5971c64cf4d4296a07207d' && cityId == '5c5971c64cf4d4296a07207d' && locatinId == '5c5971c64cf4d4296a07207d')
            {

            verificationPriceArray.push(StateReslt);

            }
            });
           /* Country Wise Businees Price Calculation */

                 countryprice.find({
              $and : [
                         { 
                           'ads_id':typesOfAdId
                         },
                         { 'c_id': { $in: countryId } }
                         
                       ]
             })
            .select("country_bs_price")
            .exec()
            .then(docsCity => {  

               docsCity.map(docCity => {
              StateReslt = {
                    "CoutntyWiseprice": docCity.country_bs_price
          
                  };
              if(countryId != '5c5971c64cf4d4296a07207d' && stateId == '5c5971c64cf4d4296a07207d' && cityId == '5c5971c64cf4d4296a07207d' && locatinId == '5c5971c64cf4d4296a07207d')
              {
              verificationPriceArray.push(StateReslt);
              }
              });

              
              let Priceresults = [];
              for(var i = 0; i < verificationPriceArray.length; i++){
                var BsPriceObj = verificationPriceArray[i];
                var BsPriceKey = Object.keys(BsPriceObj);
                var BsPriceValue = verificationPriceArray[i][BsPriceKey];  
                Priceresults.push(BsPriceValue);
                           
              }
              var SumPrice = math.sum(Priceresults);
              var cpmvalue = 1000;
              var total_impressions = math.multiply(cpm, cpmvalue)
              var finalPrice = math.multiply(total_impressions, SumPrice)
              
              FinalPrice.push(finalPrice)
                

              var ads_countrylist_id = (countryId != '5c5971c64cf4d4296a07207d') ? countryId:'5c5971c64cf4d4296a07207d';
         var ads_stateslist_id = (stateId != '5c5971c64cf4d4296a07207d') ? stateId:'5c5971c64cf4d4296a07207d';
         var ads_citieslist_id = (cityId != '5c5971c64cf4d4296a07207d') ? cityId:'5c5971c64cf4d4296a07207d';
         var ads_citieslocationlist_id = (locatinId != '5c5971c64cf4d4296a07207d') ? locatinId:'5c5971c64cf4d4296a07207d';
         var ads_prefagelist_id = (ageId != '5c5971c64cf4d4296a07207d') ? ageId:'5c5971c64cf4d4296a07207d';
         var ads_profslist_id = (professionId != '5c5971c64cf4d4296a07207d') ? professionId:'5c5971c64cf4d4296a07207d';
         var ads_genderlist_id = (genderId != "5c5971c64cf4d4296a07207d") ? genderId:'5c5971c64cf4d4296a07207d';
             
              const Estimateadsprice = new estimateadsprice({
              _id: new mongoose.Types.ObjectId(),
              userid: userid,
              ads_id: typesOfAdId,
              ads_name: typesofad,
              ads_price: SumPrice,
              cpm: cpm,
              total_impressions: total_impressions,
              user_impressions: total_impressions,
              user_view_impressions: total_impressions,
              ads_total_price: finalPrice,
              ads_file_path: adspath,
        ads_genderlist_id: ads_genderlist_id,
        ads_profslist_id: ads_profslist_id,
        ads_prefagelist_id: ads_prefagelist_id,
        ads_citieslocationlist_id: ads_citieslocationlist_id,
        ads_citieslist_id: ads_citieslist_id,
        ads_stateslist_id: ads_stateslist_id,
        ads_countrylist_id: ads_countrylist_id
              });
                 
              Estimateadsprice
                .save();

                const adsDetails = {
                  typesofads_id : typesOfAdId,
                  typesofad : typesofad,
                  price : SumPrice,
                  cpm : cpm,
                  TotalPrice : finalPrice
                 }
                 
                  if(isEmpty(finalPrice))
                  {
                      res.status(200).json({
              status : "Failure",
              message : "ads prices not available in server"
             });
                  }
                  else
                  {
                    res.status(200).json({
              status : "Ok",
              message : "Sucess",
              adsPriceDetails : adsDetails
              
             });
                  }
      
               });
             });
            });
            });
            });
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
			   res.status(200).json({
				  status: 'Failed',
				  message: 'Bad Request. Please provide clientid.'
			  });
		  }

});

/* Cities List */
// Handle incoming GET requests to /List

router.get("/List", (req, res, next) => {
  
  businessCitiesList.find()
    .select("_id c_id st_id city_name city_createdate")
    .exec()
    .then(docs => {
      res.status(200).json({
		status: "Ok",
        message: "List Of Business Cities Business Prices for ads",
        count: docs.length,
        CitiesList: docs.map(doc => {
          return {
			_id: doc._id,
			c_id: doc.c_id,
			st_id: doc.st_id,
			city_name: doc.city_name,
			city_createdate: doc.city_createdate
	
          };
        })
      });
    })
    .catch(err => {
      var spliterror=err.message.split(":")
            res.status(500).json({ 
                status: 'Failed',
                message: spliterror[0]
            });
    });
	
});


module.exports = router;