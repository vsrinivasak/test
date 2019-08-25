const User = require("../models/user");
const mongoose = require('mongoose');

const adsManagentSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    iv_acountid:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_user'},
    bus_id:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_business'},
	bus_prof_id:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_businessprofile'},
	ad_desc:{ type: String, required: true },
	ad_title:{ type: String, required: true },
	ads_total_price:{ type: String},
	ad_logo:{ type: String, required: true },
	ads_post_create:{ type: Date},
	ads_post_update:{ type: Date}
	

});

module.exports = mongoose.model('iv_ads_management', adsManagentSchema);
