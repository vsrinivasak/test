const mongoose = require('mongoose');

const userAddressSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    userid:{type:String},
    name:{type:String, default:""},
    door_no:{type:String, default:""},
    street:{type:String, default:""},
    locality:{type:String, default:""},
    city:{type:String, default:""},
    state:{type:String, default:""},
    pin:{type:String, default:""},
    alternate_mobile:{type:String, default:""},
    address_name:{type:String, default:""},
    created_on:{type:Date, default:Date.now()}
});

module.exports = mongoose.model('iv_userAddress', userAddressSchema);