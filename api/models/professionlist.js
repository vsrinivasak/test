const mongoose = require('mongoose');

const professionListSchema = mongoose.Schema({
	_id: mongoose.Schema.Types.ObjectId,
	profession_name:{ type: String, required: true, unique: true},
	profession_createdate:{ type: Date, default: Date.now },
	profession_update:{ type: Date}
});
module.exports = mongoose.model('iv_business_professionlist', professionListSchema);
