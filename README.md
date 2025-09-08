# International Airlines Management System

A comprehensive AI-powered airport management system built with the MERN stack (MongoDB, Express.js, React, Node.js) featuring modern web technologies and artificial intelligence capabilities.

## 🚀 Features

### Core Features
- **User Authentication & Authorization**
  - Secure login/registration system
  - JWT-based authentication
  - Role-based access control
  - Login activity tracking

- **Flight Management**
  - Complete CRUD operations for flights
  - Real-time flight status updates
  - Route management
  - Aircraft and capacity management
  - Dynamic pricing system

- **Weather Integration**
  - Real-time weather data
  - Weather forecasts
  - Weather alerts for flight operations
  - Multiple city weather tracking

- **Ticket Management**
  - Passenger booking system
  - Seat management
  - Ticket status tracking
  - Revenue analytics

- **Reporting & Analytics**
  - Dashboard with key metrics
  - Flight performance reports
  - Revenue analysis
  - User activity reports

### AI-Powered Features
- **Route Safety Analysis** - AI-powered route risk assessment
- **Dynamic Pricing** - Intelligent pricing based on demand and conditions
- **Flight Delay Prediction** - ML-based delay forecasting
- **Passenger Flow Optimization** - AI-driven passenger management
- **Maintenance Prediction** - Predictive maintenance scheduling

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Axios** - HTTP client

### Frontend
- **HTML5** - Markup
- **CSS3** - Styling with modern features
- **JavaScript (ES6+)** - Client-side logic
- **Font Awesome** - Icons

### APIs & Services
- **OpenWeatherMap API** - Weather data
- **Custom REST API** - Backend services

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v14.0.0 or higher)
- **MongoDB** (v4.4.0 or higher)
- **npm** (v6.0.0 or higher)

## 🚀 Installation & Setup

### 1. Clone the Repository
\`\`\`bash
git clone <repository-url>
cd international-airlines-management
\`\`\`

### 2. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 3. Environment Configuration
Create a `.env` file in the root directory:

\`\`\`env
MONGODB_URI=mongodb://localhost:27017/international_airlines
JWT_SECRET=your_super_secret_jwt_key_12345
SESSION_SECRET=your_session_secret_67890
WEATHER_API_KEY=your_openweather_api_key_here
PORT=5000
FRONTEND_URL=http://localhost:3000
\`\`\`

### 4. Get Weather API Key
1. Visit [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up for a free account
3. Get your API key
4. Replace `your_openweather_api_key_here` in the `.env` file

### 5. Start MongoDB
Make sure MongoDB is running on your system:

**Windows:**
\`\`\`bash
net start MongoDB
\`\`\`

**macOS/Linux:**
\`\`\`bash
sudo systemctl start mongod
\`\`\`

### 6. Run the Application

**Development Mode:**
\`\`\`bash
npm run dev
\`\`\`

**Production Mode:**
\`\`\`bash
npm start
\`\`\`

The application will be available at:
- **Backend API:** http://localhost:5000
- **Frontend:** http://localhost:5000 (served by Express)

## 📁 Project Structure

\`\`\`
international-airlines-management/
├── models/                 # Database models
│   ├── User.js
│   ├── Flight.js
│   ├── Ticket.js
│   └── LoginActivity.js
├── routes/                 # API routes
│   ├── auth.js
│   ├── flights.js
│   ├── weather.js
│   ├── tickets.js
│   └── reports.js
├── public/                 # Frontend files
│   ├── css/
│   │   ├── style.css
│   │   └── dashboard.css
│   ├── js/
│   │   ├── auth.js
│   │   ├── dashboard.js
│   │   ├── flights.js
│   │   └── weather.js
│   ├── login.html
│   └── dashboard.html
├── server.js              # Main server file
├── package.json
├── .env
└── README.md
\`\`\`

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `GET /api/auth/activities` - Get login activities

### Flights
- `GET /api/flights` - Get all flights
- `POST /api/flights` - Create new flight
- `GET /api/flights/:id` - Get flight by ID
- `PUT /api/flights/:id` - Update flight
- `DELETE /api/flights/:id` - Delete flight
- `GET /api/flights/stats/overview` - Get flight statistics

### Weather
- `GET /api/weather/:city` - Get weather for city
- `GET /api/weather/:city/forecast` - Get weather forecast

### Tickets
- `GET /api/tickets` - Get all tickets
- `POST /api/tickets` - Create new ticket
- `GET /api/tickets/:id` - Get ticket by ID
- `PUT /api/tickets/:id` - Update ticket
- `DELETE /api/tickets/:id` - Delete ticket

### Reports
- `GET /api/reports/dashboard` - Dashboard overview
- `GET /api/reports/flights/performance` - Flight performance
- `GET /api/reports/revenue` - Revenue reports
- `GET /api/reports/users/activity` - User activity

## 🎯 Usage

### First Time Setup
1. Start the application
2. Navigate to http://localhost:5000
3. Click "Register" to create your first admin account
4. Fill in the registration form
5. Login with your credentials
6. Access the dashboard and start managing flights

### Managing Flights
1. Go to the "Flights" section
2. Click "Add New Flight"
3. Fill in all required flight details
4. Save the flight
5. View, edit, or delete flights from the table

### Weather Monitoring
1. Go to the "Weather" section
2. Search for any city
3. View current weather and forecasts
4. Monitor weather alerts for flight operations

### Profile Management
1. Go to the "Profile" section
2. Update your personal information
3. View your login activity history

## 🔒 Security Features

- **Password Hashing** - bcryptjs for secure password storage
- **JWT Authentication** - Secure token-based authentication
- **Input Validation** - Server-side validation for all inputs
- **CORS Protection** - Cross-origin request security
- **Session Management** - Secure session handling

## 🌟 AI Features

The system includes several AI-powered features that enhance operational efficiency:

1. **Route Safety Analysis** - Analyzes weather, traffic, and historical data
2. **Dynamic Pricing** - Adjusts prices based on demand and market conditions
3. **Delay Prediction** - Predicts potential delays using ML algorithms
4. **Passenger Flow** - Optimizes passenger distribution and boarding
5. **Maintenance Prediction** - Predicts maintenance needs to prevent issues

## 📊 Dashboard Features

- **Real-time Statistics** - Live flight and ticket metrics
- **Recent Activities** - Latest flights and bookings
- **Weather Integration** - Current weather for operations
- **Quick Actions** - Fast access to common tasks
- **Responsive Design** - Works on all devices

## 🎨 Design Features

- **Modern UI/UX** - Clean and intuitive interface
- **Responsive Design** - Mobile-friendly layout
- **Dark/Light Themes** - Customizable appearance
- **Smooth Animations** - Enhanced user experience
- **Accessibility** - WCAG compliant design

## 🚨 Troubleshooting

### Common Issues

**MongoDB Connection Error:**
\`\`\`bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB if not running
sudo systemctl start mongod
\`\`\`

**Port Already in Use:**
\`\`\`bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>
\`\`\`

**Weather API Not Working:**
- Verify your API key is correct
- Check if you have internet connection
- Ensure you've activated your OpenWeatherMap account

**Login Issues:**
- Clear browser cache and cookies
- Check if backend server is running
- Verify MongoDB connection

## 🔄 Updates & Maintenance

### Regular Updates
- Keep dependencies updated
- Monitor security vulnerabilities
- Update API keys as needed
- Backup database regularly

### Performance Optimization
- Monitor server performance
- Optimize database queries
- Implement caching strategies
- Monitor API rate limits

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation

## 🚀 Future Enhancements

- Mobile application
- Real-time notifications
- Advanced analytics
- Integration with external systems
- Multi-language support
- Advanced AI features

---

**International Airlines Management System** - Powering the future of aviation management with AI and modern web technologies.
