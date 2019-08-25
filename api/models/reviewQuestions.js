const mongoose = require('mongoose');

const reviewQtnsSchema = mongoose.Schema({
       _id: mongoose.Schema.Types.ObjectId,
      userid:{ type: String, required: true },
      business_prof_id:{ type: String, required: true },
      review_question:{ type: String, required: true  },
      question_rating:{type:Number, default:0},
      user_answer:[{
      	userid:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_user'},
      	rating:{type:Number, default:0}
      }],
      ads_business_post_id:{ type: String, default:1},
      review_question_create:{ type: Date, default: Date.now },
      review_question_update:{ type: Date }
});

module.exports = mongoose.model('iv_business_reviewquestions', reviewQtnsSchema);