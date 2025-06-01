const axios = require("axios");
const JSZip = require("jszip");
const fs = require('fs');
const { url } = require("inspector");


const BASEURL = "https://api.mangadex.org";
const IMAGEURL = "https://uploads.mangadex.org/data/";
const COVERURL = "https://uploads.mangadex.org/covers/";


/*for each search we need to get the mangadexid, coverImage*/
const searchManga = async (req,res) => {
  const {title} = req.body;  
  try {
    const response = await axios({
      method: "GET",
      url: `${BASEURL}/manga`,
      params: {
        title: title,
        limit:50
      },
    });


    // Ensure data exists
    if (!response.data?.data || !Array.isArray(response.data.data)) {
      console.error("Invalid API response:", response.data);
      return res.status(404).json({ error: "Invalid API response" });
    }


    let mangaList = response.data.data;
    const mangas = mangaList.map((manga) => ({
      mangadexid: manga.id,
      coverartid: manga.relationships.find((rel) => rel.type === "cover_art")
        ?.id,
    }));
    return res.status(200).json(mangas)
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "An error occurred while searching for manga." });
  }
};


const mangaInfo = async (req, res) => {
  const { mangadexid, coverartid } = req.body;
  console.log(mangadexid, coverartid);
  
  let manga;
  let author = "unknown";

  // Fetch manga info
  try {
    const response = await axios.get(`${BASEURL}/manga/${mangadexid}`);    
    manga = response.data?.data;

    if (!manga || !manga.attributes) {
      console.error("Invalid manga data:", response.data);
      return res.status(404).json({ error: "Manga not found" });
    }
  } catch (error) {
    // console.log("A problem occurred when fetching manga info:", error);
    return res.status(500).json({ error: "An error occurred while fetching manga info." });
  }

  // Fetch artist info
  try {
    const artistRel = manga.relationships.find(
      (rel) => rel.type === "artist"
    );
    
    const authorID = artistRel?.id;

    if (authorID) {
      const authorQuery = await axios.get(`${BASEURL}/author/${authorID}`);
      author = authorQuery.data?.data?.attributes?.name || "unknown";
    }
  } catch (error) {
    // console.log("A problem occurred when fetching author info:", error);
    return res.status(500).json({ error: "An error occurred while fetching author info." });
  }
  let fileURL = '';
  try
  {
      const response = await axios.get(`${BASEURL}/cover/${coverartid}`); 
      const fileName = response.data?.data?.attributes?.fileName;
      fileURL = `${COVERURL}${mangadexid}/${fileName}`;
  }
  catch(error)
  { 
      console.log("A problem occurred when fetching cover image:", error);
      return res.status(500).json({ error: "An error occurred while fetching cover image." });
  }

  // Build response
  //have to proxy url to a different link 
  
  const mangaInfo = {
    mangadexid: mangadexid,
    coverartid: coverartid,
    title: manga.attributes.title?.en || "Untitled",
    author: author,
    status: manga.attributes.status || "Unknown",
    chapters: manga.attributes.lastChapter || 0,
    description: manga.attributes.description?.en || "No description available",
    coverimageurl: fileURL
  };

  return res.status(200).json(mangaInfo);
};



const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));


const returnChapterMap = async (req, res) => {
  const { mangadexid } = req.body;
  const chapterIDs = {};
  let chapterImages = {};

  try {
    const response = await axios({
      method: "GET",
      url: `${BASEURL}/manga/${mangadexid}/feed?limit=500&translatedLanguage%5B%5D=en&contentRating%5B%5D=safe&contentRating%5B%5D=suggestive&contentRating%5B%5D=erotica&includeFutureUpdates=1&order%5BcreatedAt%5D=asc&order%5BupdatedAt%5D=asc&order%5BpublishAt%5D=asc&order%5BreadableAt%5D=asc&order%5Bvolume%5D=asc&order%5Bchapter%5D=asc`,
    });

    const chapterResponse = response.data.data;
    chapterResponse.forEach((manga) => {
      const chapterNo = manga.attributes.chapter;
      const id = manga.id;
      if (!chapterIDs[chapterNo]) {
        chapterIDs[chapterNo] = { id: [id] };
      }
    });
  } catch (error) {
    console.log("Error fetching chapters:", error);
    return res.status(500).json({ error: "Error fetching chapters." });
  }
  const sortedChapterIDs = Object.keys(chapterIDs)
  .sort((a, b) => parseFloat(a) - parseFloat(b));


  return res.status(200).json({sortedChapterIDs,chapterIDs});
}

const downloadChapters = async (req, res) => {
  const {chapterMap,chapterIDs} = req.body;  
  let chapterImages = {};

  for (let x=0; x< chapterMap.length; x++) {
    let chapterNo = chapterMap[x];
        const chapterID = chapterIDs[chapterNo]?.id[0];
      
      try {
        const response = await axios.get(`${BASEURL}/at-home/server/${chapterID}`);
        const path = response.data.chapter;
        chapterImages[chapterNo] = { hash: path.hash, data: path.data };
      } catch (error) {
        console.log("Error fetching chapter pages:", error);
        return res.status(500).json({ error: "Error fetching chapter pages." });
      }
      console.log(`chapter ${chapterNo} downloaded`);
      await delay(2000);
    }


  

  const zip = new JSZip();
  for (const entry in chapterImages) {
    const hash = chapterImages[entry].hash;
    const data = chapterImages[entry].data;
    for (let i = 0; i < data.length; i++) {
      const url = `${IMAGEURL}${hash}/${data[i]}`;
      try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const imageData = response.data;
        zip.file(`Chapter ${entry}-${i}.${url.split('.').pop()}`, imageData);
        console.log(`Chapter ${entry}-${i}`);
      } catch (error) {
        console.log("Error downloading image:", error);
      }
    }
  }

  try {
    const content = await zip.generateAsync({ type: 'nodebuffer' });
    // Just return the zip buffer instead of writing to disk
    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="chapters.zip"',
      'Content-Length': content.length,
    });
    return res.send(content);
  } catch (error) {
    console.error("Error generating zip file:", error);
    return res.status(500).json({ error: "Failed to create ZIP file." });
  }
};  



// const coverImage = async (req,res) => 
// { 
//   const {mangadexid, coverartid} = req.body;
//   try
//   { 
//       const response = await axios.get(`${BASEURL}/cover/${coverartid}`); 
//       const fileName = response.data?.data?.attributes?.fileName;
//       const fileURL = `${COVERURL}${mangadexid}/${fileName}`;
//       return res.status(200).json(fileURL);
      
//   }
//   catch(error)
//   { 
//       console.log("A problem occurred when fetching cover image:", error);
//       return res.status(500).json({ error: "An error occurred while fetching cover image." });
//   }
// }


module.exports = {  
  searchManga,
  mangaInfo,
  downloadChapters,
  returnChapterMap
};



//personal code for me to download without the web app + tester :)
// const main = async () => {
//   const title = "dorohedoro";
//   const mangas = await searchManga(title);
 
//   //print all the options
//   for(let x =0; x < mangas.length; x++)
//   {
//     let info = await mangaInfo(mangas[x].mangadexid,mangas[x].coverartid)
//     console.log(info);
    
//     console.log(`${x+1}. ${info.title}`);
//   }


//   //make a selection goofy js doesnt have a proper input method so always assume first result is correct
//   let selection = 1;
//   let info = await mangaInfo(mangas[selection-1].mangadexid)
//   console.log(`You have selected ${selection}. ${info.title}`);


//   //download the chapters to your local drive
//   console.log(await downloadChapters(mangas[selection-1].mangadexid,info.title));
// };

// const tester = async () => {
//   const title = "dorohedoro";
//   const mangas = await searchManga(title);
//   console.log(mangas.length);
//   const fileName = await coverImage(mangas[0].mangadexid,mangas[0].coverartid);
//   console.log(fileName);
  
// } 


// tester();
// main();


