/** @format */

import fs from "node:fs"
import http from "node:http"
import esbuild from "esbuild"
import * as fsp from "node:fs/promises"
import * as path from "node:path/posix"
import {makeBuildOptions, makeWorkerBuildOptions} from "./esOpts.ts"
import {getConfig} from "./config.ts"
import {handleLinks} from "./links.ts"
import {runStaticBuilder} from "./runStaticBuilder.ts"

const {config} = await getConfig()

const staticBuilders = new Map<string, Promise<string>>()

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
		if (req.url) {
			const url = new URL("http://localhost" + req.url)
			// run static builders WHEN paths are requested
			for (const [staticResourcePath, command] of Object.entries(config.staticBuilders)) {
				const fileName = path.basename(staticResourcePath)
				if (url.pathname === staticResourcePath) {
					const s = staticBuilders.get(staticResourcePath)
					let promise: Promise<string>
					if (s) {
						promise = s
						console.log("[ .. ] waiting for static resource")
					} else {
						console.log("[ .. ] building static resource")
						const outPath = path.join(outdir, fileName)
						promise = runStaticBuilder(command, outPath).then(async () => {
							// get contents on disk from assets directory
							const contents = await fsp.readFile(outPath, "utf8")
							return contents
						})
						staticBuilders.set(staticResourcePath, promise)
					}
					promise
						.then((contents) => {
							console.log("[ ok ] building static resource")
							res.end(contents)
						})
						.catch((err) => {
							console.error("[fail] building static resource")
							res.writeHead(500, {"content-type": "text/plain"})
							res.end(err.toString() + "\n")
						})
						.finally(() => {
							console.log("[ .x ] building static resource")
							// clear me so if we retry we build again. this is mainly to stop racing processes
							staticBuilders.delete(staticResourcePath)
						})
					return
				}
			}
		}
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
