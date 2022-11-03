CREATE TABLE IF NOT EXISTS users(
    -- Username and password
    username VARCHAR(50) PRIMARY KEY NOT NULL,
    userPassword CHAR(60) NOT NULL
    -- Theme info inserted below
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