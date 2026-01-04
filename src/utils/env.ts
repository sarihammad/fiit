type EnvMap = Record<string, string | undefined>;

export const getEnv = (key: string): string | undefined => {
  const env = (globalThis as { process?: { env?: EnvMap } }).process?.env;
  return env?.[key];
};
