const mongoose = require('mongoose');

const businessPostSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    iv_acountid:{ type: Number, required: true },
	bus_prof_id:{ type: String, required: true },
	business_post_desc:{ type: String, required: true },
	bus_post_create:{ type: Date, default: Date.now },
	bus_post_update:{ type: Date}
});

module.exports = mongoose.model('iv_business_post', businessPostSchema);