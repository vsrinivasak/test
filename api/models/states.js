const mongoose = require('mongoose');

const statesSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
	ads_id:{ type: String, required: true},
	st_name:{ type: String, required: true},
	st_code:{ type: String, required: true},
	c_id:{ type: String, required: true},
	states_bs_price:{ type: String, required: true},
	states_create:{ type: Date, default: Date.now },
	states_update:{ type: Date}
});
//businessTypesAdsSchema.plugin(uniqueValidator);
module.exports = mongoose.model('iv_business_states', statesSchema);
