'use client';

import React from 'react';
import CloudinaryImage from '../common/CloudinaryImage';

const CloudinaryTest = () => {
  // URL de test Cloudinary (remplacez par une vraie URL de votre compte)
  const testImageUrl = "https://res.cloudinary.com/dkp46n0ce/image/upload/v1/users/avatars/user_b223d2db-b0b4-41d3-8ddc-87f507d7e604_avatar";

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Test Cloudinary Image</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Image originale */}
        <div className="text-center">
          <h4 className="text-sm font-medium mb-2">Original</h4>
          <CloudinaryImage
            src={testImageUrl}
            alt="Test Original"
            width={150}
            height={150}
            className="rounded-lg mx-auto"
          />
        </div>

        {/* Avatar rond */}
        <div className="text-center">
          <h4 className="text-sm font-medium mb-2">Avatar (100x100)</h4>
          <CloudinaryImage
            src={testImageUrl}
            alt="Test Avatar"
            width={100}
            height={100}
            crop="fill"
            gravity="face"
            className="rounded-full mx-auto"
          />
        </div>

        {/* Thumbnail */}
        <div className="text-center">
          <h4 className="text-sm font-medium mb-2">Thumbnail (50x50)</h4>
          <CloudinaryImage
            src={testImageUrl}
            alt="Test Thumbnail"
            width={50}
            height={50}
            crop="fill"
            gravity="face"
            className="rounded mx-auto"
          />
        </div>
      </div>

      <div className="mt-4 p-3 bg-gray-100 rounded text-sm">
        <strong>URL de test:</strong> {testImageUrl}
      </div>
    </div>
  );
};

export default CloudinaryTest;