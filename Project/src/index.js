const express = require('express');
const app = express();
const pgp = require('pg-promise')();
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const axios = require('axios');
var activeUser = null;

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
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
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
    const query = 'INSERT INTO users (username, userPassword) VALUES ($1, $2)';
    db.any(query, [req.body.username, hash])
      .then(function (data) {
        console.log('Register successful');
        console.log(data);
        res.redirect('/login'); //this will call the /login route in the API
      })
      .catch(function (err) {
        console.log('Register problem');
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
//This is broken. We need some fixing here as logging in throws the "database request failed" error
app.post("/login", async (req, res) => {


    //Get variables!
    const username = req.body.username;
    const password = req.body.password;
    const query = `SELECT * FROM users WHERE username = $1;`;
    const values = [username];

    await db.one(query, values)
        .then(async (data) => {                
                const match = await bcrypt.compare(password, data.userpassword); //await is explained in #8
                
                if(match){
                    //Log session users
                    req.session.user = {
                        username: data.username,
                        api_key: process.env.API_KEY,
                      };
                    req.session.save();
                    res.redirect('/eventAdd'); //this will call the /discover route in the API
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
      // Default to login page.
      return res.redirect('/login');
    }
    next();
  };


// Authentication Required
app.use(auth);


//TO DO-> add home, then get all the 


app.get("/home", (req, res) => {
  res.render("pages/home", {
    username: req.session.user.username,
    
    //All custom settings go here


    
  });
});



//Get event for /eventAdd. This directs to the eventAdd page.
app.get('/eventAdd', (req, res) => {
    res.render('pages/eventAdd');
});

//Post request for adding events
app.post('/eventAdd', async (req, res) => {

    //Insert events into table
    //Should work, but needs some testing
    const query = 'INSERT INTO events (username, eventName, eventTime, warnTime, eventDescription) VALUES ($1, $2, $3, $4, $5)';
    db.any(query, [req.session.user.username, req.body.name, req.body.eventTime, req.body.warnTime, req.body.description])
      .then(function (data) {
        res.redirect('/eventAdd'); 
      })
      .catch(function (err) {
        res.redirect('/eventAdd'); 
      });
    //Redirect to get/eventAdd afterwards
});

//Get eventView page
//Needs testing
app.get('/eventView', (req, res) => {
  const query = 'SELECT * FROM events WHERE events.username = $1';
  const values = [req.session.user.username];


  db.any(query, values)
    .then((userEvents) => {
      res.render("pages/eventView", {
        userEvents,
      });
    })
    .catch((err) => {
      console.log('Error in Event View');

      res.render("pages/eventView", {
        userEvents: [],
        error: true,
        message: err.message,
      });
    });
});


//Post request for deleting events
//Need to refine it
app.post('/eventDel', async (req, res) => {

  //Should work, but needs some testing
  const query = 'DELETE FROM events WHERE username = $1 AND eventName = $2';
  db.any(query, [req.session.user.username, req.body.eventName])
    .then(function (data) {
      res.redirect('/eventView'); //Temporary redirect. Will redo later.
    })
    .catch(function (err) {
      res.redirect('/eventAdd'); 
    });
  //Redirect to get/eventAdd afterwards
});


 //Get /customize
  // Note, this is temporary, shoudl be moved below Authentication once login is complete, here for testing porpouses
  app.get('/customize', (req, res) => {
      res.render('pages/customize');
  })

  // Add the custom settings to the database
  app.post('/customize/addColBG', (req, res) =>{

    const query = `UPDATE users SET colBG = $1;`;
    
    console.log("COLOR!!!!!!!!!!!!!!!!");
    console.log(req.body.colBG);

    db.any(query, [req.body.colBG, req.body.imgBG, 1])
        .then(function (data) {
            console.log("YAY!!!!!!!!!!!!!!!!!!!!!!!");
            res.render('pages/customize');
        })
        .catch(function (err) {
          res.render('pages/customize');
            return console.log(err);
        });
  })




//Logout
app.get("/logout", (req, res) => {
    req.session.destroy();
    res.render("pages/login");
});

app.listen(3000);
console.log('Server is listening on port 3000');