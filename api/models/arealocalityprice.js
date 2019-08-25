const mongoose = require('mongoose');

const arealocalityPriceSchema = mongoose.Schema({
	_id: mongoose.Schema.Types.ObjectId,
	ads_id:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_business_adstype'},
	c_id:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_business_countrylist'},
	st_id:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_business_stateslist'},
	city_id:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_business_citieslist'},
	arealocality_id:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_business_arealocalitylist'},
	arealocality_business_price:{ type: String, required: true},
	arealocality_price_createdate:{ type: Date, default: Date.now },
	arealocality_price_update:{ type: Date}
});
module.exports = mongoose.model('iv_business_arealocality_price', arealocalityPriceSchema);
