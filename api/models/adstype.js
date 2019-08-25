const mongoose = require('mongoose');

const businessTypesAdsSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
	ads_name:{ type: String, required: true, unique: true },
	ads_create:{ type: Date, default: Date.now },
	ads_update:{ type: Date}
});
//businessTypesAdsSchema.plugin(uniqueValidator);
module.exports = mongoose.model('iv_business_adstype', businessTypesAdsSchema);