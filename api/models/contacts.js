
const mongoose = require('mongoose');

const userDetailsSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    userid: {type: mongoose.Schema.Types.ObjectId, ref: 'iv_user'},
    existing_contacts:[{
        contact:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_user'},
        contact_details:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_userdetail'},
        user_category:{type:String},
        status:{type: String},
        contact_id:{type:String}
    }],
    new_contacts:[{
        username: {type: String},
        mobile: {type: String},
        url: {type:String},
        status: {type: String},
        contact_id:{type:String}
    }],
    blocked:[{type: mongoose.Schema.Types.ObjectId, ref: 'iv_user'}]
});

module.exports = mongoose.model('iv_contact', userDetailsSchema);