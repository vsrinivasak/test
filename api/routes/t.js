iv_feeds.find({$and: [{feed_type: "video"}, {old_feed_id: []}, {has_sensitive_content: false}, {feed_expiry_status: 0}]})
                .sort({no_views: -1})
                .exec()
                .then(dex => {

                                if (dex.length > 0)
                                 {
                                           var tags = []

                                           dex.map(dog => {
                                           var tags_db = dog.feeds_hash_tags
                                           tags_db.forEach(function (efe) {
                                           var found = tags.find(o => String(o) === String(efe))

                                           if (typeof found === 'undefined') {
                                           tags.push(efe)
                                           }
                                           })
                                           })
                                                 feedtags.find({feedTag_name: {$in: tags}}).sort({feedTag_used_today: -1}).limit(9)
                                                 .select('feedTag_name feedTag_used -_id')
                                                 .exec()
                                                 .then(result => {
                                                   console.log(result);
                                                               var trcount = result.length;
                                                               let dkTr = 0;
                                                               var djTr = 0;
                                                               var hemaTr = 0;
                                                               var TrFeedsCount = 0;
                                                               var TrFeedsTagsCount;
                                                               var TrFTagsCunt = 0;
                                                               if(trcount > 9)
                                                               {
                                                                  //console.log('test1');
                                                                 TrFeedsTagsCount = 9;
                                                               }
                                                               else
                                                               {
                                                                 //  console.log('test2');
                                                                 TrFeedsTagsCount = trcount;
                                                               }

                                                              async.each(result, function(resultDoc, outCb)
                                                              {

                                                                  var TrackingTag = resultDoc.feedTag_name;
                                                                  var TrFeedT = resultDoc.feedTag_name;
                                                                  console.log(resultDoc.feedTag_name);
                                                                  console.log(TrFeedT);
                                                                  dkTr++;

                                                                      contactsModel.aggregate([{$match: {userid: ObjectId(req.body.userid)}},
                                                                      {$project: {blocked: "$blocked"}}
                                                                      ], function (err, data) {

                                                                                    iv_feeds.find({$and: [{iv_acountid: {$nin: data[0].blocked}}, {feeds_hash_tags: {$in: TrackingTag}}, {feed_type: "video"}, {old_feed_id: []}, {has_sensitive_content: false}, {feed_expiry_status: 0}]})
                                                                                    .populate('profile_url', 'profileimage username -_id')
                                                                                    .populate('old_feed_id iv_acountid profile_url')
                                                                                    .populate({
                                                                                    path: 'old_feed_id',
                                                                                    populate: {path: 'iv_acountid '}
                                                                                    })
                                                                                      .populate({
                                                                                      path: 'old_feed_id.iv_acountid',
                                                                                      populate: {path: 'username'}
                                                                                      })
                                                                                      .sort({no_rating: -1})
                                                                                      .exec()
                                                                                      .then(docs => {
                                                                                          //  console.log('docs0');
                                                                                            //console.log(docs);

                                                                                             var length = docs.length;

                                                                                             /*
                                                                                                   googleMapsClient.geocode({
                                                                                                   address: lat_lang
                                                                                                   }, function(err, response) {

                                                                                                   if (!err) {

                                                                                                   var GeoResults = response.json.results;



                                                                                                   var countryName = [];
                                                                                                   var stateName = [];
                                                                                                   var cityName = [];
                                                                                                   GeoResults[0].address_components.forEach(function(country_name){




                                                                                                   if(country_name.types[0] == "country")
                                                                                                   {
                                                                                                   countryName.push(country_name.long_name);
                                                                                                   }

                                                                                                   if(country_name.types[0] == "administrative_area_level_1")
                                                                                                   {
                                                                                                   stateName.push(country_name.long_name);
                                                                                                   }

                                                                                                   if(country_name.types[0] == "locality")
                                                                                                   {
                                                                                                   cityName.push(country_name.long_name);
                                                                                                   }


                                                                                                   })



                                                                                                   var locality = [];
                                                                                                   GeoResults[1].address_components.forEach(function(locality_name){




                                                                                                   if(locality_name.types[0] == "political")
                                                                                                   {
                                                                                                   locality.push(locality_name.long_name);
                                                                                                   }
                                                                                                   })
                                                                                                   }
                                                                                                   */
                                                                                                   /* Country List Schema */
                                                                                                   /*
                                                                                                   countrylist.find({  country_name: {
                                                                                                   $in: countryName
                                                                                                   }})
                                                                                                   .select("_id")
                                                                                                   .exec()
                                                                                                   .then(country_docs => {
                                                                                                   var country_docs_id = [];
                                                                                                   if(isEmpty(country_docs))
                                                                                                   {
                                                                                                   country_docs_id.push("5c5971c64cf4d4296a07207d");
                                                                                                   }
                                                                                                   else
                                                                                                   {

                                                                                                   country_docs.forEach(function(countrydoc_ids)
                                                                                                   {

                                                                                                   country_docs_id.push(countrydoc_ids._id);

                                                                                                   });

                                                                                                   }


                                                                                                   */
                                                                                                   /* State List Schema */
                                                                                                   /*
                                                                                                   stateslist.find({  st_name: {
                                                                                                   $in: stateName
                                                                                                   }})
                                                                                                   .select("_id")
                                                                                                   .exec()
                                                                                                   .then(state_docs => {

                                                                                                   var state_docs_id = [];
                                                                                                   if(isEmpty(state_docs))
                                                                                                   {
                                                                                                   state_docs_id.push("5c5971c64cf4d4296a07207d");
                                                                                                   }
                                                                                                   else
                                                                                                   {

                                                                                                   state_docs.forEach(function(statedoc_ids)
                                                                                                   {

                                                                                                   state_docs_id.push(statedoc_ids._id);

                                                                                                   });

                                                                                                   }
                                                                                                   */
                                                                                                   /* City List Schema */
                                                                                                   /*
                                                                                                   citieslist.find({  city_name: {
                                                                                                   $in: cityName
                                                                                                   }})
                                                                                                   .select("_id")
                                                                                                   .exec()
                                                                                                   .then(city_docs => {

                                                                                                   var city_docs_id = [];
                                                                                                   if(isEmpty(city_docs))
                                                                                                   {
                                                                                                   city_docs_id.push("5c5971c64cf4d4296a07207d");
                                                                                                   }
                                                                                                   else
                                                                                                   {

                                                                                                   city_docs.forEach(function(citydoc_ids)
                                                                                                   {

                                                                                                   city_docs_id.push(citydoc_ids._id);

                                                                                                   });

                                                                                                   }
                                                                                                   */
                                                                                                   /* Locality List Schema */
                                                                                                   /*
                                                                                                   AreaLocalityIds = [];
                                                                                                   arealocalitylist.find({  arealocality_name: {
                                                                                                   $in: locality
                                                                                                   }})
                                                                                                   .select("_id")
                                                                                                   .exec()
                                                                                                   .then(localitydocs => {

                                                                                                   var localityids = [];
                                                                                                   if(isEmpty(localitydocs))
                                                                                                   {
                                                                                                   localityids.push("5c5971c64cf4d4296a07207d");
                                                                                                   }
                                                                                                   else
                                                                                                   {

                                                                                                   localitydocs.forEach(function(locality_ids)
                                                                                                   {

                                                                                                   localityids.push(locality_ids._id);

                                                                                                   });

                                                                                                   }
                                                                                                   */


                                                      											 /* Rich Media Logic
                                                      											 ,
                                                      											 {
                                                      											 ads_countrylist_id: {
                                                      											 $in: country_docs_id
                                                      											 }}
                                                      											 , {
                                                      											 ads_stateslist_id: {
                                                      											 $in: state_docs_id
                                                      											 }}
                                                      											 , {
                                                      											 ads_citieslist_id: {
                                                      											 $in: city_docs_id
                                                      											 }}
                                                      											 , {
                                                      											 ads_citieslocationlist_id: {
                                                      											 $in: localityids
                                                      											 }}
                                                      											 */



                                                                          /* Feeds data and ads data merging */
                                                                          if(length >0)
                                                                          {

                                                                          TrFTagsCunt++;
                                                                          console.log('TrFeedsCount='+TrFeedsCount);
                                                                                  if(TrFeedsCount === 5)
                                                                                  {
                                                                                          var emtyCheck = richAds[0];

                                                                                          var Radsfiles = [];
                                                                                          if (!isEmpty(emtyCheck)) {

                                                                                          if (!isEmpty(richAds[0].ads_file_path)) {
                                                                                           var string = richAds[0].ads_file_path;
                                                                                           var array = string.split(",");
                                                                                           var files = [];
                                                                                          var adsfiles = constants.APIBASEBIZURL + richAds[0].ads_file_path;
                                                                                           for (j = 0; j < array.length; j++) {
                                                                                             var filePath = constants.APIBASEBIZURL + array[j];
                                                                                             Radsfiles.push(filePath)
                                                                                           }


                                                                                          }

                                                                                    var ricMediaAds = [];
                                                                                    var richAd = {
                                                                                        "ad_type": "Rich Media",
                                                                                        "ad_files": Radsfiles,
                                                                                        "offer_id": richAds[0].ads_business_post_id,
                                                                                        "ads_price_id": richAds[0]._id
                                                                                    }
                                                                                    ricMediaAds.push(richAd);

                                                                                    videoTagDetails = {
                                                                                        item_tag_type: 'Rich Media',
                                                                                        tag_name: '',
                                                                                        rich_media_ad: richAd,
                                                                                        videos: rich_video_array
                                                                                    }

                                                                                    video_tag_details.push(videoTagDetails);
                                                                                  }
                                                                                }
                                                                                console.log("mactch feeds using " + TrFeedT)
                                                                                for (i = 0; i < length; i++)
                                                                                {


                                                                                            var has_Sensitive_verifiedUID = docs[i].hasverified_count;
                                                                                            var has_seen_already;
                                                                                          //	console.log("has_sensitive_content", has_Sensitive_verifiedUID);
                                                                                            if (docs[i].has_verified_content === true) {
                                                                                              var found = has_Sensitive_verifiedUID.find(function (element) {
                                                                                                return element == req.body.userid;
                                                                                              });

                                                                                              // console.log("found", found);
                                                                                              if (found != undefined) {
                                                                                            //		console.log("*********", found)
                                                                                                has_seen_already = true;
                                                                                              }
                                                                                            } else {
                                                                                              has_seen_already = false;
                                                                                            }


                                                                                            var preview_url
                                                                                            if (isEmpty(docs[i].preview_url)) {
                                                                                              preview_url = constants.APIBASEURL + 'thumbnail/480x320.png';
                                                                                            } else {
                                                                                              preview_url = constants.APIBASEURL + docs[i].preview_url;
                                                                                              //preview_url = constants.APIBASEURL+'thumbnail/480x320.png';
                                                                                            }
                                                                                            var Feed_challenge_number;
                                                                                            if (isEmpty(docs[i].challenge_number)) {
                                                                                              Feed_challenge_number = 0;
                                                                                            } else {
                                                                                              Feed_challenge_number = docs[i].challenge_number;
                                                                                            }


                                                                                            var feedstagsArr = docs[i].feeds_hash_tags;


                                                                                            var tags_arr_info = [];
                                                                                            feedstagsArr.forEach(function (ftags) {


                                                                                              var HashTags = '#' + ftags;

                                                                                              tags_arr_info.push(HashTags);


                                                                                            });

                                                                                            if (docs[i].feed_type === 'video') {
                                                                                              if (!isEmpty(docs[i].feed_file_path) && docs[i].feed_file_path != null) {


                                                                                                var video_streaming_url = constants.APIBASEURL + docs[i].feed_file_path;
                                                                                              } else {
                                                                                                var video_streaming_url = "";
                                                                                              }


                                                                                            } else {
                                                                                              if (!isEmpty(docs[i].feed_file_path) && docs[i].feed_file_path != null) {
                                                                                                var string = docs[i].feed_file_path;
                                                                                                var array = string.split(",");

                                                                                                var files = [];
                                                                                                if (array.indexOf(',') != -1) {
                                                                                                  for (i = 0; i < array.length; i++) {
                                                                                                    var filePath = constants.APIBASEURL + array[i];
                                                                                                    files.push(filePath)
                                                                                                  }
                                                                                                } else {
                                                                                                  files.push(constants.APIBASEURL + docs[i].feed_file_path)
                                                                                                }

                                                                                                var video_streaming_url = files;
                                                                                              } else {
                                                                                                var video_streaming_url = [];
                                                                                              }
                                                                                            }
                                                                                            var video_dur = docs[i].video_duration
                                                                                            var video_duration = ""
                                                                                            var video = video_dur * 1000

                                                                                            var minutes = Math.floor(video / 60000);
                                                                                            var seconds = ((video % 60000) / 1000).toFixed(0);
                                                                                            var video_duration = minutes + ":" + seconds

                                                                                            if (minutes.length === 1 && seconds.length === 1) {
                                                                                              video_duration = "0" + minutes + ":" + "0" + seconds

                                                                                            } else if (minutes.length === 1) {
                                                                                              video_duration = "0" + minutes + ":" + seconds
                                                                                              if (seconds.length === 1) {
                                                                                                video_duration = "0" + minutes + ":" + "0" + seconds
                                                                                              }
                                                                                            } else {
                                                                                              if (seconds.length === 1) {
                                                                                                video_duration = minutes + ":" + "0" + seconds
                                                                                              }
                                                                                              if (minutes.length === 1) {
                                                                                                video_duration = "0" + minutes + ":" + "0" + seconds
                                                                                              }
                                                                                            }
                                                                                            var repostDetails;
                                                                                            if (!isEmpty(docs[i].old_feed_id) && docs[i].old_feed_id != null) {

                                                                                              if (!isEmpty(docs[i].old_feed_id[0].iv_acountid.profileimage) && docs[i].old_feed_id[0].iv_acountid.profileimage != null) {

                                                                                                var profileimage = constants.APIBASEURL + docs[i].old_feed_id[0].iv_acountid.profileimage;
                                                                                              } else {

                                                                                                var profileimage = constants.APIBASEURL + 'uploads/userimage.png';
                                                                                              }

                                                                                              repostDetails = {
                                                                                                "original_userid": docs[i].old_feed_id[0].iv_acountid._id,
                                                                                                "original_feed_id": docs[i].old_feed_id[0]._id,
                                                                                                "original_user_img_url": profileimage,
                                                                                                "original_username": docs[i].old_feed_id[0].iv_acountid.username,
                                                                                                "original_no_views": docs[i].old_feed_id[0].no_views
                                                                                              }
                                                                                            } else {


                                                                                              repostDetails = {

                                                                                                "original_userid": "",
                                                                                                "original_feed_id": "",
                                                                                                "original_user_img_url": "",
                                                                                                "original_username": "",
                                                                                                "original_no_views": 0

                                                                                              }
                                                                                            }


                                                                                            if (!isEmpty(docs[i].old_feed_id) && docs[i].old_feed_id != null) {

                                                                                              if (!isEmpty(docs[i].profile_url.profileimage) && docs[i].profile_url.profileimage != null) {

                                                                                                var Feed_User_profileimage = constants.APIBASEURL + docs[i].profile_url.profileimage;
                                                                                              } else {

                                                                                                var Feed_User_profileimage = constants.APIBASEURL + "uploads/userimage.png";
                                                                                              }

                                                                                            } else {

                                                                                              if (!isEmpty(docs[i].iv_acountid.profileimage) && docs[i].iv_acountid.profileimage != null) {

                                                                                                var Feed_User_profileimage = constants.APIBASEURL + docs[i].iv_acountid.profileimage;
                                                                                              } else {

                                                                                                var Feed_User_profileimage = constants.APIBASEURL + "uploads/userimage.png";
                                                                                              }
                                                                                            }

                                                                                            if (!isEmpty(docs[i].old_feed_id) && docs[i].old_feed_id != null) {
                                                                                              if (String(docs[i].profile_url._id) === String(req.body.userid)) {

                                                                                                var is_self_feed = true;

                                                                                              } else {

                                                                                                var is_self_feed = false;

                                                                                              }
                                                                                            } else {
                                                                                              if (String(docs[i].iv_acountid._id) === String(req.body.userid)) {

                                                                                                var is_self_feed = true;

                                                                                              } else {

                                                                                                var is_self_feed = false;

                                                                                              }
                                                                                            }


                                                                                            var can_show_ad;
                                                                                            can_show_ad = false;
                                                                                            if (docs[i].privacy_mode === 1 && is_self_feed === false && parseInt(docs[i].video_duration) >= 30) {

                                                                                              can_show_ad = true;

                                                                                              if (docs[i].is_under_challenge === true) {
                                                                                                can_show_ad = true;
                                                                                              }


                                                                                            }

                                                                                            if (String(docs[i].iv_acountid._id) != String(req.body.userid) && docs[i].privacy_mode == 1 && docs[i].no_rating >= 0 && docs[i].no_views >= 0 && parseInt(docs[i].video_duration) >= 30) {

                                                                                              is_challengeable = true;

                                                                                            } else {

                                                                                              is_challengeable = false;

                                                                                            }
                                                                                            var is_time_extendable;
                                                                                            if (docs[i].extend_time_status == 0) {
                                                                                              is_time_extendable = true;

                                                                                            } else {
                                                                                              is_time_extendable = false;

                                                                                            }
                                                                                            var comments_privacy;
                                                                                            var allow_comments;
                                                                                            if (docs[i].comments_privacy === 0) {
                                                                                              comments_privacy = docs[i].comments_privacy;
                                                                                              allow_comments = false;
                                                                                            } else {
                                                                                              comments_privacy = docs[i].comments_privacy;
                                                                                              allow_comments = true;
                                                                                            }

                                                                                            var feedLike = docs[i].likes;
                                                                                            var is_liked;
                                                                                            if (typeof feedLike === 'undefined') {

                                                                                              is_liked = false;
                                                                                            } else {
                                                                                              if (isEmpty(feedLike)) {
                                                                                                is_liked = false;
                                                                                              } else {
                                                                                                feedLike.every(function (newlike) {


                                                                                                  if (String(newlike) === String(req.body.userid)) {

                                                                                                    is_liked = true;
                                                                                                    return false;
                                                                                                  } else {
                                                                                                    is_liked = false;
                                                                                                    return true;
                                                                                                  }
                                                                                                })
                                                                                              }

                                                                                            }


                                                                                            if (docs[i].privacy_mode === 1) {


                                                                                              var date = new Date()
                                                                                              var date1 = date.setTime(date.getTime());


                                                                                              var dateNow = new Date(date1).toISOString();


                                                                                              var dateB = moment(dateNow);
                                                                                              var dateC = moment(docs[i].feeds_expiry_time_);

                                                                                              var t = Date.parse(docs[i].feeds_expiry_time_) - Date.parse(dateNow);
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


                                                                                              var calculatetime = hours + ':' + minutes + ':' + days;


                                                                                              var start_date = moment(docs[i].feed_post_create);

                                                                                              var startLTS = start_date.format('LTS');
                                                                                              var dates = new Date();

                                                                                              var date = new Date()
                                                                                              var date1 = date.setTime(date.getTime());


                                                                                              var NowDate = new Date(date1).toISOString();

                                                                                              var end_date = moment(docs[i].feeds_expiry_time_);
                                                                                              var diff = end_date - NowDate;
                                                                                              var endLTS = end_date.format('LTS');
                                                                                              var duration = Date.parse(docs[i].feeds_expiry_time_);

                                                                                              var diff = diff;

                                                                                              var coutnlikes = docs[i].no_likes;
                                                                                              var FinalLikes;
                                                                                              if (coutnlikes < 1) {
                                                                                                FinalLikes = 0;

                                                                                              } else {
                                                                                                FinalLikes = docs[i].no_likes;
                                                                                              }


                                                                                              if (ads.length > m) {
                                                                                                m = m;
                                                                                              } else {
                                                                                                m = 0;
                                                                                              }
                                                                                               //console.log('JValue='+j);
                                                                                              var ALength = math.subtract(docs.length, 1);
                                                                                              if (j === 4 && ads.length == 0 && ALength != i) {

                                                                                                var adsLength = ads.length;


                                                                                                for (k = 0; k < 1; k++) {


                                                                                                  var bannerArray = [];
                                                                                                  var banner = constants.APIBASEBIZURL + 'uplad_business_ads/ai1.jpg';
                                                                                                  bannerArray.push(banner);
                                                                                                  var banner1 = constants.APIBASEBIZURL + 'uplad_business_ads/ai2.jpg';
                                                                                                  bannerArray.push(banner1);
                                                                                                  var adsfiles = {

                                                                                                    "ad_type": "Rich Media",
                                                                                                    "ad_files": bannerArray,
                                                                                                    "offer_id": "",
                                                                                                    "ads_price_id": ""
                                                                                                  }

                                                                                                 /*
                                                                                                  feedinfo = {

                                                                                                    "feed_id": "",
                                                                                                    "feed_desc": "",
                                                                                                    "feeds_tags": [],
                                                                                                    "feed_type": 'ads',
                                                                                                    "is_time_extendable": false,
                                                                                                    "privacy_mode": 0,
                                                                                                    "userid": "",
                                                                                                    "expiry_time": "",
                                                                                                    "rating": 0,
                                                                                                    "no_shares": 0,
                                                                                                    "no_likes": 0,
                                                                                                    "no_comments": 0,
                                                                                                    "no_views": 0,
                                                                                                    "video_duration": "",
                                                                                                    "no_activities": 0,
                                                                                                    "profile_url": "",
                                                                                                    "allow_comments": false,
                                                                                                    "is_liked": false,
                                                                                                    "can_show_ad": false,
                                                                                                    "preview_url": "",
                                                                                                    "has_sensitive_content": false,
                                                                                                    "has_seen_already": false,
                                                                                                    "is_under_challenge": false,
                                                                                                    "is_challengeable": false,
                                                                                                    "challenge_details": {
                                                                                                      "challenge_number": 0,
                                                                                                      "challenged_by": "",
                                                                                                      "challenged_feed_id": ""
                                                                                                    },
                                                                                                    "is_self_feed": false,
                                                                                                    "ad_details": adsfiles,
                                                                                                    "comment_privacy": 0,
                                                                                                    "repost_details": {
                                                                                                      "original_userid": "",
                                                                                                      "original_feed_id": "",
                                                                                                      "original_user_img_url": "",
                                                                                                      "original_username": "",
                                                                                                      "original_no_views": 0

                                                                                                    }

                                                                                                  }
                                                                                                  feed_info.push(feedinfo) */

                                                                                                  // m++;
                                                                                                  ads_inc++;
                                                                                                }


                                                                                                if (docs[i].feed_type === 'video') {

                                                                                                  video_Object = {

                                                                                                    "feed_id": docs[i]._id,
                                                                                                    "feed_desc": docs[i].feed_desc,
                                                                                                    "feeds_tags": tags_arr_info,
                                                                                                    "feed_type": docs[i].feed_type,
                                                                                                    "userid": docs[i].profile_url._id,
                                                                                                    "expiry_time": duration,
                                                                                                    "rating": parseFloat(docs[i].feed_rating),
                                                                                                    "no_shares": docs[i].no_repost,
                                                                                                    "no_likes": FinalLikes,
                                                                                                    "no_comments": docs[i].no_comments,
                                                                                                    "no_views": docs[i].no_views,
                                                                                                    "no_activities": docs[i].activity_count,
                                                                                                    "profile_url": Feed_User_profileimage,
                                                                                                    "preview_url": preview_url,
                                                                                                    "video_streaming_url": video_streaming_url,
                                                                                                    "is_liked": is_liked,
                                                                                                    "video_duration": video_duration,
                                                                                                    "allow_comments": allow_comments,
                                                                                                    "can_show_ad": can_show_ad,
                                                                                                    "has_sensitive_content": docs[i].has_verified_content,
                                                                                                    "has_seen_already": has_seen_already,
                                                                                                    "is_under_challenge": docs[i].is_under_challenge,
                                                                                                    "is_time_extendable": is_time_extendable,
                                                                                                    "privacy_mode": docs[i].privacy_mode,
                                                                                                    "is_challengeable": is_challengeable,
                                                                                                    "challenge_details": {
                                                                                                      "challenge_number": Feed_challenge_number,
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
                                                                                                    "comment_privacy": comments_privacy,
                                                                                                    "username": docs[i].profile_url.username,
                                                                                                    "repost_details": repostDetails

                                                                                                  }

                                                                                                }


                                                                                                video_array.push(video_Object);
                                                                                                j = 0;
                                                                                              } else if (j === 4 && ads.length != 0) {

                                                                                                var adsLength = ads.length;


                                                                                                for (k = 0; k < 1; k++) {

                                                                                                  var emtyCheck = ads[m];

                                                                                                  //var adsfiles = [];
                                                                                                  if (!isEmpty(emtyCheck)) {

                                                                                                    if (!isEmpty(ads[m].ads_file_path)) {
                                                                                                      var string = ads[m].ads_file_path;
                                                                                                      var array = string.split(",");
                                                                                                      var files = [];
                                                                                                        var adsfiles = constants.APIBASEBIZURL + ads[m].ads_file_path;
                                                                                                    /*	for (j = 0; j < array.length; j++) {
                                                                                                        var filePath = constants.APIBASEBIZURL + array[j];
                                                                                                        adsfiles.push(filePath)
                                                                                                      }*/


                                                                                                    }

                                                                                                    if (ALength != i) {

                                                                                                      var ads_offer_id;
                                                                                                      if (ads[m].type == 'ads') {
                                                                                                        ads_offer_id = "";
                                                                                                      } else {

                                                                                                        ads_offer_id = ads[m].ads_business_post_id;
                                                                                                      }


                                                                                                      FsEstimateadsprice.findOneAndUpdate({_id: ads[m]._id},
                                                                                                        {$inc: {user_impressions: -1}})
                                                                                                        .exec();

                                                                                                      var video_Object = {

                                                                                                        "feed_id": "",
                                                                                                        "feed_desc": "",
                                                                                                        "feeds_tags": [],
                                                                                                        "feed_type": 'ads',
                                                                                                        "is_time_extendable": false,
                                                                                                        "privacy_mode": 0,
                                                                                                        "userid": "",
                                                                                                        "expiry_time": "",
                                                                                                        "rating": 0,
                                                                                                        "no_shares": 0,
                                                                                                        "no_likes": 0,
                                                                                                        "no_comments": 0,
                                                                                                        "no_views": 0,
                                                                                                        "no_activities": 0,
                                                                                                        "profile_url": "",
                                                                                                        "video_duration": "",
                                                                                                        "allow_comments": false,
                                                                                                        "is_liked": false,
                                                                                                        "can_show_ad": false,
                                                                                                        "preview_url": "",
                                                                                                        "has_sensitive_content": false,
                                                                                                        "has_seen_already": false,
                                                                                                        "is_under_challenge": false,
                                                                                                        "is_challengeable": false,
                                                                                                        "challenge_details": {
                                                                                                          "challenge_number": 0,
                                                                                                          "challenged_by": "",
                                                                                                          "challenged_feed_id": ""
                                                                                                        },
                                                                                                        "is_self_feed": false,
                                                                                                        "ad_details": {
                                                                                                          "ad_type": ads[m].ads_name,
                                                                                                          "ads_url": adsfiles,
                                                                                                          "offer_id": ads_offer_id,
                                                                                                          "ads_price_id": ads[m]._id

                                                                                                        },
                                                                                                        "comment_privacy": 0,
                                                                                                        "repost_details": {
                                                                                                          "original_userid": "",
                                                                                                          "original_feed_id": "",
                                                                                                          "original_user_img_url": "",
                                                                                                          "original_username": "",
                                                                                                          "original_no_views": 0

                                                                                                        }

                                                                                                      }
                                                                                                        video_array.push(video_Object);
                                                                                                    }

                                                                                                    /*else
                                                                                                    {
                                                                                                    FsEstimateadsprice.findOneAndUpdate({_id:ads[m]._id},
                                                                                                    {$inc:{user_impressions:-1}})
                                                                                                    .exec();
                                                                                                    }*/
                                                                                                  }
                                                                                                  m++;
                                                                                                  ads_inc++;

                                                                                                }


                                                                                                if (docs[i].feed_type === 'video') {


                                                                                                  video_Object = {

                                                                                                    "feed_id": docs[i]._id,
                                                                                                    "feed_desc": docs[i].feed_desc,
                                                                                                    "feeds_tags": tags_arr_info,
                                                                                                    "feed_type": docs[i].feed_type,
                                                                                                    "userid": docs[i].profile_url._id,
                                                                                                    "expiry_time": duration,
                                                                                                    "rating": parseFloat(docs[i].feed_rating),
                                                                                                    "no_shares": docs[i].no_repost,
                                                                                                    "no_likes": FinalLikes,
                                                                                                    "no_comments": docs[i].no_comments,
                                                                                                    "no_views": docs[i].no_views,
                                                                                                    "no_activities": docs[i].activity_count,
                                                                                                    "profile_url": Feed_User_profileimage,
                                                                                                    "preview_url": preview_url,
                                                                                                    "video_streaming_url": video_streaming_url,
                                                                                                    "is_liked": is_liked,
                                                                                                    "allow_comments": allow_comments,
                                                                                                    "video_duration": video_duration,
                                                                                                    "can_show_ad": can_show_ad,
                                                                                                    "has_sensitive_content": docs[i].has_verified_content,
                                                                                                    "has_seen_already": has_seen_already,
                                                                                                    "is_under_challenge": docs[i].is_under_challenge,
                                                                                                    "is_time_extendable": is_time_extendable,
                                                                                                    "privacy_mode": docs[i].privacy_mode,
                                                                                                    "is_challengeable": is_challengeable,
                                                                                                    "challenge_details": {
                                                                                                      "challenge_number": Feed_challenge_number,
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
                                                                                                    "comment_privacy": comments_privacy,
                                                                                                    "username": docs[i].profile_url.username,
                                                                                                    "repost_details": repostDetails

                                                                                                  }
                                                                                                }

                                                                                                 video_array.push(video_Object);
                                                                                                j = 0;
                                                                                              } else {

                                                                                                   console.log('MainFeeds');
                                                                                                if (docs[i].feed_type === 'video') {

                                                                                                  video_Object = {

                                                                                                    "feed_id": docs[i]._id,
                                                                                                    "feed_desc": docs[i].feed_desc,
                                                                                                    "feeds_tags": tags_arr_info,
                                                                                                    "feed_type": docs[i].feed_type,
                                                                                                    "userid": docs[i].profile_url._id,
                                                                                                    "expiry_time": duration,
                                                                                                    "rating": parseFloat(docs[i].feed_rating),
                                                                                                    "no_shares": docs[i].no_repost,
                                                                                                    "no_likes": FinalLikes,
                                                                                                    "no_comments": docs[i].no_comments,
                                                                                                    "is_liked": is_liked,
                                                                                                    "no_views": docs[i].no_views,
                                                                                                    "no_activities": docs[i].activity_count,
                                                                                                    "profile_url": Feed_User_profileimage,
                                                                                                    "video_duration": video_duration,
                                                                                                    "can_show_ad": can_show_ad,
                                                                                                    "allow_comments": allow_comments,
                                                                                                    "preview_url": preview_url,
                                                                                                    "video_streaming_url": video_streaming_url,
                                                                                                    "has_sensitive_content": docs[i].has_verified_content,
                                                                                                    "has_seen_already": has_seen_already,
                                                                                                    "is_under_challenge": docs[i].is_under_challenge,
                                                                                                    "is_time_extendable": is_time_extendable,
                                                                                                    "privacy_mode": docs[i].privacy_mode,
                                                                                                    "is_challengeable": is_challengeable,
                                                                                                    "challenge_details": {
                                                                                                      "challenge_number": Feed_challenge_number,
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
                                                                                                    "comment_privacy": comments_privacy,
                                                                                                    "username": docs[i].profile_url.username,
                                                                                                    "repost_details": repostDetails

                                                                                                  }
                                                                                                }
                                                                                                video_array.push(video_Object);

                                                                                              }
                                                                                              j++;

                                                                                              //console.log(docs[i]);
                                                                                              //console.log("I Values"+i);


                                                                                            }


                                                                               }

                                                                                     videoTagDetails = {
                                                                         								item_tag_type: 'video',
                                                                         								tag_name: TrackingTag,
                                                                         								rich_media_ad: {
                                                                         										"ad_type": "",
                                                                         										"ad_files": [],
                                                                         										"offer_id": "",
                                                                         										"ads_price_id": ""
                                                                         								},
                                                                         								videos: video_array
                                                                         						}
                                                                         						video_tag_details.push(videoTagDetails);
                                                                         						video_array = [];
                                                                         						videoTagDetails = {}
                                                                                   //  console.log
                                                                                   djTr++
                                                                                   TrFeedsCount++;
                                                                             }
                                                                             hemaTr++;

                                                                                   var Bumper_ads;
                                                                                   console.log('FTagsCunt='+FTagsCunt);
                                                                                   if (Bumper_screen_Ads.length == 0) {


                                                                                       // var BumperArray = [];
                                                                                       // var banner = constants.APIBASEBIZURL + 'uplad_business_ads/t8.mp4';
                                                                                     //   BumperArray.push(banner)
                                                                                        Bumper_ads = {

                                                                                            "ad_type": "",
                                                                                            "ad_files": [],
                                                                                            "offer_id": "",
                                                                                            "ads_price_id": ""
                                                                                        }

                                                                                    } else {
                                                                                        if (TrFTagsCunt == 9 || TrFTagsCunt > 9) {

                                                                                            if (!isEmpty(Bumper_screen_Ads[0].ads_file_path)) {

                                                                                                FsEstimateadsprice.findOneAndUpdate({_id: Bumper_screen_Ads[0]._id},
                                                                                                    {$inc: {user_impressions: -1}})
                                                                                                    .exec();


                                                                                                var BumperAdsstring = Bumper_screen_Ads[0].ads_file_path;
                                                                                                var BUmperArray = BumperAdsstring.split(",");
                                                                                                var BpAdsfiles = [];
                                                                                                var offerId = [];
                                                                                                var adsName = [];
                                                                                                var ads_price_id = [];

                                                                                                /*
                                                                                                for(v=0;v<BUmperArray.length;v++)
                                                                                                 {
                                                                                                 var BpFilePath = constants.APIBASEURL+BUmperArray[v];
                                                                                                 BpAdsfiles.push(BpFilePath)
                                                                                                 }
                                                                                                 */

                                                                                                offerId.push(Bumper_screen_Ads[0].ads_business_post_id);
                                                                                                adsName.push(Bumper_screen_Ads[0].ads_name);
                                                                                                ads_price_id.push(Bumper_screen_Ads[0]._id);

                                                                                            }

                                                                                            var BumperArray = [];
                                                                                            var BumperFilePath = constants.APIBASEBIZURL + Bumper_screen_Ads[0].ads_file_path;
                                                                                            BumperArray.push(BumperFilePath)
                                                                                            var ads_offer_id;
                                                                                            if (Bumper_screen_Ads[0].type == 'ads') {
                                                                                                ads_offer_id = "";
                                                                                            } else {

                                                                                                ads_offer_id = Bumper_screen_Ads[0].ads_business_post_id;
                                                                                            }
                                                                                            Bumper_ads = {
                                                                                                "ad_type": adsName[0],
                                                                                                "ad_files": BumperArray,
                                                                                                "offer_id": ads_offer_id,
                                                                                                "ads_price_id": ads_price_id[0]
                                                                                            }
                                                                                        } else {

                                                                                            Bumper_ads = {
                                                                                                "ad_type": "",
                                                                                                "ad_files": [],
                                                                                                "offer_id": "",
                                                                                                "ads_price_id": ""
                                                                                            }

                                                                                        }

                                                                                    }

                                                                      						var feedinfo = {
                                                                      								Bumper_Ads: Bumper_ads,
                                                                      								video_tag_details: video_tag_details

                                                                      						}

                                                                                  if(TrFeedsTagsCount === hemaTr)
                                                                      						{
                                                                                  res.status(200).json({
                                                                    							status: 'Ok',
                                                                    							message: "List of feeds.",
                                                                    							total_pages: Math.ceil(count / perPage),
                                                                    							fs_ad_number: fs,
                                                                    							current_page: page,
                                                                    							total_feed: count,
                                                                    							video_tags: feedinfo
                                                                    						});
                                                                                  }
                                                                                      })

                                                                      })
                                                              })

                                                 })

                                 }







                })