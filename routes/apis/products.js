const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { validateProductName, validateURL, validateCompanyName, validateCost, validateDetails} = require('../../validator')
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

//Delete the product
router.get('/delete/:id', authenticateJWT, async (req, res) => {
    const id = parseInt(req.params.id);
            try{
                const deleted = await database.collection("products").deleteOne({id: id});
                if(deleted.deletedCount !== 0){
                    res.redirect('/api/products');
                }
                else{
                    res.send({
                        status: 404,
                        data: "Product Not Found",
                    });
                } 
            }
            catch (err){
                console.error(err);
            }
})


//Get one product
router.get('/get/:id', authenticateJWT, async (req, res) => {
    const id = parseInt(req.params.id);
            try{
                const product = await database.collection("products").find({id: id}).toArray();
                const productData = product[0];
                if(product.length !== 0){
                    res.render('updateProduct', {productData});
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

//Update product
router.post('/update/:id', authenticateJWT,
    [validateProductName, validateURL, validateCompanyName, validateCost, validateDetails],
    async (req, res) => {
        const id = parseInt(req.params.id);
        const {name, url, cost, company, online_shopping_link} = req.body;
        if( !name || !url || !cost || !company || !online_shopping_link ){
            return res.status(400).json({msg:"You have to enter all the details"})
        }
        else{
            const errors = validationResult(req);
            if(!errors.isEmpty()){
                return res.status(400).json({ errors:errors.array()});
            }
            try{
                let updateProduct = await database.collection("products").updateOne({id:id},[{$set:{
                    name: name,
                    url:url,
                    cost:cost,
                    company:company,
                    online_shopping_link:online_shopping_link
                }}]);
                res.redirect('/api/products');        
            }
            catch(err){
                console.error(err);
            }  
        }
    })

// Add product
router.post('/', authenticateJWT,
    [validateProductName, validateURL, validateCompanyName, validateCost, validateDetails],
    async (req, res) => {
        const {name, url, cost, company, online_shopping_link} = req.body;
        if( !name || !url || !cost || !company || !online_shopping_link ){
            return res.status(400).json({msg:"You have to enter all the details"})
        }
        else{
            const errors = validationResult(req);
            if(!errors.isEmpty()){
                return res.status(400).json({ errors:errors.array()});
            }
            try{
                await database.collection("counters").updateOne({_id:"userid"}, {$inc:{seq:1}});
                let seqVal = await database.collection("counters").find({_id:"userid"}).toArray();
                seqVal = seqVal[0].seq;
                let addProduct = await database.collection("products").insertOne({
                    id: seqVal,
                    name: name,
                    url:url,
                    cost:cost,
                    company:company,
                    online_shopping_link:online_shopping_link
                });
                res.redirect('/api/products');        
            }
            catch(err){
                console.error(err);
            }  
        }
})

//Get all products
router.get('/', authenticateJWT, (req, res) => {
    jwt.verify(req.token, secretAccessToken, async (err, authData) => {
                if(err){
                    res.sendStatus(403);
                }
                else{
                    req.authData = authData;
                    const id = authData.user[0].id;
                    let allProducts = await database.collection("products").find({}).toArray();
                    let users = await database.collection("users").find({id:"R151501"}).toArray();
                    users = users[0].cart;
                    users.map(user => {
                        const index = allProducts.findIndex(x => x.id == user.id);
                        if(index !== -1){
                            allProducts.splice(index, 1)
                        }
                    })
                    res.cookie('authData', authData, { httpOnly: true }, "/");
                    res.render('productsList', {id, allProducts});
                }
            });
})

module.exports = router;