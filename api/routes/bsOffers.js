const User = require("../models/user");
const mongoose = require('mongoose');

const businessOffersSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    iv_acountid:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_user'},
    bus_id:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_business'},
	bus_prof_id:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_businessprofile'},
	business_post_desc:{ type: String, required: true },
	business_post_price:{ type: String},
	business_post_logo:{ type: String, required: true },
	no_of_items:{ type: String, required: true },
	business_catetgory_type:{ type: String, required: true },
	business_post_startdate:{ type: String},
	business_post_enddate:{ type: String},
	bus_post_create:{ type: Date, default: Date.now },
	bus_post_update:{ type: Date},
	no_likes:{type: Number,default:0 },
	no_comments:{type: Number,default:0 },
	no_clicks:{type: Number,default:0 },
	no_views:{type: Number,default:0 },
	no_used:{type: Number,default:0 },
	review_status:{type: Number,default:0 },
	no_redeem:{type: Number,default:0},
	no_rating:{type: Number, default:0},
	offer_rating:{type: Number, default:0},
	likes:[{type: mongoose.Schema.Types.ObjectId, ref: 'iv_user', default:[]}],
	comments:[{
		commented_by:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_user'},
		comment_data:{type:String},
		comment_number:{type:Number, default:0}
	}],
	clicks:[{type: mongoose.Schema.Types.ObjectId, ref: 'iv_user'}],
	views:[{type: mongoose.Schema.Types.ObjectId, ref: 'iv_user'}],
	used:[{type: mongoose.Schema.Types.ObjectId, ref: 'iv_user'}],
	redeem:[{type: mongoose.Schema.Types.ObjectId, ref: 'iv_user'}],
	rating:[{
		rated_by:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_user'},
		rating_value:{type:Number}
	}],
	is_expired:{type: Boolean, default:false},
	offer_category:{type:String, default:"Stellar"}

});

module.exports = mongoose.model('iv_business_offers', businessOffersSchema);