import React from 'react';

function Footer() {
  return (
    <footer className="bg-green-800 text-white text-center py-3 mt-auto">
      <span>&copy; {new Date().getFullYear()} Sustainable Lifestyle Companion</span>
    </footer>
  );
}

export default Footer;