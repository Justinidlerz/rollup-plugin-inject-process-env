import MagicString from 'magic-string';
import { Plugin } from 'rollup';

const name = 'rollup-plugin-inject-process-env';

// The virtual id for our shared "process" mock.
// We prefix it with \0 so that other plugins ignore it
const VIRTUAL_MODULE_ID = `\0${ name }`;

export default function rollupPluginInjectProcessEnv(env = {}): Plugin {
    return {
        name,
        transform(code: string, id: string) {
            // Each module except our virtual module gets the process mock injected.
            if (id !== VIRTUAL_MODULE_ID) {
                const magicString = new MagicString(code);
                magicString.prepend(`import '${VIRTUAL_MODULE_ID}';\n`);
                return {
                    code: magicString.toString(),
                    map: magicString.generateMap({ hires: true })
                };
            }
        },
        resolveId(id: string) {
            // this tells Rollup not to try to resolve imports from our virtual id
            if (id === VIRTUAL_MODULE_ID) {
                return VIRTUAL_MODULE_ID;
            }
        },
        load(id: string) {
            if (id === VIRTUAL_MODULE_ID) {
                return `(function() {
    const env = ${ JSON.stringify(env) }
    try {
        if (process) {
            process.env = Object.assign({}, process.env);
            Object.assign(process.env, env);
            return;
        }
    } catch (e) {} // avoid ReferenceError: process is not defined
    globalThis.process = { env:env }
})();
`;
            }
            return null;
        },
    };
}
