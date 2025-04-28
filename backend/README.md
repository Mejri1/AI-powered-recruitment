# Backend Setup

## Database Setup

1. Install PostgreSQL and create a database:
   ```bash
   createdb talentMatch
   ```

2. Create a `jobs` table:
   ```sql
   CREATE TABLE jobs (
       id SERIAL PRIMARY KEY,
       title VARCHAR(255) NOT NULL,
       description TEXT NOT NULL,
       cleaned_description TEXT NOT NULL,
       location VARCHAR(255) NOT NULL,
       salary_range VARCHAR(255) NOT NULL,
       experience_level VARCHAR(255) NOT NULL,
       job_type VARCHAR(255) NOT NULL
   );
   ```

3. Update the `.env` file with your database credentials:
   ```
   DB_NAME=talentMatch
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_HOST=localhost
   DB_PORT=5432
   ```
