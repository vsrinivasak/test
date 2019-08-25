const mongoose = require('mongoose');

const countrySchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
	ads_id:{ type: String, required: true},
	country_name:{ type: String, required: true},
	country_code:{ type: String, required: true},
	country_bs_price:{ type: String, required: true},
	country_create:{ type: Date, default: Date.now },
	country_update:{ type: Date}
});
//businessTypesAdsSchema.plugin(uniqueValidator);
module.exports = mongoose.model('iv_business_country', countrySchema);