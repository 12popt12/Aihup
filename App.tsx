import React, { useState, useCallback, ChangeEvent, FormEvent } from 'react';
import { processFile, ImageDetails } from './utils/fileUtils';
import { editImage } from './services/geminiService';
import { UploadIcon, SparklesIcon, SpinnerIcon, XCircleIcon, DownloadIcon, TrashIcon } from './components/icons';

interface ImageFileState extends ImageDetails {
  file: File;
}

// Helper components are defined outside the main App component
// to prevent re-creation on every render.

const ImagePlaceholder = ({ onImageUpload, isLoading }: { onImageUpload: (file: File) => void; isLoading: boolean; }) => {
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageUpload(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
  };
  
  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onImageUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="flex items-center justify-center w-full h-full">
      <label 
        htmlFor="file-upload" 
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="flex flex-col items-center justify-center w-full h-full max-w-lg p-8 border-2 border-dashed rounded-lg cursor-pointer bg-gray-800 border-gray-600 hover:border-indigo-500 hover:bg-gray-700 transition-colors duration-300"
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <UploadIcon className="w-10 h-10 mb-4 text-gray-400" />
          <p className="mb-2 text-sm text-center text-gray-400">
            <span className="font-semibold text-indigo-400">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-center text-gray-500">PNG, JPG, GIF up to 10MB</p>
        </div>
        <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/*" disabled={isLoading} />
      </label>
    </div>
  );
};

export default function App() {
  const [originalImage, setOriginalImage] = useState<ImageFileState | null>(null);
  const [editedImage, setEditedImage] = useState<{ url: string; mimeType: string; } | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    setEditedImage(null);
    try {
      const details = await processFile(file);
      setOriginalImage({ ...details, file });
    } catch (e: any) {
      setError(e.message);
      setOriginalImage(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleClear = useCallback(() => {
    setOriginalImage(null);
    setEditedImage(null);
    setPrompt('');
    setError(null);
    setIsLoading(false);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!originalImage || !prompt.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setEditedImage(null);
    
    try {
      const resultBase64 = await editImage(originalImage.base64, originalImage.mimeType, prompt);
      setEditedImage({
        url: `data:${originalImage.mimeType};base64,${resultBase64}`,
        mimeType: originalImage.mimeType,
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const getFileExtension = (mimeType: string) => {
    const parts = mimeType.split('/');
    return parts[parts.length - 1] || 'png';
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      <header className="p-4 sm:p-6 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
          Gemini Image Editor
        </h1>
        <p className="text-lg sm:text-xl text-gray-400 mt-2" lang="ar" dir="rtl">
          انشاء صور عن طريق رفع صورة و prompt
        </p>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center p-4 pb-40">
        {!originalImage && !isLoading && (
          <ImagePlaceholder onImageUpload={handleImageUpload} isLoading={isLoading} />
        )}
        
        {isLoading && !originalImage && (
            <div className="flex flex-col items-center justify-center text-gray-400">
                <SpinnerIcon className="w-12 h-12"/>
                <p className="mt-4">Processing image...</p>
            </div>
        )}

        {originalImage && (
          <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            <div className="flex flex-col items-center">
              <h2 className="text-xl font-semibold text-gray-300 mb-2">Original</h2>
              <div className="relative aspect-square w-full bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                <img src={originalImage.url} alt="Original" className="w-full h-full object-contain" />
                <button
                    onClick={handleClear}
                    className="absolute top-3 right-3 p-2 bg-gray-900/60 rounded-full text-white hover:bg-red-600/80 transition-all duration-300 ease-in-out backdrop-blur-sm"
                    title="Remove Image"
                    aria-label="Remove original image"
                >
                    <TrashIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <h2 className="text-xl font-semibold text-gray-300 mb-2">Edited</h2>
              <div className="relative aspect-square w-full bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center border border-gray-700">
                {isLoading && !editedImage && (
                  <div className="flex flex-col items-center text-gray-400">
                    <SpinnerIcon className="w-12 h-12" />
                    <p className="mt-4">Generating with Gemini...</p>
                  </div>
                )}
                {editedImage && (
                  <>
                    <img src={editedImage.url} alt="Edited" className="w-full h-full object-contain" />
                    <a
                      href={editedImage.url}
                      download={`edited-image.${getFileExtension(editedImage.mimeType)}`}
                      className="absolute top-3 right-3 p-2 bg-gray-900/60 rounded-full text-white hover:bg-indigo-600/80 transition-all duration-300 ease-in-out backdrop-blur-sm"
                      title="Download Image"
                      aria-label="Download edited image"
                    >
                      <DownloadIcon className="w-6 h-6" />
                    </a>
                  </>
                )}
                {!isLoading && !editedImage && (
                  <p className="text-gray-500">Your edited image will appear here</p>
                )}
              </div>
            </div>
          </div>
        )}

        {error && (
            <div className="fixed top-5 right-5 bg-red-800 text-white p-4 rounded-lg shadow-lg max-w-sm" role="alert">
                <p className="font-bold">Error</p>
                <p>{error}</p>
                <button onClick={() => setError(null)} className="absolute top-1 right-1 p-1">
                  <XCircleIcon className="w-5 h-5"/>
                </button>
            </div>
        )}

      </main>

      {originalImage && (
        <footer className="fixed bottom-0 left-0 right-0 bg-gray-900/80 backdrop-blur-sm border-t border-gray-700 p-4">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex items-center gap-2 sm:gap-4">
            <button
              type="button"
              onClick={handleClear}
              title="Start Over"
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <XCircleIcon className="w-6 h-6" />
            </button>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="اكتب ما تريد تعديله، مثلاً 'add a retro filter'"
              lang="ar" dir="auto"
              rows={1}
              className="flex-grow bg-gray-800 border border-gray-600 rounded-lg p-2.5 text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="flex items-center justify-center gap-2 px-4 py-2.5 font-semibold text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500"
            >
              {isLoading ? (
                <>
                  <SpinnerIcon className="w-5 h-5" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5" />
                  <span>Generate</span>
                </>
              )}
            </button>
          </form>
        </footer>
      )}
    </div>
  );
}