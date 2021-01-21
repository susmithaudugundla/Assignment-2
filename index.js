require('dotenv').config();
const express = require('express');
const exphb = require('express-handlebars');
const cookieParser = require('cookie-parser');
const app = express();

//body-parser middleware
app.use(express.json());
app.use(express.urlencoded({extended:false}))

//handle-bars middleware
app.engine('handlebars',exphb({defaultLayout:'main'}));
app.set('view engine', 'handlebars');

//cookie-parser middleware
app.use(cookieParser());

//Home page
app.get('/', (req, res) => {
    res.render('index');
});
app.get('/signup', (req, res) => {
    res.render('signup')
})
app.get('/forgotpass', (req, res) => {
    res.render('forgotpass')
})
app.get('/api/addProduct', (req, res) => {
    res.render('addProduct');
})

app.use('/api/users', require('./routes/apis/users'));
app.use('/api/products', require('./routes/apis/products'))
app.use('/api/cart', require('./routes/apis/cart'));

const PORT = process.env.PORT || 5000;
app.listen(PORT)