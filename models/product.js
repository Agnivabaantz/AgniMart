const mongoose = require('mongoose');

const productSchema =  new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    imageUrl : {
        type: String,
        default: 'https://unsplash.com/photos/u79wy47kvVs'
    },
    description : {
        type: String,
        default: 'Default product description'
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    countInStock :{
        type: Number,
        required: true,
        min: 0
    },
    category: {
        type: String,
        required: true
    },
    vendor : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

const Product = mongoose.model('Product', productSchema);
// Exporting product schema from js file
module.exports = Product;