const axios = require("axios");
const JSZip = require("jszip");
const fs = require('fs');
const { url } = require("inspector");


const BASEURL = "https://api.mangadex.org";
const IMAGEURL = "https://uploads.mangadex.org/data/";
const COVERURL = "https://uploads.mangadex.org/covers/";


/*for each search we need to get the mangaID, coverImage*/
const searchManga = async (req,res) => {
  const {mangaTitle} = req.body;
  try {
    const response = await axios({
      method: "GET",
      url: `${BASEURL}/manga`,
      params: {
        title: mangaTitle,
      },
    });


    // Ensure data exists
    if (!response.data?.data || !Array.isArray(response.data.data)) {
      console.error("Invalid API response:", response.data);
      return res.status(404).json({ error: "Invalid API response" });
    }


    let mangaList = response.data.data;
    const mangas = mangaList.map((manga) => ({
      mangaID: manga.id,
      coverArtid: manga.relationships.find((rel) => rel.type === "cover_art")
        ?.id,
    }));
    return res.status(200).json(mangas)
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "An error occurred while searching for manga." });
  }
};


const mangaInfo = async (req, res) => {
  const { mangaID, coverArtid } = req.body;

  let manga;
  let author = "unknown";

  // Fetch manga info
  try {
    const response = await axios.get(`${BASEURL}/manga/${mangaID}`);
    manga = response.data?.data;

    if (!manga || !manga.attributes) {
      console.error("Invalid manga data:", response.data);
      return res.status(404).json({ error: "Manga not found" });
    }
  } catch (error) {
    console.log("A problem occurred when fetching manga info:", error);
    return res.status(500).json({ error: "An error occurred while fetching manga info." });
  }

  // Fetch artist info
  try {
    const artistRel = manga.relationships.find(
      (rel) => rel.type === "author" && rel.role === "artist"
    );
    const authorID = artistRel?.id;

    if (authorID) {
      const authorQuery = await axios.get(`${BASEURL}/author/${authorID}`);
      author = authorQuery.data?.data?.attributes?.name || "unknown";
    }
  } catch (error) {
    console.log("A problem occurred when fetching author info:", error);
    return res.status(500).json({ error: "An error occurred while fetching author info." });
  }
  let fileURL = '';
  try
  {
      const response = await axios.get(`${BASEURL}/cover/${coverArtid}`); 
      const fileName = response.data?.data?.attributes?.fileName;
      fileURL = `${COVERURL}${mangaID}/${fileName}`;
  }
  catch(error)
  { 
      console.log("A problem occurred when fetching cover image:", error);
      return res.status(500).json({ error: "An error occurred while fetching cover image." });
  }

  // Build response
  const mangaInfo = {
    id: mangaID,
    coverArtid: coverArtid,
    title: manga.attributes.title?.en || "Untitled",
    author: author,
    status: manga.attributes.status || "Unknown",
    chapters: manga.attributes.lastChapter || "Unknown",
    description: manga.attributes.description?.en || "No description available",
    coverImageUrl: fileURL
  };

  return res.status(200).json(mangaInfo);
};



const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));


/*Download manga chapters, this is probs gonna be the meat of the code*/
const downloadChapters = async (req,res) => {

  const {mangaID, mangaTitle} = req.body;
  //fetch all chapter ids
  const chapterIDs = {};
  let chapterImages = {};


  try {
    const response = await axios({
      method: "GET",
      url: `${BASEURL}/manga/${mangaID}/feed?limit=500&translatedLanguage%5B%5D=en&contentRating%5B%5D=safe&contentRating%5B%5D=suggestive&contentRating%5B%5D=erotica&includeFutureUpdates=1&order%5BcreatedAt%5D=asc&order%5BupdatedAt%5D=asc&order%5BpublishAt%5D=asc&order%5BreadableAt%5D=asc&order%5Bvolume%5D=asc&order%5Bchapter%5D=asc`,
    });


    chapterResponse = response.data.data;


    chapterResponse.forEach((manga) => {
      const chapterNo = manga.attributes.chapter;
      const id = manga.id;


      if (!chapterIDs[chapterNo]) {
        chapterIDs[chapterNo] = {
          id: [id],
        };
      }
    });
  } catch (error) {
    console.log("A problem occured when fetching chapters " + error);
    return res.status(500).json({ error: "An error occurred while fetching chapters." });
  }
  x=0
 
  //fetch all images based on chapter ids
  for (const chapterNo in chapterIDs) {
    if (chapterIDs.hasOwnProperty(chapterNo)) {
      const chapterID = chapterIDs[chapterNo].id; // Assuming the ID is in the first element of the array
      try {
        const response = await axios({
          method: "GET",
          url: `${BASEURL}/at-home/server/${chapterID}`,
        });
        const path = response.data.chapter;


        chapterImages[chapterNo] = {
          hash: path.hash,
          data: path.data,
        };
      } catch (error) {
        console.log("A problem occurred when fetching chapter pages:", error);
        return res.status(500).json({ error: "An error occurred while fetching chapter pages." });
      }
      console.log(`chapter ${chapterNo} downloaded`);
      await delay(2000)
    }
    if(x++ == 10)
    {
      break;
    }
  }  




  const zip = new JSZip();  
  for (const entry in chapterImages) {
    //generate link for image
    hash = chapterImages[entry].hash;
    data = chapterImages[entry].data;  
    for(let x = 0; x < data.length; x++)
    {      
      let url = `${IMAGEURL}${hash}/${data[x]}`
      try
      {        
        await axios.get(url, {responseType:'arraybuffer'})
        .then(response =>
        {
          const imageData = response.data;
          console.log(`Chapter ${entry}-${x}`);      
          zip.file(`Chapter ${entry}-${x}.${url.split('.').pop()}`,imageData);
        }
        )
      }
      catch(error)
      {
        console.log(error);
      }
    }
  }
  try {
    const content = await zip.generateAsync({ type: 'nodebuffer' });
    fs.writeFileSync(`${mangaTitle}.cbz`, content);
    console.log('Zip file created successfully!');
  } catch (error) {
    console.error('Error generating zip file:', error);
  }
}

// const coverImage = async (req,res) => 
// { 
//   const {mangaID, coverArtid} = req.body;
//   try
//   { 
//       const response = await axios.get(`${BASEURL}/cover/${coverArtid}`); 
//       const fileName = response.data?.data?.attributes?.fileName;
//       const fileURL = `${COVERURL}${mangaID}/${fileName}`;
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
};



//personal code for me to download without the web app + tester :)
// const main = async () => {
//   const mangaTitle = "dorohedoro";
//   const mangas = await searchManga(mangaTitle);
 
//   //print all the options
//   for(let x =0; x < mangas.length; x++)
//   {
//     let info = await mangaInfo(mangas[x].mangaid,mangas[x].coverArtid)
//     console.log(info);
    
//     console.log(`${x+1}. ${info.title}`);
//   }


//   //make a selection goofy js doesnt have a proper input method so always assume first result is correct
//   let selection = 1;
//   let info = await mangaInfo(mangas[selection-1].mangaid)
//   console.log(`You have selected ${selection}. ${info.title}`);


//   //download the chapters to your local drive
//   console.log(await downloadChapters(mangas[selection-1].mangaid,info.title));
// };

// const tester = async () => {
//   const mangaTitle = "dorohedoro";
//   const mangas = await searchManga(mangaTitle);
//   console.log(mangas.length);
//   const fileName = await coverImage(mangas[0].mangaid,mangas[0].coverArtid);
//   console.log(fileName);
  
// } 


// tester();
// main();


