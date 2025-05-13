import React, {useState} from "react";
import SearchBar from "../components/searchBar";
import SearchedMangas from "../components/searchedMangas";
const SearchPage = () => 
{ 
    return (
        <>
            <SearchBar></SearchBar>
            <SearchedMangas></SearchedMangas>
        </>
    );
}
export default SearchPage; 