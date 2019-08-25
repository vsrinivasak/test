const mongoose = require('mongoose');

const ageListPriceSchema = mongoose.Schema({
	_id: mongoose.Schema.Types.ObjectId,
	ads_id:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_business_adstype'},
	age_id:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_business_agelist'},
	age_business_price:{type: String, required: true},
	age_price_createdate:{ type: Date, default: Date.now },
	age_price_update:{ type: Date}
});
module.exports = mongoose.model('iv_business_agelistprice', ageListPriceSchema);
