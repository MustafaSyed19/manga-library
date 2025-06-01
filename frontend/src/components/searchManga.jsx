import "./../styles/searchManga.css";
import { useNavigate } from "react-router-dom";
import React from "react";
import axios from "axios";

const SearchManga = ({ manga }) => {
  const navigate = useNavigate();
  const onclickHandler = async () => {
    const res = await axios.post("http://localhost:5000/account/createManga", {
      mangadexid: manga.mangadexid,
      coverimageurl: manga.coverimageurl,
      title: manga.title,
      author: manga.author,
      status: manga.status,
      chapters: manga.chapters,
      description: manga.description,
    });
    

    const ret = await axios.post(
      "http://localhost:5000/account/addHistory",
      { mangadexid: manga.mangadexid, title:manga.title,coverimageurl:manga.coverimageurl},
      { withCredentials: true } // <-- this is mandatory here to send cookies!
    );

    navigate(`/manga/${encodeURIComponent(manga.title)}`, {
      state: {
        manga: manga,
      },
    });
  };

  return (
    //convert to this onclick such that it will redirect to the manga page
    <div className="image-wrapper" onClick={onclickHandler}>
      <img
        src={manga.coverimageurl}
        alt={manga.title}
        className="manga-image"
      />
      <div>{manga.title}</div>
    </div>
  );
};
export default SearchManga;
