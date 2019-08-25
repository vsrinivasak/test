const mongoose = require('mongoose');

const fcmSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    fcmtoken: { type: String,},
    mobile:{type:Number},
    userid: { type: String, default: null },
    imei: {type: String,  },
    deviceid: {type: String, },
    created_on:{type:Date, default: Date.now},
    updated_on:{type:Date}
});

module.exports = mongoose.model('iv_fcmtoken', fcmSchema);