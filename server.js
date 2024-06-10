const http = require('http');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const EventEmitter = require('events');

class MyEmitter extends EventEmitter {}

//New emitter object
const myEmitter = new MyEmitter();

//Logging function
function logEvent(message) {
    const date = new Date();
    const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const logFilePath = path.join(logsDir, `${dateString}.log`);

    const logMessage = `[${date.toISOString()}] ${message}\n`;
    fs.appendFile(logFilePath, logMessage, (err) => {
        if (err) {
            console.error('Failed to write log:', err);
        }
    });
}

//Event listeners
myEmitter.on('status', (code) => {
    const message = `HTTP Status Code: ${code}`;
    console.log(message);
    logEvent(message);
});

myEmitter.on('error', (err) => {
    const message = `Error: ${err.message}`;
    console.log(message);
    logEvent(message);
});

myEmitter.on('routeAccessed', (route) => {
    const message = `Route accessed: ${route}`;
    console.log(message);
    logEvent(message);
});

myEmitter.on('fileRead', (filePath) => {
    const message = `File successfully read: ${filePath}`;
    console.log(message);
    logEvent(message);
});

myEmitter.on('fileNotFound', (filePath) => {
    const message = `File not found: ${filePath}`;
    console.log(message);
    logEvent(message);
});

//Function to read HTML files
function readHtmlFile(filePath, res) {
    fs.readFile(filePath, (err, data) => {
        if (err) {
            myEmitter.emit('error', err);
            myEmitter.emit('fileNotFound', filePath);
            res.writeHead(500, {'Content-Type': 'text/plain'});
            res.end('Internal Server Error');
        } else {
            myEmitter.emit('fileRead', filePath);
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.end(data);
        }
    });
}

//Fetch daily information (e.g., news)
async function fetchDailyInfo(res) {
    try {
        const response = await axios.get('https://newsapi.org/v2/top-headlines', {
            params: {
                country: 'us',
                apiKey: 'YOUR_NEWSAPI_KEY'
            }
        });
        const articles = response.data.articles;
        let content = '<h1>Top News Headlines</h1>';
        articles.forEach(article => {
            content += `<h2>${article.title}</h2><p>${article.description}</p>`;
        });
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(content);
    } catch (error) {
        myEmitter.emit('error', error);
        res.writeHead(500, {'Content-Type': 'text/plain'});
        res.end('Failed to fetch daily information');
    }
}

//Create the server
const server = http.createServer((req, res) => {
    const url = req.url;

    switch(url) {
        case '/':
            myEmitter.emit('routeAccessed', '/');
            readHtmlFile(path.join(__dirname, 'views', 'index.html'), res);
            break;
        case '/about':
            myEmitter.emit('routeAccessed', '/about');
            readHtmlFile(path.join(__dirname, 'views', 'about.html'), res);
            break;
        case '/contact':
            myEmitter.emit('routeAccessed', '/contact');
            readHtmlFile(path.join(__dirname, 'views', 'contact.html'), res);
            break;
        case '/products':
            myEmitter.emit('routeAccessed', '/products');
            readHtmlFile(path.join(__dirname, 'views', 'products.html'), res);
            break;
        case '/subscribe':
            myEmitter.emit('routeAccessed', '/subscribe');
            readHtmlFile(path.join(__dirname, 'views', 'subscribe.html'), res);
            break;
        case '/daily':
            myEmitter.emit('routeAccessed', '/daily');
            fetchDailyInfo(res);
            break;
        default:
            myEmitter.emit('routeAccessed', 'unknown');
            res.writeHead(404, {'Content-Type': 'text/html'});
            res.end('<h1>404 Page Not Found</h1>');
    }

    //Emit HTTP status code event
    myEmitter.emit('status', res.statusCode);
});

//Listening on port 3000
server.listen(3000, () => {
    console.log('Server is listening on port 3000');
});
