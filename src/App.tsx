/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import Groq from 'groq-sdk';
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
      className="ml-2 p-1 bg-gray-800 text-gray-300 rounded-md hover:bg-gray-700 hover:text-white transition-colors duration-200"
      title="Copy to clipboard"
    >
      <Copy size={16} />
    </button>
  );
};

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [title, setTitle] = useState<string>('');
  const [shortDescription, setShortDescription] = useState<string>('');
  const [longDescription, setLongDescription] = useState<string>('');
  const [metaTitle, setMetaTitle] = useState<string>('');
  const [metaDescription, setMetaDescription] = useState<string>('');
  const [keywords, setKeywords] = useState<string[]>([]);
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
    setShortDescription('');
    setLongDescription('');
    setMetaTitle('');
    setMetaDescription('');
    setKeywords([]);

    try {
      const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const base64Data = image.split(',')[1];
      const mimeType = image.split(';')[0].split(':')[1];

      // 1. Get image description from Gemini
      const geminiResponse: GenerateContentResponse = await gemini.models.generateContent({
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
              text: "Describe this product image in high detail. Mention all visible features, colors, the style, and the target audience.",
            },
          ],
        },
      });

      const imageDescription = geminiResponse.text;

      // 2. Generate E-commerce Copy via Groq using the description
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY, dangerouslyAllowBrowser: true });
      const prompt = `You are an expert e-commerce copywriter and SEO specialist. Analyze the following product description. Generate:\n1. A catchy product title\n2. A 1-2 sentence short description\n3. A detailed long description (2-3 paragraphs separated by \\n\\n)\n4. A SEO Meta Title (max 60 characters)\n5. A SEO Meta Description (max 160 characters)\n6. 5-7 SEO Keywords as an array of strings\n\nProduct Description:\n${imageDescription}\n\nReturn the response ONLY in valid JSON format like this: { "title": "...", "shortDescription": "...", "longDescription": "...", "metaTitle": "...", "metaDescription": "...", "keywords": ["...", "..."] }`;

      const groqResponse = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' },
      });

      const textResponse = groqResponse.choices[0]?.message?.content || '{}';
      const jsonResponse = JSON.parse(textResponse.trim());
      setTitle(jsonResponse.title);
      setShortDescription(jsonResponse.shortDescription);
      setLongDescription(jsonResponse.longDescription);
      setMetaTitle(jsonResponse.metaTitle);
      setMetaDescription(jsonResponse.metaDescription);
      setKeywords(jsonResponse.keywords);
    } catch (error: any) {
      console.error('Error generating copy:', error);
      alert(`Failed to generate copy: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-between p-4 md:p-8">
      {/* Main Header */}
      <div className="w-full max-w-[1400px] flex flex-col items-center text-center mt-4 mb-8">
        <img
          src="/images/snapcopy-logo.png"
          alt="SnapCopy Logo"
          className="h-16 md:h-20 object-contain"
        />
        <p className="text-gray-400 text-lg mt-3">
          E-commerce copywriter & SEO optimization tool.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gray-900 shadow-2xl rounded-3xl p-8 max-w-[1400px] w-full border border-gray-800 grid grid-cols-1 md:grid-cols-3 gap-8"
      >
        {/* Column 1: Image Upload */}
        <div className="flex flex-col items-center space-y-6">
          <h2 className="text-2xl font-bold text-gray-100">Upload Product Image</h2>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            ref={fileInputRef}
            className="hidden"
          />
          <div
            className="w-full border-4 border-dashed border-green-500/50 rounded-xl flex items-center justify-center cursor-pointer hover:border-green-400 transition-all duration-300 relative overflow-hidden bg-black/50"
            style={{ minHeight: '20rem' }}
            onClick={() => fileInputRef.current?.click()}
          >
            {image ? (
              <img src={image} alt="Product Preview" className="w-full h-auto max-h-[80vh] object-contain" />
            ) : (
              <div className="flex flex-col items-center text-green-500">
                <Upload size={48} />
                <span className="mt-2 text-lg font-medium">Drag & Drop or Click to Upload</span>
              </div>
            )}
          </div>

          <button
            onClick={handleGenerateCopy}
            disabled={!image || loading}
            className="flex items-center space-x-2 px-8 py-3 bg-black text-white font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <img src="/images/snapsave-fav.png" alt="Generate Icon" className="w-5 h-5" />
            )}
            <span>{loading ? 'Generating...' : 'Generate Details'}</span>
          </button>
        </div>

        {/* Column 2: Product Copy */}
        <div className="flex flex-col space-y-6">
          <h2 className="text-4xl font-extrabold text-center text-white tracking-tight leading-tight mb-4 md:mb-0">
            Product Details
          </h2>
          <p className="text-center text-gray-400 text-lg mb-8 md:mb-0">
            Your product details will appear here.
          </p>

          {(title || shortDescription || longDescription) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-6"
            >
              {title && (
                <div className="bg-black p-4 rounded-lg border border-gray-800">
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xl font-bold text-gray-100">Product Title:</h2>
                    <CopyToClipboard text={title}><Copy size={16} /></CopyToClipboard>
                  </div>
                  <p className="text-lg text-gray-300">{title}</p>
                </div>
              )}

              {shortDescription && (
                <div className="bg-black p-4 rounded-lg border border-gray-800">
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xl font-bold text-gray-100">Short Description:</h2>
                    <CopyToClipboard text={shortDescription}><Copy size={16} /></CopyToClipboard>
                  </div>
                  <p className="text-base text-gray-300 leading-relaxed">{shortDescription}</p>
                </div>
              )}

              {longDescription && (
                <div className="bg-black p-4 rounded-lg border border-gray-800">
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xl font-bold text-gray-100">Long Description:</h2>
                    <CopyToClipboard text={longDescription}><Copy size={16} /></CopyToClipboard>
                  </div>
                  <div className="text-base text-gray-300 leading-relaxed space-y-4">
                    {longDescription.split('\n\n').map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Column 3: SEO Metadata */}
        <div className="flex flex-col space-y-6">
          <h2 className="text-4xl font-extrabold text-center text-white tracking-tight leading-tight mb-4 md:mb-0">
            SEO Tags
          </h2>
          <p className="text-center text-gray-400 text-lg mb-8 md:mb-0">
            Optimized metadata for search engines.
          </p>

          {(metaTitle || metaDescription || keywords.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="space-y-6"
            >
              {metaTitle && (
                <div className="bg-black p-4 rounded-lg border border-gray-800">
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xl font-bold text-gray-100">Meta Title:</h2>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${metaTitle.length > 60 ? 'text-red-400' : 'text-green-500'}`}>
                        {metaTitle.length}/60
                      </span>
                      <CopyToClipboard text={metaTitle}><Copy size={16} /></CopyToClipboard>
                    </div>
                  </div>
                  <p className="text-lg text-gray-300">{metaTitle}</p>
                </div>
              )}

              {metaDescription && (
                <div className="bg-black p-4 rounded-lg border border-gray-800">
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xl font-bold text-gray-100">Meta Description:</h2>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${metaDescription.length > 160 ? 'text-red-400' : 'text-green-500'}`}>
                        {metaDescription.length}/160
                      </span>
                      <CopyToClipboard text={metaDescription}><Copy size={16} /></CopyToClipboard>
                    </div>
                  </div>
                  <p className="text-base text-gray-300 leading-relaxed">{metaDescription}</p>
                </div>
              )}

              {keywords.length > 0 && (
                <div className="bg-black p-4 rounded-lg border border-gray-800">
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xl font-bold text-gray-100">Keywords:</h2>
                    <CopyToClipboard text={keywords.join(', ')}><Copy size={16} /></CopyToClipboard>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-green-900/40 text-green-400 border border-green-800/50 rounded-full text-sm font-medium"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Footer */}
      <footer className="mt-auto pt-12 pb-4 w-full text-center text-gray-500 text-sm flex flex-row items-center justify-center space-x-2">
        <span>&copy; {new Date().getFullYear()} SnapCopy. All Rights Reserved.</span>
        <span className="text-gray-600">|</span>
        <span>
          Developed by:{' '}
          <a
            href="https://shakilmahmud.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-500 hover:text-green-400 font-medium transition-colors duration-200 hover:underline"
          >
            Shakil Mahmud
          </a>
        </span>
      </footer>
    </div>
  );
}
