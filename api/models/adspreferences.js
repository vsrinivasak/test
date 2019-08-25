const mongoose = require('mongoose');

const PreferencesPageSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
	ads_id:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_business_adstype'},
	prefrence_page_name:{ type: String, required: true},
	prefrence_page_create:{ type: Date, default: Date.now },
	prefrence_page_update:{ type: Date}
});

module.exports = mongoose.model('iv_business_pref_page', PreferencesPageSchema);