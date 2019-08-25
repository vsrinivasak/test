const mongoose = require('mongoose');

const trendingusersSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,	
    details:[{
    	userid:{type:String}, 
    	username:{type:String},
    	connections:{type:Number},
    	mobile:{type:Number},
    	email:{type:String},
    	rank:{type:String},
    	profileimage:{type:String},
        friends:{type:Number},
        won:{type:Number}
    }],
    contest_name: {type:String},
    contest_date: {type:Date},
});

module.exports = mongoose.model('iv_trending_users', trendingusersSchema);