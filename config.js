/***
 * Create end export configuration parameters
 * 
 */

// Container for all the environvents
var environments = {};

// Staging (default) environment
environments.staging = {
  'port': 3000,
  'envName': 'staging'
};


// Production environment
environments.production = {
  'port': 5000,
  'envName': 'production'
};


// Determine wich enviromnent was passed as a command line argument
var currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check if the current environment is one of the envronments above, if not, default to dtaging
var environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

// export the module

module.exports = environmentToExport;
