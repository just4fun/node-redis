export interface RedisServerDockerConfig {
    image: string;
    version: string;
}
export interface RedisServerDocker {
    port: number;
    dockerId: string;
}
export declare function spawnRedisServer(dockerConfig: RedisServerDockerConfig, serverArguments: Array<string>): Promise<RedisServerDocker>;
export interface RedisClusterDockersConfig extends RedisServerDockerConfig {
    numberOfNodes?: number;
}
export declare function spawnRedisCluster(dockersConfig: RedisClusterDockersConfig, serverArguments: Array<string>): Promise<Array<RedisServerDocker>>;
