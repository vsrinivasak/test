const mongoose = require('mongoose');

const businessReviewPriceSchema = mongoose.Schema({
      _id: mongoose.Schema.Types.ObjectId,
      userid:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_user'},
      ads_business_post_id:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_business_offers'},
      business_post_review_price:{ type: String, required: true },
      review_answer_create:{ type: Date, default: Date.now },
      review_answer_update:{ type: Date }
});

module.exports = mongoose.model('iv_business_reviewprice', businessReviewPriceSchema);