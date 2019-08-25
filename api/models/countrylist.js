const mongoose = require('mongoose');

const countryListSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
	country_name:{ type: String, required: true , unique: true },
	country_code:{ type: String, required: true , unique: true },
	country_create:{ type: Date, default: Date.now },
	country_update:{ type: Date}
});
//businessTypesAdsSchema.plugin(uniqueValidator);
module.exports = mongoose.model('iv_business_countrylist', countryListSchema);