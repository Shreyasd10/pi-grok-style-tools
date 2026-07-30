#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const action = process.argv[2] ?? "apply";
if (!["apply", "check", "rollback"].includes(action)) {
	throw new Error("Usage: patch-atomic-grok-ui.mjs [apply|check|rollback]");
}

const npmEnv = { ...process.env };
delete npmEnv.npm_config_prefix;
delete npmEnv.NPM_CONFIG_PREFIX;
const npmRoot = execFileSync("npm", ["root", "--global"], { encoding: "utf8", env: npmEnv }).trim();
const atomicRoot = process.env.ATOMIC_PACKAGE_ROOT || join(npmRoot, "@bastani", "atomic");
const packageJson = JSON.parse(readFileSync(join(atomicRoot, "package.json"), "utf8"));
const mainPath = join(atomicRoot, "dist", "main.js");
const cliPath = join(atomicRoot, "dist", "cli.js");
const atomicAgentDir = process.env.ATOMIC_CODING_AGENT_DIR || join(homedir(), ".atomic", "agent");
const themeSource = fileURLToPath(new URL("../theme/grok-dark.json", import.meta.url));
const themeTarget = join(atomicAgentDir, "themes", "grok-dark.json");

const mainOriginal = 'const isolateInteractiveHost = appMode === "interactive" && !isPlainRuntimeMetadataCommand(parsed) && process.env.ATOMIC_INTERACTIVE_ENGINE_CHILD !== "1";';
const mainPatched = 'const isolateInteractiveHost = appMode === "interactive" && !isPlainRuntimeMetadataCommand(parsed) && process.env.ATOMIC_INTERACTIVE_ENGINE_CHILD !== "1" && process.env.ATOMIC_DISABLE_INTERACTIVE_ENGINE_ISOLATION !== "1";';
const cliOriginal = 'process.env[`${APP_NAME.toUpperCase()}_CODING_AGENT`] = "true";\nprocess.emitWarning = (() => { });';
const cliPatched = 'process.env[`${APP_NAME.toUpperCase()}_CODING_AGENT`] = "true";\nprocess.env.ATOMIC_DISABLE_INTERACTIVE_ENGINE_ISOLATION ??= "1";\nprocess.emitWarning = (() => { });';

function state(path, original, patched) {
	const content = readFileSync(path, "utf8");
	if (content.includes(patched)) return "patched";
	if (content.includes(original)) return "original";
	return "unknown";
}

function replace(path, from, to, label) {
	const content = readFileSync(path, "utf8");
	if (content.includes(to)) return;
	if (!content.includes(from)) {
		throw new Error(`${label} does not match Atomic ${packageJson.version}; update the managed patch before continuing`);
	}
	writeFileSync(path, content.replace(from, to));
}

function themeState() {
	if (!existsSync(themeTarget)) return "missing";
	try {
		if (lstatSync(themeTarget).isSymbolicLink() && realpathSync(themeTarget) === realpathSync(themeSource)) return "linked";
		if (readFileSync(themeTarget, "utf8") === readFileSync(themeSource, "utf8")) return "copied";
	} catch {
		return "conflict";
	}
	return "conflict";
}

function ensureTheme() {
	const current = themeState();
	if (current === "linked" || current === "copied") return;
	if (current === "conflict") {
		throw new Error(`Refusing to replace unmanaged Atomic theme: ${themeTarget}`);
	}
	mkdirSync(dirname(themeTarget), { recursive: true });
	symlinkSync(themeSource, themeTarget);
}

const mainState = state(mainPath, mainOriginal, mainPatched);
const cliState = state(cliPath, cliOriginal, cliPatched);

if (action === "check") {
	const currentThemeState = themeState();
	if (mainState !== "patched" || cliState !== "patched" || !["linked", "copied"].includes(currentThemeState)) {
		throw new Error(`Atomic ${packageJson.version} Grok UI patch is not active (main=${mainState}, cli=${cliState}, theme=${currentThemeState})`);
	}
	console.log(`Atomic ${packageJson.version} Grok UI patch: active`);
	process.exit(0);
}

if (action === "apply") {
	replace(mainPath, mainOriginal, mainPatched, "dist/main.js");
	replace(cliPath, cliOriginal, cliPatched, "dist/cli.js");
	ensureTheme();
	console.log(`Atomic ${packageJson.version} Grok UI patch applied`);
	console.log(`Atomic theme linked: ${themeTarget}`);
	console.log("Set ATOMIC_DISABLE_INTERACTIVE_ENGINE_ISOLATION=0 to temporarily restore isolation.");
	process.exit(0);
}

if (themeState() === "linked") unlinkSync(themeTarget);
replace(cliPath, cliPatched, cliOriginal, "dist/cli.js");
replace(mainPath, mainPatched, mainOriginal, "dist/main.js");
console.log(`Atomic ${packageJson.version} Grok UI patch rolled back`);
