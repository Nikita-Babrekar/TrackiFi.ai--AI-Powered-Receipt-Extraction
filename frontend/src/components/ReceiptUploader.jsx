import React, { useState, useRef } from 'react';

const ReceiptUploader = ({ onUploadStart, onUploadSuccess, onUploadError }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const processFile = async (file) => {
    if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {
      onUploadError("Please upload a PNG or JPEG image.");
      return;
    }

    onUploadStart(file);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('https://trackifiai-ai-powered-receipt-extraction-production.up.railway.app/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process receipt');
      }

      const responseData = await response.json();
      onUploadSuccess(responseData.data);
    } catch (error) {
      onUploadError(error.message);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="uploader-container">
      <div
        className={`drop-zone glass-panel ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/png, image/jpeg"
          style={{ display: 'none' }}
        />

        <div className="upload-prompt">
          <div className="upload-icon-wrapper">
            <svg className="upload-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
          </div>
          <h3>Drag & Drop Receipt</h3>
          <p>or click to browse files</p>
          <span className="file-hint">Supports PNG, JPG up to 10MB</span>
        </div>
      </div>
    </div>
  );
};

export default ReceiptUploader;
