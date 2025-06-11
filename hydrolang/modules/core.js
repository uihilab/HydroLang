// Core modules (always included)
import * as data from "./data/data.js";
import * as analyze from "./analyze/analyze.js";

export const getModules = async (config = { includeVisuals: true }) => {
  // Base modules are always loaded
  const modules = {
    data,
    analyze
  };

  // Only load visual modules if requested
  if (config.includeVisuals) {
    try {
      const [visualize, map] = await Promise.all([
        import("./visualize/visualize.js"),
        import("./map/map.js")
      ]);
      
      Object.assign(modules, {
        visualize,
        map
      });
    } catch (error) {
      console.warn('Visual modules could not be loaded:', error);
    }
  }

  return modules;
};