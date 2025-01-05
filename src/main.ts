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
const fileInfo = document.getElementById('pb-file-info')!;
const loadButton = document.getElementById('pb-load')! as HTMLButtonElement;
const runButton = document.getElementById('pb-run')! as HTMLButtonElement;
const benchmarkButton = document.getElementById('pb-bench')! as HTMLButtonElement;
const benchmarkWebWorkersButton = document.getElementById('pb-bench-webworkers')! as HTMLButtonElement;
const result = document.getElementById('pb-result')!;

let indigoModule: ReturnType<indigoInit>;
let components: Set<string>;

interface Configuration {
    WEBWORKERS_AMOUNT: number;
    BENCHMARK_ITERATIONS: number;
}

const appWindow = window as unknown as typeof window & Configuration;

appWindow.BENCHMARK_ITERATIONS = 10;
appWindow.WEBWORKERS_AMOUNT = 2;

const disabledButtons = [
    runButton,
    benchmarkButton,
    benchmarkWebWorkersButton,
];

const createWorker = () => {
    return new Worker(new URL('./worker.ts', import.meta.url), {
        type: 'module'
    });
};

function pbDatasetToJson(dataset: Uint8Array): Dataset {
    return ordSchema.Dataset.deserializeBinary(dataset).toObject();
}

function loadFile() {
    if (fileInput.files === null || fileInput.files.length === 0) {
        alert('No file selected');
        return;
    }
    try {
        const file = fileInput.files![0];
        file.bytes().then(result => {
            const dataset = pbDatasetToJson(result);
            console.time('Components get');
            components = getComponents(dataset);
            console.timeEnd('Components get');
            disabledButtons.forEach(button => button.disabled = false);
            fileInfo.innerHTML = `Components amount: ${components.size}`;
        })
    } catch (e: unknown) {
        alert('Could not read file');
        console.error(e instanceof Error ? e.message : e);
    }
}

function renderComponents(components: Set<string>) {
    const componentsArray = Array.from(components);
    const options = new indigoModule.MapStringString();
    options.set("render-output-format", "svg");
    return componentsArray.map(component =>{
        try {
            return Buffer.from(indigoModule.render(component, options), 'base64').toString()
        } catch (e) {
            console.error(component, e);
            throw e;
        }
    });
}

function renderHtml(renderedComponents: Array<string>) {
    renderedComponents.forEach(component => {
        const node = document.createElement('div');
        node.classList.add('item');
        node.innerHTML = component;
        root.appendChild(node);
    });
}

function runRender() {
    if (!components) {
        alert('Select file and load first');
        return;
    }

    try {
        const start = performance.now();
        const renderedComponents = renderComponents(components);
        const end = performance.now();
        const total = end - start;

        renderHtml(renderedComponents);
        result.innerHTML = `Total time: ${total}ms`;
    } catch (e: unknown) {
        console.error(e);
    }
}

function runBenchmark() {
    if (!components) {
        alert('Select file and load first');
        return;
    }

    const totalTime = new Array(appWindow.BENCHMARK_ITERATIONS).fill(0).reduce((acc, item, index) => {
        console.count(`Benchmark iteration (out of ${appWindow.BENCHMARK_ITERATIONS})`);
        const start = performance.now();
        renderComponents(components);
        const end = performance.now();
        return acc + (end - start);
    }, 0);
    result.innerHTML = `Median time: ${totalTime / appWindow.BENCHMARK_ITERATIONS}ms`;
}

function webWorkerRun(workers: Array<Worker>, totalTime: number, iteration: number) {
    console.count(`WebWorker iteration (out of ${appWindow.BENCHMARK_ITERATIONS})`);
    let readyCount = 0;
    const componentsArray = Array.from(components);
    const amountPerWorker = Math.ceil(componentsArray.length / workers.length);
    const start = performance.now();
    workers.forEach((worker, index) => {
       const startIndex = index * amountPerWorker;
       const endIndex = index === workers.length - 1 ? componentsArray.length : (index + 1) * amountPerWorker - 1;
       worker.postMessage(componentsArray.slice(startIndex, endIndex));
       worker.onmessage = (event) => {
           readyCount++;
           if (readyCount === workers.length) {
               const end = performance.now();
               totalTime += (end - start);
               if (iteration === appWindow.BENCHMARK_ITERATIONS - 1) {
                   result.innerHTML = `Median time: ${totalTime / appWindow.BENCHMARK_ITERATIONS}ms`;
                   workers.forEach(worker => worker.terminate());
               } else {
                   webWorkerRun(workers, totalTime, iteration + 1);
               }
           }
       }
    });
}

function runBenchmarkWebWorkers() {
    if (!components) {
        alert('Select file and load first');
        return;
    }
    let readyCount = 0;
    const workers = new Array(appWindow.WEBWORKERS_AMOUNT).fill(0).map(() => createWorker());
    new Promise<void>((resolve) => {
        workers.forEach(worker => {
            worker.onmessage = (event) => {
                if (event.data !== 'ready') return;
                readyCount++;
                if (readyCount === workers.length) {
                    resolve();
                }
            }
        })
    }).then(() => {
        webWorkerRun(workers, 0, 0);
    });
}

// Ignoring missing indigo-ketcher types
// @ts-ignore
indigoInit().then((module) => {
    indigoModule = module;
    // @ts-ignore
    window.indigoModule = indigoModule;
});

loadButton.addEventListener('click', loadFile);
runButton.addEventListener('click', runRender);
benchmarkButton.addEventListener('click', runBenchmark);
benchmarkWebWorkersButton.addEventListener('click', runBenchmarkWebWorkers);