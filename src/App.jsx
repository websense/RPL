import { useState, useEffect } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import QuickAssist from "./components/QuickAssist";  
import Home from "./pages/Home.jsx";
import Application from "./pages/Application.jsx";
import Thankyou from './pages/Thankyou.jsx';
import DatabasePage from "./pages/Database.jsx";
import ReviewSingleRecord from './pages/ReviewSingleRecord.jsx';
import Dashboard from './pages/Dashboard.jsx';
import StaffLogin from './pages/StaffLogin.jsx';
// to add more pages, import them here

import './App.css'
const TEST_ID = "68b93293fbbdab4300bb01d6"; // for testing ReviewSingleRecord page

function App() {
  const [count, setCount] = useState(0)
  
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/application" element={<Application />} />
        <Route path="/application/thankyou" element={<Thankyou />}/>
        <Route path='/database' element={<DatabasePage count={count} />} />
        <Route path='/review/:id' element={<ReviewSingleRecord />} />
        <Route path='/dashboard' element={<Dashboard />} />
        <Route path='/staff-login' element={<StaffLogin />} />
      </Routes>
      <QuickAssist position="floating-left" />
    </>
  )
}

export default App
