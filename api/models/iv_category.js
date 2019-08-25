const mongoose = require('mongoose');

const category = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    category: [{ 
    		name: {type:String, required:true},
    		category_id:{type:Number}
    }]
});

module.exports = mongoose.model('iv_category', category);