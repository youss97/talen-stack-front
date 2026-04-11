// Script pour générer des icônes simples pour la PWA
// Ce script peut être exécuté avec Node.js pour créer des icônes de base

const fs = require('fs');
const path = require('path');

// Créer un SVG simple avec le texte "TS" (Talent Stack)
const createSVGIcon = (size) => {
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#3b82f6" rx="${size * 0.1}"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="${size * 0.4}" font-weight="bold">TS</text>
</svg>`;
};

// Tailles d'icônes nécessaires
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Créer le dossier icons s'il n'existe pas
const iconsDir = path.join(__dirname, '../../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Générer les icônes SVG (pour le développement)
sizes.forEach(size => {
  const svgContent = createSVGIcon(size);
  const filename = `icon-${size}x${size}.svg`;
  fs.writeFileSync(path.join(iconsDir, filename), svgContent);
  console.log(`Icône ${filename} créée`);
});

console.log('Toutes les icônes ont été générées dans public/icons/');
console.log('Note: Pour la production, convertissez les SVG en PNG avec un outil comme ImageMagick ou un service en ligne.');