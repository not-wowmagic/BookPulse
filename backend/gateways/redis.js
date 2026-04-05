const memoryStore = new Map();
const lockStore = new Map();
let redisClient;

const RELEASE_LOCK_LUA = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
else
  return 0
end
`;

function nowMs() {
  return Date.now();
}

function readMemoryValue(key) {
  const item = memoryStore.get(key);
  if (!item) {
    return null;
  }

  if (item.expiresAtMs && item.expiresAtMs < nowMs()) {
    memoryStore.delete(key);
    return null;
  }

  return item.value;
}

function writeMemoryValue(key, value, ttlSeconds) {
  memoryStore.set(key, {
    value,
    expiresAtMs: ttlSeconds ? nowMs() + ttlSeconds * 1000 : null,
  });
}

function tryAcquireMemoryLock(lockKey, owner, ttlSeconds) {
  const current = lockStore.get(lockKey);
  const now = nowMs();

  if (current && current.expiresAtMs > now) {
    return false;
  }

  lockStore.set(lockKey, {
    owner,
    expiresAtMs: now + ttlSeconds * 1000,
  });

  return true;
}

function releaseMemoryLock(lockKey, owner) {
  const current = lockStore.get(lockKey);
  if (!current || current.owner !== owner) {
    return false;
  }

  lockStore.delete(lockKey);
  return true;
}

async function getRedisClient(env) {
  if (!env.REDIS_URL) {
    return null;
  }

  if (!redisClient) {
    const { default: Redis } = await import("ioredis");
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 2,
      lazyConnect: true,
      enableAutoPipelining: true,
    });

    await redisClient.connect();
  }

  return redisClient;
}

export async function createCacheGateway({ env, logger = () => {} }) {
  const redis = await getRedisClient(env);

  if (!redis) {
    logger("REDIS_URL is not configured. Using in-memory cache and lock fallback.");
    return {
      kind: "memory",
      async getJson(key) {
        return readMemoryValue(key);
      },
      async setJson(key, value, ttlSeconds) {
        writeMemoryValue(key, value, ttlSeconds);
      },
      async acquireLock(lockKey, owner, ttlSeconds) {
        return tryAcquireMemoryLock(lockKey, owner, ttlSeconds);
      },
      async releaseLock(lockKey, owner) {
        return releaseMemoryLock(lockKey, owner);
      },
    };
  }

  return {
    kind: "redis",
    async getJson(key) {
      const raw = await redis.get(key);
      return raw ? JSON.parse(raw) : null;
    },
    async setJson(key, value, ttlSeconds) {
      await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
    },
    async acquireLock(lockKey, owner, ttlSeconds) {
      const result = await redis.set(lockKey, owner, "EX", ttlSeconds, "NX");
      return result === "OK";
    },
    async releaseLock(lockKey, owner) {
      const released = await redis.eval(RELEASE_LOCK_LUA, 1, lockKey, owner);
      return Number(released) === 1;
    },
  };
}
