/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef } from 'react';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { Upload, Sparkles, Copy } from 'lucide-react';
import { motion } from 'motion/react';

const CopyToClipboard = ({ text, children }: { text: string; children: React.ReactNode }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };
  return (
    <button
      onClick={handleCopy}
      className="ml-2 p-1 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors duration-200"
      title="Copy to clipboard"
    >
      <Copy size={16} />
    </button>
  );
};

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateCopy = async () => {
    if (!image) return;

    setLoading(true);
    setTitle('');
    setDescription('');
    setTags([]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const base64Data = image.split(',')[1];
      const mimeType = image.split(';')[0].split(':')[1];

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: "You are an expert e-commerce copywriter. Analyze the provided product image. Generate a catchy product title, a compelling 3-4 sentence description highlighting the style, and 5 SEO-friendly tags. Return the response ONLY in valid JSON format like this: { 'title': '...', 'description': '...', 'tags': ['...', '...'] }",
            },
          ],
        },
        config: {
          responseMimeType: 'application/json',
        },
      });

      const jsonResponse = JSON.parse(response.text.trim());
      setTitle(jsonResponse.title);
      setDescription(jsonResponse.description);
      setTags(jsonResponse.tags);
    } catch (error) {
      console.error('Error generating copy:', error);
      alert('Failed to generate copy. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white shadow-2xl rounded-3xl p-8 max-w-5xl w-full border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-8"
      >
        {/* Left Column: Image Upload */}
        <div className="flex flex-col items-center space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">Upload Product Image</h2>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            ref={fileInputRef}
            className="hidden"
          />
          <div
            className="w-full max-w-md h-80 border-4 border-dashed border-indigo-300 rounded-xl flex items-center justify-center cursor-pointer hover:border-indigo-500 transition-all duration-300 relative overflow-hidden"
            onClick={() => fileInputRef.current?.click()}
          >
            {image ? (
              <img src={image} alt="Product Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center text-indigo-500">
                <Upload size={48} />
                <span className="mt-2 text-lg font-medium">Drag & Drop or Click to Upload</span>
              </div>
            )}
          </div>

          <button
            onClick={handleGenerateCopy}
            disabled={!image || loading}
            className="flex items-center space-x-2 px-8 py-3 bg-indigo-600 text-white font-semibold rounded-full shadow-lg hover:bg-indigo-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <Sparkles size={20} />
            )}
            <span>{loading ? 'Generating...' : 'Generate Copy'}</span>
          </button>
        </div>

        {/* Right Column: Generated Content */}
        <div className="flex flex-col space-y-6">
          <h1 className="text-4xl font-extrabold text-center text-gray-900 tracking-tight leading-tight mb-4 md:mb-0">
            E-commerce Copywriter
          </h1>
          <p className="text-center text-gray-600 text-lg mb-8 md:mb-0">
            Your AI-generated product copy will appear here.
          </p>

          {(title || description || tags.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-6"
            >
              {title && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xl font-bold text-gray-800">Product Title:</h2>
                    <CopyToClipboard text={title}><Copy size={16} /></CopyToClipboard>
                  </div>
                  <p className="text-lg text-gray-700">{title}</p>
                </div>
              )}

              {description && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xl font-bold text-gray-800">Description:</h2>
                    <CopyToClipboard text={description}><Copy size={16} /></CopyToClipboard>
                  </div>
                  <p className="text-base text-gray-700 leading-relaxed">{description}</p>
                </div>
              )}

              {tags.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xl font-bold text-gray-800">SEO Tags:</h2>
                    <CopyToClipboard text={tags.join(', ')}><Copy size={16} /></CopyToClipboard>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
