/**
 * @author Benjamin Gwynn <contact@benjamingwynn.com>
 * @format
 */

import * as path from "path"
import {fileURLToPath} from "url"
import fsp from "fs/promises"
import c from "ansi-colors"
import {getConfig} from "./config.ts"

const packageJSON = JSON.parse((await fsp.readFile(path.join(fileURLToPath(import.meta.url), "..", "package.json"))).toString())

const commands = {
	dev: () => void 0,
	build: () => void 0,
	meta: () => void 0,
	visualize: () => void 0,
}

const verString = "swes@" + packageJSON.version

function help() {
	console.log(verString)
	console.log("S.W.E.S.   Svelte Web ESbuild")
	console.log("           a simple platform for developing svelte projects with esbuild")
	console.log("           https://github.com/benjamingwynn/swes")
	console.log("")
	console.log("Usage:", "swes", "[command]", "[flags]")
	console.log("      ", "swes", "[ -h | --help | -v | --version ]")
}

function noCommand() {
	help()
	console.log("")
	console.log("(start with --help for a full list of options)")
}

async function helpAll() {
	help()
	// const defaults = ["devPort", "buildFolder", "metaFile", "visualizer"]
	const {config, defaults, configPath} = await getConfig()
	// const config = {
	// 	devPort: 1234,
	// 	buildFolder: "dist",
	// 	metaFile: ".meta.json",
	// 	visualizer: "esbuild-visualizer --open --metadata",
	// }
	console.log("")
	console.log("Commands:")
	console.log("  " + "dev".padEnd(21, " ") + `Starts the development server on port ${c.bold(c.redBright(config.devPort.toString()))}.`)
	console.log("  " + "build".padEnd(21, " ") + `Builds the production bundle of the website to the '${c.bold(c.green(config.buildFolder))}' folder.`)
	console.log("  " + "metafile".padEnd(21, " ") + `Generates a metafile from esbuild into '${c.bold(c.magenta(config.metaFile))}' for external analysis.`)
	console.log("  " + "visualize".padEnd(21, " ") + `Generates a metafile and opens it with '${c.bold(c.blue(config.visualizer?.split(" ").at(0) ?? ""))}'.`)
	console.log("")
	console.log("Configuration:")
	console.log("  " + "Using the following configuration:")
	console.log("    " + "{")
	console.log(
		"    " +
			`  ${c.bold(c.redBright("devPort"))}: ${
				defaults.includes("devPort") ? c.bgBlack(config.devPort.toString()) : c.bgYellow(config.devPort.toString())
			},`
	)
	console.log(
		"    " +
			`  ${c.bold(c.green("buildFolder"))}: ${
				defaults.includes("buildFolder") ? c.bgBlack(`"${config.buildFolder}"`) : c.bgYellow(`"${config.buildFolder}"`)
			},`
	)
	console.log(
		"    " +
			`  ${c.bold(c.magenta("metaFile"))}: ${defaults.includes("metaFile") ? c.bgBlack(`"${config.metaFile}"`) : c.bgYellow(`"${config.metaFile}"`)},`
	)
	console.log(
		"    " +
			`  ${c.bold(c.blue("visualizer"))}: ${
				defaults.includes("visualizer") ? c.bgBlack(`"${config.visualizer}"`) : c.bgYellow(`"${config.visualizer}"`)
			},`
	)
	console.log("    " + "}")

	if (defaults.length) {
		console.log("  " + "Using defaults for: " + defaults.map((x) => c.bgBlack(x)).join(", "))
	}
	if (configPath) {
		console.log("  " + "Using configuration from " + c.bgYellow(`'${configPath}'`) + ", configure this to change parameters.")
	} else {
		console.log("  " + "Create a file at '" + path.join(process.cwd(), "swes.jsonc") + "' to configure the above parameters.")
	}
	console.log("")
}

function version() {
	console.log(verString)
}

;(function parseAndExecute() {
	const args = process.argv.slice(2)
	if (args.includes("--help") || args.includes("-h")) {
		return helpAll()
	}

	if (args.includes("--version") || args.includes("-v")) {
		return version()
	}

	return noCommand()
})()
