const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building and preparing for deployment...\n');

// Step 1: Build all portals
console.log('📦 Building Citizen Portal...');
execSync('cd citizen-portal && npm run build', { stdio: 'inherit' });

console.log('\n📦 Building Sweeper Portal...');
execSync('cd sweeper-portal && npm run build', { stdio: 'inherit' });

console.log('\n📦 Building Admin Portal...');
execSync('cd admin-portal && npm run build', { stdio: 'inherit' });

// Step 2: Create public directory structure
console.log('\n📁 Creating public directory structure...');
const publicDir = path.join(__dirname, 'public');

// Remove existing public directory if it exists
if (fs.existsSync(publicDir)) {
  fs.rmSync(publicDir, { recursive: true, force: true });
}
fs.mkdirSync(publicDir, { recursive: true });

// Copy landing page
console.log('📄 Copying landing page...');
fs.copyFileSync(
  path.join(__dirname, 'index.html'),
  path.join(publicDir, 'index.html')
);

// Copy citizen portal build
console.log('📄 Copying Citizen Portal build...');
const citizenBuild = path.join(__dirname, 'citizen-portal', 'dist');
const citizenPublic = path.join(publicDir, 'citizen');
if (fs.existsSync(citizenBuild)) {
  copyRecursiveSync(citizenBuild, citizenPublic);
}

// Copy sweeper portal build
console.log('📄 Copying Sweeper Portal build...');
const sweeperBuild = path.join(__dirname, 'sweeper-portal', 'dist');
const sweeperPublic = path.join(publicDir, 'sweeper');
if (fs.existsSync(sweeperBuild)) {
  copyRecursiveSync(sweeperBuild, sweeperPublic);
}

// Copy admin portal build
console.log('📄 Copying Admin Portal build...');
const adminBuild = path.join(__dirname, 'admin-portal', 'dist');
const adminPublic = path.join(publicDir, 'admin');
if (fs.existsSync(adminBuild)) {
  copyRecursiveSync(adminBuild, adminPublic);
}

console.log('\n✅ Build complete! Ready for deployment.\n');
console.log('📝 Next step: Run "firebase deploy --only hosting" to deploy\n');

// Helper function to copy directories recursively
function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}
