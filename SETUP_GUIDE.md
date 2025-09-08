# International Airlines Management System - Complete Setup Guide

This comprehensive guide will walk you through setting up the International Airlines Management System from scratch.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [System Requirements](#system-requirements)
3. [Installation Steps](#installation-steps)
4. [Configuration](#configuration)
5. [Running the Application](#running-the-application)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)
8. [Production Deployment](#production-deployment)

## 🔧 Prerequisites

### Required Software

#### 1. Node.js
- **Version:** 14.0.0 or higher
- **Download:** https://nodejs.org/
- **Verification:**
  \`\`\`bash
  node --version
  npm --version
  \`\`\`

#### 2. MongoDB
- **Version:** 4.4.0 or higher
- **Options:**
  - **Local Installation:** https://www.mongodb.com/try/download/community
  - **MongoDB Atlas (Cloud):** https://www.mongodb.com/atlas (Recommended)

#### 3. Git (Optional)
- **Download:** https://git-scm.com/
- **Verification:**
  \`\`\`bash
  git --version
  \`\`\`

### Optional Tools
- **MongoDB Compass** - GUI for MongoDB
- **Postman** - API testing
- **VS Code** - Code editor

## 💻 System Requirements

### Minimum Requirements
- **OS:** Windows 10, macOS 10.14, Ubuntu 18.04
- **RAM:** 4GB
- **Storage:** 2GB free space
- **Network:** Internet connection for API services

### Recommended Requirements
- **OS:** Latest versions
- **RAM:** 8GB or more
- **Storage:** 5GB free space
- **Network:** Stable broadband connection

## 🚀 Installation Steps

### Step 1: Download the Project

#### Option A: Download ZIP
1. Download the project ZIP file
2. Extract to your desired location
3. Rename folder to `international-airlines`

#### Option B: Clone Repository (if available)
\`\`\`bash
git clone <repository-url>
cd international-airlines
\`\`\`

### Step 2: Install Dependencies

\`\`\`bash
# Navigate to project directory
cd international-airlines

# Install all dependencies
npm install
\`\`\`

**Expected output:**
\`\`\`
added 150 packages from 200 contributors and audited 150 packages in 30s
\`\`\`

### Step 3: Database Setup

#### Option A: Local MongoDB

1. **Install MongoDB Community Server**
   - Download from https://www.mongodb.com/try/download/community
   - Follow installation wizard
   - Start MongoDB service

2. **Verify Installation**
   \`\`\`bash
   # Windows
   net start MongoDB
   
   # macOS/Linux
   sudo systemctl start mongod
   sudo systemctl status mongod
   \`\`\`

#### Option B: MongoDB Atlas (Recommended)

1. **Create Account**
   - Go to https://www.mongodb.com/atlas
   - Sign up for free account

2. **Create Cluster**
   - Choose "Build a Database"
   - Select "Free" tier
   - Choose cloud provider and region
   - Create cluster (takes 3-5 minutes)

3. **Setup Database Access**
   - Go to "Database Access"
   - Add new database user
   - Choose "Password" authentication
   - Set username and password
   - Grant "Read and write to any database"

4. **Setup Network Access**
   - Go to "Network Access"
   - Add IP Address
   - Choose "Allow access from anywhere" (0.0.0.0/0)
   - Or add your specific IP address

5. **Get Connection String**
   - Go to "Databases"
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string

## ⚙️ Configuration

### Step 1: Environment Variables

Create a `.env` file in the project root:

\`\`\`env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/international_airlines
# For MongoDB Atlas, use: mongodb+srv://username:password@cluster.mongodb.net/international_airlines

# Security
JWT_SECRET=your_super_secret_jwt_key_12345_change_this_in_production
SESSION_SECRET=your_session_secret_67890_change_this_in_production

# External APIs
WEATHER_API_KEY=your_openweather_api_key_here

# Server Configuration
PORT=5000
FRONTEND_URL=http://localhost:3000

# Environment
NODE_ENV=development
\`\`\`

### Step 2: Get Weather API Key

1. **Visit OpenWeatherMap**
   - Go to https://openweathermap.org/api
   - Click "Sign Up" (free account)

2. **Create Account**
   - Fill in registration form
   - Verify email address

3. **Get API Key**
   - Go to "API Keys" section
   - Copy the default API key
   - Replace `your_openweather_api_key_here` in `.env`

4. **Activate Account**
   - API key may take 10-15 minutes to activate
   - Test with a simple API call

### Step 3: Verify Configuration

Create a test file `test-config.js`:

\`\`\`javascript
require('dotenv').config();

console.log('Configuration Test:');
console.log('MongoDB URI:', process.env.MONGODB_URI ? '✓ Set' : '✗ Missing');
console.log('JWT Secret:', process.env.JWT_SECRET ? '✓ Set' : '✗ Missing');
console.log('Weather API Key:', process.env.WEATHER_API_KEY ? '✓ Set' : '✗ Missing');
console.log('Port:', process.env.PORT || 5000);
\`\`\`

Run the test:
\`\`\`bash
node test-config.js
\`\`\`

## 🏃‍♂️ Running the Application

### Step 1: Start the Server

#### Development Mode (Recommended)
\`\`\`bash
npm run dev
\`\`\`

#### Production Mode
\`\`\`bash
npm start
\`\`\`

**Expected output:**
\`\`\`
✅ Connected to MongoDB
🚀 Backend Server running on port 5000
📡 API Base URL: http://localhost:5000/api
🌐 Server is running on port 5000
\`\`\`

### Step 2: Access the Application

1. **Open your browser**
2. **Navigate to:** http://localhost:5000
3. **You should see the login page**

### Step 3: Create First Account

1. **Click "Register" tab**
2. **Fill in the form:**
   - First Name: Your first name
   - Last Name: Your last name
   - Email: your@email.com
   - Date of Birth: Select a date
   - Password: At least 6 characters
   - Confirm Password: Same as above

3. **Click "Create Account"**
4. **You'll be redirected to the dashboard**

## 🧪 Testing

### Step 1: Test Authentication

1. **Register a new account**
2. **Login with credentials**
3. **Access dashboard**
4. **Logout and login again**

### Step 2: Test Flight Management

1. **Go to "Flights" section**
2. **Click "Add New Flight"**
3. **Fill in sample data:**
   \`\`\`
   Flight Number: IA001
   Airline: International Airlines
   Origin: Dhaka, Hazrat Shahjalal International Airport, DAC
   Destination: New York, John F. Kennedy International Airport, JFK
   Departure: Tomorrow 10:00 AM
   Arrival: Tomorrow 8:00 PM
   Aircraft: Boeing 777-300ER, IA-001
   Capacity: Total 350, Economy 280, Business 60, First 10
   Pricing: Economy $800, Business $2500, First $5000
   \`\`\`
4. **Save flight**
5. **Verify it appears in the table**

### Step 3: Test Weather

1. **Go to "Weather" section**
2. **Search for "London"**
3. **Verify weather data loads**
4. **Try different cities**

### Step 4: Test Profile

1. **Go to "Profile" section**
2. **Update your information**
3. **Save changes**
4. **Verify updates are saved**

### Step 5: API Testing (Optional)

Use Postman or curl to test API endpoints:

\`\`\`bash
# Health check
curl http://localhost:5000/api/health

# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test@example.com","password":"password123","dateOfBirth":"1990-01-01"}'
\`\`\`

## 🔧 Troubleshooting

### Common Issues

#### 1. MongoDB Connection Error

**Error:** `MongoNetworkError: failed to connect to server`

**Solutions:**
\`\`\`bash
# Check if MongoDB is running
# Windows:
net start MongoDB

# macOS/Linux:
sudo systemctl start mongod
sudo systemctl status mongod

# Check connection string in .env file
# Verify username/password for Atlas
\`\`\`

#### 2. Port Already in Use

**Error:** `EADDRINUSE: address already in use :::5000`

**Solutions:**
\`\`\`bash
# Find process using port 5000
# Windows:
netstat -ano | findstr :5000

# macOS/Linux:
lsof -i :5000

# Kill the process
# Windows:
taskkill /PID <PID> /F

# macOS/Linux:
kill -9 <PID>

# Or use different port in .env
PORT=3001
\`\`\`

#### 3. Weather API Not Working

**Error:** Weather data shows "mock data"

**Solutions:**
1. Verify API key is correct
2. Check internet connection
3. Wait 10-15 minutes for API activation
4. Test API key directly:
   \`\`\`bash
   curl "https://api.openweathermap.org/data/2.5/weather?q=London&appid=YOUR_API_KEY"
   \`\`\`

#### 4. Dependencies Installation Failed

**Error:** `npm install` fails

**Solutions:**
\`\`\`bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install

# If still fails, try:
npm install --legacy-peer-deps
\`\`\`

#### 5. Login Issues

**Error:** Cannot login after registration

**Solutions:**
1. Check browser console for errors
2. Verify backend server is running
3. Clear browser cache and cookies
4. Check network tab in developer tools
5. Verify MongoDB connection

### Debug Mode

Enable debug logging by adding to `.env`:
\`\`\`env
DEBUG=true
LOG_LEVEL=debug
\`\`\`

### Log Files

Check server logs for detailed error information:
- Console output shows real-time logs
- Check MongoDB logs for database issues
- Browser console shows frontend errors

## 🚀 Production Deployment

### Step 1: Environment Setup

Update `.env` for production:
\`\`\`env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/international_airlines_prod
JWT_SECRET=very_secure_random_string_for_production
SESSION_SECRET=another_secure_random_string_for_production
WEATHER_API_KEY=your_production_api_key
PORT=80
FRONTEND_URL=https://yourdomain.com
\`\`\`

### Step 2: Security Hardening

1. **Use strong secrets**
2. **Enable HTTPS**
3. **Set up firewall rules**
4. **Regular security updates**
5. **Monitor logs**

### Step 3: Performance Optimization

1. **Enable gzip compression**
2. **Use CDN for static files**
3. **Database indexing**
4. **Caching strategies**
5. **Load balancing**

### Step 4: Monitoring

1. **Set up health checks**
2. **Monitor server resources**
3. **Database performance**
4. **API response times**
5. **Error tracking**

## 📞 Support

If you encounter issues:

1. **Check this guide first**
2. **Review error messages carefully**
3. **Check server and browser logs**
4. **Verify all prerequisites are met**
5. **Test with minimal configuration**

## ✅ Success Checklist

- [ ] Node.js installed and verified
- [ ] MongoDB running (local or Atlas)
- [ ] Project dependencies installed
- [ ] Environment variables configured
- [ ] Weather API key obtained and working
- [ ] Server starts without errors
- [ ] Can access login page
- [ ] Can register new account
- [ ] Can login and access dashboard
- [ ] Can add and view flights
- [ ] Weather data loads correctly
- [ ] Profile updates work

**Congratulations! Your International Airlines Management System is now ready to use! ✈️**
