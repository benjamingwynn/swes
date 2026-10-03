/** @format */

import fs from "node:fs"
import http from "node:http"
import esbuild from "esbuild"
import * as fsp from "node:fs/promises"
import * as path from "node:path/posix"
import {makeBuildOptions, makeWorkerBuildOptions} from "./esOpts.ts"
import {getConfig} from "./config.ts"
import {handleLinks} from "./links.ts"

const {config} = await getConfig()

export async function startDevServer() {
	const buildOptions = makeBuildOptions(true)
	const workerBuildOptions = makeWorkerBuildOptions(true)

	const outdir = path.join(process.cwd(), buildOptions.outdir)
	await fsp.rm(outdir, {recursive: true, force: true})
	await fsp.mkdir(outdir)

	if (workerBuildOptions) {
		const outdir = path.join(process.cwd(), workerBuildOptions.outdir)
		await fsp.rm(outdir, {recursive: true, force: true})
		await fsp.mkdir(outdir)
	}

	// link includes
	await handleLinks(config, true)

	const ctx = await esbuild.context(buildOptions)

	ctx.watch()
	if (workerBuildOptions) {
		console.log("web workers enabled!")
		const ctx2 = await esbuild.context(workerBuildOptions)
		ctx2.watch()
	}

	const server = await ctx.serve({fallback: "/index.html", servedir: outdir})
	// esbuild needs us proxy requests to add headers
	// we need to add headers for cross-origin-isolation, see https://developer.mozilla.org/en-US/docs/Web/API/Window/crossOriginIsolated
	http.createServer((req, res) => {
		const proxyReq = http.request(
			{
				host: server.host,
				port: server.port,
				path: req.url,
				method: req.method,
				headers: req.headers,
			},
			(proxyRes) => {
				res.writeHead(proxyRes.statusCode ?? 200, {
					...proxyRes.headers,
					// customer headers here
					"Cross-Origin-Opener-Policy": "same-origin",
					"Cross-Origin-Embedder-Policy": "require-corp",
					"x-server": "swes-devel",
				})

				proxyRes.pipe(res, {end: true})
			}
		)

		req.pipe(proxyReq, {end: true})
	}).listen(config.devPort)

	console.log(`watching & listening at http://${server.host}:${server.port}`)
	// console.log("(end)")
}
