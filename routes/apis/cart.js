const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
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

//Remove the product from cart
router.get('/remove/:id', authenticateJWT, async (req, res) => {
    const id = parseInt(req.params.id);
    const userID = req.cookies["authData"].user[0].id;
            try{
                let ItemsInCart = await database.collection("users").updateOne({id: userID},{$pull:{cart:{id:id}}});
                if(ItemsInCart.modifiedCount !== 0){
                    res.redirect('/api/cart')
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
})

// Add product to cart
router.get('/add/:id', authenticateJWT,
    async (req, res) => {
        const id = parseInt(req.params.id);
        const userID = req.cookies["authData"].user[0].id;
        try{
            let product = await database.collection("products").find({id:id}).toArray();
            product = product[0];
            let addProductToCart = await database.collection("users").updateOne({id:userID},{$push:{
                cart:product
            }});
            if(addProductToCart.modifiedCount !== 0){
                res.redirect('/api/products');
            }
                    
        }
        catch(err){
            console.error(err);
        }  
        
})

//Get all products in cart
router.get('/', authenticateJWT, (req, res) => {
    jwt.verify(req.token, process.env.SECRET_ACCESS_TOKEN, async (err, authData) => {
                if(err){
                    res.sendStatus(403);
                }
                else{
                    req.authData = authData;
                    const id = authData.user[0].id;
                    let allProductsInCart = await database.collection("users").find({id:id}).toArray();
                    allProductsInCart = allProductsInCart[0].cart;
                    if(allProductsInCart.length !== 0){
                        res.render('cart', {allProductsInCart});
                    } else{
                        res.send("<h1>Nothing is added to cart</h1>")
                    }
                }
            });
})

module.exports = router;