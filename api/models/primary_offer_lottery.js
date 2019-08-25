const mongoose = require('mongoose');

const primaryOfferusersSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,	
    details:[{
    	userid:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_user'}, 
        primary_offer:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_primaryoffers'}
    }],
    contest_name: {type:String},
    contest_date: {type:Date},
});

module.exports = mongoose.model('iv_primaryoffer_lottery', primaryOfferusersSchema);