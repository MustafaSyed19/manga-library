import React, { useEffect, useState } from "react";
import axios from "axios";

const SearchedMangas = ({ title }) => {
  const [error, setError] = useState("");
  const [mangaResults, setMangaResults] = useState([]);

  const returnMangas = async () => {
    let returnedMangas = [];
    try {
      //search the manga using the API
      const response = await axios.post(
        "http://localhost:5000/manga/mangaSearch",
        {
          mangaTitle: title,
        }
      );
      returnedMangas = response.data;
    } catch (err) {
        setError("An error occured while searching for the manga")
        return;
    }
    let mangaInfoStorage= [];
    try
    { 
      for (let x = 0; x < returnedMangas.length; x++) {
        const response = await axios.post(
          "http://localhost:5000/manga/mangaInfo",
          {
            mangaID: returnedMangas[x].mangaID,
            coverArtid: returnedMangas[x].coverArtid
          }
        );
        mangaInfoStorage.push(response.data)
      }
    }
    catch(err)
    { 
        setError("An error occured while fetching the mangaInfo")
        return;
    }
    setMangaResults(mangaInfoStorage);
    return; 
  };
  useEffect(() => {
    if (title) {
      returnMangas();
    }
  }, [title]);

  return (
    <div className="manga-container">
      {error && <p className="error">{error}</p>}
      {mangaResults.map((manga) => {
        <div>{}</div>;
        <div>{}</div>
      })}
    </div>
  );
};
export default SearchedMangas;
