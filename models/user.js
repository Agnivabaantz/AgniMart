const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }
})
const userSchema =  new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        lowercase: true
    },
    orderedItems: {
        type: [orderSchema]
    }
});

const User = mongoose.model('User', userSchema);
// Exporting product schema from js file
module.exports = User;