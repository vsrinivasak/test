const mongoose = require('mongoose');

const countryPriceSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
	ads_id:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_business_adstype'},
	c_id:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_business_countrylist'},
	country_bs_price:{ type: String, required: true},
	country_price_create:{ type: Date, default: Date.now },
	country_price_update:{ type: Date}
});

module.exports = mongoose.model('iv_business_country_price', countryPriceSchema);