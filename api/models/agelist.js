const mongoose = require('mongoose');

const ageListSchema = mongoose.Schema({
	_id: mongoose.Schema.Types.ObjectId,
	age:{ type: String, required: true, unique: true},
	age_createdate:{ type: Date, default: Date.now },
	age_update:{ type: Date}
});
module.exports = mongoose.model('iv_business_agelist', ageListSchema);
