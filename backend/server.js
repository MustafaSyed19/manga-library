/*query to make my db
CREATE TABLE Manga (
  MangaID SERIAL PRIMARY KEY,
  MangaDexID INT,
  Title TEXT NOT NULL,
  Chapters INT,
  CoverImage TEXT,
  Description TEXT,
  Author TEXT,
  Status TEXT
);

CREATE TABLE Account (
  AccountId SERIAL PRIMARY KEY,
  Username VARCHAR(50) UNIQUE NOT NULL,
  PasswordHash TEXT NOT NULL,
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  LastLogin TIMESTAMP
);

CREATE TABLE DownloadedManga (
  AccountID INT NOT NULL,
  MangaID INT NOT NULL,
  PRIMARY KEY (AccountID, MangaID),
  FOREIGN KEY (AccountID) REFERENCES Account(AccountId) ON DELETE CASCADE,
  FOREIGN KEY (MangaID) REFERENCES Manga(MangaID) ON DELETE CASCADE
);
CREATE TABLE HistoryEntry (
  AccountID INT NOT NULL,
  MangaID INT NOT NULL,
  PRIMARY KEY (AccountID, MangaID),
  FOREIGN KEY (AccountID) REFERENCES Account(AccountId) ON DELETE CASCADE,
  FOREIGN KEY (MangaID) REFERENCES Manga(MangaID) ON DELETE CASCADE
);
*/

const express = require('express'); 
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const {Pool} = require('pg');
const authRoutes = require('./routes/authroutes')
const mangaRoutes = require('./routes/mangaroutes');

dotenv.config({ origin: 'http://localhost:3000'}); 
const app = express(); 

app.use(cors()); 
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(cookieParser());
app.use('/auth', authRoutes);
app.use('/manga', mangaRoutes);


const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
})

pool.query('SELECT NOW()',(err,res)=>
{
    if(err)
    {
        console.error("Database connection error: ", err)
    }
    else
    {
        console.log('Connected to PostgreSQL at:', res.rows[0].now);
    }
})


app.get('/',(req,res)=>
{
    res.send("Manga Libary backend is Running!")
}
)

const PORT = process.env.PORT||5000; 
app.listen(PORT, ()=>
{
    console.log(`Running Server on Port ${PORT}! `);
})

