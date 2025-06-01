const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// User Registration
const register = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if the username already exists
    const userCheck = await pool.query(
      "SELECT * FROM ACCOUNT WHERE username=$1",
      [username]
    );
    if (userCheck.rowCount > 0) {
      return res
        .status(400)
        .json({ error: `Username: ${username} already taken` });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user into the database
    const result = await pool.query(
      "INSERT INTO ACCOUNT (USERNAME, PASSWORDHASH) VALUES ($1, $2) RETURNING accountId",
      [username, hashedPassword]
    );
    const user = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { accountid: user.accountid, username: username },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, {
      httpOnly: true, // Prevents JS access to the cookie
      secure: false, // Use true if HTTPS, false for local dev over HTTP
      sameSite: "Strict", // Protect against CSRF
      maxAge: 3600000, // 1 hour in milliseconds
    });

    return res
      .status(201)
      .json({ message: "User registered successfully", token, username });
  } catch (err) {
    console.error(err); // For debugging purposes
    return res
      .status(500)
      .json({ error: "Something went wrong during registration." });
  }
};

// User Login
const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if the user exists in the database
    const userCheck = await pool.query(
      "SELECT accountid, passwordhash FROM ACCOUNT WHERE username=$1",
      [username]
    );
    if (userCheck.rowCount === 0) {
      return res.status(401).json({ error: "username does not exist" });
    }

    const { accountid, passwordhash } = userCheck.rows[0];

    // Compare entered password with the stored hash
    const isMatch = await bcrypt.compare(password, passwordhash);
    if (!isMatch) {
      return res.status(401).json({ error: "Incorrect username or password" });
    }

    await pool.query("UPDATE ACCOUNT SET lastlogin=NOW() WHERE accountid=$1", [
      accountid]);

    // Generate JWT token
    const token = jwt.sign(
      { accountid: accountid, username: username },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.cookie("token", token, {
      httpOnly: true, // Prevents JS access to the cookie
      secure: false, // Use true if HTTPS, false for local dev over HTTP
      sameSite: "Strict", // Protect against CSRF
      maxAge: 3600000, // 1 hour in milliseconds
    });

    // Send the token to the client
    return res.status(200).json({ message: "Login successful", username });
  } catch (error) {
    console.error(error); // For debugging purposes
    return res.status(500).json({ error: "Something went wrong during login" });
  }
};

// User Logout (Clear JWT token)
const logout = (req, res) => {
  res.clearCookie("token"); // Clear the token cookie
  return res.status(200).json({ message: "Logged out successfully" });
};

module.exports = { register, login, logout };
