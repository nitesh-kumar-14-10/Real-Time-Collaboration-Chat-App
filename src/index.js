const express = require('express');
const helmet = require('helmet');
const http = require('http');
const cors = require('cors');
const Logger = require('./helpers/logger');
const routes = require('./routes/routes.js');
const {connectToMongoDB} = require('./config/mongo');
const {connectToMySQL} = require('./config/mysql');
const {connectToRedis} = require('./config/redis.js');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(helmet());
app.use('/api', routes);


app.use((err, req, res, next) => {
    Logger.error(err.stack);
    const errorResponse = {
        message: 'Internal Server Error',
    };

    if (req.app.get('env') === 'development') {
        errorResponse.error = err.message;
    }

    res.status(500).json(errorResponse);
});

app.use(cors());


if (process.env.NODE_ENV === 'production') {
    app.use(helmet({
        contentSecurityPolicy: false,
    }));
}

app.get('/', (req, res) => {
    Logger.info('GET /');
    return res.status(200).json({success: true, users: []});
});


module.exports = app;

// Start the server
const port = process.env.PORT || 8080;

if (process.env.NODE_ENV !== 'testing') {
    server.listen(port, async () => {
        Logger.info(`Server is running on port ${port}`);
        await connectToMongoDB()
            .then(() => {
                Logger.info('After initial steps, MongoDB connection opened');
            })
            .catch((error) => {
                Logger.error(`Error opening MongoDB connection: ${error}`);
            });
        await connectToMySQL()
            .then(() => {
                Logger.info('After initial steps, MySQL connection opened');
            })
            .catch((error) => {
                Logger.error(`Error opening MySQL connection: ${error}`);
            });
        await connectToRedis()
            .then(() => {
                Logger.info('After initial steps, Redis connection opened');
            })
            .catch((error) => {
                Logger.error(`Error opening Redis connection: ${error}`);
            });
    });
}
