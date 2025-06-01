const cookieParser = require("cookie-parser");
const { Pool } = require("pg");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

//implement endpoint to create a manga if its mangadex mangadexid does not already exist within the db
const createManga = async (req, res) => {
  const { mangadexid, coverimageurl, title, author, status, chapters, description } =
    req.body;    
  try {
    const existing = await pool.query(
      `SELECT * FROM Manga WHERE mangadexid = $1`,
      [mangadexid]
    );

    if (existing.rows.length > 0) {
      return res
        .status(202)
        .json({ message: "Manga already exists", manga: existing.rows[0] });
    }

    const result = await pool.query(
      `INSERT INTO manga (mangadexid, title, chapters, coverimageurl, description, author, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [mangadexid, title, chapters, coverimageurl, description, author, status]
    );
    console.log(result.rows[0]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating manga:", error);
    // Handle database down or other server errors
    return res.status(500).json({ error: "Internal server error" });
  }
};

//implement endpoint such that it saves the mangas to saved
const saveManga = async (req, res) => {
  const { mangadexid, title, coverimageurl} = req.body;
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: "Authentication token missing" });
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const accountid = decoded.accountid;
  try {
    const result = await pool.query(
      `INSERT INTO DownloadedManga (mangadexid, accountid,coverimageurl,title) VALUES ($1, $2,$3,$4) RETURNING *`,
      [mangadexid, accountid, coverimageurl, title]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating manga:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

//implement endpoint such that it removes the mangas from saved
const unSaveManga = async (req, res) => {
  const { mangadexid } = req.body;
  const token = req.cookies.token;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const accountid = decoded.accountid;
  try {
    const result = await pool.query(
      `DELETE FROM DownloadedManga WHERE accountid=$2 AND mangadexid=$1 RETURNING *`,
      [mangadexid, accountid]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating manga:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

//implement endpoint such that it saves the mangas to history (limit this to 10 mangas)
const addHistoryManga = async (req, res) => {
  const { mangadexid,title, coverimageurl } = req.body;
  const token = req.cookies.token;  
  
  if (!token) {
    return res.status(401).json({ error: "Authentication token missing" });
  }
  let decoded = jwt.verify(token, process.env.JWT_SECRET);
  const accountid = decoded.accountid;  
  

  const validationQuery = "Select * from historyentry where accountid = $1 and mangadexid = $2";
  const deleteQuery = `DELETE FROM historyentry WHERE ctid IN (
            SELECT ctid FROM historyentry
            WHERE accountid = $1 
            ORDER BY CreatedAt ASC 
            LIMIT 1 
        ) AND (SELECT COUNT(*) FROM historyentry WHERE accountid = $1) >= 10`;
  const insertQuery = `INSERT INTO historyentry (accountid, mangadexid,coverimageurl, title, createdat)
        VALUES ($1, $2,$3,$4, NOW()) 
        ON CONFLICT (accountid,mangadexid) 
        DO UPDATE SET createdat = NOW()`;
  let validationResult;
  try {    
    console.log(accountid,mangadexid);
    validationResult = await pool.query(validationQuery, [accountid,mangadexid]);
    
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Internal server error trying to find manga" });
  }  
  if (validationResult.rows.length === 0) {
    try {
      await pool.query(deleteQuery, [accountid]);
    } catch (error) {
      return res
        .status(500)
        .json({ error: "Internal server error trying to delete manga" });
    }
  }

  try {
    const ret = await pool.query(insertQuery, [accountid,mangadexid,coverimageurl,title]);
    res.status(201).json({ message: "Manga history updated or added." });
  } catch (error) {
    console.log(error);

    return res
      .status(500)
      .json({ error: "Internal server error trying to insert manga" });
  }
};

//implement endpoint that returns saved mangas for a specific user
const getSavedManga = async (req, res) => {
  const token = req.cookies.token;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const accountid = decoded.accountid;

  const query = `SELECT * FROM DownloadedManga Where AccountID=$1`;
  try {
    const ret = await pool.query(query, [accountid]);
    return res.status(200).json(ret.rows);
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Internal server error trying to retrieve saved manga" });
  }
};

const getSavedStatus = async(req,res) => 
{ 
  const { mangadexid } = req.query;
  const token = req.cookies.token; 
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const accountid = decoded.accountid;

  const query = `SELECT * FROM DownloadedManga WHERE AccountID=$1 AND mangadexid=$2`;
  try {
    const result = await pool.query(query, [accountid, mangadexid]);
    if (result.rows.length > 0) {
      return res.status(200).json({ saved: true });
    } else {
      return res.status(200).json({ saved: false });
    }
  } catch (error) {
    console.error("Error checking saved status:", error);
    return res
      .status(500)
      .json({ error: "Internal server error while checking saved status" });
  }
}

//implement endpoint that returns history for a specific user
const getMangaHistory = async (req, res) => {
  const token = req.cookies.token;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const accountid = decoded.accountid;
  
  const query = `SELECT * FROM HistoryEntry Where AccountID=$1`;
  
  let historyEntries;
  try {
    historyEntries = await pool.query(query, [accountid]);    
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Internal server error trying to retrieve saved manga" });
  }
  let ret = [];
  try {
    for (let i = 0; i < historyEntries.rows.length; i++) { 
           
      const manga = await pool.query(
        `SELECT * FROM Manga Where mangadexid=$1`,
        [historyEntries.rows[i].mangadexid]
      );
      ret.push(
        manga.rows[0],
      );
    }
    console.log(ret);
    return res.status(200).json(ret);
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Internal server error trying to retrieve saved manga" });
  }
};
module.exports = {
  createManga,
  saveManga,
  unSaveManga,
  addHistoryManga,
  getSavedManga,
  getMangaHistory,
  getSavedStatus
};

  