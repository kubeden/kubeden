// pages/index.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import ReactMarkdown from 'react-markdown';

export default function Home() {
  const [markdown, setMarkdown] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [lineCount, setLineCount] = useState(0);

  useEffect(() => {
    const savedMarkdown = localStorage.getItem('markdown');
    if (savedMarkdown) {
      setMarkdown(savedMarkdown);
      updateCounts(savedMarkdown);
    }
  }, []);

  const handleChange = (e) => {
    const newMarkdown = e.target.value;
    setMarkdown(newMarkdown);
    localStorage.setItem('markdown', newMarkdown);
    updateCounts(newMarkdown);
  };

  const updateCounts = (text) => {
    setWordCount(text.trim().split(/\s+/).filter(Boolean).length);
    setLineCount(text.split('\n').length);
  };

  return (
    <div className="container">
      <Head>
        <title>Markdown Editor</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <nav className="navbar">
        <div className="navbar-left">
          <span>markdown | <a href="https://kubeden.io" target="_blank">kubeden.io</a></span>
        </div>
        <div className="navbar-right">
          <a href="https://globchess.com" target="_blank" rel="noopener noreferrer">globchess.com</a>
          <a href="https://geeklore.com" target="_blank" rel="noopener noreferrer">geeklore.com</a>
          <a href="https://humalitics.com" target="_blank" rel="noopener noreferrer">humalitics.com</a>
        </div>
      </nav>

      <main>
        <div className="editor-container">
          <textarea
            className="editor"
            value={markdown}
            onChange={handleChange}
            placeholder="Enter your markdown here..."
          />
          <div className="preview">
            <ReactMarkdown>{markdown}</ReactMarkdown>
          </div>
        </div>
      </main>

      <footer className="info-bar">
        <span>Words: {wordCount}</span>
        <span>Lines: {lineCount}</span>
      </footer>

      <style jsx>{`
        .container {
          display: flex;
          flex-direction: column;
          height: 100vh;
        }
        .navbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background-color: #f0f0f0;
        }
        .navbar-right {
          display: flex;
          gap: 1rem;
        }
        main {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
        }
        .editor-container {
          display: flex;
          flex-grow: 1;
        }
        .editor, .preview {
          width: 50%;
          padding: 1rem;
          overflow-y: auto;
        }
        .editor {
          resize: none;
          border: none;
          border-right: 1px solid #ccc;
          outline: none;
        }
        .editor:focus {
          outline: none;
          border: none;
          border-right: 1px solid #ccc;
        }
        .preview {
          border-left: 1px solid #ccc;
        }
        .info-bar {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 1rem;
          background-color: #f0f0f0;
        }
      `}</style>

      <style jsx global>{`
        html,
        body {
          padding: 0;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto,
            Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue,
            sans-serif;
        }
        * {
          box-sizing: border-box;
        }
        body {
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}