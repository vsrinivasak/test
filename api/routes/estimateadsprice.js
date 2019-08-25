const mongoose = require('mongoose');

const estimatedAdsBusPriceSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    userid:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_user'},
	ads_id:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_business_adstype'},
	ads_name:{ type: String, required: true},
	ads_price:{ type: String, required: true },
	cpm:{ type: Number, required: true },
	no_video_watch:{ type: Number, default:0 },
	user_impressions : { type: Number, default:0 },
	total_impressions : { type: Number, default:0 },
	user_view_impressions:{ type: Number, default:0 },
	Video_views:[{type: mongoose.Schema.Types.ObjectId, ref: 'iv_user'}],
	ads_total_price:{ type: String, required: true },
	ads_business_post_id:{type: String, default :1},
	ads_genderlist_id:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_business_genderlist'},
	ads_profslist_id:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_business_professionlist'},
	ads_prefagelist_id:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_business_agelist'},
	ads_citieslocationlist_id:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_business_arealocalitylist'},
	ads_citieslist_id:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_business_citieslist'},
	ads_stateslist_id:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_business_stateslist'},
	ads_countrylist_id:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_business_countrylist'},
	ads_file_path:{ type: String},
	ads_price_create:{ type: Date, default: Date.now },
	ads_price_update:{ type: Date}
});

module.exports = mongoose.model('iv_business_individualads_price', estimatedAdsBusPriceSchema);

