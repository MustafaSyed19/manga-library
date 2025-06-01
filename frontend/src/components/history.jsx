import { useEffect, useState } from "react";
import axios from "axios";
import './../styles/history.css'
import { useNavigate } from "react-router-dom";


const History = () => {
  const [mangas, setMangas] = useState([]);
  const navigate = useNavigate();
  useEffect(() => {
    const getMangas = async () => {
      try {
        const res = await axios.get(
          "http://localhost:5000/account/getMangaHistory",
          {
            withCredentials: true,
          }
        );
        setMangas(res.data);
      } catch (error) {
        console.error("Error fetching history:", error);
      }
    };
    getMangas();
  }, []);
  const onclick = (manga)=> 
  { 
    navigate(`/manga/${manga.title}`,{
        state:{
            manga: manga,
        },
    });
  }

  return (
    <div className="history">
      <div className="history-title">History</div>
      <div className="history-container">
        {mangas.map((manga, index) => {
          return (
          <div className="manga" key={index} onClick={()=> onclick(manga)}>
            <img src={manga.coverimageurl} alt=""/>
            <div className="title">
              {manga.title}
            </div>
          </div>)
        })}
      </div>
    </div>
  );
};
export default History;
