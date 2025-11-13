# Travel Buddy 🚌

A full-stack travel booking web application inspired by RedBus, tailored for the Indian market.

## Features

- 🔐 **Firebase Authentication** - Email/Password and Google Sign-in
- 🔍 **Bus Search** - Search buses between major Indian cities
- 🎫 **Seat Selection** - Interactive seat map for booking
- 📱 **User Profile** - View booking history and manage trips
- 🎨 **Modern UI** - Beautiful, responsive design
- 🔍 **Advanced Filters** - Filter by bus type, price range, and timing
- ⭐ **Ratings & Reviews** - See bus ratings and reviews
- 📊 **Booking Management** - Complete booking flow with confirmation

## Tech Stack

- **Frontend**: React 18 with Hooks
- **Routing**: React Router v6
- **Backend**: Firebase (Authentication + Firestore)
- **Styling**: CSS3 with custom properties
- **Icons**: React Icons
- **Build Tool**: Vite

## Quick Start

### Prerequisites

- Node.js 16+ and npm
- Firebase account

### Installation

1. **Clone the repository**:
```bash
cd travel-buddy
```

2. **Install dependencies**:
```bash
npm install
```

3. **Set up Firebase**:
   - Follow the detailed guide in [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)
   - Create a Firebase project
   - Enable Authentication (Email/Password + Google)
   - Create Firestore database
   - Update `src/config/firebase.js` with your Firebase config

4. **Seed sample bus data**:
   - Use the sample data from `src/utils/seedData.js`
   - Add buses to Firestore collection named `buses`
   - See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for detailed instructions

5. **Run the development server**:
```bash
npm run dev
```

6. **Open your browser**:
   - Navigate to `http://localhost:3000`

## Project Structure

```
travel-buddy/
├── src/
│   ├── components/          # Reusable components
│   │   ├── Navbar.jsx       # Navigation bar
│   │   └── ProtectedRoute.jsx # Route protection
│   ├── pages/               # Page components
│   │   ├── Home.jsx         # Landing page with search
│   │   ├── Search.jsx       # Bus search results
│   │   ├── BusDetails.jsx   # Bus details page
│   │   ├── SeatSelection.jsx # Seat selection interface
│   │   ├── BookingConfirmation.jsx # Booking confirmation
│   │   ├── Profile.jsx      # User profile & bookings
│   │   ├── Login.jsx        # Login page
│   │   └── Signup.jsx       # Signup page
│   ├── context/             # React context
│   │   └── AuthContext.jsx  # Authentication context
│   ├── config/              # Configuration
│   │   └── firebase.js      # Firebase configuration
│   ├── utils/               # Utility functions
│   │   ├── constants.js     # Constants (cities, bus types)
│   │   └── seedData.js      # Sample bus data
│   ├── styles/              # Global styles
│   │   └── index.css        # Main stylesheet
│   ├── App.jsx              # Main app component
│   └── main.jsx             # Entry point
├── index.html               # HTML template
├── package.json             # Dependencies
├── vite.config.js           # Vite configuration
├── README.md                # This file
└── FIREBASE_SETUP.md        # Firebase setup guide
```

## Key Features Explained

### 1. Authentication
- Email/Password authentication
- Google Sign-in integration
- Protected routes for authenticated users
- User session management

### 2. Bus Search
- Search between 30+ Indian cities
- Filter by bus type (Sleeper, Semi-Sleeper, Seater, AC, Non-AC)
- Filter by price range
- Sort by price, timing, or rating

### 3. Seat Selection
- Interactive seat map (40 seats, 4 per row)
- Visual indicators for available, selected, and booked seats
- Maximum 5 seats per booking
- Real-time seat availability

### 4. Booking Flow
- Complete booking with passenger details
- Booking confirmation with ticket details
- Unique booking ID generation
- Booking history in user profile

## Firebase Collections

### `buses`
- Contains bus information (name, operator, route, fare, timings, etc.)

### `bookings`
- Contains user bookings (userId, busId, seats, passenger details, etc.)

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Environment Setup

For production, consider using environment variables:

```javascript
// .env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
// ... etc
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is open source and available under the MIT License.

## Support

For issues and questions, please open an issue on GitHub.

---

Made with ❤️ for Indian travelers

