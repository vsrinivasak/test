const mongoose = require('mongoose');

const messageSchema = mongoose.Schema({
	_id: mongoose.Schema.Types.ObjectId,
    topic:{ type: String, default:""},
    userid: {type: mongoose.Schema.Types.ObjectId, ref: 'iv_user'},
    memberid: {type: mongoose.Schema.Types.ObjectId, ref: 'iv_user'},
    messages:[{
        user:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_user'},
        message:{ type: String, default:""},
        created_at:{ type: Date},
        msg_id:{ type: String, default:""},
    }],
    userid_read:{type:Date, default:null},
    memberid_read:{type:Date, default:null},
    user_offline:[{ type: String}],
    delete_user:[{
        user_id: {type: mongoose.Schema.Types.ObjectId, ref: 'iv_user'},
        deleted_at:{type:Date, default:null}
    }]
    
});
module.exports = mongoose.model('iv_message', messageSchema);