var bunyan      = require('bunyan');
var logging     = bunyan.createLogger({
    name: 'git-slack-pullrequests-reminder',
    streams: [
    {
        level: 'debug',
        stream: process.stdout
    },
    {

        level: 'error',
        stream: process.stdout
    },
    {
        level: 'debug',
        path: './logs/debug.log'
    },
    {
        level: 'error',
        path: './logs/error.log'
    },
    {
        level: 'info',
        path: './logs/access.logs'
    }
    ]
});
logging.info("CREATED LOGGER!!");
module.exports = logging;

