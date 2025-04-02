import { describe, it, beforeAll, afterAll, expect } from "vitest";
import * as net from "node:net";

// Import your server file so that it starts up. If possible, have your server file export
// the server instance so you can shut it down after tests. For example:
// import { server } from "../src/server";
import "../src/server";

// Helper function to send a command to the server and collect its response.
function sendCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const client = net.connect({ port: 6379 }, () => {
            client.write(command);
        });
        let response = "";
        client.on("data", (chunk) => {
            response += chunk.toString();
        });
        client.on("end", () => {
            resolve(response);
        });
        client.on("error", reject);
    });
}

describe("RESP Server", () => {
    // Wait a bit before running tests to allow the server to start.
    beforeAll((done) => {
        setTimeout(done, 100);
    });

    // If your server.ts exports the server instance, you can gracefully close it here.
    afterAll((done) => {
        // Example: server.close(done);
        done();
    });

    it("should respond with PONG for a RESP Array command", async () => {
        // PING as an array command (commonly how commands are sent)
        const command = "*1\r\n$4\r\nPING\r\n";
        const response = await sendCommand(command);
        expect(response).toBe("+PONG\r\n");
    });

    it("should respond with PONG for a BulkString command", async () => {
        // PING sent as a BulkString command
        const command = "$4\r\nPING\r\n";
        const response = await sendCommand(command);
        expect(response).toBe("+PONG\r\n");
    });

    it("should respond with PONG for a SimpleString command", async () => {
        // PING sent as a SimpleString command
        const command = "+PING\r\n";
        const response = await sendCommand(command);
        expect(response).toBe("+PONG\r\n");
    });

    it("should respond with an error for a non-PING command", async () => {
        // Any command other than PING should return an error.
        const command = "*1\r\n$3\r\nSET\r\n";
        const response = await sendCommand(command);
        expect(response.startsWith("-")).toBe(true);
    });
});
