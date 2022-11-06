CREATE TABLE IF NOT EXISTS users(
    -- Username and password
    username VARCHAR(50) PRIMARY KEY NOT NULL,
    userPassword CHAR(60) NOT NULL,
    -- Theme info inserted below
    colBG CHAR(7),
    imgBG VARCHAR(100), -- note, length may need to be longer???
    imgBG_on BIT,
    colMenu1 CHAR(7),
    imgMenu1 VARCHAR(100), -- note, length may need to be longer???
    imgMenu1_on BIT
);

-- events table is finalized
CREATE TABLE IF NOT EXISTS events(
	-- primary key
    eventNum SERIAL PRIMARY KEY NOT NULL,
    -- The user who made this
    username VARCHAR(50)  REFERENCES users(username),
    -- Name of the event
    eventName VARCHAR(50), 
    -- Date of Event
    -- Time of Event
    -- eventDateTime DATETIME,
    -- Warn Time
   --  warnDateTime DATETIME,
    -- Description of Event
    eventDescription VARCHAR (280)
);