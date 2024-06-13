/**
 * @author Benjamin Gwynn <contact@benjamingwynn.com>
 * @format
 */

function removeTrailingCommas(json: string) {
	// Remove trailing commas in objects and arrays
	return json.replace(/,\s*(?=[}\]])/g, "")
}

function removeCommentsFromJSONC(jsonc: string) {
	// Remove all JSDoc comments
	jsonc = jsonc.replace(/\/\*\*[\s\S]*?\*\//g, "")

	// Remove all single-line comments
	jsonc = jsonc.replace(/\/\/.*/g, "")

	return jsonc
}

function jsonCtoJson(jsonc: string) {
	const cleanedJSONC = removeCommentsFromJSONC(jsonc)
	const validJSON = removeTrailingCommas(cleanedJSONC)
	return validJSON
}

export function parseJSoncFile(json: string) {
	const asJson = jsonCtoJson(json)
	const parsed = JSON.parse(asJson)
	return parsed
}
