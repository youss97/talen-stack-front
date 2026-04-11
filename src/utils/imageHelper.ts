/**
 * Helper function to get the full image URL
 * @param path - The image path from the API (e.g., "uploads/companies/xxx/logo.png")
 * @returns The full URL to the image or null if path is not provided
 */
export function getImageUrl(path?: string | null): string | null {
  if (!path) return null;
  
  // If path already starts with http, return as is (Cloudinary URLs)
  if (path.startsWith('http')) {
    return path;
  }
  
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  
  // Clean both the API URL and path to avoid double slashes
  const cleanApiUrl = apiUrl.replace(/\/$/, ''); // Remove trailing slash
  const cleanPath = path.startsWith('/') ? path : `/${path}`; // Ensure leading slash
  
  return `${cleanApiUrl}${cleanPath}`;
}

/**
 * Helper function to get user avatar URL with fallback
 * @param user - User object with photo_path field
 * @returns The best available image URL or null
 */
export function getUserAvatarUrl(user?: { photo_path?: string | null }): string | null {
  console.log('🖼️ getUserAvatarUrl appelé avec:', user);
  
  if (!user) {
    console.log('❌ Pas d\'utilisateur');
    return null;
  }
  
  // Utiliser photo_path qui contient maintenant les URLs Cloudinary
  if (user.photo_path) {
    console.log('📸 photo_path trouvé:', user.photo_path);
    
    // Si photo_path commence par http, c'est une URL Cloudinary
    if (user.photo_path.startsWith('http')) {
      console.log('✅ URL Cloudinary détectée:', user.photo_path);
      return user.photo_path;
    }
    // Sinon, c'est un chemin local, le traiter comme tel
    const localUrl = getImageUrl(user.photo_path);
    console.log('📁 Chemin local converti:', localUrl);
    return localUrl;
  }
  
  console.log('❌ Pas de photo_path');
  return null;
}

/**
 * Helper function to check if an image URL is from Cloudinary
 * @param url - The image URL to check
 * @returns true if it's a Cloudinary URL, false otherwise
 */
export function isCloudinaryUrl(url?: string | null): boolean {
  if (!url) return false;
  return url.includes('cloudinary.com') || url.includes('res.cloudinary.com');
}

/**
 * Helper function to get the display URL for debugging
 * @param user - User object with photo_path field
 * @returns Object with URL info for debugging
 */
export function getUserImageDebugInfo(user?: { photo_path?: string | null }) {
  if (!user) return { hasPhotoPath: false, isCloudinary: false, url: null };
  
  const finalUrl = getUserAvatarUrl(user);
  
  return {
    hasPhotoPath: !!user.photo_path,
    isCloudinary: isCloudinaryUrl(finalUrl),
    url: finalUrl,
    rawPhotoPath: user.photo_path,
  };
}
