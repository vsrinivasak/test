const mongoose = require('mongoose');

const businessprofileSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    iv_acountid:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_user'},
	bus_prof_photo:{ type: String},
	bus_prof_mobile:{ type: Number, required: true },
	bus_prof_email:{ type: String, required: true },
	bus_prof_gst:{ type: String},
	bus_prof_pan:{ type: String},
	bus_prof_aadhar:{ type: String},
	bus_prof_create:{ type: Date, default: Date.now },
	bus_prof_update:{ type: Date}
});

module.exports = mongoose.model('iv_businessprofile', businessprofileSchema);