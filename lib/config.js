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
  'envName': 'staging',
  'hashingSecret': 'thisIsASecret'
};


/**
 * Production environment.
 */
environments.production = {
  'httpPort': 5020,
  'httpsPort': 5021,
  'envName': 'production',
  'hashingSecret': 'thisIsAlsoASecret'
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
 * export the module.
 */
export default environmentToExport;
