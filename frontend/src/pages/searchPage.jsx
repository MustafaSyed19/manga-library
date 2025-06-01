import React, {useState} from "react";
import { useParams } from 'react-router-dom';
import SearchBar from "../components/searchBar";
import SearchedMangas from "../components/searchedMangas";
const SearchPage = (title) => 
{ 
    const { query } = useParams();
    const searchTerm = decodeURIComponent(query).substring(1);
    return (
        <>
            <SearchBar></SearchBar>
            <SearchedMangas title={searchTerm}></SearchedMangas>
        </>
    );
}
export default SearchPage; 