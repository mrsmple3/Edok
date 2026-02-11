export default defineNuxtPlugin(() => {
  if (import.meta.server) return;

  const w = window as any;
  if (w.__eusignReady) return;

  w.EU_MAX_DATA_SIZE_MB = 50;
  w.EU_LOG_EVENTS = false;
  w.EU_MODULE_INITIALIZE_ON_LOAD = true;

  w.__eusignReady = new Promise((resolve, reject) => {
    w.EUSignCPModuleInitialized = (ok: boolean) => {
      if (!ok) {
        reject(new Error("EUSignCP init failed"));
        return;
      }

      try {
        w.__eu = w.__eu || new w.EUSignCP();
        resolve(w.__eu);
      } catch (e) {
        reject(e);
      }
    };

    w.EUSignCPModuleLoaded = () => {};

    const loadScript = (src: string) =>
      new Promise<void>((res, rej) => {
        const script = document.createElement("script");
        script.src = src;
        script.async = false;
        script.onload = () => res();
        script.onerror = () => rej(new Error(`Failed to load ${src}`));
        document.head.appendChild(script);
      });

    loadScript("/js/euscpt.js")
      .then(() => loadScript("/js/euscpm.js"))
      .then(() => loadScript("/js/euscp.js"))
      .catch(reject);
  });
});
