module.exports = ws => {
    console.log('connected');
    ws.on('message', (message) => {
        console.log('received: %s', message);
    });
    ws.send('something');
};