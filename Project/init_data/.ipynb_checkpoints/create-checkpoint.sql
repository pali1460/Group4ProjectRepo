CREATE TABLE users(
    --Username and password
    username VARCHAR(50) PRIMARY KEY,
    password CHAR(60) NOT NULL
    --Theme info inserted below
);

--events table is finalized
CREATE TABLE events(
    --The user who made this
    user VARCHAR(50),
    --Name of the event
    name VARCHAR(50), 
    --Date of Event
    --Time of Event
    eventDateTime DATETIME,
    --Warn Time
    warnDateTime DATETIME,
    --Description of Event
    description VARCHAR (280)
);