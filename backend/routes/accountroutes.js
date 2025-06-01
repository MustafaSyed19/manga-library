const express = require('express');
const {  createManga,
  saveManga,
  unSaveManga,
  addHistoryManga,
  getSavedManga,
  getMangaHistory,
  getSavedStatus} = require('./../controllers/accountcontroller');

const router = express.Router();

router.get('/getSavedStatus', getSavedStatus);
router.get('/getSavedManga', getSavedManga);
router.get('/getMangaHistory', getMangaHistory);

router.post('/createManga', createManga);
router.post('/saveManga', saveManga);
router.post('/unSaveManga', unSaveManga);
router.post('/addHistory', addHistoryManga);


module.exports = router;
