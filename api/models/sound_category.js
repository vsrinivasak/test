
const mongoose = require('mongoose');

const soundCategorySchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    category_name: {type:String, required:true},
    category_logo: {type:String},
    created_on: {type:Date}

});

module.exports = mongoose.model('sound_category', soundCategorySchema);