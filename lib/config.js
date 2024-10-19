/**
 * Create end export configuration parameters.
 * 
 */

/**
 * Container for all the environvents.
 */
var environments = {};

/**
 * Staging (default) environment.
 */
environments.dev = {
  'httpPort': 3000,
  'httpsPort': 3001,
  'envName': 'development',
};


/**
 * Production environment.
 */
environments.production = {
  'httpPort': 5020,
  'httpsPort': 5021,
  'envName': 'production',
};


/**
 * Determine wich enviromnent was passed as a command line argument.
 */
var currentEnvironment = typeof (process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

/**
 * Check if the current environment is one of the envronments above, if not, default to dtaging.
 */
var environmentToExport = typeof (environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.dev;


/**
 * Add other environment variables into config variable set.
 */
environmentToExport.hashingSalt = process.env.hashingSalt;
environmentToExport.stripeRkKey = process.env.stripeRkKey;


/**
 * export the module.
 */
export default environmentToExport;
