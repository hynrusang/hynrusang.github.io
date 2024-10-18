import loadModule from "https://hynrusang.github.io/lib/js/Rose.js";

const [Dynamic, LiveData] = await Promise.all([
    loadModule("dynamic", "2.1"),
    loadModule("livedata", "2.0")
]);

export { Dynamic, LiveData }