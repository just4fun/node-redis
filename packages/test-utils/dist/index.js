"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _a, _TestUtils_getVersion, _TestUtils_VERSION_NUMBERS, _TestUtils_DOCKER_IMAGE, _TestUtils_clusterFlushAll;
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@redis/client/lib/client");
const cluster_1 = require("@redis/client/lib/cluster");
const dockers_1 = require("./dockers");
const yargs_1 = require("yargs");
const helpers_1 = require("yargs/helpers");
class TestUtils {
    constructor(config) {
        _TestUtils_VERSION_NUMBERS.set(this, void 0);
        _TestUtils_DOCKER_IMAGE.set(this, void 0);
        const { string, numbers } = __classPrivateFieldGet(TestUtils, _a, "m", _TestUtils_getVersion).call(TestUtils, config.dockerImageVersionArgument, config.defaultDockerVersion);
        __classPrivateFieldSet(this, _TestUtils_VERSION_NUMBERS, numbers, "f");
        __classPrivateFieldSet(this, _TestUtils_DOCKER_IMAGE, {
            image: config.dockerImageName,
            version: string
        }, "f");
    }
    isVersionGreaterThan(minimumVersion) {
        if (minimumVersion === undefined)
            return true;
        const lastIndex = Math.min(__classPrivateFieldGet(this, _TestUtils_VERSION_NUMBERS, "f").length, minimumVersion.length) - 1;
        for (let i = 0; i < lastIndex; i++) {
            if (__classPrivateFieldGet(this, _TestUtils_VERSION_NUMBERS, "f")[i] > minimumVersion[i]) {
                return true;
            }
            else if (minimumVersion[i] > __classPrivateFieldGet(this, _TestUtils_VERSION_NUMBERS, "f")[i]) {
                return false;
            }
        }
        return __classPrivateFieldGet(this, _TestUtils_VERSION_NUMBERS, "f")[lastIndex] >= minimumVersion[lastIndex];
    }
    isVersionGreaterThanHook(minimumVersion) {
        const isVersionGreaterThan = this.isVersionGreaterThan.bind(this);
        before(function () {
            if (!isVersionGreaterThan(minimumVersion)) {
                return this.skip();
            }
        });
    }
    testWithClient(title, fn, options) {
        let dockerPromise;
        if (this.isVersionGreaterThan(options.minimumDockerVersion)) {
            const dockerImage = __classPrivateFieldGet(this, _TestUtils_DOCKER_IMAGE, "f");
            before(function () {
                this.timeout(30000);
                dockerPromise = (0, dockers_1.spawnRedisServer)(dockerImage, options.serverArguments);
                return dockerPromise;
            });
        }
        it(title, async function () {
            if (!dockerPromise)
                return this.skip();
            const client = client_1.default.create({
                ...options?.clientOptions,
                socket: {
                    ...options?.clientOptions?.socket,
                    port: (await dockerPromise).port
                }
            });
            if (options.disableClientSetup) {
                return fn(client);
            }
            await client.connect();
            try {
                await client.flushAll();
                await fn(client);
            }
            finally {
                if (client.isOpen) {
                    await client.flushAll();
                    await client.disconnect();
                }
            }
        });
    }
    testWithCluster(title, fn, options) {
        let dockersPromise;
        if (this.isVersionGreaterThan(options.minimumDockerVersion)) {
            const dockerImage = __classPrivateFieldGet(this, _TestUtils_DOCKER_IMAGE, "f");
            before(function () {
                this.timeout(30000);
                dockersPromise = (0, dockers_1.spawnRedisCluster)({
                    ...dockerImage,
                    numberOfNodes: options?.numberOfNodes
                }, options.serverArguments);
                return dockersPromise;
            });
        }
        it(title, async function () {
            if (!dockersPromise)
                return this.skip();
            const dockers = await dockersPromise, cluster = cluster_1.default.create({
                ...options.clusterConfiguration,
                rootNodes: dockers.map(({ port }) => ({
                    socket: {
                        port
                    }
                }))
            });
            await cluster.connect();
            try {
                await __classPrivateFieldGet(TestUtils, _a, "m", _TestUtils_clusterFlushAll).call(TestUtils, cluster);
                await fn(cluster);
            }
            finally {
                await __classPrivateFieldGet(TestUtils, _a, "m", _TestUtils_clusterFlushAll).call(TestUtils, cluster);
                await cluster.disconnect();
            }
        });
    }
}
exports.default = TestUtils;
_a = TestUtils, _TestUtils_VERSION_NUMBERS = new WeakMap(), _TestUtils_DOCKER_IMAGE = new WeakMap(), _TestUtils_getVersion = function _TestUtils_getVersion(argumentName, defaultVersion) {
    return (0, yargs_1.default)((0, helpers_1.hideBin)(process.argv))
        .option(argumentName, {
        type: 'string',
        default: defaultVersion
    })
        .coerce(argumentName, (arg) => {
        const indexOfDash = arg.indexOf('-');
        return {
            string: arg,
            numbers: (indexOfDash === -1 ? arg : arg.substring(0, indexOfDash)).split('.').map(x => {
                const value = Number(x);
                if (Number.isNaN(value)) {
                    throw new TypeError(`${arg} is not a valid redis version`);
                }
                return value;
            })
        };
    })
        .demandOption(argumentName)
        .parseSync()[argumentName];
}, _TestUtils_clusterFlushAll = async function _TestUtils_clusterFlushAll(cluster) {
    await Promise.all(cluster.getMasters().map(({ client }) => client.flushAll()));
};
