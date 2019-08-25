const mongoose = require('mongoose');

const adsBusPostFinalPriceSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    userid:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_user'},
	ads_post_final_price:{ type: String, required: true },
	type:{ type: String, default: 'offer'},
	ads_business_post_id:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_business_offers'},
	ads_price_create:{ type: Date, default: Date.now },
	ads_price_update:{ type: Date}
});

module.exports = mongoose.model('iv_business_ads_businesspost_finalprice', adsBusPostFinalPriceSchema);