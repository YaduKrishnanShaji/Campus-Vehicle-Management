# Campus Vehicle Management System

A modern web-based system for managing campus vehicles and facilitating carpooling among university students and staff at RTU Liepaja.

## 🚀 Features

- **User Management**
  - Student and Staff registration
  - Role-based access control
  - Profile management
  - Department-wise organization

- **Vehicle Management**
  - Vehicle registration and approval system
  - Vehicle status tracking
  - License plate verification
  - Vehicle type categorization

- **Carpool System**
  - Create and join carpools
  - Real-time seat availability
  - Route matching
  - Payment integration
  - Trip history

- **Admin Dashboard**
  - User management
  - Vehicle approval
  - Carpool monitoring
  - System analytics
  - Notification management

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **Database**: Microsoft SQL Server
- **Authentication**: JWT, bcrypt
- **Additional Libraries**: Font Awesome, Leaflet Maps

## 📋 Prerequisites

- Node.js (v14 or higher)
- Microsoft SQL Server
- npm or yarn package manager

## 🔧 Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/campus-vehicle-management.git
cd campus-vehicle-management
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
PORT=3001
DB_HOST=your_database_host
DB_NAME=Campus_Vehicle_Management_System
DB_USER=your_username
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
```

4. Initialize the database:
```bash
npm run init-db
```

5. Start the server:
```bash
# Development
npm run dev

# Production
npm start
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Users
- `GET /api/users/profile` - Get user profile
- `PATCH /api/users/profile` - Update profile
- `GET /api/users` - List all users (Admin)

### Vehicles
- `POST /api/vehicles` - Register vehicle
- `GET /api/vehicles/my-vehicles` - User's vehicles
- `PATCH /api/vehicles/:id/status` - Update status

### Carpools
- `POST /api/carpool` - Create carpool
- `GET /api/carpool/active` - List active carpools
- `POST /api/carpool/join` - Join carpool

## 👥 Team

- **Ashwin** - Authentication System
- **Sunil** - Vehicle Management
- **Yadukrishnan Shaji** - Carpool Management

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- CORS protection
- Rate limiting
- XSS protection

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support, email support@campusride.com or join our Slack channel. 