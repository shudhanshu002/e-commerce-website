import dotenv from 'dotenv'
dotenv.config({
  path: './.env',
});

import connectDB from './config/db.js'
import { app } from './app.js'



const port = process.env.PORT || 8000;

connectDB()
.then(() => {
    app.listen(port, () => {
        console.log(`🚀 Server is running at http://localhost:${port}`);
    })
})
.catch((err) => {
    console.error("MongoDB connection failed!!!", err);
    process.exit(1);
})