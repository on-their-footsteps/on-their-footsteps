# Use the official .NET 10.0 runtime as a parent image
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

# Use the SDK image to build the application
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy csproj and restore as distinct layers
COPY ["OnTheirFootsteps.Api/OnTheirFootsteps.Api.csproj", "OnTheirFootsteps.Api/"]
RUN dotnet restore "OnTheirFootsteps.Api/OnTheirFootsteps.Api.csproj"

# Copy the rest of the files and build
COPY . .
WORKDIR "/src/OnTheirFootsteps.Api"
RUN dotnet build "OnTheirFootsteps.Api.csproj" -c Release -o /app/build

# Build the runtime image
FROM build AS publish
RUN dotnet publish "OnTheirFootsteps.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Final stage
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Create uploads directory
RUN mkdir -p /app/wwwroot/uploads

# Set environment variables
ENV ASPNETCORE_URLS=http://+:80
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "OnTheirFootsteps.Api.dll"]
