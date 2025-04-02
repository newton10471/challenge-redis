import net from 'net';
import { Parser } from './parser.ts';
import { Serializer } from './serializer.ts';

// Create a TCP server
const server = net.createServer((socket) => {
	// Instantiate the parser for this connection.
	const parser = new Parser();

	// Listen for complete commands parsed from incoming data.
	parser.on('command', (command: string[]) => {
		// Check that we received a command and that it is PING.
		if (command.length > 0 && command[0].toUpperCase() === 'PING') {
			// Respond with PONG using the Serializer.
			const reply = Serializer.serialize("PONG");
			socket.write(reply);
		} else {
			// For any unsupported command, send an error reply.
			const reply = Serializer.serialize(new Error("ERR unknown command"));
			socket.write(reply);
		}
	});

	// When data comes in from the client, feed it to the parser.
	socket.on('data', (data: Buffer) => {
		parser.feed(data);
	});

	socket.on('error', (err) => {
		console.error('Socket error:', err);
	});
});

// Start listening on the standard Redis port.
server.listen(6379, () => {
	console.log('Redis clone server listening on port 6379');
});
