import SearchBar from "../components/searchBar";
import History from './../components/history';
import SavedManga from './../components/savedMangas';
import './../styles/homepage.css';
const HomePage = () => 
{ 
    return (
            <div className="bg">
                <SearchBar></SearchBar>
                <History></History>
                <SavedManga></SavedManga>
            </div>
    );
}
export default HomePage;