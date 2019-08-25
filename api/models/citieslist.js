const mongoose = require('mongoose');

const citiesListSchema = mongoose.Schema({
	_id: mongoose.Schema.Types.ObjectId,
	c_id:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_business_countrylist'},
	st_id:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_business_stateslist'},
	city_name:{ type: String, required: true, unique: true},
	city_createdate:{ type: Date, default: Date.now },
	city_update:{ type: Date}
});
module.exports = mongoose.model('iv_business_citieslist', citiesListSchema);
