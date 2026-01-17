import './config';

import { pool } from './database/db';
import app from './app';
export default pool;

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});