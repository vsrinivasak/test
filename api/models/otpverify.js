const mongoose = require('mongoose');

const otpSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    userid: { type: String},
    otp: {type: String, required: true},
    imei: {type: String},
    deviceid: {type: String},
    mobile: {type: Number,required: true},
    otp_verified: {type:String, default:0},
    created_on:{type:Date,default: Date.now},
    updated_on:{type:Date}
});

module.exports = mongoose.model('iv_otp', otpSchema);