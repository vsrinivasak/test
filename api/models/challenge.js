const mongoose = require('mongoose');

const challengeSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    userid:{type: String},
    challenges:[{
        my_feed_id:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_feeds'},
        my_userid:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_userdetail'},
        challenge_userid:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_userdetail'},
        challenge_feed_id:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_feeds'},
        created_at:{type: Date, default: Date.now},
        amount:{type:Number, default: 0},
        challenge_number:{type:Number},
        status:{type:Number, default: 0},
        user_views:{type:Number, default:0},
        member_views:{type:Number, default:0}
    }],
    challenged:[{
        my_feed_id:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_feeds'},
        my_userid:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_userdetail'},
        challenge_userid:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_userdetail'},
        challenge_feed_id:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_feeds'},
        created_at:{type: Date, default: Date.now},
        amount:{type:Number, default: 0},
        challenge_number:{type:Number},
        status:{type:Number, default: 0},
        user_views:{type:Number, default:0},
        member_views:{type:Number, default:0}
    }],
    on_going_challenges:[{
        my_feed_id:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_feeds'},
        my_userid:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_userdetail'},
        challenge_userid:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_userdetail'},
        challenge_feed_id:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_feeds'},
        created_at:{type: Date, default: Date.now},
        challenge_started_at:{type: Date, default: Date.now},
        amount:{type:Number, default: 0},
        challenge_number:{type:Number},
        status:{type:Number, default: 0},
        user_views:{type:Number, default:0},
        user_viewed_by:[{type: mongoose.Schema.Types.ObjectId, ref: 'iv_user'}],
        member_viewed_by:[{type: mongoose.Schema.Types.ObjectId, ref: 'iv_user'}],
        member_views:{type:Number, default:0}
    }],
    challenges_history:[{
        my_feed_id:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_feeds'},
        my_userid:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_userdetail'},
        challenge_userid:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_userdetail'},
        challenge_feed_id:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_feeds'},
        created_at:{type: Date, default: Date.now},
        challenge_completed_at:{type: Date},
        amount:{type:Number, default: 0},
        winner:{type:String},
        challenge_number:{type:Number},
        user_views:{type:Number, default:0},
        member_views:{type:Number, default:0},
        won_amount:{type:Number, default: 0}
    }],
    expired_challenges:[{
        my_feed_id:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_feeds'},
        my_userid:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_userdetail'},
        challenge_userid:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_userdetail'},
        challenge_feed_id:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_feeds'},
        created_at:{type: Date, default: Date.now},
        amount:{type:Number, default: 0},
        challenge_number:{type:Number}
    }]
});

challengeSchema.plugin(require('mongoose-autopopulate'));
module.exports = mongoose.model('iv_challenges', challengeSchema);