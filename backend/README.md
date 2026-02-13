# 🚀 OnTheirFootsteps Backend - .NET Core 10.0

ASP.NET Core 10.0 Web API for the "On Their Footsteps" Islamic historical figures educational platform.

## 🏗️ Architecture

### Technology Stack
- **Framework**: ASP.NET Core 10.0
- **Language**: C# 12
- **Database**: PostgreSQL with Entity Framework Core
- **Authentication**: JWT Bearer with ASP.NET Identity
- **Documentation**: Swagger/OpenAPI 3.0
- **Testing**: xUnit + Moq
- **Logging**: Serilog

### Project Structure
```
OnTheirFootsteps.Api/
├── Controllers/          # API Controllers
│   ├── AuthController.cs
│   ├── CharactersController.cs
│   ├── UsersController.cs
│   ├── ContentController.cs
│   ├── MediaController.cs
│   └── AnalyticsController.cs
├── Services/             # Business Logic
│   ├── IAuthService.cs
│   ├── ICharacterService.cs
│   ├── IUserService.cs
│   ├── IContentService.cs
│   ├── IMediaService.cs
│   └── IAnalyticsService.cs
├── Models/               # Data Models
│   ├── Entities/         # Database Entities
│   └── DTOs/            # Data Transfer Objects
├── Data/                 # Database Context
│   └── ApplicationDbContext.cs
├── Middleware/           # Custom Middleware
│   ├── ExceptionHandlingMiddleware.cs
│   ├── RequestLoggingMiddleware.cs
│   ├── CorsMiddleware.cs
│   └── RateLimitingMiddleware.cs
├── Extensions/           # Service Extensions
│   └── ServiceCollectionExtensions.cs
├── Filters/             # Action Filters
│   ├── ValidateModelAttribute.cs
│   └── AuthorizeAttribute.cs
├── Program.cs           # Application Entry Point
├── appsettings.json     # Configuration
└── OnTheirFootsteps.Api.csproj  # Project File
```

## 🛠️ Prerequisites

- .NET 10.0 SDK
- PostgreSQL 15+
- Visual Studio 2022 or VS Code
- Git

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/on-their-footsteps/on-their-footsteps.git
cd on-their-footsteps/backend/OnTheirFootsteps.Api
```

### 2. Database Setup
```bash
# Create PostgreSQL database
createdb on_their_footsteps

# Update connection string in appsettings.json
```

### 3. Install Dependencies
```bash
dotnet restore
```

### 4. Database Migrations
```bash
# Create initial migration
dotnet ef migrations add InitialCreate

# Apply migrations
dotnet ef database update
```

### 5. Run Application
```bash
dotnet run
```

### 6. Access API
- **API Base URL**: http://localhost:5000
- **Swagger UI**: http://localhost:5000/swagger
- **Health Check**: http://localhost:5000/health

## ⚙️ Configuration

### appsettings.json
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=on_their_footsteps;Username=postgres;Password=your_password"
  },
  "Jwt": {
    "Key": "your-secret-key-here",
    "Issuer": "OnTheirFootsteps",
    "Audience": "OnTheirFootsteps",
    "ExpirationMinutes": 60
  },
  "AllowedOrigins": "http://localhost:3000,http://localhost:3001",
  "FileUpload": {
    "UploadPath": "wwwroot/uploads",
    "MaxFileSize": 10485760,
    "AllowedExtensions": [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"]
  },
  "RateLimit": {
    "MaxRequests": 100,
    "WindowMinutes": 1
  },
  "Serilog": {
    "MinimumLevel": "Information",
    "WriteTo": ["Console", "File"]
  }
}
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/forgot-password` - Forgot password
- `POST /api/auth/reset-password` - Reset password

### Character Endpoints
- `GET /api/characters` - Get all characters
- `GET /api/characters/{id}` - Get character by ID
- `GET /api/characters/slug/{slug}` - Get character by slug
- `POST /api/characters` - Create character (Admin)
- `PUT /api/characters/{id}` - Update character (Admin)
- `DELETE /api/characters/{id}` - Delete character (Admin)
- `GET /api/characters/featured` - Get featured characters
- `POST /api/characters/search` - Search characters
- `POST /api/characters/{id}/like` - Like character
- `DELETE /api/characters/{id}/like` - Unlike character
- `POST /api/characters/{id}/view` - Increment views

### Content Endpoints
- `GET /api/content/categories` - Get categories
- `GET /api/content/categories/{id}` - Get category by ID
- `GET /api/content/eras` - Get eras
- `GET /api/content/eras/{id}` - Get era by ID

### Media Endpoints
- `POST /api/media/upload` - Upload file
- `DELETE /api/media/{url}` - Delete file
- `GET /api/media` - Get media files (Admin)

### Analytics Endpoints
- `POST /api/analytics/events` - Track event
- `POST /api/analytics/pageview` - Track page view
- `GET /api/analytics` - Get analytics (Admin)

## 🧪 Testing

### Run Tests
```bash
dotnet test
```

### Test Structure
```
Tests/
├── Controllers/
│   ├── AuthControllerTests.cs
│   ├── CharactersControllerTests.cs
│   └── ...
├── Services/
│   ├── AuthServiceTests.cs
│   ├── CharacterServiceTests.cs
│   └── ...
└── Integration/
    ├── ApiIntegrationTests.cs
    └── DatabaseIntegrationTests.cs
```

## 🚀 Deployment

### Development
```bash
dotnet run --environment Development
```

### Production
```bash
dotnet publish -c Release -o ./publish
```

### Docker
```bash
docker build -t ontheirfootsteps-api .
docker run -p 5000:80 ontheirfootsteps-api
```

## 🔧 Development Commands

### Entity Framework
```bash
# Add migration
dotnet ef migrations add MigrationName

# Update database
dotnet ef database update

# Remove last migration
dotnet ef migrations remove

# Generate SQL script
dotnet ef migrations script
```

### Build & Run
```bash
# Build project
dotnet build

# Run project
dotnet run

# Run with specific environment
dotnet run --environment Production

# Watch for changes
dotnet watch
```

### Code Quality
```bash
# Format code
dotnet format

# Analyze code
dotnet analyze

# Restore packages
dotnet restore
```

## 🛡️ Security Features

- **JWT Authentication**: Secure token-based authentication
- **ASP.NET Identity**: User management and password hashing
- **Rate Limiting**: API protection against abuse
- **CORS**: Cross-origin resource sharing configuration
- **Input Validation**: Comprehensive model validation
- **SQL Injection Protection**: Entity Framework parameterized queries
- **HTTPS Enforcement**: SSL/TLS in production

## 📊 Performance Features

- **Response Caching**: In-memory and distributed caching
- **Database Indexing**: Optimized query performance
- **Async/Await**: Non-blocking I/O operations
- **Connection Pooling**: Efficient database connections
- **Lazy Loading**: Optimized data loading
- **Compression**: GZIP response compression

## 📝 Logging & Monitoring

- **Serilog**: Structured logging
- **Request Logging**: HTTP request/response logging
- **Error Handling**: Centralized exception handling
- **Health Checks**: Application health monitoring
- **Performance Metrics**: Request timing and analytics

## 🔄 Version Control

- **Git**: Source control management
- **Semantic Versioning**: Automated version bumping
- **CI/CD Pipeline**: Automated build and deployment
- **Code Review**: Pull request workflow

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Email: support@ontheirfootsteps.com
- Documentation: https://docs.ontheirfootsteps.com

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
