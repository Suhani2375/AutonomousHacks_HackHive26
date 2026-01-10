const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting CleanCity Development Servers...\n');

const portals = [
  { name: 'Citizen Portal', port: 3000, dir: 'citizen-portal' },
  { name: 'Sweeper Portal', port: 3001, dir: 'sweeper-portal' },
  { name: 'Admin Portal', port: 3002, dir: 'admin-portal' }
];

const processes = [];

portals.forEach((portal, index) => {
  console.log(`📱 Starting ${portal.name} on port ${portal.port}...`);
  
  const child = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, portal.dir),
    shell: true,
    stdio: 'inherit'
  });

  processes.push({
    name: portal.name,
    process: child
  });

  // Add delay between starts
  if (index < portals.length - 1) {
    setTimeout(() => {}, 2000);
  }
});

console.log('\n✅ All servers starting!');
console.log('\n📍 Access the portals at:');
portals.forEach(portal => {
  console.log(`   - ${portal.name}: http://localhost:${portal.port}`);
});
console.log('\nPress Ctrl+C to stop all servers\n');

// Handle cleanup on exit
process.on('SIGINT', () => {
  console.log('\n\n🛑 Stopping all servers...');
  processes.forEach(({ name, process }) => {
    process.kill();
    console.log(`   ✓ Stopped ${name}`);
  });
  process.exit(0);
});

process.on('SIGTERM', () => {
  processes.forEach(({ process }) => process.kill());
  process.exit(0);
});

