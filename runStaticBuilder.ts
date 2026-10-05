import path from "node:path/posix"
import cproc from "node:child_process"

export function runStaticBuilder(command: string, outPath: string) {
	return new Promise<void>((resolve, reject) => {
		const bin = process.env.SHELL ?? "/bin/bash"
		const outDirectory = path.resolve(outPath, "..")
		const expectedFileName = path.basename(outPath)
		const args = ["-c", command, "_", path.resolve(outDirectory, expectedFileName), outDirectory]
		console.log("Run static builder", {bin, command, outDirectory, expectedFileName, args})
		const c = cproc.spawn(bin, args, {
			cwd: process.cwd(),
		})
		c.stdout.on("data", (d) => process.stdout.write(d))
		c.stderr.on("data", (d) => process.stderr.write(d))
		c.addListener("exit", () => {
			if (c.exitCode === 0) {
				resolve()
			} else {
				reject(new Error("Exit code " + c.exitCode))
			}
		})
	})
}
