const mongoose = require('mongoose');

const feedTagsSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
	feedTag_name:{ type: String, required: true , unique: true },
	feedTag_create:{ type: Date, default: Date.now },
	feedTag_update:{ type: Date},
	feedTag_used:{type:Number, default:0},
	feedTag_used_today:{type:Number, default:0},
	feedTag_today:{ type: Date}
});

module.exports = mongoose.model('iv_feedtag', feedTagsSchema);