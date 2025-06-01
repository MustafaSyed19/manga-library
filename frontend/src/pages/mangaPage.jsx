import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import "./../styles/mangaPage.css";
import { FaBookmark, FaRegBookmark } from "react-icons/fa"; // filled and outline
import { useNavigate } from "react-router-dom";
import SearchBar from "./../components/searchBar";

const MangaPage = () => {
  const location = useLocation();
  const manga = location.state?.manga;
  const [chapters, setChapters] = useState({});
  const [allSelected, setAllSelected] = useState(true);
  const [Saved, setSaved] = useState(false);

  useEffect(() => {
    if (!manga) return;

    const fetchChapters = async () => {
      try {
        const res = await axios.post("http://localhost:5000/manga/chapterMap", {
          mangadexid: manga.mangadexid,
        });
        setChapters(res.data); // assuming res.data is an array or object you can loop through
      } catch (error) {
        console.error("Error fetching chapters:", error);
      }
    };
    const fetchSaveStatus = async () => {
      const status = await getSaveStatus();
      setSaved(status);
    };

    if (manga) fetchSaveStatus();

    fetchChapters();
  }, [manga]);

  const selectAll = (e) => {
    e.preventDefault();
    document.querySelectorAll(".chapter_radio").forEach((checkbox) => {
      checkbox.checked = allSelected;
      setAllSelected(!allSelected);
    });
  };
  const handleSubmit = async (e) => {
    let checkedEntries = [];
    e.preventDefault();
    document.querySelectorAll(".chapter_radio").forEach((checkbox) => {
      if (checkbox.checked) {
        checkedEntries.push(checkbox.name);
      }
    });

    try {
      const response = await axios.post(
        "http://localhost:5000/manga/chapterZip",
        {
          chapterMap: checkedEntries,
          chapterIDs: chapters.chapterIDs,
        },
        { responseType: "blob" }
      );

      const blob = new Blob([response.data], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "chapters.zip";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url); // cleanup
    } catch (err) {
      console.error("Download failed:", err);
    }
  };
  const check = (entry) => {
    const checkbox = document.getElementById(entry);
    checkbox.checked = !checkbox.checked;
  };
  const addSaved = async () => {
    try {
      const response = await axios.post(
        "http://localhost:5000/account/saveManga",
        {
            mangadexid: manga.mangadexid,
            title: manga.title,
            coverimageurl: manga.coverimageurl,
        },
        {
          withCredentials: true,
        }
      );
    } catch (error) {
    }
  };
  const removeSaved = async ()=> {
    try {
      const response = await axios.post(
        "http://localhost:5000/account/unSaveManga",
        {
            mangadexid: manga.mangadexid,
            title: manga.title,
            coverimageurl: manga.coverimageurl,
        },
        {
          withCredentials: true,
        }
      );
    } catch (error) {
    }
  }

  const getSaveStatus = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/account/getSavedStatus",
        {
          params: {
            mangadexid: manga.mangadexid,
          },
          withCredentials: true,
        }
      );

      return response.data.saved;
    } catch (error) {
      return false; // default to not saved if there's an error
    }
  };
const toggleSave = async () => {
  if (Saved) {
    await removeSaved();
    setSaved(false); // Update state after successful removal
  } else {
    await addSaved();
    setSaved(true); // Update state after successful addition
  }
};

  return (
    <div className="manga-page">
      <SearchBar></SearchBar>
      <div className="manga-info">
        <div className="manga-cover">
          <img
            src={manga.coverimageurl}
            alt={manga.title}
            className="manga-cover-image"
          />
        </div>

        <div className="title-row">
          <h1>{manga.title}</h1>
          <button 
            aria-label="Toggle Save" 
            onClick={toggleSave}
            className={Saved?'saved-button':'unsaved-button'}
          >
            {Saved ? <FaBookmark /> : <FaRegBookmark />}
          </button>
        </div>
        <div className="info-text">
          <p>
            <b>Description: </b>
            {manga.description}
          </p>
          <br />
          <p>
            <b>Author:</b> {manga.author}
          </p>
          <p>
            <b>Status:</b> {manga.status}
          </p>
          <p>
            <b>Chapters:</b> {manga.chapters}
          </p>
        </div>
      </div>
      <form action="" className="chapter_download">
        <button onClick={selectAll}>Select All</button>

        {chapters.sortedChapterIDs?.map((entry, index) => (
          <div key={index} onClick={() => check(entry)}>
            <input
              type="checkbox"
              name={entry}
              id={entry}
              className="chapter_radio"
            />
            <label htmlFor={entry} className="chapter_text">
              Chapter {entry}
            </label>
          </div>
        ))}
        <button type="submit" onClick={handleSubmit}>
          Download
        </button>
      </form>
    </div>
  );
};

export default MangaPage;
