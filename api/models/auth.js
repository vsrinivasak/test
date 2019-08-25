const mongoose = require('mongoose');

const authSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    userid: { type: String},
    iv_token: {type: String, required:true},
    created_at:{type:Date, default:Date.now},
    removed_at:{type:Date},
    imei: {type:String},
    deviceid: {type: String}
});

module.exports = mongoose.model('iv_Auth', authSchema);