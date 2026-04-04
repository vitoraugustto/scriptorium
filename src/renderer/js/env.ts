const Env = Object.freeze({
  DEBUG: import.meta.env.DEV || (window as any).electronAPI?.isDebug === true,
});

export default Env;
