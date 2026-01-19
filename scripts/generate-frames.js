const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '../assets/watch frames');
const OUTPUT_FILE = path.join(__dirname, '../assets/frames.json');

// Ensure assets directory exists
if (!fs.existsSync(ASSETS_DIR)) {
    console.error(`Directory not found: ${ASSETS_DIR}`);
    process.exit(1);
}

// Read and sort files
const files = fs.readdirSync(ASSETS_DIR)
    .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file))
    .sort((a, b) => {
        // Extract numbers for proper numeric sorting if needed, 
        // though standard sort works for fixed width zero-padded names like frame_000
        return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });

const filePaths = files.map(file => `assets/watch frames/${file}`);

// Write to JSON
const jsonContent = JSON.stringify(filePaths, null, 2);
fs.writeFileSync(OUTPUT_FILE, jsonContent);

console.log(`Generated ${files.length} frames list to ${OUTPUT_FILE}`);
