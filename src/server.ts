import * as net from "node:net";
import { Parser, SimpleString, RespError, BulkString, RespArray } from "./parser.ts";

const server = net.createServer((client) => {
	console.log("client connected");

	client.on("end", () => {
		console.log("client disconnected");
	});

	client.on("data", (data: Buffer) => {
		try {
			const parser = new Parser(data);
			const [msg, _] = parser.parseFrame();

			// Check if the parsed message is an array (typical for commands)
			if (msg instanceof RespArray) {
				const arr = msg.data;
				if (
					arr &&
					arr.length > 0 &&
					arr[0] instanceof BulkString &&
					arr[0].data?.toUpperCase() === "PING"
				) {
					client.write(new SimpleString("PONG").encode());
					return;
				}
			}
			// Also handle the cases where the command is sent as a BulkString or SimpleString.
			else if (msg instanceof BulkString) {
				if (msg.data?.toUpperCase() === "PING") {
					client.write(new SimpleString("PONG").encode());
					return;
				}
			} else if (msg instanceof SimpleString) {
				if (msg.data.toUpperCase() === "PING") {
					client.write(new SimpleString("PONG").encode());
					return;
				}
			}

			// For any other input, respond with an error.
			client.write(new RespError("unknown command").encode());
		} catch (err) {
			console.error("Error processing data:", err);
			client.write(new RespError("protocol error").encode());
		}
	});
});

server.on("error", (err) => {
	throw err;
});

server.listen(6379, () => {
	console.log("server bound");
});
