const mongoose = require('mongoose');

const trendingSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,	
    start_date:{type:Date, default:Date.now()},		//start date
    end_date:{type:Date, default:Date.now()},	//end date
    campaign_name:{type:String}, 
    campaign_desc:{type:String},
    campaign_type:{type:String}
});

module.exports = mongoose.model('iv_trending', trendingSchema);