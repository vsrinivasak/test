const bsOffers = require("../models/bsOffers");
const mongoose = require('mongoose');

const userOffersTransactionSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    userid: {type: mongoose.Schema.Types.ObjectId, ref: 'iv_user', required: true},
    offer: {type: mongoose.Schema.Types.ObjectId, ref: 'iv_business_offers'},
    redeem_on:{type:Date, default:Date.now()},
    amount_paid:{type:String},
    payment_id:{type:String},
    payment_type:{type:String},
    payment_status:{type:String}
});

module.exports = mongoose.model('iv_failed_transactions', userOffersTransactionSchema);