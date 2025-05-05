const axios = require("axios");
const JSZip = require("jszip");
const fs = require('fs');
const { url } = require("inspector");


const BASEURL = "https://api.mangadex.org";
const IMAGEURL = "https://uploads.mangadex.org/data/";


/*for each search we need to get the mangaID, coverImage*/
const searchManga = async (mangaTitle) => {
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
      return [];
    }


    let mangaList = response.data.data;
    const mangas = mangaList.map((manga) => ({
      mangaid: manga.id,
      coverArtid: manga.relationships.find((rel) => rel.type === "cover_art")
        ?.id,
    }));
    return mangas;
  } catch (error) {
    console.log(error);
    return [];
  }
};


/*this returns mangaInfo in the case the user clicks on a manga title including author, status,
chapters, title and description*/
const mangaInfo = async (mangaID) => {
  try {
    const response = await axios({
      method: "GET",
      url: `${BASEURL}/manga/${mangaID}`,
    });


    let manga = response.data?.data;


    if (!manga || !manga.attributes) {
      console.error("Invalid manga data:", response.data);
      return null;
    }


    let authorID = manga.relationships.find((rel) => rel.type === "artist")?.id;
    let author = "unknown";
    if (authorID) {
      const authorquery = await axios({
        method: "GET",
        url: `${BASEURL}/author/${authorID}`,
      });
      author = authorquery.data?.data?.attributes?.name || "unknown";
    }


    const mangaInfo = {
      title: manga.attributes.title?.en || "Untitled",
      author: author,
      status: manga.attributes.status || "Unknown",
      chapters: manga.attributes.lastChapter || "Unknown",
      description:
        manga.attributes.description?.en || "No description available",
    };
    return mangaInfo;
  } catch (error) {
    console.log(error);
    return [];
  }
};


const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));


/*Download manga chapters, this is probs gonna be the meat of the code*/
const downloadChapters = async (mangaID, mangaTitle) => {
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


//personal code for me to download without the web app + tester :)
const main = async () => {
  const mangaTitle = "dorohedoro";
  const mangas = await searchManga(mangaTitle);
 
  //print all the options
  for(let x =0; x < mangas.length; x++)
  {
    let info = await mangaInfo(mangas[x].mangaid)
    console.log(`${x+1}. ${info.title}`);
  }


  //make a selection goofy js doesnt have a proper input method so always assume first result is correct
  let selection = 1;
  let info = await mangaInfo(mangas[selection-1].mangaid)
  console.log(`You have selected ${selection}. ${info.title}`);


  //download the chapters to your local drive
  console.log(await downloadChapters(mangas[selection-1].mangaid,info.title));
};


main();


