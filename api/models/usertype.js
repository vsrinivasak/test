const mongoose = require('mongoose');

const usertypeSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    usertype: [
        {type : "Business"},
        {type : "Regularuser"}
    ]
});

module.exports = mongoose.model('iv_usertype', usertypeSchema);