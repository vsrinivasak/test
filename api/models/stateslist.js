const mongoose = require('mongoose');

const stateslistSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
	st_name:{ type: String, required: true, unique: true },
	st_code:{ type: String, required: true, unique: true },
	c_id:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_business_countrylist'},
	states_create:{ type: Date, default: Date.now },
	states_update:{ type: Date}
});
//businessTypesAdsSchema.plugin(uniqueValidator);
module.exports = mongoose.model('iv_business_stateslist', stateslistSchema);
