import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import ReactMarkdown from 'react-markdown';

export default function Home() {
  const [files, setFiles] = useState([{ id: 1, name: 'Untitled', content: '' }]);
  const [activeFileId, setActiveFileId] = useState(1);
  const [wordCount, setWordCount] = useState(0);
  const [lineCount, setLineCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const editorRef = useRef(null);
  const previewRef = useRef(null);

  useEffect(() => {
    const savedFiles = localStorage.getItem('markdownFiles');
    if (savedFiles) {
      setFiles(JSON.parse(savedFiles));
    }

    const handleEditorScroll = () => {
      if (previewRef.current && editorRef.current) {
        const editorScrollPercentage = editorRef.current.scrollTop / (editorRef.current.scrollHeight - editorRef.current.clientHeight);
        previewRef.current.scrollTop = editorScrollPercentage * (previewRef.current.scrollHeight - previewRef.current.clientHeight);
      }
    };

    const editor = editorRef.current;
    if (editor) {
      editor.addEventListener('scroll', handleEditorScroll);
    }

    return () => {
      if (editor) {
        editor.removeEventListener('scroll', handleEditorScroll);
      }
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('markdownFiles', JSON.stringify(files));
    const activeFile = files.find(file => file.id === activeFileId);
    if (activeFile) {
      updateCounts(activeFile.content);
    }
  }, [files, activeFileId]);

  const handleChange = (e) => {
    const newContent = e.target.value;
    setFiles(files.map(file => 
      file.id === activeFileId ? { ...file, content: newContent } : file
    ));
  };

  const updateCounts = (text) => {
    setWordCount(text.trim().split(/\s+/).filter(Boolean).length);
    setLineCount(text.split('\n').length);
  };

  const addNewFile = () => {
    const newId = Math.max(...files.map(file => file.id), 0) + 1;
    setFiles([...files, { id: newId, name: `Untitled ${newId}`, content: '' }]);
    setActiveFileId(newId);
  };

  const deleteFile = (id) => {
    if (files.length > 1) {
      const newFiles = files.filter(file => file.id !== id);
      setFiles(newFiles);
      if (activeFileId === id) {
        setActiveFileId(newFiles[0].id);
      }
    }
  };

  const renameFile = (id, newName) => {
    setFiles(files.map(file => 
      file.id === id ? { ...file, name: newName } : file
    ));
  };

  const saveToDatabase = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/save-files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ files }),
      });

      if (!response.ok) {
        throw new Error('Failed to save files');
      }

      alert('Files saved successfully!');
    } catch (error) {
      console.error('Error saving files:', error);
      alert('Failed to save files. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const activeFile = files.find(file => file.id === activeFileId) || files[0];

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Head>
        <title>KUBERDENIS' Markdown Editor (GOOD)</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <nav className="flex justify-between items-center p-4 bg-gray-100">
        <div className="navbar-left">
          <span>markdown | <a href="https://kubeden.io" target="_blank" className="text-blue-500 hover:text-blue-700">kubeden.io</a></span>
        </div>
        <div className="flex gap-4">
          <a href="https://globchess.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">globchess.com</a>
          <a href="https://geeklore.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">geeklore.com</a>
          <a href="https://humalitics.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">humalitics.com</a>
        </div>
      </nav>

      <div className="flex items-center p-2 bg-gray-200 overflow-x-auto whitespace-nowrap">
        {files.map(file => (
          <div key={file.id} className={`inline-flex items-center mr-2 p-1 rounded ${file.id === activeFileId ? 'bg-white' : 'bg-gray-300'}`}>
            <input
              type="text"
              value={file.name}
              onChange={(e) => renameFile(file.id, e.target.value)}
              onClick={() => setActiveFileId(file.id)}
              className="border-none bg-transparent text-sm focus:outline-none"
            />
            {files.length > 1 && (
              <button onClick={() => deleteFile(file.id)} className="ml-2 text-gray-500 hover:text-gray-700">×</button>
            )}
          </div>
        ))}
        <button onClick={addNewFile} className="text-gray-500 hover:text-gray-700">+</button>
      </div>

      <main className="flex-grow flex overflow-hidden">
        <div className="flex flex-grow overflow-hidden">
          <textarea
            ref={editorRef}
            className="w-1/2 p-4 resize-none border-r border-gray-300 focus:outline-none overflow-y-auto"
            value={activeFile.content}
            onChange={handleChange}
            placeholder="Enter your markdown here..."
          />
          <div ref={previewRef} className="w-1/2 p-4 overflow-y-hidden markdown-body">
            <ReactMarkdown>{activeFile.content}</ReactMarkdown>
          </div>
        </div>
      </main>

      <footer className="flex justify-between items-center p-2 bg-gray-100">
        <div>
          <span className="mr-4">Words: {wordCount}</span>
          <span>Lines: {lineCount}</span>
        </div>
        <button 
          onClick={saveToDatabase} 
          disabled={isSaving}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save to Database'}
        </button>
      </footer>
    </div>
  );
}