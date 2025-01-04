# Indigo-wasm performance test 

Tool to test how fast indigo-wasm can render ord-schema compatible components.

## How to use

1. Select protobuf file (.pb) via upload file button and press "Load" to parse the file and see how many components can be rendered via indigo-wasm
2. Press "Run render" to render the components and add them into html
3. Press "Run benchmark" to run render multiple times in a row (without html display)
4. Press "Run WebWorkers benchmark" to run the same benchmark via multiple web workers

### Usage comments
* Benchmark will freeze the main UI render thread until it finishes. Do not stop the script while it is running
* You can view run status via console
* You can control the number of renders via `window.BENCHMARK_ITERATIONS`
* You can control number of spawned WebWorkers via `window.WEBWORKERS_AMOUNT`