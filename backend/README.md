# 🚀 OnTheirFootsteps Backend - .NET Core 10.0

ASP.NET Core 10.0 Web API following N-Tier architecture for the "On Their Footsteps" Islamic historical figures educational platform.

## 🏗️ Architecture Overview

### N-Tier Architecture
```
OnTheirFootsteps.Api/
├── Application/           # Application Layer (Use Cases)
│   ├── Commands/        # Write operations (CQRS Commands)
│   ├── Queries/         # Read operations (CQRS Queries)
│   └── DTOs/           # Request/Response models
├── Domain/              # Domain Layer (Business Logic)
│   ├── Entities/       # Rich domain models
│   ├── ValueObjects/   # Immutable value types
│   └── Services/       # Domain services
├── Infrastructure/      # Infrastructure Layer (External Concerns)
│   ├── Data/           # EF Core, Repositories
│   ├── Identity/       # ASP.NET Identity implementation
│   └── Media/          # File storage services
├── Common/              # Shared Layer (Cross-cutting)
│   ├── Extensions/      # Common extensions
│   ├── Exceptions/      # Custom exceptions
│   └── Utilities/      # Shared utilities
├── Presentation/        # Presentation Layer (API)
│   ├── Controllers/     # API Controllers
│   ├── Middleware/      # Custom middleware
│   └── Filters/         # Action filters
└── Configuration/       # Configuration
    ├── Program.cs        # Application entry point
    └── appsettings.json # Application settings
```

### Technology Stack
- **Framework**: ASP.NET Core 10.0
- **Language**: C# 12
- **Architecture**: N-Tier with Clean Architecture principles
- **Database**: PostgreSQL with Entity Framework Core
- **Authentication**: JWT Bearer with ASP.NET Identity
- **CQRS**: Command Query Responsibility Segregation
- **Documentation**: Swagger/OpenAPI 3.0
- **Testing**: xUnit + Moq
- **Logging**: Serilog
- **Containerization**: Docker + Docker Compose

## 🛠️ Prerequisites

- .NET 10.0 SDK
- PostgreSQL 15+
- Visual Studio 2022 or VS Code
- Git
- Docker (optional, for containerized deployment)

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/on-their-footsteps/on-their-footsteps.git
cd on-their-footsteps/backend
```

### 2. Database Setup
```bash
# Create PostgreSQL database
createdb on_their_footsteps

# Update connection string in appsettings.json
```

### 3. Install Dependencies
```bash
cd OnTheirFootsteps.Api
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

## 🏗️ N-Tier Architecture Benefits

### Separation of Concerns
- **Presentation Layer**: Handles HTTP requests/responses
- **Application Layer**: Implements use cases and business rules
- **Domain Layer**: Contains core business logic and entities
- **Infrastructure Layer**: Handles external concerns (database, file storage)
- **Common Layer**: Shared utilities and extensions

### CQRS Pattern
- **Commands**: Write operations (Create, Update, Delete)
- **Queries**: Read operations optimized for different scenarios
- **Separate Handlers**: Optimized for specific operations

### Clean Architecture Principles
- **Dependency Inversion**: High-level modules don't depend on low-level modules
- **Single Responsibility**: Each class has one reason to change
- **Open/Closed**: Open for extension, closed for modification
- **Interface Segregation**: Clients don't depend on unused interfaces
- **Dependency Inversion**: Depend on abstractions, not concretions

## 🧪 Testing

### Run Tests
```bash
dotnet test
```

### Test Structure
```
Tests/
├── Application/
│   ├── Commands/
│   │   ├── CreateCharacterCommandTests.cs
│   │   └── UpdateCharacterCommandTests.cs
│   └── Queries/
│       ├── GetCharacterByIdQueryTests.cs
│       └── GetCharactersQueryTests.cs
├── Domain/
│   ├── Entities/
│   │   ├── CharacterTests.cs
│   │   └── UserTests.cs
│   └── Services/
│       └── DomainServiceTests.cs
├── Infrastructure/
│   ├── Data/
│   │   └── RepositoryTests.cs
│   └── Identity/
│       └── AuthServiceTests.cs
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
# Build image
docker build -t ontheirfootsteps-api .

# Run with compose
docker-compose up -d

# View logs
docker-compose logs -f
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
- **Authorization**: Role-based access control

## 📊 Performance Features

- **Response Caching**: In-memory and distributed caching
- **Database Indexing**: Optimized query performance
- **Async/Await**: Non-blocking I/O operations
- **Connection Pooling**: Efficient database connections
- **Lazy Loading**: Optimized data loading
- **Compression**: GZIP response compression
- **CQRS Optimization**: Separate read/write models

## 📝 Logging & Monitoring

- **Serilog**: Structured logging with multiple sinks
- **Request Logging**: HTTP request/response logging
- **Error Handling**: Centralized exception handling
- **Health Checks**: Application health monitoring
- **Performance Metrics**: Request timing and analytics
- **Application Insights**: Azure monitoring integration

## 🔄 Version Control & CI/CD

- **Git**: Source control management
- **Semantic Versioning**: Automated version bumping
- **GitHub Actions**: Automated build and deployment
- **Code Review**: Pull request workflow
- **Automated Testing**: CI pipeline with test coverage

## 🌐 Container Support

### Docker Configuration
- **Multi-stage builds**: Optimized production images
- **Base images**: Official .NET runtime
- **Health checks**: Built-in container health monitoring
- **Environment variables**: Flexible configuration
- **Volume mounting**: Persistent data storage

### Docker Compose
- **PostgreSQL**: Database service
- **Redis**: Caching service (optional)
- **Nginx**: Reverse proxy with SSL termination
- **Application**: .NET API service
- **Networking**: Internal service communication

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Email: support@ontheirfootsteps.com
- Documentation: https://docs.ontheirfootsteps.com

## 📄 License

This project is licensed under MIT License - see LICENSE file for details.

## 🎯 Architecture Decision Records (ADRs)

### ADR-001: N-Tier Architecture
**Decision**: Adopt N-Tier architecture with clean architecture principles
**Status**: Accepted
**Consequences**: 
- Improved maintainability and testability
- Clear separation of concerns
- Better support for scaling individual layers

### ADR-002: CQRS Pattern
**Decision**: Implement CQRS for command/query separation
**Status**: Accepted
**Consequences**:
- Optimized read/write operations
- Better performance for complex queries
- Clearer intent in code

### ADR-003: Entity Framework Core
**Decision**: Use EF Core for data access
**Status**: Accepted
**Consequences**:
- Rapid development with migrations
- Strong typing and LINQ support
- Cross-platform database support
