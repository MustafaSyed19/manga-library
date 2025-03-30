const axios = require("axios");

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

  let x =0; 
  //fetch all images based on chapter ids
  //TODO: i need to use some sort of timeout function so I don't get the rate limited 
  //status code 429 
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
        if(x++ == 10)
        {
            break
        }
      } catch (error) {
        console.log("A problem occurred when fetching chapter pages:", error);
      }
    }
  }
  //Todo images to comic book archive format : ) 
};

(async () => {
  console.log(
    await downloadChapters(
      "bb8310e4-6050-4a43-984e-f7bbdfce23b1",
      "kokou no hitou"
    )
  );
})();
