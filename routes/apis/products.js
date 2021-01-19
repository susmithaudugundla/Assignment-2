const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const emailExistence = require('email-existence');
const { validateId, validateEmail, isEmailInUse, validatePassword, isIDInUse } = require('../../validator')
const secretAccessToken = "secret";
const MongoClient = require('mongodb').MongoClient;
const uri = process.env.MONGODB_URI || "mongodb+srv://FirstAssignment:Susmi@123@assignment-1.ksf6u.mongodb.net/Shopping?retryWrites=true&w=majority";
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
                jwt.sign({user: user }, secretAccessToken, (err, token) => {
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

// Get all students
router.get('/', async (req, res) => {
            // jwt.verify(req.token, secretAccessToken, async (err, authData) => {
            //     if(err){
            //         res.sendStatus(403);
            //     }
            //     else{
            //         req.authData = authData;
            //         res.cookie('authData', authData, { httpOnly: true }, "/");
            //     }
            // });
            try{
                let allStudents = await database.collection("users").find({}).toArray();
                res.json({allStudents});
            }
            catch (err){
                console.error(err);
            }
          } 
)

// Create a student record
router.post('/post', 
    [validateId, isIDInUse, validateEmail, isEmailInUse, validatePassword],
    async (req, res) => {
        const {id, name, branch, email, password} = req.body;
        if(!id || !name || !branch || !email || !password){
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
                        let addStudent = await database.collection("students_data").insertOne({
                            id:id,
                            name: name,
                            email:email,
                            branch:branch,
                            password:password
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

module.exports = router;