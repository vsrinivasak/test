const mongoose = require('mongoose');

const genderListPriceSchema = mongoose.Schema({
	_id: mongoose.Schema.Types.ObjectId,
	ads_id:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_business_adstype'},
	gender_id:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_business_genderlist'},
	gender_business_price:{ type: String, required: true},
	gender_price_createdate:{ type: Date, default: Date.now },
	gender_price_update:{ type: Date}
});
module.exports = mongoose.model('iv_business_genderlistprice', genderListPriceSchema);
