const express = require('express');
const app = express();
const pgp = require('pg-promise')();
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const axios = require('axios');
var activeUser = null;

// This line of code will allow access of CSS files
app.use('/public',express.static('public'));

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
    const query2 = 'INSERT INTO eventtype (username, etypename, color) VALUES ($1, $2, $3)';    
    db.any(query, [req.body.username, hash])
      .then(function (data) {
        console.log('Register successful');
        // create default event type for new user
        db.any(query2, [user, 'default', '#FFFFFF'])
          .then(function (data) {
            console.log('Default eventtype successful');
          })
          .catch(function (err) {
            console.log('Error creating default eventtype for new user');
          });
      })
      .catch(function (err) {
        console.log('Register problem');
        return res.redirect('/register'); //this will call the /register route in the API
      });

    //Redirect to get/login if it works, otherwise direct to get/register
    return res.redirect('/login'); //this will call the /login route in the API
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
                    res.redirect('/home'); //this will call the /home route in the API
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

app.get('/home', async (req, res) => {
  sendNotification();
  const query1 = `SELECT * FROM users WHERE username = $1;`;
  const date = new Date();
    const query2 = `SELECT * FROM events e INNER JOIN eventType t ON e.eventType = t.etypeNum
    WHERE e.username = $1 AND e.warnTime <= $2 ORDER BY e.eventTime ASC;`;
  const values = [req.session.user.username, date];
      await db.one(query1, req.session.user.username)
          .then((customData) => {          
              db.any(query2, values)
                  .then((userEvents) => {
                    res.render("pages/home", {
                      userEvents,
                      username: req.session.user.username,
                      customData
                    });
                  })
                  .catch((err) => {
                    console.log('Error in Event View');

                    res.render("pages/home", {
                      userEvents: [],
                      username: req.session.user.username,
                      error: true,
                      message: err.message,
                      customData
                    });
                  });
          })
          .catch(function (err) {
              console.log(err);
              res.redirect('/login');
          });
          /*
          new Notification();
          console.log(Notification.permission);

          if(Notification.permission == "granted") {
            alert("permission granted");
          }
          else if(Notification.permission != "denied") {
            Notification.requestPermission().then(permission => {
              console.log(permission);
            });
          }
          */
});

function sendNotification() {
  console.log(Notification.permission);

          if(Notification.permission == "granted") {
            alert("permission granted");
          }
          else if(Notification.permission != "denied") {
            Notification.requestPermission().then(permission => {
              console.log(permission);
            });
          }
}

//Get event for /eventAdd. This directs to the eventAdd page.
app.get('/eventAdd', async (req, res) => {
    const query1 = `SELECT * FROM users WHERE username = $1;`;
    const query2 = `SELECT * FROM eventType WHERE username = $1`;
    const values = [req.session.user.username];
    await db.one(query1, values)
        .then((customData) => {
            db.any(query2, values)
                .then((eventType) => {
                    res.render("pages/eventAdd", {
                        eventType,
                        customData
                    });
                })
                .catch((err) => {
                    console.log('Error in Event View');

                    res.render("pages/home", {
                        userEvents: [],
                        error: true,
                        message: err.message,
                        customData
                    });
                });
        })
        .catch(function (err) {
            console.log(err);
            res.redirect('/login');
        });



});

//Post request for adding events
app.post('/eventAdd', async (req, res) => {

    //Insert events into table
    //Should work, but needs some testing
    // tempoaraily use default event type
    const query = 'INSERT INTO events (username, eventName, eventTime, warnTime, eventDescription, eventType) VALUES ($1, $2, $3, $4, $5, $6);';
    db.any(query, [req.session.user.username, req.body.name, req.body.eventTime, req.body.warnTime, req.body.description, req.body.eventType])
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
app.get('/eventView', async (req, res) => {


    const query1 = `SELECT * FROM users WHERE username = $1;`;
    const query2 = `SELECT * FROM events e INNER JOIN eventType t ON e.eventType = t.etypeNum 
                    WHERE e.username = $1 ORDER BY e.eventTime ASC;`;
    const values = [req.session.user.username];
        await db.one(query1, req.session.user.username)
            .then((customData) => {          
                db.any(query2, values)
                    .then((userEvents) => {
                      res.render("pages/eventView", {
                        userEvents,
                        customData
                      });
                    })
                    .catch((err) => {
                      console.log('Error in Event View');

                      res.render("pages/eventView", {
                        userEvents: [],
                        error: true,
                        message: err.message,
                        customData
                      });
                    });
            })
            .catch(function (err) {
                console.log(err);
                res.redirect('/login');
            });
});

app.get('/calendarView', async (req, res) => {

  const query1 = `SELECT * FROM users WHERE username = $1;`;
  const query2 = `SELECT * FROM events e INNER JOIN eventType t ON e.eventType = t.etypeNum 
                  WHERE e.username = $1 ORDER BY e.eventTime ASC;`;
  const user = [req.session.user.username];

  await db.one(query1, user)
    .then((customData) => {
      db.any(query2, user)
        .then((userEvents) => {
          res.render("pages/calendarView", {
            userEvents,
            customData
          });
        })
        .catch((err) => {
          console.log('Error in Calendar View');
          return res.redirect('/home');
        });
    })
    .catch(function (err) {
      console.log(err);
      res.redirect('/home');
    });
});


//Post request for deleting events
//Need to refine it
app.post('/eventDel', async (req, res) => {

  //Should work, but needs some testing
  const query = 'DELETE FROM events WHERE username = $1 AND eventName = $2 AND eventNum = $3';
  db.any(query, [req.session.user.username, req.body.eventName, req.body.eventNum])
    .then(function (data) {
      res.redirect('/eventView'); //Temporary redirect. Will redo later.
    })
    .catch(function (err) {
      res.redirect('/eventAdd'); 
    });
  //Redirect to get/eventAdd afterwards
});


 //Get /customize
  app.get('/customize', async (req, res) => {
    const query1 = `SELECT * FROM users WHERE username = $1;`;
    const query2 = 'SELECT * FROM eventType WHERE username = $1;';
    const values = [req.session.user.username];
        await db.one(query1, req.session.user.username)
            .then((customData) => {          
                db.any(query2, values)
                    .then((eventTypes) => {
                      res.render("pages/customize", {
                        eventTypes,
                        customData
                      });
                    })
                    .catch((err) => {
                      console.log('Error in Event View');

                      res.render("pages/customize", {
                        eventTypes: [],
                        error: true,
                        message: err.message,
                        customData
                      });
                    });
            })
            .catch(function (err) {
                console.log(err);
                res.redirect('/login');
            });
  })

  // Add the custom settings to the database
  // background color
  app.post('/customize/addColBG', (req, res) =>{

    const query = `UPDATE users SET colBG = $1, imgBG_on = '0' WHERE username = $2;`;
    const values = [req.body.colBG,req.session.user.username];

    db.one(query, values)
        .then(function (data) {
            console.log("successfully changed color");
            res.redirect('/customize')
        })
        .catch(function (err) {
            console.log(err);
            res.redirect('/customize');
        });
  });
  // background image
  app.post('/customize/addImgBG', (req, res) =>{

    const query = `UPDATE users SET imgBG = $1, imgBG_on = '1' WHERE username = $2;`;
    const values = [req.body.imgBG,req.session.user.username];

    db.one(query, values)
        .then(function (data) {
            console.log("successfully changed image");
            res.redirect('pages/customize');
        })
        .catch(function (err) {
            console.log(err);
            res.redirect('/customize');
        });
  });

  // Add the new event types
  app.post('/customize/addEventType', (req, res) =>{

    const query = `INSERT INTO eventType (etypeName, color, username) VALUES ($1, $2, $3)`;
    const values = [req.body.eventTypeName, req.body.eventTypeColor, req.session.user.username];

    db.one(query, values)
        .then(function (data) {
            console.log("successfully created event type");
            res.redirect('/customize')
        })
        .catch(function (err) {
            console.log(err);
            res.redirect('/customize');
        });
  })

    //Post request for deleting events
    //Need to refine it
    app.post('/customize/etypeDel', async (req, res) => {

    //Should work, but needs some testing
    const query = 'DELETE FROM eventType WHERE etypeNum = $1 AND username = $2;';
    db.any(query, [req.body.etypeNum, req.session.user.username])
    .then(function (data) {
        res.redirect('/customize'); //Temporary redirect. Will redo later.
    })
    .catch(function (err) {
        res.redirect('/customize'); 
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