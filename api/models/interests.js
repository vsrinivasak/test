const mongoose = require('mongoose');

const hobbiesSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    title: {type:String, required:true},
    items:[{
    	items_name:{type:String, default:null}
    }]
});

module.exports = mongoose.model('iv_hobbies', hobbiesSchema);