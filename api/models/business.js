const mongoose = require('mongoose');

const businessSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
	bus_prof_id:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_businessprofile'},
    iv_acountid:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_user'},
	bus_name:{ type: String, required: true, unique: true },
	bus_category:{ type: String, required: true },
	bus_menu:{ type: String},
	bus_logo:{ type: String},
	bus_location:{ type: String, required: true },
	bus_tags:{ type: String},
	bus_prof_create:{ type: Date, default: Date.now },
	bus_prof_update:{ type: Date}
});

module.exports = mongoose.model('iv_business', businessSchema);