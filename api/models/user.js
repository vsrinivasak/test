const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        match: /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/
    },
    password: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    fullname: {type: String},
    age:{ type: Number},
    mobile:{type: Number, unique: true},
    gender:{type: String},
    imei: {type: String, required: true},
    deviceid:{type: String, required: true},
    email_verified: {type: Number, default: 0},
    mobile_verified :{type: String, default: 'false'},
    guardian_mobile_number:{type: Number},
    business_profile_id:{type: String, default:0},
    language:{type: String},
    created_on:{type: Date,default: Date.now},
    updated_on:{type: Date},
    coverimage:{type: String, default:null},
    profileimage:{type: String, default:null},
    usertype: {type: String},
    is_profile_completed: {type: Boolean, default: false },
    refby: {type: String, default: null},
    ref_Code:{type: String, required: true, unique: true},
    hobbies:[{
        item_name:{type:String,default:null},
        item_id:{type:String, default:null}
    }],
    is_new_signup: {type:String, default: true},
    email_token: {type:String, default:""}
});

module.exports = mongoose.model('iv_user', userSchema);