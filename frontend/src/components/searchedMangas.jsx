import React, { useEffect, useState } from "react";
import axios from "axios";
import "./../styles/searchedMangas.css";
import SearchManga from "./searchManga";

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
          title: title,
        }
      );
      returnedMangas = response.data;
    } catch (err) {
      setError("An error occured while searching for the manga");
      return;
    }    
    let mangaInfoStorage = [];
    try {
      for (let x = 0; x < returnedMangas.length; x++) {        
        const response = await axios.post(
          "http://localhost:5000/manga/mangaInfo",
          {
            mangadexid: returnedMangas[x].mangadexid,
            coverartid: returnedMangas[x].coverartid,
          }
        );
        mangaInfoStorage.push(response.data);
      }
    } catch (err) {
      setError("An error occured while fetching the mangaInfo");
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
  console.log(mangaResults);
  
  return (
    <div className="manga-container">
      {error && <p className="error">{error}</p>}
      {mangaResults.map((manga, index) => (
        <SearchManga manga = {manga} key={index}></SearchManga>
      ))}
    </div>
  );
};
export default SearchedMangas;
