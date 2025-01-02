// Ignoring missing indigo-ketcher types
// @ts-ignore
import indigoInit from 'indigo-ketcher';
import {Buffer} from 'buffer';
import ordSchema from 'ord-schema';
import {getComponents} from "./getComponents";
import {Dataset} from "./types";
import './index.css';

const root = document.getElementById('root')!;
const fileInput = document.getElementById('pb-input')! as HTMLInputElement;
const runButton = document.getElementById('pb-run')! as HTMLButtonElement;

let indigoModule: ReturnType<indigoInit>;

function pbDatasetToJson(dataset: Uint8Array): Dataset {
    return ordSchema.Dataset.deserializeBinary(dataset).toObject();
}

function readFile() {
    if (!indigoModule) {
        alert('Module not loaded');
        return;
    }
    if (fileInput.files === null || fileInput.files.length === 0) {
        alert('No file selected');
        return;
    }
    try {
        const file = fileInput.files![0];
        console.log('Starting to read file: ', file.name, '');
        console.time('File read');
        file.bytes().then(result => {
            console.timeEnd('File read');
            console.time('File parse');
            const dataset = pbDatasetToJson(result);
            console.timeEnd('File parse');
            console.time('Components get');
            const components = getComponents(dataset);
            console.timeEnd('Components get');
            const componentsArray = Array.from(components);
            const options = new indigoModule.MapStringString();
            options.set("render-output-format", "svg");
            console.time('Components render');
            const renderedComponents =  componentsArray.map(component => Buffer.from(indigoModule.render(component, options), 'base64').toString());
            console.timeEnd('Components render');

            console.time('HTML render');
            renderedComponents.forEach(component => {
                const node = document.createElement('div');
                node.classList.add('item');
                node.innerHTML = component;
                root.appendChild(node);
            });
            console.timeEnd('HTML render');

        });
    } catch (e: unknown) {
        alert('Could not read file');
        console.error(e instanceof Error ? e.message : e);
    }
}

// Ignoring missing indigo-ketcher types
// @ts-ignore
indigoInit().then((module) => {
    indigoModule = module;
});

runButton.addEventListener('click', readFile);