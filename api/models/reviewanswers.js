const mongoose = require('mongoose');

const reviewAnswersSchema = mongoose.Schema({
      _id: mongoose.Schema.Types.ObjectId,
      userid:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_user'},
      review_qtns_id:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_business_reviewquestions'},
      ads_business_post_id:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_business_offers'},
      review_answer_create:{ type: Date, default: Date.now },
      review_answer_update:{ type: Date }
});

module.exports = mongoose.model('iv_business_reviewanswers', reviewAnswersSchema);