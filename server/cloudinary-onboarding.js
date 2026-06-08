const cloudinary = require('cloudinary').v2;
const https = require('https');
const fs = require('fs');
const path = require('path');

// ===== CLOUDINARY CONFIGURATION (INLINE) =====
cloudinary.config({
  cloud_name: 'dsncyzzjl',           // ← replace this
  api_key: '412381517493542',        // ← replace this
  api_secret: '8RZF0LDgkRtKX64bfBESWiRJi1Y' // ← replace this
});

// ===== HELPER FUNCTION: Download image from URL =====
function downloadImage(url, filePath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(filePath);
      });
    }).on('error', (err) => {
      fs.unlink(filePath, () => {}); // Delete file on error
      reject(err);
    });
  });
}

// ===== MAIN FLOW =====
async function main() {
  try {
    console.log('Starting Cloudinary integration test...\n');

    // STEP 1: Download sample image from Cloudinary demo
    console.log('📥 Downloading sample image...');
    const sampleImageUrl = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';
    const localImagePath = path.join(__dirname, 'sample-download.jpg');
    
    await downloadImage(sampleImageUrl, localImagePath);
    console.log('✅ Sample image downloaded\n');

    // STEP 2: Upload image to Cloudinary
    console.log('☁️  Uploading image to Cloudinary...');
    const uploadResult = await cloudinary.uploader.upload(localImagePath, {
      public_id: 'onboarding-test-image',
      overwrite: true
    });

    const uploadedUrl = uploadResult.secure_url;
    const publicId = uploadResult.public_id;

    console.log(`✅ Upload successful!`);
    console.log(`   Secure URL: ${uploadedUrl}`);
    console.log(`   Public ID: ${publicId}\n`);

    // STEP 3: Get image metadata
    console.log('📊 Fetching image metadata...');
    const metadata = await cloudinary.api.resource(publicId);

    const width = metadata.width;
    const height = metadata.height;
    const format = metadata.format;
    const bytes = metadata.bytes;

    console.log(`✅ Metadata retrieved:`);
    console.log(`   Width: ${width}px`);
    console.log(`   Height: ${height}px`);
    console.log(`   Format: ${format}`);
    console.log(`   File Size: ${bytes} bytes (${(bytes / 1024).toFixed(2)} KB)\n`);

    // STEP 4: Transform image
    console.log('🎨 Generating transformed image URL...');
    
    // f_auto: automatically selects the best format for the browser (WebP, AVIF, etc.)
    // q_auto: automatically adjusts quality for optimal compression without visible loss
    const transformedUrl = cloudinary.url(publicId, {
      transformation: [
        {
          fetch_format: 'auto',  // f_auto equivalent
          quality: 'auto'        // q_auto equivalent
        }
      ]
    });

    console.log(`✅ Transformation applied:`);
    console.log(`   f_auto: Automatically selects best image format for browser`);
    console.log(`   q_auto: Automatically optimizes quality for file size\n`);

    // STEP 5: Final success message
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✨ Done! Cloudinary integration is working correctly!');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('📝 Original Image URL (for reference):');
    console.log(`   ${uploadedUrl}\n`);

    console.log('🔗 Transformed Image URL (optimized):');
    console.log(`   ${transformedUrl}\n`);

    console.log('👉 Next steps:');
    console.log('   1. Open the transformed URL in your browser to see the optimized image');
    console.log('   2. Check the file size and format in your browser DevTools (Network tab)');
    console.log('   3. Compare with the original URL to see the optimization benefits\n');

    // Cleanup
    fs.unlinkSync(localImagePath);
    console.log('🧹 Cleanup complete. Local download removed.\n');

  } catch (error) {
    console.error('❌ Error during Cloudinary integration test:');
    console.error(error.message || error);
    process.exit(1);
  }
}

// Run the script
main();
