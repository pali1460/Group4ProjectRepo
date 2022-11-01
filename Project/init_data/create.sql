CREATE TABLE users(
    --Username and password
    username VARCHAR(50) PRIMARY KEY,
    password CHAR(60) NOT NULL
    --Theme info inserted below
);

CREATE TABLE events(
    --The user who made this
    user VARCHAR(50),
    --Name of the event
    name VARCHAR(50)
);