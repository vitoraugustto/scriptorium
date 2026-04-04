const Env = Object.freeze({
  DEBUG: import.meta.env.DEV || window.electronAPI?.isDebug === true,
});

export default Env;
