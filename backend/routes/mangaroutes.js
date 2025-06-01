
const express = require('express');
const { searchManga, mangaInfo, coverImage,returnChapterMap,downloadChapters} = require('./../services/mangaservice');

const router = express.Router();

//searches for the manga by title and returns the mangaID and coverArtID
router.post('/mangaSearch',searchManga); 

//returns the manga info including author, status, chapters, title and description
router.post('/mangaInfo', mangaInfo);

//returns map of chapters that exist as well as their chapterID 
router.post('/chapterMap',returnChapterMap)

//returns a zip containing all the selected chapters 
router.post('/chapterZip', downloadChapters);

//returns the cover image URL for the manga
// router.post('/coverImage', coverImage);

module.exports = router; 