const MongoClient = require('mongodb').MongoClient;
const { check, body } = require('express-validator');
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

module.exports = {
    validateID:   check('id').matches(/^(\d{12})|(R(\d{6}))$/).withMessage('Invalid ID'),
    isIDInUse:    check('id').custom(async value => {
        const val = await database.collection("users").find({id:value}).count();
        if(val>0){
            throw new Error('ID Number already in use') ;
        }
    }),
    validatePhone:   check('phone').matches(/^(9|8|7|6)(\d{9})$/).withMessage('Enter correct phone number'),
    isPhoneInUse:    check('phone').custom(async value => {
                    console.log(typeof value);
                    const val = await database.collection("users").find({phone:value}).count();
                    if(val>0){
                        throw new Error('Phone Number already in use') ;
                    }
                }),
    isPhoneUpdateInUse:    check('phone').custom(async value => {
                    console.log(typeof value);
                    const val = await database.collection("users").find({phone:value}).count();
                    if(val>1){
                        throw new Error('Phone Number already in use') ;
                    }
                }),            
    validateEmail: check('email').isEmail().withMessage('Incorrect email id'),
    isEmailInUse: check('email').custom(async value => {
                        const val = await database.collection("users").find({email:value}).count();
                        if(val>0){
                            throw new Error('Email already in use') ;
                        }
                    }),
    isEmailUpdateInUse: check('email').custom(async value => {
                        const val = await database.collection("users").find({email:value}).count();
                        if(val>1){
                            throw new Error('Email already in use') ;
                        }
                    }),
    validatePin: check('pin').matches(/^(\d{6})$/).withMessage('Invalid PIN number'),
    validatePassword: check('password').matches(/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z]).{8,32}$/).withMessage("Password should have atleast 8 digits, one uppercase letter, one lowercase letter, one digit"),
    validateConfirmPassword: body('confirmPassword').custom((value, {req}) => {
                                if (value !== req.body.password) {
                                  console.log("hello")
                                  throw new Error('Password confirmation does not match password');
                                }
                                else{
                                  return true;
                                }
                              }),
    validateProductName:check('name').matches(/^[A-Za-z\s]{2,}$/).withMessage("Name should be atleast 2 chars"),
    validateCost:check('cost').matches(/^[1-9](\d{1,20})$/).withMessage('The price should be greaterthan 9'),
    validateCompanyName:check('company').matches(/^[A-Za-z\s]{2,}$/).withMessage("Name should be atleast 2 chars"),
    validateURL:check('url').matches(/^(ftp|http|https):\/\/.*(jpg|jpeg|png)$/).withMessage("Not valid URL for images"),
    validateDetails:check('online_shopping_link').matches(/^(ftp|http|https):\/\/.*$/).withMessage("Not a valid URL")
}