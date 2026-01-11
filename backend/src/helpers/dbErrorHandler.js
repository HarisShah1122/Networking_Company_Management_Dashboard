const isColumnError = (error) => {
  if (!error || !error.message) return false;
  const message = error.message;
  return message.includes('Unknown column') || 
         message.includes('doesn\'t exist') || 
         message.includes('ER_BAD_FIELD_ERROR');
};

const withColumnErrorFallback = async (primaryFn, fallbackFn) => {
  try {
    return await primaryFn();
  } catch (error) {
    if (isColumnError(error) && fallbackFn) {
      try {
        return await fallbackFn();
      } catch (fallbackError) {
        throw fallbackError;
      }
    }
    throw error;
  }
};

module.exports = {
  isColumnError,
  withColumnErrorFallback
};

