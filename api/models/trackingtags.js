const mongoose = require('mongoose');

const trackingTagsSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    userid:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_user'},
    feeds_hash_tags: [{ tagname: {type: String},
    view_count:{ type: Number, default: 0},
    viewed:[{
      userid:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_user'},
      viewcount:{ type: Number, default: 0}
    }]
  }],
  tracking_tags_create:{ type: Date},
	tracking_tags_update:{ type: Date}

});

module.exports = mongoose.model('iv_trackingtags', trackingTagsSchema);
