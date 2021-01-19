const MongoClient = require('mongodb').MongoClient;
const { check, body } = require('express-validator');
const uri = process.env.MONGODB_URI || "mongodb+srv://FirstAssignment:Susmi@123@assignment-1.ksf6u.mongodb.net/Students?retryWrites=true&w=majority";
let database;

MongoClient.connect(uri,{ useUnifiedTopology: true, useNewUrlParser: true }, (err, conn) => {
        if (err) {
            console.log("Connection failed to database", err);
          } else {
            database = conn.db("Students");
            console.log("Connection Successfull");
          }
        }
  )

module.exports = {
    validateId:   check('id').matches(/^R(\d{6})$/).withMessage('Entered ID is in wrong format. Ex:R151001'),
    isIDInUse:    check('id').custom(async value => {
                    const val = await database.collection("students_data").find({id:value}).count();
                    if(val>0){
                        throw new Error('ID already in use') ;
                    }
                }),
    validateEmail: check('email').isEmail().withMessage('Incorrect email id'),
    isEmailInUse: check('email').custom(async value => {
                        const val = await database.collection("students_data").find({email:value}).count();
                        if(val>0){
                            throw new Error('Email already in use') ;
                        }
                    }),
    validatePassword: check('password').matches(/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z]).{8,32}$/).withMessage("Password should have atleast 8 digits, one uppercase letter, one lowercase letter, one digit"),
    validateConfirmPassword: body('confirmPassword').custom((value, {req}) => {
                                if (value !== req.body.password) {
                                  console.log("hello")
                                  throw new Error('Password confirmation does not match password');
                                }
                                else{
                                  return true;
                                }
                              })
}