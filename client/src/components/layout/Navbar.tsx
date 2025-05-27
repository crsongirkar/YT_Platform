import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { motion } from "framer-motion";
import {
  Youtube,
  LucideUpload,
  UserCircle,
  LucideLogOut,
  Menu,
  X,
  UploadCloud,
} from "lucide-react";

const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-gray-800 py-4 sticky top-0 z-10">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            to="/"
            className="flex items-center space-x-2 transition-transform hover:scale-105"
          >
            <Youtube className="h-8 w-8 text-primary hover:text-red-500 transition-colors" />
            <span className="text-2xl font-bold text-white hover:text-primary transition-colors">
              YT
            </span>
          </Link>
        </motion.div>

        <div className="md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-white focus:outline-none"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Desktop menu */}
        <div className="hidden md:flex items-center space-x-6">
          {isAuthenticated ? (
            <>
              <Link
                to="/profile"
                className="flex items-center space-x-1 text-gray-300 hover:text-white transition"
              >
                <UserCircle size={18} />
                <span>Profile</span>
              </Link>
              <Link
                to="/upload"
                className="flex items-center space-x-1 text-gray-300 hover:text-white transition"
              >
                <LucideUpload size={18} />
                <span>Upload</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 text-gray-300 hover:text-white transition"
              >
                <LucideLogOut size={18} />
                <span>Logout</span>
              </button>

              <div className="text-gray-300">
                <span className="mr-2">💸</span>
                <span>₹{user?.balance || 0}</span>
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 rounded bg-transparent hover:bg-gray-700 text-white transition"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded bg-primary hover:bg-primary-dark text-white transition"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-gray-800 px-4 pt-2 pb-4">
          {isAuthenticated ? (
            <div className="flex flex-col space-y-4">
              <div className="text-gray-300 pb-2 border-b border-gray-700">
                <span className="mr-2">💰</span>
                <span>₹{user?.balance || 0}</span>
              </div>
              <Link
                to="/upload"
                className="flex items-center space-x-1 text-gray-300 hover:text-white transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                <UploadCloud size={18} />
                <span>Upload</span>
              </Link>
              <Link
                to="/profile"
                className="flex items-center space-x-1 text-gray-300 hover:text-white transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                <UserCircle size={18} />
                <span>Profile</span>
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center space-x-1 text-gray-300 hover:text-white transition"
              >
                <LucideLogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col space-y-4">
              <Link
                to="/login"
                className="px-4 py-2 rounded bg-transparent hover:bg-gray-700 text-white transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded bg-primary hover:bg-primary-dark text-white transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
