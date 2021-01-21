const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const emailExistence = require('email-existence');
const nodemailer = require('nodemailer');
const { validatePhone, isPhoneUpdateInUse, validateEmail, isEmailInUse, isEmailUpdateInUse, validatePassword, validateConfirmPassword, isPhoneInUse, validatePin } = require('../../validator')
const MongoClient = require('mongodb').MongoClient;
const uri = process.env.MONGODB_URI;
let database;

MongoClient.connect(uri,{ useUnifiedTopology: true, useNewUrlParser: true }, (err, conn) => {
        if (err) {
            console.log("Connection failed to database", err);
          } else {
            database = conn.db("Shopping");
            console.log("Connection Successfull");
          }
        }
  )
  
  
  const authenticateJWT = (req, res, next) =>{
      const authHeader = req.headers["authorization"] || req.cookies["token"];
      if(authHeader){
          const token = authHeader.split(' ')[1];
          req.token = token;
          next();
      }
      else {
          res.sendStatus(401);
      }
  }


// Login
router.post('/login', async (req, res) => {
    const {phone, password} = req.body;
    if(!phone || !password){
        res.json({msg:"You have to enter all the details"})
    }
    else{
        try{
            const user = await database.collection("users").find({$and:[{phone:phone}, {password:password}]}).toArray();
            if(user.length !== 0){
                jwt.sign({user: user }, process.env.SECRET_ACCESS_TOKEN, (err, token) => {
                    res.cookie('token', "Bearer "+token, { httpOnly: true });
                    res.redirect('/api/products');
                });
            }
            else{
                res.send("<h3>Entered incorrect details</h3>");
            }
        }
        catch(err){
            console.log(err);
        }
    }
})

// Get all users
router.get('/', async (req, res) => {
            try{
                let allUsers = await database.collection("users").find({}).toArray();
                res.json({allUsers});
            }
            catch (err){
                console.error(err);
            }
          } 
)

// Delete user profile
router.get('/deleteProfile/:id', authenticateJWT, async (req, res) =>{
    jwt.verify(req.token, process.env.SECRET_ACCESS_TOKEN, async (err, authData) => {
        if(err){
            res.sendStatus(403);
        }
        else{
            const id = parseInt(req.params.id);
            try{
                const deleted = await database.collection("users").deleteOne({id: id});
                if(deleted.deletedCount !== 0){
                    res.clearCookie("token");
                    res.send({
                        status: 200,
                        data: "Profile Deleted Successfully",
                    });
                }
                else{
                    res.send({
                        status: 404,
                        data: "Profile Not Found",
                    });
                }
                
            }
            catch (err){
                console.error(err);
            }
        }
    });
})

//Logout
router.use('/logout', (req, res) =>{
    res.clearCookie("token");
    res.redirect('/')
})


// Get user profile
router.get('/getProfile/:id', authenticateJWT, async (req, res) =>{
    jwt.verify(req.token, process.env.SECRET_ACCESS_TOKEN, async (err, authData) => {
        if(err){
            res.sendStatus(403);
        }
        else{
            const id = parseInt(req.params.id);
            try{
                const user = await database.collection("users").find({id: id}).toArray();
                const user_data = user[0];
                if(user.length !== 0){
                    res.render('updateProfile', {user_data});
                }
                else{
                    res.send({
                        status: 404,
                        data: "Profile Not Found",
                    });
                }
            }
            catch (err){
                console.error(err);
            }
        }
    });
})

//Reset Password
router.use('/resetPass',authenticateJWT, async (req, res) =>{
    jwt.verify(req.token, process.env.SECRET_ACCESS_TOKEN, async (err, authData) => {
        if(err){
            res.sendStatus(403);
        }
        else{
            req.authData = authData;
            const id = authData.user[0].id;
            res.render('resetPass', {id});
        }
    });
})

//Update Password
router.post('/resetPassword/:id', authenticateJWT,
    [validatePassword, validateConfirmPassword],
    async (req, res) => {
        const { oldPassword, password, confirmPassword} = req.body;
        if(!oldPassword || !password || !confirmPassword){
            return res.status(400).json({msg:"You have to enter all the details"})
        }
        else{
            const errors = validationResult(req);
            if(!errors.isEmpty()){
                return res.status(400).json({ errors:errors.array()});
            }
            try{                                                            
                const id = parseInt(req.params.id);
                let passwordUpdate = await database.collection("users").updateOne({$and: [{password:oldPassword}, {id:id}]}, {$set:{password:password}});
                if(passwordUpdate.modifiedCount !== 0){
                    res.send("<h1>Updated successfully</h1>");
                }
                else{
                    res.send({
                        status: 404,
                        data: "Profile Not Found",
                    });
                }
            }
            catch(err){
                console.error(err);
            }  
        }
    
})



// Update user profile
router.post('/updateProfile/:id', authenticateJWT,
    [validatePhone, isPhoneUpdateInUse, validateEmail, isEmailUpdateInUse, validatePin],
    async (req, res) => {
        jwt.verify(req.token, process.env.SECRET_ACCESS_TOKEN, async (err, authData) => {
            if(err){
                res.sendStatus(403);
            }
            else{
                const id = parseInt(req.params.id);
                const {name, phone, email, door, street, city, state, pin} = req.body;
                if( !name || !phone || !email || !door || !street || !city || !state || !pin ){
                    return res.status(400).json({msg:"You have to enter all the details"})
                }
                else{
                    const errors = validationResult(req);
                    if(!errors.isEmpty()){
                        return res.status(400).json({ errors:errors.array()});
                    }
                    try{
                        emailExistence.check(email, async (err, resp) => {
                            if(resp){
                                let addUser = await database.collection("users").updateOne({id:id},[{ $set: {
                                    name: name,
                                    phone: phone,
                                    email:email,
                                    address: {
                                        door_no: door,
                                        street: street,
                                        city: city,
                                        state: state,
                                        pin: pin
                                    }
                                }}]);
                                if(addUser.modifiedCount !== 0){
                                    res.send("<h1>Updated successfully</h1>");
                                }
                                else{
                                    res.send({
                                        status: 404,
                                        data: "Profile Not Found",
                                    });
                                }
                            }
                            else{
                                res.send("<h1>Enter a valid email</h1>");
                            }
                        })
                    }
                    catch(err){
                        console.error(err);
                    }  
                }
            }
        });        
})


// Create user record
router.post('/', 
    [validatePhone, isPhoneInUse, validateEmail, isEmailInUse, validatePin, validatePassword],
    async (req, res) => {
        const {name, phone, email, door, street, city, state, pin, password} = req.body;
        if( !name || !phone || !email || !door || !street || !city || !state || !pin || !password ){
            return res.status(400).json({msg:"You have to enter all the details"})
        }
        else{
            const errors = validationResult(req);
            if(!errors.isEmpty()){
                return res.status(400).json({ errors:errors.array()});
            }
            try{
                emailExistence.check(email, async (err, resp) => {
                    if(resp){
                        await database.collection("counters").updateOne({_id:"userid"}, {$inc:{userSeq:1}});
                        let seqVal = await database.collection("counters").find({_id:"userid"}).toArray();
                        seqVal = seqVal[0].userSeq;
                        let addUser = await database.collection("users").insertOne({
                            id: seqVal,
                            name: name,
                            phone: phone,
                            email:email,
                            address: {
                                door_no: door,
                                street: street,
                                city: city,
                                state: state,
                                pin: pin
                            },
                            password:password,
                            cart:[]
                        });
                        res.send("<h1>Recorded successfully</h1>");
                    }
                    else{
                        res.send("<h1>Enter a valid email</h1>");
                    }
                })
            }
            catch(err){
                console.error(err);
            }  
        }
})

//Forgot Password
router.use('/forgotpassword', async (req, res) =>{
    let testAccount = await nodemailer.createTestAccount();
    const mail = req.body.email;
    let user = await database.collection("users").find({email:mail}).toArray();
    if(user.length === 0){
        return res.send("<h1>You are not registered</h1>")
    }
    const pass = user[0].password;
    let transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_ID, 
            pass: "", 
        },
    });

    let mailDetails = {
        from: process.env.EMAIL_ID, 
        to: mail,
        subject: "Password", 
        text: `Your password is ${pass}`, 
        html: `<b>Your password is ${pass}</b>`
        }

    transporter.sendMail( mailDetails, (err, response) => {
        if(err){
            return res.json({err});
        }
        else{
                res.send("<h1>Password sent to your registered mail</h1>")
            console.log(JSON.stringify(res));
        }
    });

})


module.exports = router;