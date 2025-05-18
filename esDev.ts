/** @format */

import esbuild from "esbuild"
import * as fsp from "node:fs/promises"
import {makeBuildOptions} from "./esOpts.ts"
import {getConfig} from "./config.ts"

const {config} = await getConfig()

export async function startDevServer() {
	const buildOptions = makeBuildOptions(true)

	const outdir = buildOptions.outdir
	await fsp.rm(outdir, {recursive: true, force: true})
	const ctx = await esbuild.context(buildOptions)

	ctx.watch()

	const server = await ctx.serve({port: config.devPort, fallback: "/index.html", servedir: outdir})
	console.log(`watching & listening at http://${server.host}:${server.port}`)
	// console.log("(end)")
}
