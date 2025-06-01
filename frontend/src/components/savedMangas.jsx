import { useEffect, useState } from "react";
import axios from "axios";
import './../styles/savedMangas.css';
import { useNavigate } from "react-router-dom";

const SavedManga = () => {
  const [savedMangas, setSavedMangas] = useState([]);
  const navigate = useNavigate();
  
  useEffect(() => {
    const getSavedMangas = async () => {
      try {
        const res = await axios.get(
          "http://localhost:5000/account/getSavedManga", 
          {
            withCredentials: true,
          }
        );
        setSavedMangas(res.data);
      } catch (error) {
        console.error("Error fetching saved manga:", error);
      }
    };
    getSavedMangas();
  }, []);

  const onclick = (manga) => {
    navigate(`/manga/${manga.title}`, {
      state: {
        manga: manga,
      },
    });
  }

  return (
    <div className="saved-manga-container">
      <div className="saved-title">Saved Manga</div>
      <div className="saved-container">
        {savedMangas.map((manga, index) => {
          return (
            <div className="saved-manga" key={index} onClick={() => onclick(manga)}>
              <img src={manga.coverimageurl} alt=""/>
              <div className="saved-title">
                {manga.title}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
};

export default SavedManga;