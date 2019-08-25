const mongoose = require('mongoose');

const genderListSchema = mongoose.Schema({
	_id: mongoose.Schema.Types.ObjectId,
	gender_name:{ type: String, required: true, unique: true},
	gender_createdate:{ type: Date, default: Date.now },
	gender_update:{ type: Date}
});
module.exports = mongoose.model('iv_business_genderlist', genderListSchema);
