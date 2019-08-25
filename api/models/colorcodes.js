const mongoose = require('mongoose');

const colorSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    letter: {type:String},
    color:{type:String}
});

module.exports = mongoose.model('iv_colorcode', colorSchema);