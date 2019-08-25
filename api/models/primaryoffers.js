const User = require("../models/user");
const mongoose = require('mongoose');

const primaryOffers = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
	business_post_desc:{ type: String, required: true },
	business_post_name:{ type: String, required: true },
	business_post_price:{ type: String},
	business_post_logo:{ type: String },
	no_of_items:{ type: String },
	business_catetgory_type:{ type: String },
	business_post_startdate:{ type: String},
	business_post_enddate:{ type: String},
	bus_post_create:{ type: Date, default: Date.now },
	bus_post_update:{ type: Date},
	no_likes:{type: Number,default:0 },
	no_comments:{type: Number,default:0 },
	no_used:{type: Number,default:0 },
	review_status:{type: Number,default:0 },
	no_rating:{type: Number, default:0},
	offer_rating:{type: Number, default:0},
	likes:[{type: mongoose.Schema.Types.ObjectId, ref: 'iv_user', default:[]}],
	comments:[{
		commented_by:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_user'},
		comment_data:{type:String},
		comment_number:{type:Number, default:0}
	}],
	used:[{type: mongoose.Schema.Types.ObjectId, ref: 'iv_user'}],
	rating:[{
		rated_by:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_user'},
		rating_value:{type:Number}
	}],
	is_expired:{type:Boolean, default:false}

});

module.exports = mongoose.model('iv_primaryoffers', primaryOffers);