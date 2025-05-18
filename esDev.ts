/** @format */

import fs from "node:fs"
import esbuild from "esbuild"
import * as fsp from "node:fs/promises"
import * as path from "node:path/posix"
import {makeBuildOptions} from "./esOpts.ts"
import {getConfig} from "./config.ts"
import {handleLinks} from "./links.ts"

const {config} = await getConfig()

export async function startDevServer() {
	const buildOptions = makeBuildOptions(true)

	const outdir = path.join(process.cwd(), buildOptions.outdir)
	await fsp.rm(outdir, {recursive: true, force: true})
	await fsp.mkdir(outdir)

	// link includes
	await handleLinks(config, true)

	const ctx = await esbuild.context(buildOptions)

	ctx.watch()

	const server = await ctx.serve({port: config.devPort, fallback: "/index.html", servedir: outdir})
	console.log(`watching & listening at http://${server.host}:${server.port}`)
	// console.log("(end)")
}
