const bsOffers = require("../models/bsOffers");
const mongoose = require('mongoose');

const userDetailsSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    userid: {type: mongoose.Schema.Types.ObjectId, ref: 'iv_user', required: true},
    category_type: {type: String, default:'Stellar'},
    followers_count:{type: Number, default: 0},
    followers: [{type: mongoose.Schema.Types.ObjectId, ref: 'iv_userdetail'}],
    following_count : {type: Number, default: 0},
    following:[{type: mongoose.Schema.Types.ObjectId, ref: 'iv_userdetail'}],
    blocked_count:{type: Number, default: 0},
    blocked:[{type: mongoose.Schema.Types.ObjectId, ref: 'iv_userdetail', default:[]}],
    user_blocked:[{type: mongoose.Schema.Types.ObjectId, ref: 'iv_userdetail', default:[]}],
    groups_count: {type: Number, default: 0},
    no_contacts:{type: Number, default: 0},
    groups:[{
        group_name:{type:String},
        group_image:{type:String},
        members:[{type: mongoose.Schema.Types.ObjectId, ref: 'iv_userdetail'}],
        group_admin:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_userdetail'},
        group_number:{type:Number}
    }],
    talent_rating: {type: Number, default: 0},
    view_points: {type: Number, default: 0},
    t_views: {type: Number, default: 0},
    talent_points:{type: Number, default: 0},
    total_active_offers:{type:Number, default:0},
    offer_details:[{
        offer: {type: mongoose.Schema.Types.ObjectId, ref: 'iv_business_offers'},
        primary_offer: {type: mongoose.Schema.Types.ObjectId, ref: 'iv_primaryoffers'},
        offer_status: { type: String},
        is_primary_offer:{type : Boolean, default:false},
        admin:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_userdetail'},
        active_group:[{type: mongoose.Schema.Types.ObjectId, ref: 'iv_userdetail'}],
        requested_group:[{type: mongoose.Schema.Types.ObjectId, ref: 'iv_userdetail'}],
        rejected_group:[{type: mongoose.Schema.Types.ObjectId, ref: 'iv_userdetail'}],
        total_contributions:{type:Number, default:0},
        contributions:[{
            userid:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_userdetail'},
            cont_date:{type:Date, default:Date.now()},
            cont_points:{type:Number, default:0},
            view_points_from:{type:Number, default:0},
            talent_points_from:{type:Number, default:0}

        }],
        offer_category:{type : String},
        primary_contribution:{type : Boolean, default:false},
        created_at:{type:Date, default:Date.now()},
        todays_extra_contribution:{type:Number, default:0},
        next_cont_date:{type:Date, default:null}
    }],
    offers_history:[{
        offer: {type: mongoose.Schema.Types.ObjectId, ref: 'iv_business_offers'},
        primary_offer:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_primaryoffers'},
        redeemed_on: {type:Date, default:null},
        payment_status:{type:Number , default:0},
        transaction_id: {type:String , default:null},
        payment_type:{type:String , default:""},
        payment_id: {type:String , default:""},
        pay_status: {type:String , default:""},
        admin:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_userdetail'},
        selected_address:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_userAddress'},
        is_primary_offer:{type : Boolean, default:false},
        is_lottery_showed:{type:Boolean,default:false},
        discount_redeemed:{type:Boolean, default:false},
        total_contributions:{type:Number, default:0},
        contributions:[{
            userid:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_userdetail'},
            cont_date:{type:Date, default:Date.now()},
            cont_points:{type:Number, default:0},
            view_points_from:{type:Number, default:0},
            talent_points_from:{type:Number, default:0}

        }],
    }],
    wishlist_offers:[{
        offer: {type: mongoose.Schema.Types.ObjectId, ref: 'iv_wishlistoffers'},
        offer_status: { type: String},
        is_primary_offer:{type : Boolean, default:false},
        created_at:{type:Date, default:Date.now()},
        admin:{type: mongoose.Schema.Types.ObjectId, ref: 'iv_userdetail'},
    }],
    rejected_offers:[{
        offer: {type: mongoose.Schema.Types.ObjectId, ref: 'iv_business_offers'},
        userid: {type: mongoose.Schema.Types.ObjectId, ref: 'iv_user'}
    }],
    pending_rating:[{
        offer: {type: mongoose.Schema.Types.ObjectId, ref: 'iv_business_offers'},
        is_skipped:{type:Boolean , default:false}
    }],
    user_address:[{type: mongoose.Schema.Types.ObjectId, ref: 'iv_userAddress'}],
    coin_details:{
        current_date:{type:Date, default:Date.now()},
        points_added:{type:Number , default:0}
    },
    has_shown_announcements:{type:Boolean , default:false},
    announcement_seen_on:{type:Date, default:null},
    has_shown_offer: {type: Boolean, default: true},
    offer_seen_on: {type: Date, default: null},
    offer_seen:{type:String, default:""},
    has_user_activity:{type:Boolean, default: false},
    coins_collected_today:{type:Number, default:0},
    activity_status:{type:Boolean, default:false},
    showcase_details:{
        home: {type:Boolean, default:false},
        profile: {type:Boolean, default:false},
        offers: {type:Boolean, default:false},
        fab: {type:Boolean, default:false},
        challenge_details: {type:Boolean, default:false},
        feed_details: {type:Boolean, default:false},
        challenge_tab: {type:Boolean, default:false},
        offer_details:{type:Boolean, default:false}
    },
    contest_seen_on:{type:Date, default:null},
    contests_won:[{
        contest_id:{type:String},
        contest_name:{type:String},
        rank:{type:Number},
        contest_date:{type:Date},
        has_contest_seen:{type:Boolean}
    }]
});

module.exports = mongoose.model('iv_userdetail', userDetailsSchema);