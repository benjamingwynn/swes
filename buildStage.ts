/** @format */
import c from "ansi-colors"

export async function stage<T>(name: string, fn: () => Promise<T>): Promise<T> {
	try {
		console.log("[ .. ] " + name)
		const start = Date.now()
		const rtn = await fn()
		console.log(c.green("[ OK ] ") + name + "  " + c.cyan("+" + Math.ceil(Date.now() - start) + "ms"))
		return rtn
	} catch (err) {
		console.log(c.bold(c.red("[FAIL] ")) + name.toString())
		throw err
	}
}
