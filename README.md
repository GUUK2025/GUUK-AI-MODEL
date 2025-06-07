mkdir cropbatch
cd cropbatch
mkdir -p src/components
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ImageGrid } from './components/ImageGrid';
import './App.css';

function App() {
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [customRatio, setCustomRatio] = useState({ width: 1, height: 1 });
  const [croppingMethod, setCroppingMethod] = useState('center');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleUpload = (event) => {
    const files = Array.from(event.target.files);
    const newImages = files.map((file, index) => ({
      id: `image-${Date.now()}-${index}`,
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages((prevImages) => [...prevImages, ...newImages]);
    if (newImages.length > 0 && !selectedImage) {
      setSelectedImage(newImages[0]);
    }
  };

  const handleDownload = () => {
    // This will be implemented later to handle actual image cropping and download
    alert('Download functionality will be implemented soon!');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex flex-col h-screen">
      <Header onUpload={() => document.getElementById('fileInput').click()} onDownload={images.length > 0 ? handleDownload : null} isMobile={isMobile} onToggleSidebar={toggleSidebar} />
      <input
        type="file"
        id="fileInput"
        multiple
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleUpload}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          aspectRatio={aspectRatio}
          setAspectRatio={setAspectRatio}
          croppingMethod={croppingMethod}
          setCroppingMethod={setCroppingMethod}
          customRatio={customRatio}
          setCustomRatio={setCustomRatio}
          isOpen={isSidebarOpen}
        />
        <main className="flex-1 overflow-auto p-4">
          {images.length === 0 ? (
            <div className="flex items-center justify-center h-full border-2 border-dashed border-gray-300 rounded-lg">
              <p className="text-gray-500">Upload images to get started</p>
            </div>
          ) : (
            <ImageGrid
              images={images}
              selectedImage={selectedImage}
              setSelectedImage={setSelectedImage}
              aspectRatio={aspectRatio}
              croppingMethod={croppingMethod}
              customRatio={customRatio}
            />
          )}
        </main>
        {/* Right Panel for individual image adjustments will go here */}
      </div>
    </div>
  );
}

export default App;
// ...existing code...# GUUK-AI-MODEL
