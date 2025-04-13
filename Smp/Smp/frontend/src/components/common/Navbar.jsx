import { Link } from "react-router-dom";
import { useState } from "react";
import { FiMenu, FiX } from "react-icons/fi";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Mentors", path: "/mentors" },
    { name: "Chat", path: "/chat" },
    { name: "Resources", path: "/resources" },
  ];

  return (
    <nav className="bg-richblack-900 border-b border-richblack-700 text-richblack-5 px-6 py-4 shadow-md">
      <div className="flex justify-between items-center max-w-7xl mx-auto">
        {/* Logo */}
        <Link to="/" className="text-xl font-bold text-yellow-400 tracking-wide">
          SMP HUB
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex gap-6 text-sm">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className="hover:text-yellow-400 transition duration-200"
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Mobile Menu Icon */}
        <button className="md:hidden text-xl" onClick={toggleMenu}>
          {mobileMenuOpen ? <FiX /> : <FiMenu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="flex flex-col md:hidden gap-3 mt-4 px-4 text-sm">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              onClick={toggleMenu}
              className="hover:text-yellow-400 transition"
            >
              {link.name}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
