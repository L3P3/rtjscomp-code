import {
	Uri,
	workspace,
	languages,
} from 'vscode';

const CONFIG_FILE_PATH = '/rtjscomp.json';

const LANGUAGES_SUPPORTED = [
	'html',
	'json',
	'txt'
];
const LANGUAGE_DEFAULT = {
	css: 'css',
	html: 'html',
	js: 'javascript',
	json: 'json',
	rss: 'xml',
	xml: 'xml',
};

const config_default = {
	type_dynamics: ['events', 'html', 'json', 'txt'],
};
let config_path = '';
let config = {
	...config_default,
};

async function config_read(path) {
	if (path === config_path) return;
	config_path = path;
	config = {
		...config_default,
	};
	try {
		const bytes = await workspace.fs.readFile(
			Uri.file(path + CONFIG_FILE_PATH)
		);
		const parsed = JSON.parse(
			new TextDecoder().decode(bytes)
		);
		if (parsed.type_dynamics) {
			config.type_dynamics = parsed.type_dynamics;
		}
	}
	catch {}
}

async function document_configure(document) {
	const path = document.uri.fsPath.replace(/\\/g, '/');
	if (!path.includes('/public/')) return;
	await config_read(path.split('/public/', 1)[0]);

	let extension = path.split('.').pop();
	if (!LANGUAGES_SUPPORTED.includes(extension)) extension = 'txt';

	const language = 'rtjscomp-' + extension;
	if (config.type_dynamics.includes(extension) !== (document.languageId === language)) {
		return languages.setTextDocumentLanguage(
			document,
			document.languageId !== language
			?	language
			:	LANGUAGE_DEFAULT[extension] || 'plaintext'
		);
	}
}

async function document_configure_all() {
	await Promise.all(
		workspace.textDocuments.map(document_configure)
	);
}

export async function activate(context) {
	await document_configure_all();
	context.subscriptions.push(
		workspace.onDidOpenTextDocument(document_configure),
		workspace.onDidChangeTextDocument(({ document }) => {
			if (document.uri.path.endsWith(CONFIG_FILE_PATH)) {
				config_path = '';
				document_configure_all();
			}
		})
	);
}
