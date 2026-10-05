import fsp from "node:fs/promises"
import path from "node:path/posix"
import cproc from "node:child_process"

export function runStaticBuilder(command: string, outPath: string) {
	return new Promise<string>((resolve, reject) => {
		const bin = process.env.SHELL ?? "/bin/bash"
		const outDirectory = path.resolve(outPath, "..")
		const expectedFileName = path.basename(outPath)
		const args = ["-c", command, "_", path.resolve(outDirectory, expectedFileName), outDirectory]
		console.log("Run static builder", {bin, command, outDirectory, expectedFileName, args})
		const c = cproc.spawn(bin, args, {
			cwd: process.cwd(),
		})
		c.stderr.on("data", (d) => process.stderr.write(d))

		// if we include $1 assume we're writing to a file not stdout
		const writesToStdout = !command.includes("$1")
		let data = ""
		if (writesToStdout) {
			// writes into stdout so don't need to read file, but do need to track stdout in a variable
			c.stdout.on("data", (d) => (data += d))
		} else {
			// otherwise we stream stdout and then go read the file
			c.stdout.on("data", (d) => process.stdout.write(d))
		}
		c.addListener("exit", async () => {
			if (c.exitCode === 0) {
				if (writesToStdout) {
					// reflect to disk
					await fsp.writeFile(outPath, data)
				} else {
					// get contents on disk from assets directory
					data = await fsp.readFile(outPath, "utf8")
				}
				resolve(data)
			} else {
				reject(new Error("Exit code " + c.exitCode))
			}
		})
	})
}
