const bsOffers = require("../models/bsOffers");
const mongoose = require('mongoose');

const userOffersSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    userid: {type: mongoose.Schema.Types.ObjectId, ref: 'iv_user', required: true},
    offer: {type: mongoose.Schema.Types.ObjectId, ref: 'iv_business_offers'},
    redeem_on:{type:Date, default:Date.now()},
    coins_paid:{type:Number, default:0},
    discount:{type:String},
    amount_paid:{type:String},
    address:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_userAddress'},
    transaction_id:{type:String},
    payment_id:{type:String},
    payment_type:{type:String},
    payment_status:{type:String},
    is_redeemed_only_with_coins:{type:Boolean, default:false},
});

module.exports = mongoose.model('iv_redeems', userOffersSchema);