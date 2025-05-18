/** @format */

import esbuildSvelte from "esbuild-svelte"
import sveltePreprocess from "svelte-preprocess"
import htmlPlugin from "@chialab/esbuild-plugin-html"
import type {BuildOptions} from "esbuild"
import {getConfig} from "./config.ts"

const {config} = await getConfig()

export const makeBuildOptions = (dev: boolean, extra?: {define: BuildOptions["define"]}): BuildOptions & {outdir: string} => {
	return {
		entryPoints: [config.entrypoint],
		minify: !dev,
		sourcemap: dev,
		// banner: {
		// 	js: `/* https://github.com/benjamingwynn/swes */`,
		// 	css: `/* https://github.com/benjamingwynn/swes */`,
		// },
		outdir: dev ? ".swes" : config.buildFolder,
		assetNames: "assets/[name]-[hash]",
		platform: "browser",
		entryNames: "index",
		chunkNames: "[ext]/[name]-[hash]",
		bundle: true,
		metafile: !dev,
		loader: {
			".ts": "ts",
			".woff": "file",
			".woff2": "file",
			".ttf": "file",
			".gif": "file",
			".png": "file",
			".svg": "file",
		},
		plugins: [
			htmlPlugin({
				// styles are normally injected as javascript
				// fix with: https://github.com/benjamingwynn/esbuild-plugin-html/
				injectStylesAs: "link",
			}),
			// @ts-expect-error
			esbuildSvelte({
				// @ts-expect-error
				preprocess: sveltePreprocess(),
				compilerOptions: {
					dev,
				},
			}),
		],
		define: {
			DEV: String(dev),
			BUILD: JSON.stringify({time: Date.now()}),
			...extra?.define,
		},
	}
}
