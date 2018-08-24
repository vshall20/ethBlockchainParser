const mongoose = require('mongoose');

var TransactionSchema = new mongoose.Schema({
    forAddress:{
        type: String,
        required: true
    },
    blockNumber: {
        type: Number,
        required: true
    },
    fromAddress: {
        type: String,
        required: true
    },
    toAddress: {
        type: String,
        required: true
    },
    transactionHash: { type: String, unique: true },
    value: {
        type: Number,
        required: true
    },
    timestamp: {
        type: Number,
        required: true
    },
    date:{
        type: String,
        required: true,
    },
    week:{
        type:Number,
        required:true
    }
});

// // Use the unique validator plugin
// UserSchema.plugin(unique, { message: 'That {PATH} is already taken.' });

// // Make the name capitalization consistent
// UserSchema.plugin(titlize, { paths: ['name'], trim: false });

TransactionSchema.pre('save', function (next) {
    next();
});

TransactionSchema.post('save', function (referral) {

});


module.exports = mongoose.model('transactions', TransactionSchema);
