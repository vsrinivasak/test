const mongoose = require('mongoose');

const areaLocalityListSchema = mongoose.Schema({
	_id: mongoose.Schema.Types.ObjectId,
	c_id:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_business_countrylist'},
	st_id:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_business_stateslist'},
	city_id:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_business_citieslist'},
	arealocality_name:{ type: String, required: true, unique: true},
	arealocality_createdate:{ type: Date, default: Date.now },
	arealocality_update:{ type: Date}
});
module.exports = mongoose.model('iv_business_arealocalitylist', areaLocalityListSchema);
