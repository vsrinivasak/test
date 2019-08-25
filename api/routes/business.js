const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const math = require('mathjs');
const multer = require('multer');
const isEmpty = require('is-empty');
const authModel = require("../models/auth");
//var path = require('path');

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
	//global.filePath = req.file;
    cb(null, './uploads/');
  },
  filename: function(req, file, cb) {
    cb(null, new Date().toISOString() + file.originalname);
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
    fileSize: 1024 * 1024 * 12
  },
  fileFilter: fileFilter
});


const business = require("../models/business");
const bsOffers = require("../models/bsOffers");
const adstype = require("../models/adstype");

const constants = require("../constants/constants");
const adspreferences = require("../models/adspreferences");
const countrylist = require("../models/countrylist");
const stateslist = require("../models/stateslist");
const businessCitiesList = require("../models/citieslist");
const bAreaLocalityList = require("../models/arealocalitylist");
const agelist = require("../models/agelist");
const professionlist = require("../models/professionlist");
const businessGenderList = require("../models/genderlist");
const estimateadsprice = require("../models/estimateadsprice");
const reviewQuestions = require("../models/reviewQuestions");
const adsbusinesspostfinalprice = require("../models/adsbusinesspostfinalprice");


/* Create Business Posts / Offers*/
router.post("/createOffers",upload.single('business_post_logo'),(req, res, next) => {

     if(constants.AndriodClientId === req.body.clientid){
		 
		  authModel.find({iv_token: req.body.iv_token})       
      .exec()
      .then(auth => { 
        if (auth.length < 1) {
              return res.status(200).json({
                status:"Logout",
                message:"You are logged in other device."
              });
        } 
        else {
		 
     var userid = req.body.userid;
     var Banner = req.body.Banner;
     var Rich_Media = req.body.Rich_Media;
     var Bumper_Ads = req.body.Bumper_Ads;
     var Full_screen_Ads = req.body.Full_screen_Ads;
     var review_enable = req.body.review_enable;
     
     const BsOffers = new bsOffers({
    _id: new mongoose.Types.ObjectId(),
    iv_acountid: req.body.userid,
	bus_prof_id: req.body.bus_prof_id,
	business_post_desc: req.body.business_post_desc,
	business_post_price: req.body.business_post_price,
	business_post_logo: req.file.path,
  no_of_items: req.body.no_of_items,
	business_catetgory_type: req.body.business_catetgory_type,
	business_post_startdate: req.body.business_post_startdate,
	business_post_enddate: req.body.business_post_enddate,
	
  });

    if(req.body.ads_enable === 0)
	{

	
  BsOffers
    .save()
    .then(result => {
      
	  reslt = {
            "business_post_id": result._id,
			"userid": result.iv_acountid,
			"bus_prof_id": result.bus_prof_id,
			"business_post_desc": result.business_post_desc,
			"business_post_price": result.business_post_price,
			"business_post_logo": constants.APIBASEURL+result.business_post_logo,
      "no_of_items": result.no_of_items,
			"business_catetgory_type": result.business_catetgory_type,
			"business_post_startdate": result.business_post_startdate,
			"business_post_enddate": result.business_post_enddate
	
          };
      res.status(200).json({
		 
		status: "Ok",
        message: "Successfully Created Business Post/Offer",
        createdBusinessPostInfo: reslt
      });
    })
    .catch(err => {
      console.log(err)
      var spliterror=err.message.split(":")
                      res.status(500).json({ 
                        status: 'Failed',
                        message: spliterror[0]
                      });
    });

}
else
{


  BsOffers
    .save()
    .then(result => {
      var lastinertid = result._id;
       console.log(lastinertid);
      if(Banner && Rich_Media && Bumper_Ads && Full_screen_Ads)
      {
      	estimateadsprice.update({ userid: userid }, { ads_business_post_id: lastinertid}).exec();
      }
      else if(isEmpty(Banner) && Rich_Media && Bumper_Ads && Full_screen_Ads)
      {
         estimateadsprice.update({ ads_id: Rich_Media }, { ads_business_post_id: lastinertid}).exec();
         estimateadsprice.update({ ads_id: Bumper_Ads }, { ads_business_post_id: lastinertid}).exec();
         estimateadsprice.update({ ads_id: Full_screen_Ads }, { ads_business_post_id: lastinertid}).exec();
      }
      else if(isEmpty(Banner) && isEmpty(Rich_Media) && Bumper_Ads && Full_screen_Ads)
      {
         
         estimateadsprice.update({ ads_id: Bumper_Ads }, { ads_business_post_id: lastinertid}).exec();
         estimateadsprice.update({ ads_id: Full_screen_Ads }, { ads_business_post_id: lastinertid}).exec();
      }
      else if(isEmpty(Banner) && isEmpty(Rich_Media) && isEmpty(Bumper_Ads) && Full_screen_Ads)
      {
         
         estimateadsprice.update({ ads_id: Full_screen_Ads }, { ads_business_post_id: lastinertid}).exec();
      }
      else if(isEmpty(Banner) && isEmpty(Rich_Media) && Bumper_Ads && isEmpty(Full_screen_Ads))
      {
         
         estimateadsprice.update({ ads_id: Bumper_Ads }, { ads_business_post_id: lastinertid}).exec();
      }
      else if(isEmpty(Banner) && Rich_Media && isEmpty(Bumper_Ads) && isEmpty(Full_screen_Ads))
      {
         
         estimateadsprice.update({ ads_id: Rich_Media }, { ads_business_post_id: lastinertid}).exec();
      }
      else if(Banner && isEmpty(Rich_Media) && Bumper_Ads && Full_screen_Ads)
      {
         estimateadsprice.update({ ads_id: Banner }, { ads_business_post_id: lastinertid}).exec();
         estimateadsprice.update({ ads_id: Bumper_Ads }, { ads_business_post_id: lastinertid}).exec();
         estimateadsprice.update({ ads_id: Full_screen_Ads }, { ads_business_post_id: lastinertid}).exec();
      }
      else if(Banner && Rich_Media && isEmpty(Bumper_Ads) && Full_screen_Ads)
      {
         estimateadsprice.update({ ads_id: Banner }, { ads_business_post_id: lastinertid}).exec();
         estimateadsprice.update({ ads_id: Rich_Media }, { ads_business_post_id: lastinertid}).exec();
         estimateadsprice.update({ ads_id: Full_screen_Ads }, { ads_business_post_id: lastinertid}).exec();
      }
      else if(Banner && Rich_Media && Bumper_Ads && isEmpty(Full_screen_Ads))
      {
         estimateadsprice.update({ ads_id: Banner }, { ads_business_post_id: lastinertid}).exec();
         estimateadsprice.update({ ads_id: Rich_Media }, { ads_business_post_id: lastinertid}).exec();
         estimateadsprice.update({ ads_id: Bumper_Ads }, { ads_business_post_id: lastinertid}).exec();
      }
      else if(Banner && Rich_Media && isEmpty(Bumper_Ads) && isEmpty(Full_screen_Ads))
      {
         estimateadsprice.update({ ads_id: Banner }, { ads_business_post_id: lastinertid}).exec();
         estimateadsprice.update({ ads_id: Rich_Media }, { ads_business_post_id: lastinertid}).exec();
      }
       else if(Banner && isEmpty(Rich_Media) && isEmpty(Bumper_Ads) && Full_screen_Ads)
      {
         estimateadsprice.update({ ads_id: Banner }, { ads_business_post_id: lastinertid}).exec();
         estimateadsprice.update({ ads_id: Full_screen_Ads }, { ads_business_post_id: lastinertid}).exec();
      }
      
      reviewQuestions.update({ userid: userid }, { ads_business_post_id: lastinertid}).exec();

      
      const Adsbusinesspostfinalprice = new adsbusinesspostfinalprice({
    _id: new mongoose.Types.ObjectId(),
    userid: req.body.userid,
	ads_post_final_price: req.body.grandtotal_price,
	ads_business_post_id: lastinertid
	
  });
  Adsbusinesspostfinalprice
    .save();
     
	  reslt = {
            "business_post_id": result._id,
			"userid": result.iv_acountid,
			"bus_prof_id": result.bus_prof_id,
			"business_post_desc": result.business_post_desc,
			"business_post_price": result.business_post_price,
			"business_post_logo": constants.APIBASEURL+result.business_post_logo,
      "no_of_items": result.no_of_items,
			"business_catetgory_type": result.business_catetgory_type,
			"business_post_startdate": result.business_post_startdate,
			"business_post_enddate": result.business_post_enddate
	
          };
      res.status(200).json({
		 
		status: "Ok",
        message: "Successfully Created Business Post/Offer",
        createdBusinessPostInfo: reslt
      });
    })
    .catch(err => {
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
		  else {
			   res.status(200).json({
				  status: 'Failed',
				  message: 'Bad Request. Please provide clientid.'
			  });
		  }
});

/* Business name checker */
router.post("/businessname_checking", (req, res, next) => {    
  
  var keyArray = ["bus_name","iv_token", "clientid"];
  var key = Object.keys(req.body);
  
  if (keyArray.length == key.length && keyArray.every((v) => key.indexOf(v) >= 0)) {

    if(constants.AndriodClientId === req.body.clientid)
    {

    authModel.find({iv_token: req.body.iv_token})       
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

  business.find({bus_name: req.body.bus_name})       
    .exec()
    .then(user => { 
      if (user.length >= 1) {
          return res.status(200).json({
            status:"Failed",
            message:"Business Name already exist"
          });
        } 
        else {
          return res.status(200).json({
            status:"OK",
            message:"Business Name available"
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
});


/* Create Business */
router.post("/create",upload.any(), (req, res, next) => {


var keyArray = ["userid", "bus_prof_id", "iv_token", "clientid", "bus_name", "bus_location", "bus_category","bus_tags"];

var key = Object.keys(req.body);

var bus_menu = "";
var bus_logo = "";

    if(key.indexOf("bus_menu") >= 0){
      
      bus_menu = req.body.bus_menu;
      keyArray.push("bus_menu");
    }

    if(key.indexOf("bus_logo")>=0){
      bus_logo = req.body.bus_logo;
      keyArray.push("bus_logo");
    }
    
                  if(req.files.length === 1 )
                  {
                    if (req.files[0].fieldname === 'bus_menu')
                    {
                      bus_menu = req.files[0]['path'];
                      bus_logo = "";    
                      
                    }
                    else if (req.files[0].fieldname === 'bus_logo')
                    {
                      bus_logo = req.files[0]['path'];
                      bus_menu = "";    
                    }
                    else{
                        res.json({
                          status: 'Failed',
                          message: 'Bad Request. please check the bus_menu or bus_logo parameters.'
                        });
                      }
                  }else
                  {

                 for(var i=0; i<req.files.length; i++)
                 {

                    if (req.files[i].fieldname === 'bus_menu'){

                        if(isEmpty(req.files[i]['path']))
                        {
                           bus_menu = "";    
                        }
                        else
                        {


                        bus_menu = req.files[i]['path'];
                        }

                       
                        
                    }
                    else if (req.files[i].fieldname === 'bus_logo'){

                        if(isEmpty(req.files[i]['path']))
                        {
                           bus_logo = "";    
                        }
                        else
                        {
                          bus_logo = req.files[i]['path'];
                        }

                        

                      
                       
                    }
                    else{
                        res.status(200).json({
                          status: 'Failed',
                          message: 'Bad Request. please check the bus_menu and bus_logo parameters.'
                        });
                    }
                }
              }


if (keyArray.length == key.length && keyArray.every((v) => key.indexOf(v) >= 0)) 
   { 
      if(constants.AndriodClientId === req.body.clientid)
      {

        authModel.find({iv_token: req.body.iv_token})       
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

                     
                

                    	const Business = new business({
                      _id: new mongoose.Types.ObjectId(),
                      iv_acountid: req.body.userid,
                    	bus_prof_id: req.body.bus_prof_id,
                    	bus_name: req.body.bus_name,
                    	bus_logo: bus_logo,
                    	bus_location: req.body.bus_location,
                    	bus_category: req.body.bus_category,
                    	bus_menu: bus_menu,
                    	bus_tags: req.body.bus_tags
                    	
                      });
                      Business
                        .save()
                        .then(result => {

                           
                        
                        if(isEmpty(result.bus_logo))
                        {
                           var bus_logo_path = "";    
                           
                        }
                        else
                        {
                         
                         var bus_logo_path = constants.APIBASEURL+result.bus_logo;
                        }

                        if(isEmpty(result.bus_menu))
                        {
                           var bus_menu_path = "";    
                        }
                        else
                        {
                         var bus_menu_path = constants.APIBASEURL+result.bus_menu;
                        }
                         
                            reslt = {
                          "bus_id": result._id,
                          "userid": result.iv_acountid,
                          "bus_prof_id": result.bus_prof_id,
                          "bus_name": result.bus_name,
                          "bus_logo": bus_logo_path,
                          "bus_location": result.bus_location,
                          "bus_category": result.bus_category,
                          "bus_menu": bus_menu_path,
                          "bus_tags": result.bus_tags,
                          "bus_prof_create": result.bus_prof_create
                      
                              };

                          res.status(200).json({
                    		  
                    		status: "Ok",
                            message: "Successfully Created Business",
                            createdBusinessInfo: reslt
                          });
                        })
                        .catch(err => {
                          if (err.code === 11000){
                              var error = err.errmsg;
                              var spliterror = error.split(":")
                                  if(spliterror[2] === " bus_name_1 dup key"){
                                      res.status(200).json({ 
                                        status: 'Failed',
                                        message: "Business name already exists"
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

                  }).catch(err => {
                        var spliterror=err.message.split(":")
                        res.status(500).json({ 
                          status: 'Failed',
                          message: spliterror[0]
                        });
                  });


       }else
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
 
});

/* List of Businees by Business Profile Id */
// Handle incoming GET requests to /orders

router.get("/list/:busPrfId", (req, res, next) => {

  const id = req.params.busPrfId;
  business.find({'bus_prof_id':id})
    .select("_id bus_prof_id iv_acountid bus_name bus_category bus_menu bus_logo bus_location bus_tags bus_prof_create")
    .exec()
    .then(docs => {
      res.status(200).json({
		    status: "Ok",
        message: "List Of Business Details",
        count: docs.length,
        createdBusinessInfoViewById: docs.map(doc => {
          return {
            bus_id: doc._id,
			iv_acountid: doc.iv_acountid,
			bus_prof_id: doc.bus_prof_id,
			bus_name: doc.bus_name,
			bus_category: doc.bus_category,
			bus_menu: doc.bus_menu,
			bus_log: doc.bus_logo,
			bus_location: doc.bus_location,
			bus_tags: doc.bus_tags,
			bus_create: doc.bus_prof_create
	
          };
        })
      });
    })
    .catch(err => {
      res.status(500).json({
        error: err
      });
    });
	
});

/* Fetch Advertisement for ads */
router.get("/advertisement/:clientid/:iv_token", (req, res, next) => {
  
  if(constants.AndriodClientId === req.params.clientid){
		 
		  authModel.find({iv_token: req.params.iv_token})       
      .exec()
      .then(auth => { 
        if (auth.length < 1) {
              return res.status(200).json({
                status:"Logout",
                message:"You are logged in other device."
              });
        } 
        else {
   var resultArray = {
                      typesOfAds : [],
                      adsPreferencespage : [],
                      countryList : [],
                      statesList : [],
                      citiesList : [],
                      citiesLocationList : [],
                      PrefageList : [],
                      ProfsList : [],
                      GenderList : []
					  
                     };
					 
  
   /* Ads Fetching Info */
   adstype.find()
    .select("_id ads_name")
    .exec()
    .then(docs => {
		docs.map(doc => {
		adsreslt = {
            "typesofads_id": doc._id,
			"ads_name": doc.ads_name
	
          };
		  resultArray.typesOfAds.push(adsreslt);
		  });
		  
	/* Ads Preference Page Fetching Info */	  
		adspreferences.find()
    .select("_id ads_id prefrence_page_name")
    .exec()
    .then(docsp => {
		
		docsp.map(docp => {
		adsPReslt = {
            "ads_prefrence_id": docp._id,
			"ads_id": docp.ads_id,
			"prefrence_page_name": docp.prefrence_page_name
	
          };
		  resultArray.adsPreferencespage.push(adsPReslt);
		  });
		  
	/* Ads Countrty Fetching Info */	 
		  
		countrylist.find()
    .select("_id country_name")
    .exec()
    .then(docsCtry => {
		
		docsCtry.map(docCtry => {
		adsCtryReslt = {
            "country_id": docCtry._id,
			"country_name": docCtry.country_name
	
          };
		  resultArray.countryList.push(adsCtryReslt);
		  });
		  
		/* Ads States Fetching Info */
		
					stateslist.find()
				.select("_id c_id st_name")
				.exec()
				.then(docsSt => {  

                        docsSt.map(docSt => {
		                adsStsReslt = {
							"state_id": docSt._id,
							"country_id": docSt.c_id,
							"st_name": docSt.st_name
					
						  };
						  resultArray.statesList.push(adsStsReslt);
						  });	
		/* Ads Citites Fetching Info */
		 
         businessCitiesList.find()
				.select("_id c_id st_id city_name")
				.exec()
				.then(docscit => {	
				
				docscit.map(docCit => {
		                adsCitReslt = {
							"city_id": docCit._id,
							"country_id": docCit.c_id,
							"state_id": docCit.st_id,
							"city_name": docCit.city_name
					
						  };
						  resultArray.citiesList.push(adsCitReslt);
						  });
						  
		/* Ads Areas(Locality) Fetching Info */
		
		bAreaLocalityList.find()
				.select("_id c_id st_id city_id arealocality_name")
				.exec()
				.then(docsloct => {
					
					docsloct.map(docloct => {
		                adsLocReslt = {
							"locatin_id": docloct._id,
							"country_id": docloct.c_id,
							"state_id": docloct.st_id,
							"city_id": docloct.city_id,
							"arealocality_name": docloct.arealocality_name
					
						  };
						  resultArray.citiesLocationList.push(adsLocReslt);
						  });
						  
		/* Ads Ages Fetching Info */
		
		agelist.find()
				.select("_id age")
				.exec()
				.then(docsaAge => {				
                           docsaAge.map(docAge => {
		                adsAgeReslt = {
							"age_id": docAge._id,
							"age": docAge.age
					
						  };
						  resultArray.PrefageList.push(adsAgeReslt);
						  });		

        /* Ads Profession Fetching Info */
         	
          professionlist.find()
				.select("_id profession_name")
				.exec()
				.then(docsProfs => {	

                       docsProfs.map(docsPrf => {
		                adsProfReslt = {
							"profession_id": docsPrf._id,
							"profession_name": docsPrf.profession_name
					
						  };
						  resultArray.ProfsList.push(adsProfReslt);
						  });		

        /* Ads Gender Fetching Info */
           	
           businessGenderList.find()
				.select("_id gender_name")
				.exec()
				.then(docsGender => {

                            docsGender.map(docGend => {
		                adsGenderReslt = {
							"gender_id": docGend._id,
							"gender_name": docGend.gender_name
					
						  };
						  resultArray.GenderList.push(adsGenderReslt);
						  }); 					
                             				//ads = docs;
												res.json({
												advertisementInfo: resultArray
											  });
				        });
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
/* Fetch Advertisement for ads */

/* Update Business */

/* Update Business */

router.post("/update",upload.any(), (req, res, next) => {    
  
  var keyArray = ["bus_id","iv_token", "clientid", "bus_category", "bus_tags","bus_name",'bus_location'];
  var key = Object.keys(req.body);
  var buslogo = "";
  var busmenu = "";

        if(req.files.length === 2)
        {
              for(var i=0; i<req.files.length; i++)
              {
                if (req.files[i].fieldname === 'bus_logo'){
                    
                    if(key.indexOf("bus_logo")>=0)
                    {
                     buslogo = req.body.bus_logo;
                     keyArray.push("bus_logo");
                    }

                    buslogo = req.files[i]['path'];
                    if(buslogo.includes(constants.APIBASEURL))
                    {
                        var splitlogo = buslogo.split(constants.APIBASEURL);
                        buslogo = splitlogo[1];
                    } 
                }
                else if (req.files[i].fieldname === 'bus_menu')
                {

                      if(key.indexOf("bus_menu")>=0)
                      {
                         busmenu = req.body.bus_menu;
                         keyArray.push("bus_menu");
                        }
                    busmenu = req.files[i]['path'];
                    if(busmenu.includes(constants.APIBASEURL))
                    {
                        var splitmenu = busmenu.split(constants.APIBASEURL);
                        busmenu = splitmenu[1];
                    }
                }
                
              }
            }
            else if(req.files.length === 1)
            {

                if (req.files[0].fieldname === 'bus_logo')
                {
                    
                    if(key.indexOf("bus_logo")>=0)
                    {

                     buslogo = req.body.bus_logo;
                     keyArray.push("bus_logo");
                    }

                    buslogo = req.files[0]['path'];

                    if(buslogo.includes(constants.APIBASEURL))
                    {
                        var splitlogo = buslogo.split(constants.APIBASEURL);
                        buslogo = splitlogo[1];
                    } 
                }
                else
                {
                  buslogo = "";
                } 


              if (req.files[0].fieldname === 'bus_menu'){

                      if(key.indexOf("bus_menu")>=0){
                         busmenu = req.body.bus_menu;
                         keyArray.push("bus_menu");
                        }
                    busmenu = req.files[0]['path'];
                    if(busmenu.includes(constants.APIBASEURL)){
                        var splitmenu = busmenu.split(constants.APIBASEURL);
                        busmenu = splitmenu[1];
                    }
                }
                else
                {
                  busmenu = ""; 
                }
                
              }
    
console.log(keyArray);
console.log(key);
  if (keyArray.length == key.length && keyArray.every((v) => key.indexOf(v) >= 0)) {

    if(constants.AndriodClientId === req.body.clientid){

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

              

              business.find({_id: req.body.bus_id})       
                .exec()
                .then(user => { 
                  if (user.length < 1) {
                      return res.status(200).json({
                        status:"Failed",
                        message:"Business does not exist"
                      });
                    } 
                  else {

                    if(user[0].bus_logo != buslogo || user[0].bus_menu != busmenu || user[0].bus_category != req.body.bus_category
                         || user[0].bus_name != req.body.bus_name || user[0].bus_tags != req.body.bus_tags){
                     //({ userid: userid }, { ads_business_post_id: lastinertid}
                  if(isEmpty(buslogo) && isEmpty(busmenu))
                   {
                    
            business.update({ _id: req.body.bus_id },
                          {$set:{
                              bus_category:req.body.bus_category,
                              bus_name:req.body.bus_name,
                              bus_tags:req.body.bus_tags}})
                .exec()
                .then(userCheck => {
                return res.status(200).json({
                  status:"OK",
                  message:"business updated successfully"
                })
                }).catch(err => {
                 var spliterror=err.message.split(":")
                  res.status(500).json({ 
                   status: 'Failed',
                   message: spliterror[0]+ spliterror[1]
                  });
                });

                   }
                   else if(buslogo && isEmpty(busmenu))
                   { 
                      business.update({ _id: req.body.bus_id },
                                                {$set:{bus_logo:buslogo,
                                                        bus_category:req.body.bus_category,
                                                        bus_name:req.body.bus_name,
                                                        bus_tags:req.body.bus_tags}})
                          .exec()
                          .then(userCheck => {
                            return res.status(200).json({
                                status:"OK",
                                message:"business updated successfully"
                            })
                          }).catch(err => {
                             var spliterror=err.message.split(":")
                              res.status(500).json({ 
                                 status: 'Failed',
                                 message: spliterror[0]+ spliterror[1]
                              });
                          });

                   }
                    else
                  if(isEmpty(buslogo) && busmenu)
                   { 
                      business.update({ _id: req.body.bus_id },
                                                {$set:{bus_menu:busmenu,
                                                        bus_category:req.body.bus_category,
                                                        bus_name:req.body.bus_name,
                                                        bus_tags:req.body.bus_tags}})
                          .exec()
                          .then(userCheck => {
                            return res.status(200).json({
                                status:"OK",
                                message:"business updated successfully"
                            })
                          }).catch(err => {
                             var spliterror=err.message.split(":")
                              res.status(500).json({ 
                                 status: 'Failed',
                                 message: spliterror[0]+ spliterror[1]
                              });
                          });

                   }
                   else
                      {
                      business.update({ _id: req.body.bus_id },
                                                {$set:{bus_logo:buslogo, 
                                                        bus_menu:busmenu,
                                                        bus_category:req.body.bus_category,
                                                        bus_name:req.body.bus_name,
                                                        bus_tags:req.body.bus_tags}})
                          .exec()
                          .then(userCheck => {
                            return res.status(200).json({
                                status:"OK",
                                message:"business updated successfully"
                            })
                          }).catch(err => {
                             var spliterror=err.message.split(":")
                              res.status(500).json({ 
                                 status: 'Failed',
                                 message: spliterror[0]+ spliterror[1]
                              });
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
                          message: "Business does not exist, Please provide correct business id"
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


/* Delete for Business */

router.delete("/delete", (req, res, next) => {    
  
  var keyArray = [ "iv_token", "clientid", "bus_id"];
  var key = Object.keys(req.body);

  if (keyArray.length == key.length && keyArray.every((v) => key.indexOf(v) >= 0)) {

    if(constants.AndriodClientId === req.body.clientid){

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

              business.findByIdAndRemove({_id: req.body.bus_id})       
                .exec()
                .then(user => { 
                    return res.status(200).json({
                      status:"OK",
                      message:"Removed business successfully"
                    });

                }).catch(err => {
                      var spliterror=err.message.split("_")
                      if(spliterror[1].indexOf("id")>=0){
                        res.status(200).json({ 
                          status: 'Failed',
                          message: "Please provide correct business id"
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

router.get("/view/:clientid/:iv_token/:businessid", (req, res, next) => {
   
  if(constants.AndriodClientId === req.params.clientid){
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
  var resultArray = {
                      BusinessProfileDetails : [],
                      BusinessList : []
            
                     };
  const businessid = req.params.businessid;
  //
  //business.find({ _id: businessid})
  business.find({'_id':businessid})
    .select("_id bus_prof_id iv_acountid bus_name bus_category bus_menu bus_logo bus_location bus_tags bus_prof_create")
    .exec()
    .then(docs => {
		
	if(isEmpty(docs[0].bus_menu))
	 {
		 var bus_menupath = "";
	 }
	 else{
		 var bus_menupath = constants.APIBASEURL+docs[0].bus_menu;
	 }
		
	if(isEmpty(docs[0].bus_logo))
	 {
		 var bus_logopath = "";
	 }
	 else{
		 var bus_logopath = constants.APIBASEURL+docs[0].bus_logo;
	 }
	 BusinessListByid = {
      bus_id: docs[0]._id,
      userid: docs[0].iv_acountid,
      bus_prof_id: docs[0].bus_prof_id,
      bus_name: docs[0].bus_name,
      bus_logo: bus_logopath,
      bus_location: docs[0].bus_location,
      bus_category: docs[0].bus_category,
      bus_menu: bus_menupath,
      bus_tags: docs[0].bus_tags,
      bus_prof_create: docs[0].bus_prof_create
  
          };
		
      res.status(200).json({
		    status: "Ok",
        message: "Get the business info by businessid",
        BusinessInfoById: BusinessListByid
	
          });
        }).catch(err => {
                      var spliterror=err.message.split("_")
                      if(spliterror[1].indexOf("id")>=0){
                        res.status(200).json({ 
                          status: 'Failed',
                          message: "Please provide correct business id"
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
                  message: "Please provide correct business id"
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

});

router.post("/listOffers", (req, res, next) => {

  var keyArray = ["userid", "iv_token", "clientid"];
  var key = Object.keys(req.body);

  if (keyArray.length == key.length && keyArray.every((v) => key.indexOf(v) >= 0)) {

    if(constants.AndriodClientId === req.body.clientid){

      authModel.find({$and:[{iv_token: req.body.iv_token}, {userid : req.body.userid}]})       
        .exec()
        .then(user => { 
          if (user.length < 1) {
              return res.status(200).json({
                status:"Logout",
                message:"You are logged in other device."
              });
            } 
          else {

            bsOffers.find({iv_acountid: req.body.userid})
    .select("_id iv_acountid bus_prof_id business_post_desc business_post_price business_post_logo business_catetgory_type no_of_items business_post_startdate business_post_enddate")
    .exec()
    .then(docs => {
      res.status(200).json({
        status: "Ok",
        message: "List of Business Offers.",
        count: docs.length,
        DisplayOffersListByUserid: docs.map(doc => {
          return {
            "business_post_id": doc._id,
            "userid": doc.iv_acountid,
            "bus_prof_id": doc.bus_prof_id,
            "business_post_desc": doc.business_post_desc,
            "business_post_price": doc.business_post_price,
            "business_post_logo": constants.APIBASEURL+doc.business_post_logo,
            "business_catetgory_type": doc.business_catetgory_type,
            "no_of_items": doc.no_of_items,
            "business_post_startdate": doc.business_post_startdate,
            "business_post_enddate": doc.business_post_enddate
  
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



router.get("/businesslists/:busPrfId", (req, res, next) => {
  console.log(req);
  console.log('hi');
  const id = req.params.busPrfId;
  console.log(req.params.busPrfId);
 bsOffers.find({iv_acountid: req.params.busPrfId})
    .select("_id iv_acountid bus_prof_id business_post_desc business_post_price business_post_logo business_catetgory_type no_of_items business_post_startdate business_post_enddate")
    .exec()
    .then(docs => {
      res.status(200).json({
        status: "Ok",
        message: "List Of Business Details",
        count: docs.length,
        createdBusinessInfoViewById: docs
      });
    })
    .catch(err => {
      res.status(500).json({
        error: err
      });
    });
  
});

module.exports = router;