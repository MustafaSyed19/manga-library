import logo from './logo.svg';
import './App.css';
import Login from './components/login.jsx';
import Register from './components/register.jsx';
import HomePage from './pages/homePage.jsx';
import SearchPage from './pages/searchPage.jsx';
import MangaPage from './pages/mangaPage.jsx';

import { BrowserRouter, Routes, Route, Link, useParams, Navigate, Outlet, createBrowserRouter, RouterProvider, Router } from 'react-router-dom';


function App() {
  const router = createBrowserRouter([
      { path: '/', element:<Navigate to="/login" replace /> }, 
      {path:'/login', element:<Login/>},
      {path:'/register', element:<Register/>},
      {path:'/home', element: <HomePage/>},
      {path:'/search/:query', element: <SearchPage/>},
      {path:'/manga/:title', element: <MangaPage/>},

  ]
  );
  return <RouterProvider router={router} />
}


export default App;
