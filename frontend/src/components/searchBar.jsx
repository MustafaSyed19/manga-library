import React, { useState} from 'react'; 
import { useNavigate } from 'react-router-dom';
import "./searchBar.css";

const SearchBar = () =>
{ 
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const handleSubmit = async (e) =>
    { 
        e.preventDefault(); 
        if (searchTerm.trim() === '') {
            setError("Please enter a search term.");
            return;
        }
        setError("")
        navigate(`/search/:${encodeURIComponent(searchTerm)}`);
    }

    return (
        <div class="entries">
            <form onSubmit={handleSubmit} class="form-container">
                <div className="search-container">
                <input 
                type="text" 
                name="" 
                id="search" 
                onChange={(e)=>{setSearchTerm(e.target.value)
                }}
                required/>
                <button type="submit" on>Search</button>
                </div>
            </form>
            {error && <p className='error'>{error}</p>}

        </div>
    )
}
export default SearchBar;