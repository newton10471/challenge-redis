import * as net from "node:net";

const server = net.createServer((c) => {
  // 'connection' listener.
  console.log('client connected');
  c.on('end', () => {
    console.log('client disconnected');
  });
  c.write('hello\r\n');
  c.pipe(c);
});

server.on('error', (err) => {
  throw err;
});

server.listen(6379, () => {
  console.log('server bound');
});
