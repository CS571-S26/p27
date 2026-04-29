import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./hooks/AppContext";
import AppNavBar from "./components/AppNavBar";
import HomePage from "./pages/HomePage";
import TierListPage from "./pages/TierListPage";
import FavoritesPage from "./pages/FavoritesPage";
import StatsPage from "./pages/StatsPage";
import BracketPickerPage from "./pages/BracketPickerPage";

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter basename="/p27">
        <AppNavBar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/tierlist" element={<TierListPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/bracket" element={<BracketPickerPage />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
