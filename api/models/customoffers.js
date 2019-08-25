const bsOffers = require("../models/bsOffers");
const business = require("../models/business");
const mongoose = require('mongoose');

const CustomOfferSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'iv_user'},
    offer_name: {type: String, required:true},
    offer_desc: {type: String},
    vendor: {type: mongoose.Schema.Types.ObjectId, ref: 'iv_business'},
    menu_items: [{type: String}]
});

module.exports = mongoose.model('iv_customoffer', CustomOfferSchema);