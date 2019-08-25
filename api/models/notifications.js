const mongoose = require('mongoose');

const notificationSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    userid:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_user'},
    notifications:[{
        notification_data:{type:String},
        member_id:{type:String, default:""},
        item_id :{type:String, default:""},
        additional_details:{
            userid:{type:String, default:""},
            feed_id:{type:String, default:""},
            member_feed_id:{type:String, default:""},
            member_id:{type:String, default:""},
            user_preview_url:{type:String, default:""},
            member_preview_url:{type:String, default:""},
            challenge_amount:{type:Number, default:0}
        },
            sender:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_user', default: null},
            message: {type:String, default:""},
            msg_created_at:{type:Date, default: Date.now()},
            title:{type:String},
            msg_id:{type:String},
            msg_count:{type:Number, default:0},
        notification_type:{type:String, default:""},
        notification_number:{type:Number, default:0},
        created_at:{type:Date, default: Date.now()},
        username:{type:String, default:""},
        profileimage:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_user'},
        member_name:{type:String, default:""},
        member_profile:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_user'},
        feed_type:{type:String, default:""},
        view_status:{type:Boolean, default:false},
        is_action_done:{type:Boolean, default:false}
    }]
    
});

module.exports = mongoose.model('iv_notification', notificationSchema);