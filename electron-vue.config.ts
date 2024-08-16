type ElectronVueConfig = {
  main: {
    browserWindowSize: {
      minWidth: number;
      minHeight: number;
    };
  };
  renderer: {
    baseURL: string;
  };
};

const isDev = process.env.NODE_ENV === "development";

export default (): ElectronVueConfig => {
  console.log(process.env.NODE_ENV);

  const browserWindowSize = {
    minWidth: 1000,
    minHeight: 670,
  };

  return {
    main: {
      browserWindowSize,
    },
    renderer: {
      baseURL: isDev
        ? "http://127.0.0.1:10926/api"
        : "https://api.vanyi.top/api",
    },
  };
};
