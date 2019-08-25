const mongoose = require('mongoose');

const citiesSchema = mongoose.Schema({
	_id: mongoose.Schema.Types.ObjectId,
	ads_id:{ type: String, required: true},
	c_id:{ type: String, required: true},
	st_id:{ type: String, required: true},
	city_name:{ type: String, required: true},
	city_business_price:{ type: String, required: true},
	city_createdate:{ type: Date, default: Date.now },
	city_update:{ type: Date}
});
module.exports = mongoose.model('iv_business_cities', citiesSchema);
