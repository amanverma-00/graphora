import { createClient, RedisClientType } from 'redis';

class RedisClient {
    public client: RedisClientType;

    constructor() {
        const redisConfig: any = {
            socket: {
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379', 10),
                reconnectStrategy: (retries: number) => {
                    if (retries > 10) {
                        console.error('Too many retries on Redis. Connection terminated');
                        return new Error('Too many retries');
                    }
                    return Math.min(retries * 100, 3000);
                }
            }
        };

        if (process.env.REDIS_USERNAME) {
            redisConfig.username = process.env.REDIS_USERNAME;
        }
        if (process.env.REDIS_PASS) {
            redisConfig.password = process.env.REDIS_PASS;
        }

        this.client = createClient(redisConfig);

        this.client.on('error', (err: Error) => {
            console.error('Redis Client Error:', err);
        });

        this.client.on('connect', () => {
            console.log('Redis connected successfully');
        });

        this.client.on('ready', () => {
            console.log('Redis ready for commands');
        });
    }

    async connect(): Promise<void> {
        if (!this.client.isOpen) {
            await this.client.connect();
        }
    }

    async set(key: string, value: string, ttl: number | null = null): Promise<void> {
        try {
            if (ttl) {
                await this.client.set(key, value, { EX: ttl });
            } else {
                await this.client.set(key, value);
            }
        } catch (error) {
            console.error('Redis SET error:', error);
            throw error;
        }
    }

    async get(key: string): Promise<string | null> {
        try {
            return await this.client.get(key);
        } catch (error) {
            console.error('Redis GET error:', error);
            throw error;
        }
    }

    async del(key: string): Promise<number> {
        try {
            return await this.client.del(key);
        } catch (error) {
            console.error('Redis DEL error:', error);
            throw error;
        }
    }

    async exists(key: string): Promise<boolean> {
        try {
            return (await this.client.exists(key)) === 1;
        } catch (error) {
            console.error('Redis EXISTS error:', error);
            throw error;
        }
    }

    async increment(key: string, ttl: number | null = null): Promise<number> {
        try {
            const result = await this.client.incr(key);
            if (ttl && result === 1) {
                await this.client.expire(key, ttl);
            }
            return result;
        } catch (error) {
            console.error('Redis INCR error:', error);
            throw error;
        }
    }

    async setObject(key: string, obj: any, ttl: number | null = null): Promise<void> {
        try {
            const jsonString = JSON.stringify(obj);
            await this.set(key, jsonString, ttl);
        } catch (error) {
            console.error('Redis SET object error:', error);
            throw error;
        }
    }

    async getObject<T>(key: string): Promise<T | null> {
        try {
            const data = await this.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Redis GET object error:', error);
            throw error;
        }
    }

    async addToSet(key: string, value: string): Promise<number> {
        try {
            return await this.client.sAdd(key, value);
        } catch (error) {
            console.error('Redis SADD error:', error);
            throw error;
        }
    }

    async isMember(key: string, value: string): Promise<boolean> {
        try {
            return (await this.client.sIsMember(key, value)) === 1;
        } catch (error) {
            console.error('Redis SISMEMBER error:', error);
            throw error;
        }
    }

    async getTTL(key: string): Promise<number> {
        try {
            return await this.client.ttl(key);
        } catch (error) {
            console.error('Redis TTL error:', error);
            throw error;
        }
    }
}

const redisClient = new RedisClient();

process.on('SIGINT', async () => {
    console.log('Closing Redis connection...');
    await redisClient.client.quit();
    console.log('Redis connection closed');
    process.exit(0);
});

export = redisClient;