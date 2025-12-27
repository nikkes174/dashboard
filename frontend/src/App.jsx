import React from "react";
import {Routes, Route} from "react-router-dom";
import Login from "./pages/Login";
import Codex from "./pages/Codex";
import Users from "./pages/Users";

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<Login/>}/>
            <Route path="/users" element={<Users/>}/>
            <Route path="/codex" element={<Codex/>}/>
        </Routes>
    );
}
