const mongoose = require('mongoose');

const transactionSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,	
    userid: {type: mongoose.Schema.Types.ObjectId, ref: 'iv_user', required: true},
    transactions:[{
    	date_of_transaction:{type:Date, default:Date.now()},
    	amount:{type:Number, default:0},
    	mode:{type:String},
    	transaction_type:{type:String},
    	action:{type:String},
    	message:{type:String},
    	transaction_id:{type:String}
    }]
});

module.exports = mongoose.model('iv_transactions', transactionSchema);