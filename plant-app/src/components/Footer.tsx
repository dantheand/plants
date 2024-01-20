import React from "react";
import { FaGithub } from "react-icons/fa"; // Importing GitHub icon
import "../styles/styles.scss";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <a
          className="hoverable-icon"
          href="https://github.com/dantheand/plants/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaGithub size={30} /> {/* GitHub icon with size 30 */}
        </a>
      </div>
    </footer>
  );
};

export default Footer;
