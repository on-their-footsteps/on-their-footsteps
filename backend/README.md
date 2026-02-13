# On Their Footsteps - N-Tier .NET Backend

This is a clean N-tier architecture .NET 10 backend for the "On Their Footsteps" application.

## Architecture Overview

The solution follows a clean N-tier architecture with clear separation of concerns:

### Layers

1. **Domain Layer** (`OnTheirFootsteps.Domain`)
   - Core business entities (Character, Story, Comment)
   - Domain interfaces (IRepository, ICharacterRepository, IStoryRepository)
   - No external dependencies

2. **Application Layer** (`OnTheirFootsteps.Application`)
   - Business logic and services
   - DTOs for data transfer
   - Service interfaces and implementations
   - Unit of Work pattern

3. **Infrastructure Layer** (`OnTheirFootsteps.Infrastructure`)
   - Entity Framework Core implementation
   - Repository pattern implementation
   - Database context and migrations
   - External dependencies

4. **API Layer** (`OnTheirFootsteps.Api`)
   - Web API controllers
   - Dependency injection configuration
   - Swagger/OpenAPI documentation
   - CORS configuration

## Features

- **Character Management**: CRUD operations for historical characters
- **Story Management**: Stories linked to characters with publishing workflow
- **Comment System**: Comments on stories with approval workflow
- **Entity Framework Core**: Database operations with SQL Server
- **Repository Pattern**: Clean data access abstraction
- **Unit of Work**: Transaction management
- **DTOs**: Clean data transfer between layers
- **Swagger API Documentation**: Auto-generated API docs

## Getting Started

### Prerequisites
- .NET 10.0 SDK
- SQL Server or SQL Server LocalDB

### Configuration

1. Update the connection string in `appsettings.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=your_server;Database=OnTheirFootstepsDb;Trusted_Connection=true;MultipleActiveResultSets=true"
  }
}
```

2. Run database migrations (once .NET CLI is available):
```bash
dotnet ef database update
```

### Running the Application

```bash
cd src/OnTheirFootsteps.Api
dotnet run
```

The API will be available at `https://localhost:7123` and Swagger UI at `https://localhost:7123/swagger`.

## API Endpoints

### Characters
- `GET /api/characters` - Get all characters
- `GET /api/characters/active` - Get active characters only
- `GET /api/characters/period/{period}` - Get characters by historical period
- `GET /api/characters/{id}` - Get character by ID
- `POST /api/characters` - Create new character
- `PUT /api/characters/{id}` - Update character
- `DELETE /api/characters/{id}` - Delete character

### Stories
- `GET /api/stories/published` - Get published stories
- `GET /api/stories/popular` - Get popular stories
- `GET /api/stories/character/{characterId}` - Get stories by character
- `GET /api/stories/{id}` - Get story by ID

## Database Schema

### Characters
- Id (Guid)
- Name (string)
- Description (string)
- HistoricalPeriod (string)
- Location (string)
- ImageUrl (string)
- IsActive (bool)
- Audit fields (CreatedAt, UpdatedAt, CreatedBy, UpdatedBy)

### Stories
- Id (Guid)
- Title (string)
- Content (string)
- Summary (string)
- PublishedAt (DateTime)
- IsPublished (bool)
- ViewCount (int)
- CharacterId (Guid, FK)
- Audit fields

### Comments
- Id (Guid)
- Content (string)
- AuthorName (string)
- AuthorEmail (string)
- IsApproved (bool)
- StoryId (Guid, FK)
- Audit fields

## Docker Deployment

### Prerequisites
- Docker Desktop for Windows
- Docker Compose

### Quick Start

1. **Using the startup script:**
   ```bash
   # Windows
   docker-start.bat
   
   # Linux/Mac
   ./docker-start.sh
   ```

2. **Manual start:**
   ```bash
   docker-compose up --build
   ```

3. **Background mode:**
   ```bash
   docker-compose up --build -d
   ```

### Services

- **Backend**: `http://localhost:5000` (.NET 10 API)
- **Frontend**: `http://localhost:3000` (React development server)
- **Database**: SQL Server on port 1433
- **Redis**: On port 6379
- **Nginx**: `http://localhost:80` (production proxy)

### Database Configuration

The Docker setup uses SQL Server with these credentials:
- **Server**: localhost,1433
- **Database**: OnTheirFootstepsDb
- **User**: sa
- **Password**: Footsteps123!

### Development Override

Use `docker-compose.override.yml` for development settings:
- Hot reload enabled
- Development environment variables
- Volume mounts for live code changes

### Stopping Services

```bash
docker-compose down
```

### Viewing Logs

```bash
docker-compose logs -f
```

## Development Notes

- The solution uses clean architecture principles with dependency injection
- Entity Framework Core handles database operations
- Repository pattern provides abstraction over data access
- DTOs prevent over-posting and provide clean API contracts
- Swagger documentation is automatically generated
- CORS is configured for frontend integration
