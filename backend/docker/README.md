# LMQB Supabase Docker Development Environment

This directory contains a complete Docker-based Supabase setup for local LMQB development. All necessary configuration files and scripts are included to get you up and running quickly.

## 🚀 Quick Start

1. **Start the services:**
   ```bash
   cd /home/dr6117285/lmqb/backend/docker
   ./start-supabase.sh
   ```

2. **Check service health:**
   ```bash
   ./health-check.sh
   ```

3. **Access your services:**
   - **Supabase API**: http://localhost:8000
   - **Supabase Studio**: http://localhost:3001
   - **PostgreSQL**: localhost:5432

## 📁 File Structure

```
/home/dr6117285/lmqb/backend/docker/
├── docker-compose.yml          # Docker Compose configuration
├── .env                        # Environment variables
├── start-supabase.sh          # Startup script
├── health-check.sh            # Service health verification
├── README.md                  # This file
└── volumes/
    ├── api/
    │   └── kong.yml           # Kong Gateway configuration
    └── db/
        ├── init/
        │   ├── 01-init-supabase-db.sql    # Database initialization
        │   └── 02-apply-migrations.sql     # Migration application
        └── realtime.sql       # Realtime setup
```

## 🛠️ Services Included

| Service | Port | Purpose |
|---------|------|---------|
| Kong Gateway | 8000 | API Gateway (routes all requests) |
| Supabase Studio | 3001 | Admin interface |
| PostgreSQL | 5432 | Database |
| PostgREST | - | REST API (via Kong) |
| GoTrue | - | Authentication (via Kong) |
| Realtime | - | Real-time subscriptions (via Kong) |
| Storage | - | File storage (via Kong) |
| ImgProxy | - | Image transformations |

## 🔧 Configuration Details

### Environment Variables (.env)
- **Database**: PostgreSQL with password `dev-password-for-local-testing-only`
- **JWT Secret**: Development-only secret for local testing
- **API Keys**: Pre-configured anon and service role keys
- **Ports**: Kong (8000), Studio (3001), PostgreSQL (5432)

### Kong Gateway (volumes/api/kong.yml)
Routes all Supabase APIs through localhost:8000:
- `/rest/v1/` → PostgREST API
- `/auth/v1/` → Authentication API
- `/realtime/v1/` → Realtime API
- `/storage/v1/` → Storage API

### Database Setup
- Automatic creation of Supabase roles and permissions
- Application of LMQB schema migrations from `/home/dr6117285/lmqb/backend/supabase/migrations/`
- Row Level Security (RLS) policies
- Realtime publication setup

## 📋 Available Scripts

### start-supabase.sh
Main startup script with options:
```bash
./start-supabase.sh           # Start all services
./start-supabase.sh down      # Stop all services
./start-supabase.sh restart   # Restart all services
./start-supabase.sh logs      # View all logs
./start-supabase.sh logs db   # View specific service logs
./start-supabase.sh status    # Show container status
```

### health-check.sh
Comprehensive health verification:
- Docker container status
- HTTP endpoint availability
- Database connectivity
- Schema validation

## 🔗 Frontend Integration

Configure your React app to connect to the local Supabase instance:

```typescript
// src/utils/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://localhost:8000'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

## 📊 Database Schema

Your LMQB application schema includes:
- **categories**: Question categories (General, Board Review, Study Tool)
- **sections**: Subject sections within categories
- **questions**: Quiz questions with original JSON preservation
- **question_options**: Normalized answer options
- **user_profiles**: Extended user information
- **quiz_sessions**: Quiz attempt sessions
- **quiz_attempts**: Individual question attempts
- **user_statistics**: Performance analytics (materialized view)

## 🔐 Security Features

### Row Level Security (RLS)
- Users can only access their own data
- Admins have broader access permissions
- Proper role-based access control

### Authentication
- JWT-based authentication via GoTrue
- User profile creation on signup
- Role assignment (learner/admin)

## 🐛 Troubleshooting

### Services won't start
```bash
# Check Docker daemon
sudo systemctl status docker

# Check container logs
./start-supabase.sh logs [service-name]

# Restart services
./start-supabase.sh restart
```

### Database connection issues
```bash
# Check if database is ready
docker-compose exec supabase-db pg_isready -U postgres

# Connect to database directly
PGPASSWORD=dev-password-for-local-testing-only psql -h localhost -p 5432 -U postgres -d postgres
```

### API not responding
```bash
# Check Kong configuration
curl -I http://localhost:8000/rest/v1/

# Verify all services are running
docker-compose ps
```

### Reset everything
```bash
./start-supabase.sh down
docker-compose down -v  # Remove volumes
docker system prune     # Clean up
./start-supabase.sh     # Start fresh
```

## 📝 Development Workflow

1. **Start services**: `./start-supabase.sh`
2. **Verify health**: `./health-check.sh`
3. **Access Studio**: Open http://localhost:3001 for database management
4. **Develop frontend**: Connect React app to http://localhost:8000
5. **Monitor logs**: `./start-supabase.sh logs` for debugging
6. **Stop when done**: `./start-supabase.sh down`

## 🔄 Database Migrations

New migrations should be placed in `/home/dr6117285/lmqb/backend/supabase/migrations/` and will be automatically applied when containers start.

To apply new migrations to running containers:
```bash
# Restart to pick up new migrations
./start-supabase.sh restart
```

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Kong Gateway Documentation](https://docs.konghq.com/)
- [PostgREST API Reference](https://postgrest.org/en/stable/api.html)

## 🆘 Getting Help

1. Check the health status: `./health-check.sh`
2. Review container logs: `./start-supabase.sh logs`
3. Verify configuration files in `volumes/`
4. Ensure all required files are present and have correct permissions

---

**Note**: This is a development environment only. Do not use these configurations or credentials in production.