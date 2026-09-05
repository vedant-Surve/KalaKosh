import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import PratyakshaChat from "./components/PratyakshaChat";

import Home from "./pages/Home";
import Gallery from "./pages/Gallery";
import ArtworkDetails from "./pages/ArtworkDetails";
import Contribute from "./pages/Contribute";
import QRScanner from "./pages/QRScanner";
import ARScanner from "./pages/ARScanner";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/admin/AdminDashboard";
import HotspotEditor from "./pages/admin/HotspotEditor";

export default function App() {
  return (
    <div className="min-h-screen bg-parchment flex flex-col selection:bg-terracotta selection:text-white">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/artworks/:id" element={<ArtworkDetails />} />
          <Route path="/scan" element={<QRScanner />} />
          <Route path="/ar" element={<ARScanner />} />
          <Route
            path="/contribute"
            element={
              <ProtectedRoute>
                <Contribute />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/hotspot-mapper"
            element={
              <ProtectedRoute adminOnly>
                <HotspotEditor />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {/* Pratyaksha Cultural AI Chatbot — globally mounted */}
      <PratyakshaChat />
    </div>
  );
}

function NotFound() {
  return (
    <div className="text-center py-28 max-w-md mx-auto space-y-4">
      <p className="text-6xl animate-bounce">🏺</p>
      <h1 className="font-serif text-5xl font-black text-earth-900">404</h1>
      <p className="text-base text-earth-600">
        This corridor of the living archive has not yet been documented.
      </p>
      <div className="pt-4">
        <Link to="/" className="btn btn-primary btn-md">
          ← Return to Living Archive
        </Link>
      </div>
    </div>
  );
}
