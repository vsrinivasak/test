const mongoose = require('mongoose');

const contentSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
	privacy: { type: String, required: true},
	terms_conditions: {type: String, required: true}
});

module.exports = mongoose.model('iv_content', contentSchema);