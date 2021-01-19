const express = require('express');
const exphb = require('express-handlebars');
const app = express();

//body-parser middleware
app.use(express.json());
app.use(express.urlencoded({extended:false}))

//handle-bars middleware
app.engine('handlebars',exphb({defaultLayout:'main'}));
app.set('view engine', 'handlebars');

//Home page
app.get('/', (req, res) => {
    res.render('index');
});

app.use('/api/products', require('./routes/apis/products'));

const PORT = process.env.PORT || 5000;
app.listen(PORT)