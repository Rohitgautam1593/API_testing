# Nurse Location Tracker

A simple Node.js API with HTML frontend for tracking nurse GPS location in real-time.

## Features

- **Nurse Interface**: Gets GPS location and sends updates every 5 seconds
- **Supervisor Dashboard**: Displays nurse location on an interactive map
- **Distance Calculations**: Shows distance from nurse to patient and supervisor
- **Real-time Updates**: Automatic location polling every 5 seconds
- **No Database Required**: Stores data in memory

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```

### 3. Access the Interfaces

- **Nurse Interface**: http://localhost:3000/nurse
- **Supervisor Dashboard**: http://localhost:3000/supervisor

## API Endpoints

### POST /update-location
Updates nurse location with GPS coordinates.

**Request Body:**
```json
{
  "lat": 30.3165,
  "lon": 78.0322
}
```

**Response:**
```json
{
  "success": true,
  "location": {
    "lat": 30.3165,
    "lon": 78.0322,
    "timestamp": 1703123456789
  }
}
```

### GET /get-location
Retrieves the latest nurse location.

**Response:**
```json
{
  "lat": 30.3165,
  "lon": 78.0322,
  "timestamp": 1703123456789
}
```

## How It Works

### Nurse Interface (`/nurse`)
1. Uses `navigator.geolocation` to get current GPS position
2. Sends location to server via `POST /update-location`
3. Updates every 5 seconds automatically
4. Shows real-time status and update count

### Supervisor Dashboard (`/supervisor`)
1. Fetches nurse location via `GET /get-location` every 5 seconds
2. Displays location on interactive Leaflet map
3. Shows distance calculations to fixed locations:
   - **Supervisor**: SRHU, Dehradun (30.3165, 78.0322)
   - **Patient**: Rishikesh (30.0869, 78.2676)
4. Updates marker position in real-time

## Fixed Locations

- **Supervisor**: SRHU, Dehradun, Uttarakhand, India (30.3165, 78.0322)
- **Patient**: Rishikesh, Uttarakhand, India (30.0869, 78.2676)

## Testing

1. Open the nurse interface in one browser tab
2. Click "Start Tracking" to begin GPS location updates
3. Open the supervisor dashboard in another browser tab
4. Watch the nurse marker move on the map as location updates

## File Structure

```
├── server.js              # Express server with API endpoints
├── package.json           # Node.js dependencies
├── README.md             # This file
└── public/
    ├── nurse.html        # Nurse GPS tracking interface
    └── supervisor.html   # Supervisor dashboard with map
```

## Technologies Used

- **Backend**: Node.js, Express
- **Frontend**: HTML, CSS, JavaScript
- **Maps**: Leaflet.js with OpenStreetMap
- **GPS**: Browser Geolocation API

## Browser Compatibility

- Requires HTTPS or localhost for GPS access
- Modern browsers with Geolocation API support
- Chrome, Firefox, Safari, Edge supported 