// Ignoring missing indigo-ketcher types
// @ts-ignore
import indigoInit from 'indigo-ketcher';
import {Buffer} from "buffer";

let indigoModule: ReturnType<indigoInit>;

onmessage = (event: MessageEvent<Array<string>>) => {
    const componentsArray = event.data;
    const options = new indigoModule.MapStringString();
    options.set("render-output-format", "svg");
    const result = componentsArray.map(component => Buffer.from(indigoModule.render(component, options), 'base64').toString());
    postMessage(result);
}

// Ignoring missing indigo-ketcher types
// @ts-ignore
indigoInit().then((module) => {
    indigoModule = module;
    postMessage('ready');
});