const mongoose = require('mongoose');

const professionListPriceSchema = mongoose.Schema({
	_id: mongoose.Schema.Types.ObjectId,
	ads_id:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_business_adstype'},
	profession_id:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_business_professionlist'},
	profession_price:{ type: String, required: true},
	profession_price_createdate:{ type: Date, default: Date.now },
	profession_price_update:{ type: Date}
});
module.exports = mongoose.model('iv_business_professionlistprice', professionListPriceSchema);
