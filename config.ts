/**
 * @author Benjamin Gwynn <contact@benjamingwynn.com>
 * @format
 */

import path from "path"
import process from "process"
import fsp from "fs/promises"
import fs from "fs"
import {parseJSoncFile} from "./jsonc.ts"

const defaultConfig = {
	entrypoint: "./src/index.html",
	serviceWorkers: "./src/sw",
	devPort: 1234,
	buildFolder: "dist",
	metaFile: ".meta.json",
	visualizer: "esbuild-visualizer --open --metadata",
}

async function readJsoncFile(filePath: string) {
	const file = (await fsp.readFile(filePath)).toString()
	const parsed = parseJSoncFile(file)
	return parsed
}

export async function getConfig() {
	const possiblePaths = ["./swes.jsonc"]
	let config = {...defaultConfig}
	let configPath: undefined | string
	const defaults = Object.keys(config)
	for (const place of possiblePaths) {
		const here = path.join(process.cwd(), place)
		if (fs.existsSync(here)) {
			try {
				const readConfig = await readJsoncFile(here)
				configPath = here
				for (const key of Object.keys(readConfig)) {
					if (defaults.includes(key)) {
						const newValue = readConfig[key]
						defaults.splice(defaults.indexOf(key), 1)
						;(config as any)[key] = newValue
					}
				}
				break
			} catch (err: any) {
				if (err.name === "SyntaxError") {
					console.error("WARNING: file", here, "has invalid syntax:", err.message)
				} else {
					throw err
				}
			}
		}
	}
	return {config, defaults, configPath}
}
