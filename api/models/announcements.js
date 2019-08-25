const mongoose = require('mongoose');

const announcementSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    ann_text: {type:String, default:""},
    ann_image:{type:String},
    created_at:{type:Date, default:Date.now()},
    ann_type:{type:String}
});

module.exports = mongoose.model('iv_announcements', announcementSchema);