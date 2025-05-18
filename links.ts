/** @format */
import path from "node:path"
import fsp from "node:fs/promises"
import fs from "node:fs"
import {makeBuildOptions} from "./esOpts.ts"
import {getConfig} from "./config.ts"

export async function handleLinks(config: Awaited<ReturnType<typeof getConfig>>["config"], dev: boolean) {
	for (const [url, linksTo] of Object.entries(config.links)) {
		const linkTarget = path.join(process.cwd(), linksTo)
		if (!fs.existsSync(linkTarget)) {
			throw new Error("File/folder does not exist: " + linkTarget)
		}
		const buildOptions = makeBuildOptions(dev)
		const outdir = path.join(process.cwd(), buildOptions.outdir)

		const linkLocation = path.join(outdir, url)
		console.log(url, "->", linkTarget)

		// make sure parent dir is created
		await fsp.mkdir(path.join(linkLocation, ".."), {recursive: true})

		if (dev) {
			// use a symlink
			await fsp.symlink(linkTarget, linkLocation)
		} else {
			// just copy the file
			const stat = await fsp.lstat(linkTarget)
			if (stat.isSymbolicLink()) {
				// unpack symlinks
				const realLinkTarget = await fsp.readlink(linkTarget)
				await fsp.cp(realLinkTarget, linkLocation)
			} else {
				await fsp.cp(linkTarget, linkLocation)
			}
		}
	}
}
