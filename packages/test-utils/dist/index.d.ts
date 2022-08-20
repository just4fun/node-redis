import { RedisModules, RedisFunctions, RedisScripts } from '@redis/client/lib/commands';
import { RedisClientOptions, RedisClientType } from '@redis/client/lib/client';
import { RedisClusterOptions, RedisClusterType } from '@redis/client/lib/cluster';
interface TestUtilsConfig {
    dockerImageName: string;
    dockerImageVersionArgument: string;
    defaultDockerVersion: string;
}
interface CommonTestOptions {
    minimumDockerVersion?: Array<number>;
}
interface ClientTestOptions<M extends RedisModules, F extends RedisFunctions, S extends RedisScripts> extends CommonTestOptions {
    serverArguments: Array<string>;
    clientOptions?: Partial<RedisClientOptions<M, F, S>>;
    disableClientSetup?: boolean;
}
interface ClusterTestOptions<M extends RedisModules, F extends RedisFunctions, S extends RedisScripts> extends CommonTestOptions {
    serverArguments: Array<string>;
    clusterConfiguration?: Partial<RedisClusterOptions<M, F, S>>;
    numberOfNodes?: number;
}
export default class TestUtils {
    #private;
    constructor(config: TestUtilsConfig);
    isVersionGreaterThan(minimumVersion: Array<number> | undefined): boolean;
    isVersionGreaterThanHook(minimumVersion: Array<number> | undefined): void;
    testWithClient<M extends RedisModules, F extends RedisFunctions, S extends RedisScripts>(title: string, fn: (client: RedisClientType<M, F, S>) => unknown, options: ClientTestOptions<M, F, S>): void;
    testWithCluster<M extends RedisModules, F extends RedisFunctions, S extends RedisScripts>(title: string, fn: (cluster: RedisClusterType<M, F, S>) => unknown, options: ClusterTestOptions<M, F, S>): void;
}
export {};
