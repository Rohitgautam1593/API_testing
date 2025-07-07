const express = require('express');
const path = require('path');
const https = require('https');
const fs = require('fs');
const app = express();
const PORT = 3000;
const HTTPS_PORT = 3443;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// In-memory storage for nurse location
let nurseLocation = null;

// API Routes
app.post('/update-location', (req, res) => {
    const { lat, lon } = req.body;
    
    if (typeof lat !== 'number' || typeof lon !== 'number') {
        return res.status(400).json({ error: 'Invalid coordinates' });
    }
    
    nurseLocation = { lat, lon, timestamp: Date.now() };
    console.log('Nurse location updated:', nurseLocation);
    
    res.json({ success: true, location: nurseLocation });
});

app.get('/get-location', (req, res) => {
    if (!nurseLocation) {
        return res.status(404).json({ error: 'No location data available' });
    }
    
    res.json(nurseLocation);
});

// Road routing API
app.get('/api/route', (req, res) => {
    const { from_lat, from_lng, to_lat, to_lng } = req.query;
    
    if (!from_lat || !from_lng || !to_lat || !to_lng) {
        return res.status(400).json({ error: 'Missing coordinates' });
    }
    
    // Calculate road distance using Haversine with road factor (1.3x for typical roads)
    const haversineDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                 Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                 Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    };
    
    const directDistance = haversineDistance(
        parseFloat(from_lat), parseFloat(from_lng),
        parseFloat(to_lat), parseFloat(to_lng)
    );
    
    // Road distance is typically 1.3x the direct distance
    const roadDistance = directDistance * 1.3;
    
    // Generate route points (simplified road path)
    const steps = 10;
    const routePoints = [];
    for (let i = 0; i <= steps; i++) {
        const ratio = i / steps;
        const lat = parseFloat(from_lat) + (parseFloat(to_lat) - parseFloat(from_lat)) * ratio;
        const lng = parseFloat(from_lng) + (parseFloat(to_lng) - parseFloat(from_lng)) * ratio;
        routePoints.push([lng, lat]); // GeoJSON format: [lng, lat]
    }
    
    res.json({
        distance: roadDistance * 1000, // Convert to meters
        duration: Math.round(roadDistance / 30 * 60), // 30 km/h speed
        geometry: {
            type: "LineString",
            coordinates: routePoints
        },
        steps: []
    });
});

// Serve HTML pages
app.get('/nurse', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'nurse.html'));
});

app.get('/supervisor', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'supervisor.html'));
});

// Create self-signed certificate
function createSelfSignedCert() {
    const { execSync } = require('child_process');
    
    try {
        // Check if certificate already exists
        if (fs.existsSync('./cert.pem') && fs.existsSync('./key.pem')) {
            console.log('✅ SSL certificates already exist');
            return;
        }
        
        console.log('🔐 Creating self-signed SSL certificate...');
        
        // Create certificate using OpenSSL
        execSync('openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/C=IN/ST=Uttarakhand/L=Dehradun/O=NurseTracker/CN=localhost"', { stdio: 'inherit' });
        
        console.log('✅ SSL certificate created successfully!');
    } catch (error) {
        console.log('❌ Error creating certificate. Using HTTP fallback...');
        console.log('💡 To enable HTTPS, install OpenSSL or use a different method.');
        return false;
    }
    return true;
}

// Start servers
function startServers() {
    // Try to start HTTPS server
    if (createSelfSignedCert()) {
        try {
            const options = {
                key: fs.readFileSync('./key.pem'),
                cert: fs.readFileSync('./cert.pem')
            };
            
            // Start HTTPS server
            https.createServer(options, app).listen(HTTPS_PORT, '0.0.0.0', () => {
                console.log(`🔒 HTTPS Server running on https://localhost:${HTTPS_PORT}`);
                console.log(`👩‍⚕️ Nurse interface: https://localhost:${HTTPS_PORT}/nurse`);
                console.log(`👨‍💼 Supervisor interface: https://localhost:${HTTPS_PORT}/supervisor`);
                console.log(`\n🌐 For testing with another device:`);
                console.log(`Nurse interface: https://172.16.4.128:${HTTPS_PORT}/nurse`);
                console.log(`Supervisor interface: https://172.16.4.128:${HTTPS_PORT}/supervisor`);
                console.log(`\n📱 Make sure both devices are on the same WiFi network!`);
                console.log(`\n⚠️  Note: You may see a security warning. Click "Advanced" and "Proceed" to continue.`);
            });
        } catch (error) {
            console.log('❌ HTTPS failed, starting HTTP server...');
            startHttpServer();
        }
    } else {
        startHttpServer();
    }
}

function startHttpServer() {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🌐 HTTP Server running on http://localhost:${PORT}`);
        console.log(`👩‍⚕️ Nurse interface: http://localhost:${PORT}/nurse`);
        console.log(`👨‍💼 Supervisor interface: http://localhost:${PORT}/supervisor`);
        console.log(`\n🌐 For testing with another device:`);
        console.log(`Nurse interface: http://172.16.4.128:${PORT}/nurse`);
        console.log(`Supervisor interface: http://172.16.4.128:${PORT}/supervisor`);
        console.log(`\n📱 Make sure both devices are on the same WiFi network!`);
    });
}

startServers(); 