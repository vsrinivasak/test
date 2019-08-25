
const mongoose = require('mongoose');

const soundsSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    sound_name: {type:String, required:true},
    sound_desc: {type:String},
    sound_size: {type:String},
    sound_url: {type:String},
    sound_logo: {type:String},
    no_used: {type:Number, default:0},
    sound_category: {type: mongoose.Schema.Types.ObjectId, ref: 'sound_category'},
    created_on: {type:Date}

});

module.exports = mongoose.model('iv_sound', soundsSchema);