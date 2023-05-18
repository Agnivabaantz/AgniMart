// Importing and running express
require('dotenv').config()

const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const methodOverride = require('method-override');


const Product = require('./models/product');
const User = require('./models/user');

const PORT = process.env.PORT || 8080
//const dbUrl = process.env.DB_URL
//Establishing connection to db server
mongoose.connect('mongodb://127.0.0.1:27017/ecom')
    .then(() => {
        console.log("Mongo Connection Open")
    })
    .catch(err =>{
        console.log("Encountered error in establishing mongo connection")
        console.log(err)
    });

// Parse any data coming from a form or as a JSON
app.use(express.urlencoded({ extended : true}))
app.use(express.json())

//Setting view engine to EJS
app.set('view engine','ejs');

//Setting path for views and public assets
app.set('views', path.join(__dirname, '/views'))
app.use(express.static(path.join(__dirname, 'public')))

//Defining variables and objects
/*
**** Objects and Functions
*/

//console.log("My name is ",process.env.myname)
let currentUser = {
    "id" : 0,
    "name" : ''
}
let cart = []
// Routing methods for CRUD operations
app.get('/',(req,res) =>{
    res.redirect('login');
})
app.get('/login',(req,res) =>{
    const { errorMsg } = req.params;
    res.render('login',{errorMsg});
})
app.get('/register',(req,res) =>{
    const { errorMsg } = req.params;
    res.render('register',{errorMsg});
})
app.get('/register',(req,res)=>{
    res.render('register');
})
app.get('/home',(req,res) =>{
    console.log(req.params);
    res.render('index');
})
/* ********************************
GET Request Routing
*********************************** 
*/

app.get('/home/products',async (req,res) =>{
    const { category } = req.query;
    console.log('Inside /home/products GET route with category as',category)
    if(currentUser.id === 0){
        res.redirect('login')
    }
    if(category){
        const products = await Product.find({category: category});
        console.log(products)
        res.render('shop', {products, category});
    }
    else{
        const products = await Product.find({vendor: {$ne: currentUser.id}});
        res.render('shop', {products, category:'Products'});
    }
})
app.get('/home/products/:id', async (req,res) =>{
    console.log('Request parameters', req.params);
    const { id } = req.params;
    const productFetch = await Product.findById(id); 
    console.log(productFetch);
    res.render('show', {productFetch});
});
app.get('/home/products/:id/buy', async (req,res) =>{
    console.log('Request parameters', req.params);
    const { id } = req.params;
    const productFetch = await Product.findById(id); 
    productFetch.countInStock--;
    if(productFetch.countInStock <=0){
        await Product.findByIdAndDelete(id);
        console.log('Item deleted');
    }
    else{
        await productFetch.save();
        console.log('Item updated');
    }

    const user = await User.findByIdAndUpdate(currentUser.id,{$push: {orderedItems: productFetch._id}},{new: true});
    console.log(user);
    res.render('buy', {productFetch});
});
app.get('/home/myproducts',async (req,res) =>{
    const products = await Product.find({vendor: currentUser.id});
    res.render('myproducts',{products});
})
app.get('/home/myproducts/new', async (req,res) =>{
    const products = await Product.find({vendor: currentUser.id});
    res.render('new',{products});
})
app.get('/home/myproducts/update', async(req,res) =>{
    const products = await Product.find({vendor: currentUser.id});
    res.render('update',{products});
})
app.get('/home/myaccount',async (req,res) =>{
    const user = await User.findById(currentUser.id);
    const products = await Product.find({vendor: currentUser.id});
    console.log('My details',user)
    console.log('My products',products)
    res.render('myaccount',{user, products});
})
app.get('/home/accountmanage',async(req,res) =>{
    const user = await User.findById(currentUser.id);
    res.render('accountmanage',{user});
})
/* ********************************
POST Request Routing
*********************************** 
*/
//*********************** Portal Login ***********************
app.post('/login', async (req,res) =>{
    console.log(req.body);
    const user = await User.findOne({email: req.body.email});
    console.log('User DB Details', user)
    let errorMsg = 'Invalid user credentials, try again!!!'
    if(user){
        if(user.password === req.body.password){
            console.log(`User ${user.username} logged in`)
            currentUser.id = user._id;
            currentUser.name = user.name;
            res.redirect('/home');
        }
        else{
            errorMsg = 'Invalid password!!!';
            res.render('login',{errorMsg});
        }
    }
    else{
        res.render('login',{errorMsg});
    }
})
app.post('/register', async(req,res) =>{
    console.log(req.body);
    const userExisting = await User.findOne({email: req.body.email});
    if(userExisting){
        const errorMsg = 'User account with same mail-id already exists';
        res.render('register',{errorMsg});
    }
    else{
        const newUser = new User(req.body);
        await newUser.save();
        console.log('New User',newUser);
        const errorMsg = 'User added successfully';
        res.render('register',{errorMsg});
    }
})
app.post('/home/myproducts/new', async(req,res) =>{
    console.log(req.body);
    const newProduct = new Product(req.body);
    newProduct.vendor = currentUser.id;
    await newProduct.save();
    console.log(newProduct);
    const products = await Product.find({vendor: currentUser.id});
    res.render('new',{products});
})
app.post('/home/myproducts/update', async(req,res) =>{
    const { id } = req.body;
    const modId = new mongoose.Types.ObjectId(id.trim());

    const productFetch = await Product.findByIdAndUpdate(modId,{
        countInStock: parseInt(req.body.countInStock),
        price: parseInt(req.body.price)
    }, {runValidators: true, new: true});

    const products = await Product.find({vendor: currentUser.id});
    res.render('update',{products});
})
app.post('/home/myproducts/delete', async(req,res) =>{
    console.log("POST route for delete item:",req.body)
    const { id } = req.body ;
    const modId = new mongoose.Types.ObjectId(id.trim());

    await Product.findByIdAndDelete(modId);

    const products = await Product.find({vendor: currentUser.id});
    res.render('update',{products});
})
app.post('/home/accountmanage',async(req,res) =>{  
    const user = await User.findByIdAndUpdate(currentUser.id,{
        name: req.body.name,
        username: req.body.username,
        password: req.body.password,
        email: req.body.email
    },{runValidators: true, new: true});
    res.render('accountmanage',{user});
})

app.listen(PORT, () => {
    console.log('Listening to server at port',PORT);
})
