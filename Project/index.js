const express = require('express');
const app = express();
const pgp = require('pg-promise')();
const bodyParser = require('body-parser');
const session = require('express-session');
//const bcrypt = require('bcrypt');
//const axios = require('axios');

// database configuration
const dbConfig = {
    host: 'db',
    port: 5432,
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
  };
  
  const db = pgp(dbConfig);
  
// test your database
  db.connect()
    .then(obj => {
      console.log('Database connection successful'); // you can view this message in the docker compose logs
      obj.done(); // success, release the connection;
    })
    .catch(error => {
      console.log('ERROR:', error.message || error);
    });

//App settings
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(
    session({
      secret: "XASDASDA",
      saveUninitialized: true,
      resave: true,
    })
  );
  
  app.use(
    bodyParser.urlencoded({
      extended: true,
    })
  );

  //Get / method
  app.get('/', (req, res) =>{
    res.redirect('/login'); //this will call the /login route in the API
  });
  
  
//Get /register
app.get('/register', (req, res) => {
    res.render('pages/register');
});

//Post /register
// Register submission
app.post('/register', async (req, res) => {
    //the logic goes here
    //Get name and password
    const user = req.body.username;
    const pass = req.body.password;

    //Hash password
    const hash = await bcrypt.hash(req.body.password, 10);
    //Insert username, password into users table
    //Be sure to edit this to account for customization later, whoever's doing this
    const query = 'INSERT INTO users (username, password) VALUES ($1, $2)';
    db.any(query, [req.body.username, hash])
      .then(function (data) {
        res.redirect('/login'); //this will call the /login route in the API
      })
      .catch(function (err) {
        res.redirect('/register'); //this will call the /register route in the API
      });
    //Redirect to get/login if it works, otherwise direct to get/register
});

//Get /login
app.get('/login', (req, res) => {
    res.render('pages/login');
});

//Post /login
// Login submission
app.post("/login", async (req, res) => {
    //Get variables!
    const username = req.body.username;
    const password = req.body.password;
    const query = "SELECT * FROM users WHERE users.username = $1";
    const values = [username];


    //Get login
    db.one(query, values)
      .then(async (data) => {
        const match = await bcrypt.compare(req.body.password, data.password); //await is explained in #8
        if(match){
            //Log session users
            req.session.user = {
                api_key: process.env.API_KEY,
              };
            req.session.save();
            res.redirect('/home'); //this will call the /discover route in the API
        }
        else{
            //Log error
            console.log("Incorrect Username or Password.");
            res.redirect('/login'); //this will call the /login route in the API
        }
      })
      .catch((err) => {
        console.log("Database request failed");
        //Render login.ejs
        res.render('pages/login');
      });
  });


//Authentication Middleware
const auth = (req, res, next) => {
    if (!req.session.user) {
      // Default to register page.
      return res.redirect('/register');
    }
    next();
  };


// Authentication Required
app.use(auth);



//TO DO-> add home, then get all the 

app.post('/home', (req,res) =>{
  //will get all cutsomization settings from the database then will store in variables.
  
  });

  //Get event for /eventAdd. This directs to the eventAdd page.
  app.get('/register', (req, res) => {
    res.render('pages/eventAdd');
});

  //Post request for adding events
  app.post('/eventAdd', async (req, res) => {

    //Insert events into table
    //Should work, but needs some testing
    const query = 'INSERT INTO events (username, eventName, eventTime, warnTime, description) VALUES ($1, $2 $3, $4. $5)';
    db.any(query, [req.session.user.username, req.body.name, req.body.eventTime, req.body.warnTime, req.body.description])
      .then(function (data) {
        res.redirect('/eventAdd'); 
      })
      .catch(function (err) {
        res.redirect('/eventAdd'); 
      });
    //Redirect to get/eventAdd afterwards
});





//Logout
app.get("/logout", (req, res) => {
    req.session.destroy();
    res.render("pages/login");
});

app.listen(3000);
console.log('Server is listening on port 3000');