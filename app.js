//jshint esversion:6
require('dotenv').config()
// console.log(process.env) 

const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
// const md5 = require('md5');
// const encrypt = require("mongoose-encryption")
const session = require("express-session")
const passport = require("passport")
const LocalStrategy = require("passport-local").Strategy;
const passportLocalMongoose = require("passport-local-mongoose")

main().catch(err => console.log(err));
async function main(){
    await mongoose.connect("mongodb://127.0.0.1:27017/userDB")
}

const app = express();

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true }
}))

app.use(passport.initialize())
app.use(passport.session())

//accessing static files
app.use(express.static(__dirname + "/public"))

app.set("view engine" , "ejs");

//to parse data received from post request
app.use(express.urlencoded({extended: true}));
app.use(express.json());

const userSchema = new mongoose.Schema({
    email : String,
    password : String
})

userSchema.plugin(passportLocalMongoose);

// userSchema.plugin(encrypt,{secret : process.env.SECRET ,encryptedFields: "password"})

const User = mongoose.model("User", userSchema);

// use static authenticate method of model in LocalStrategy
passport.use(new LocalStrategy(User.authenticate()));

// use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/" , function(req,res){
    res.render("home")
})

app.get("/register" , function(req,res){
    res.render("register")
})

app.get("/login" , function(req,res){
    res.render("login")
})

app.get("/secrets" , function(req,res){
    if(req.isAuthenticated()){
        res.render("secrets");
    } else {
        res.redirect("/login");
    }
})

app.post("/register" , function(req,res){
    // const newUser = new User({
    //     email : req.body.username,
    //     password : md5(req.body.password)
    // })

    // newUser.save().then(function(){
    //     console.log("New user registers");
    //     res.render("secrets");
    // }).catch(function(err){
    //     console.log(err);
    // })
    User.register({username: req.body.username}, req.body.password, function(err,user){
        if(err){
            console.log(err);
            res.redirect("/register")
        } else {
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets")
            })
        }
    })
})

app.get("/logout", function(req ,res , next){
    req.logout(function(err){
        if(err){ return next(err); }
        res.redirect('/')
    })
})

app.post("/login" , function(req,res){
    // const username = req.body.username;
    // const password = md5(req.body.password);

    // User.findOne({email : username})
    // .then(function(foundUser){
    //     if(foundUser.password === password){
    //         res.render("secrets");
    //     }else{
    //         console.log(err);
    //     }
    // }) .catch(function(err){
    //     console.log(err);
    // })

    const user = new User({
        username: req.body.username,
        password: req.body.password
    })

    req.login(user, function(err){
        if(err){
            console.log(err);
        } else {
            passport.authenticate("local")(req,res,function(){
                res.render("secrets")
            })
        }
    })
})

app.listen(3000, function(){
    console.log("Server running on port 3000");
})