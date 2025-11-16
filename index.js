import { writeFile } from 'fs/promises';

const BASE_URL = "https://raw.githubusercontent.com/shikijs/textmate-grammars-themes/main/packages";
const LANG_URL = "https:/raw.githubusercontent.com/Vap0r1ze/vapcord/main/assets/shiki-codeblocks/languages.json"

const SOURCES = [
    {
        url: `${BASE_URL}/tm-themes/index.js`,
        exportName: 'themes',
        outputFile: 'themes.json'
    },
    {
        url: `${BASE_URL}/tm-grammars/index.js`,
        exportName: 'grammars',
        outputFile: 'grammars.json'
    }
];

async function fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
    return res.json();
}

async function processSource({ url, exportName, outputFile }) {
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const text = await res.text();
        const match = text.match(new RegExp(`export const ${exportName} = ([\\s\\S]*?)(?=(\\nexport const|$))`));
        if (!match) throw new Error(`Couldn't find "${exportName}"`);

        const dataArray = eval(match[1]);

        if (exportName === 'grammars') {
            const langData = await fetchJson(LANG_URL);

            dataArray.forEach(grammar => {
                const lang = langData.find(l => l.id === grammar.name);
                if (lang?.devicon) {
                    grammar.devicon = lang.devicon;
                }
            });
        }

        await writeFile(outputFile, JSON.stringify(dataArray, null, 2));
        console.log(`Saved to ${outputFile}`);
    } catch (err) {
        console.error(`Error:`, err.message);
    }
}
await Promise.all(SOURCES.map(processSource));
