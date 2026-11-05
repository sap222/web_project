import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/db.js';

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not set');
  process.exit(1);
}

const port = process.env.PORT || 5001;

connectDB()
  .then(() => app.listen(port, () => console.log(`API running on http://localhost:${port}`)))
  .catch((err) => {
    console.error('Could not start server:', err.message);
    process.exit(1);
  });
