## Game Tracker

Render Link  - https://a3-maxwelljeronimo-a25.onrender.com

Game Tracker is a full-stack web application that provides features for signing up, logging in, adding games, viewing 
stats, and managing accounts. Admin users have additional features to manage all users and games in the system.

Reason for the Application: I wanted to create a simple, styled interface to track friendly competitions like 
Mario Kart, Ping Pong, and Corn Hole. This project also helped me gain experience with full-stack development, 
including sessions, authentication, MongoDB, and Bootstrap.

Issues Faced:

- Managing conditional form fields, meaning partners are only displayed for certain games.
- Keeping session data in sync with routes in Express.
- Hosting on Render and externalizing secrets from .env into environment variables.

Authentication Strategy: I chose session-based authentication using express-session and connect-mongo so that users 
stay logged in during requests. I found this approach simple to implement and well-supported by MongoDB Atlas.

CSS Framework: I used Bootstrap 5 because it offers responsive components and an easy grid layout.

Custom CSS Modifications: I made minor changes to spacing and alignment in main.css to ensure consistent visuals 
between cards and forms.

Middleware Packages Used:

- express: Manages the core server and routing.
- mongoose: Connects to MongoDB Atlas and manages schemas and models for User and Game.
- bcrypt: Hashes and securely stores passwords.
- express-session: Manages user sessions stored in cookies.
- connect-mongo: Saves session data in MongoDB instead of in memory.
- dotenv: Loads environment variables from .env, like Mongo URI and session secret.
- path: Serves static HTML and JS files correctly.

Custom Functions:

The game and stat calculation endpoints (/api/my/stats, /api/stats) gather user performance into wins, losses, and 
ties based on game type.

Middleware checks for the presence of a session to authenticate users before returning data.

Technical Achievements:

- Tech Achievement 1: I provided full CRUD functionality for games, including creating, displaying, editing, and removing them using MongoDB.
- Tech Achievement 2: I developed a role-based application with routes accessible only to admin users for creating, updating, and deleting users and games.
- Tech Achievement 3: I used session-based authentication with MongoDB-backed storage to keep users logged in even after they restart.

Design/Evaluation Achievements:

- Design Achievement 1: I used Bootstrap's grid system and card styling to create clean, responsive forms and stats for mobile devices.
- Design Achievement 2: I improved usability by conditionally showing partner fields only for the relevant games to reduce clutter.
- Design Achievement 3: I added accessible button labels and a standard navbar structure to improve navigation across the site.

TESTER ACCOUNT 1 (User):
cs4241tester@wpi.edu
tester123

TESTER ACCOUNT 2 (Admin):
cs4241testerA@wpi.edu
tester123