'use client';

import { useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Topic {
  id: string;
  name: string;
  week_number: number;
}

interface PDFUploadAreaProps {
  topic: Topic;
  classUUID: string;
  onUpload: (pdfUrl: string) => void; // <-- add this
}

export default function PDFUploadArea({ topic, classUUID, onUpload }: PDFUploadAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedPDFs, setUploadedPDFs] = useState<string[]>([]);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (!files.length) return;
    await uploadFiles(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await uploadFiles(e.target.files);
    }
  };

  const uploadFiles = async (files: FileList) => {
    const pdfFiles = Array.from(files).filter(f => f.type === 'application/pdf');
    for (const file of pdfFiles) {
      const path = `${classUUID}/${topic.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from('pdf-uploads').upload(path, file, {
        upsert: true,
      });
      if (error) {
        console.error('Upload failed:', error.message);
      } else {
        setUploadedPDFs(prev => [...prev, path]);
        const publicUrl = `https://cmvltdxdbkknpukrukbx.supabase.co/storage/v1/object/public/pdf-uploads/${path}`;
        onUpload(publicUrl); // <-- notify parent
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="mt-4">
      <h4 className="font-semibold mb-2">Upload PDF Notes</h4>
      <div
        className={`border-2 p-4 rounded text-center cursor-pointer transition ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
        }`}
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <p>Drag & drop your PDF here or click to upload</p>
        <input
          type="file"
          hidden
          ref={fileInputRef}
          accept="application/pdf"
          onChange={handleFileInputChange}
        />
      </div>

      {uploadedPDFs.length > 0 && (
        <ul className="mt-3 list-disc text-sm text-gray-700 pl-5">
          {uploadedPDFs.map((path, index) => (
            <li key={index}>
              <a
                href={`https://cmvltdxdbkknpukrukbx.supabase.co/storage/v1/object/public/pdf-uploads/${path}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                {path.split('/').pop()}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
