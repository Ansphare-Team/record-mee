import { app, BrowserWindow } from "electron";

export const AUTH_PROTOCOL = "recordmee";

export function setupAuthCallback() {
	// Allow the custom protocol
	app.setAsDefaultProtocolClient(AUTH_PROTOCOL);

	// Handle auth callback from website (macOS)
	app.on("open-url", (event, url) => {
		if (url.startsWith(`${AUTH_PROTOCOL}://auth/callback`)) {
			event.preventDefault();
			handleAuthCallback(url);
		}
	});

	// Handle auth callback from website (Windows/Linux - when app is already running)
	app.on("second-instance", (_event, commandLine) => {
		for (const arg of commandLine) {
			if (arg.startsWith(`${AUTH_PROTOCOL}://auth/callback`)) {
				handleAuthCallback(arg);
				break;
			}
		}
	});

	// Handle initial launch on Windows/Linux when opened via custom protocol
	if (process.platform === "win32" || process.platform === "linux") {
		const args = process.argv;
		for (const arg of args) {
			if (arg.startsWith(`${AUTH_PROTOCOL}://auth/callback`)) {
				// Store the URL for later handling when app is ready
				app.on("ready", () => {
					handleAuthCallback(arg);
				});
				break;
			}
		}
	}
}

function handleAuthCallback(url: string) {
	// Send the callback URL to the renderer process
	const mainWindow = BrowserWindow.getAllWindows()[0];
	if (mainWindow && !mainWindow.isDestroyed()) {
		mainWindow.webContents.send("auth-callback", url);
		mainWindow.show();
		mainWindow.focus();
	}
}
