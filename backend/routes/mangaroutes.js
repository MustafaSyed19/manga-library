
const express = require('express');
const { searchManga, mangaInfo, coverImage } = require('./../services/mangaservice');

const router = express.Router();

//searches for the manga by title and returns the mangaID and coverArtID
router.post('/mangaSearch',searchManga); 

//returns the manga info including author, status, chapters, title and description
router.post('/mangaInfo', mangaInfo);

//returns the cover image URL for the manga
// router.post('/coverImage', coverImage);

module.exports = router; 