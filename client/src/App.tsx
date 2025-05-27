import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Register from './pages/auth/Register';
import Login from './pages/auth/Login';
import Feed from './pages/feed/Feed';
import VideoUpload from './pages/creator/VideoUpload';
import VideoPlayer from './pages/video/VideoPlayer';
import Navbar from './components/layout/Navbar';
import Profile from './pages/profile/Profile';
import NotFound from './pages/NotFound';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-900 text-white">
          <Navbar />
          <div className="container mx-auto px-4 py-4 md:py-8">
            <Routes>
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Feed />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/upload"
                element={
                  <ProtectedRoute>
                    <VideoUpload />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/video/:videoId"
                element={
                  <ProtectedRoute>
                    <VideoPlayer />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;