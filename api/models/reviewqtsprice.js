const mongoose = require('mongoose');

const reviewQtnsPriceSchema = mongoose.Schema({
      _id: mongoose.Schema.Types.ObjectId,
      price:{ type: String, required: true },
      status:{ type: Number, default: 0 },
      review_qtsprice_create:{ type: Date, default: Date.now },
      review_qtsprice_update:{ type: Date }
});

module.exports = mongoose.model('iv_business_reviewqtsprice', reviewQtnsPriceSchema);