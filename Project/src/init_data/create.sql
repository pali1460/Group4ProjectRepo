CREATE TABLE IF NOT EXISTS users(
    -- Username and password
    username VARCHAR(50) PRIMARY KEY NOT NULL,
    userPassword CHAR(60) NOT NULL,
    -- Theme info inserted below
    colBG CHAR(7),
    imgBG VARCHAR(100), -- note, length may need to be longer???
    imgBG_on BIT,
    colCard CHAR(7),
    imgCard VARCHAR(100), -- note, length may need to be longer???
    imgCard_on BIT
);

CREATE TABLE IF NOT EXISTS eventType(
	-- primary key
    etypeNum SERIAL PRIMARY KEY NOT NULL,
    -- event type name
    etypeName VARCHAR (50),
    color char(7),
    image VARCHAR (100),
    image_on BIT
);

-- add a default event type
INSERT INTO eventType (etypeName, color) VALUES (' ', '#FFFFFF');

-- events table is finalized
CREATE TABLE IF NOT EXISTS events(
	-- primary key
    eventNum SERIAL PRIMARY KEY NOT NULL,
    -- The user who made this
    username VARCHAR(50) REFERENCES users(username),
    -- Name of the event
    eventName VARCHAR(50), 
    -- Date of Event
    -- Time of Event
    eventTime DATE,
    warnTime DATE,
    eventDescription VARCHAR (255),
    eventType INT REFERENCES eventType(etypeNum)
);