const mongoose = require('mongoose');

const statesPriceSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
	ads_id:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_business_adstype'},
	c_id:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_business_countrylist'},
	st_id:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_business_stateslist'},
	states_bs_price:{ type: String, required: true},
	states_price_create:{ type: Date, default: Date.now },
	states_price_update:{ type: Date}
});
//businessTypesAdsSchema.plugin(uniqueValidator);
module.exports = mongoose.model('iv_business_states_price', statesPriceSchema);
