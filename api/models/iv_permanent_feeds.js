const mongoose = require('mongoose');

const permanentfeedsSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    iv_acountid:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_user'},
    feed_type:{
            type: String,
            enum: ["video", "image"],
            required: true
        },
    privacy_mode:{
    	type: Number,
    	enum: [1,0], // 1->public, 0->private
    	required: true

    },
    feed_expiry_status:{ type: String, default:0},
    screen_directory:{ type: String, default:0},
    screen_directory_status:{ type: Number, default:0 },
	screen_shot_count:{ type: Number, default:0 },
    has_sensitive_content:{ type: Boolean, default: false },
	has_verified_content:{ type: Boolean, default: false },
    is_under_challenge: { type: Boolean, default: false },
	image_verification:{ type: Number, default:1},
    feed_desc:{ type: String, required: true },
    preview_url:{ type: String, default:null},
    feed_file_path:{ type: String, required: true },
    extend_time_status:{ type: Number, default:0},
    no_used:{ type: Number, default:0 },
    no_points:{ type: Number, default:0 },
    no_repost:{ type: Number, default:0 },
    re_post_status:{ type: Number, default:0},
    no_shares:{ type: Number, default:0 },
    no_likes:{ type: Number, default:0 },
    activity_count:{ type: Number, default:0 },
    no_comments:{ type: Number, default:0 },
    no_views:{ type: Number, default:0 },
    t_views:{ type: Number, default:0},
    no_clicks:{ type: Number, default:0 },
    no_rating: { type: Number, default:0 },
    feed_rating:{type: Number, default:0},
    video_duration:{type: Number, default:0},
    feeds_time_limit:{ type: Number, default:24},
    feeds_expiry_time_:{ type: Date},
    comments_privacy: { type: Number,
                            enum: [0,1,2],// 0->no-comments, 1->friends/followers, 2->public
                            default:2 
                      },
    feeds_hash_tags: [{ type: String}],
    old_feed_id: [{type: mongoose.Schema.Types.ObjectId, ref: 'iv_feeds'}],
    activity_id: [{type: mongoose.Schema.Types.ObjectId, ref: 'iv_user'}],
    profile_url: {type: mongoose.Schema.Types.ObjectId, ref: 'iv_user'},
    likes:[{type: mongoose.Schema.Types.ObjectId, ref: 'iv_user'}],
    clicks:[{type: mongoose.Schema.Types.ObjectId, ref: 'iv_user'}],
	views:[{type: mongoose.Schema.Types.ObjectId, ref: 'iv_user'}],
	used:[{type: mongoose.Schema.Types.ObjectId, ref: 'iv_user'}],
    points:[{type: mongoose.Schema.Types.ObjectId, ref: 'iv_user'}],
	hasverified_count:[{type: mongoose.Schema.Types.ObjectId, ref: 'iv_user'}],
	repost:[{type: mongoose.Schema.Types.ObjectId, ref: 'iv_user'}],
    shares:[{type: mongoose.Schema.Types.ObjectId, ref: 'iv_user'}],
    challenge_number:{type:Number, default:0},
    challenge_details:[{
        
        challenged_by:[{type: mongoose.Schema.Types.ObjectId, ref: 'iv_user'}],
        challenged_feed_id:[{type: mongoose.Schema.Types.ObjectId, ref: 'iv_feeds'}]
    }],
	comments:[{

        
		commented_by:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_user'},
		comment_data:{type: String},
        no_likes_comments:{ type: Number, default:0 },
        comment_number:{type:Number, default:0},
        comments_likes:[{
            likes_by:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_user'},
            comment_id:{type: String}
        }],
        reply_comment:[{
         
         comment_id:{type: String},
         received_by:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_user'},
         reply_by:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_user'},
         reply_data:{type: String},
     }],
      default:[]
	}],
	rating:[{
		rating_by:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_user'},
		rating_number:{type: Number}
	}],
	report_feed:[{
		report_by:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_user'},
		report_message:{type: String}
	}],
	report_count:{type: Number, default: 0},
    report_feed_blocked:[{type: mongoose.Schema.Types.ObjectId, ref: 'iv_feeds', default:[]}],
    feed_post_create:{ type: Date},
	feed_post_update:{ type: Date}

});

module.exports = mongoose.model('iv_static_feeds', permanentfeedsSchema);