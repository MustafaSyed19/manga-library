import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./../styles/searchBar.css";
import { FaHome } from "react-icons/fa";

const SearchBar = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (searchTerm.trim() === "") {
      setError("Please enter a search term.");
      return;
    }
    setError("");
    navigate(`/search/:${encodeURIComponent(searchTerm)}`);
  }; 
  const goHome = async (e) =>
  { 
    navigate('/home')
  }
  return (
    <div className="entries">
      <div className="home-icon-wrapper" onClick={()=>goHome()}>
        <FaHome className="home-icon" />
      </div>
      <form onSubmit={handleSubmit} className="form-container">
        <input
          type="text"
          id="search"
          onChange={(e) => {
            setSearchTerm(e.target.value);
          }}
          placeholder="Search a Manga"
          required
        />
        <button id="submit" type="submit">
          Search
        </button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  );
};
export default SearchBar;
