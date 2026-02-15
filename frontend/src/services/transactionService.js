import apiClient from './api/apiClient';

export const transactionService = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.type && filters.type.trim()) params.append('type', filters.type);
    if (filters.category && filters.category.trim()) params.append('category', filters.category);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    const queryString = params.toString();
    const response = await apiClient.get(`/transactions${queryString ? `?${queryString}` : ''}`);
    return response.data.data ?? response.data;
  },
  getById: async (id) => {
    const response = await apiClient.get(`/transactions/${id}`);
    return response.data.data ?? response.data;
  },
  create: async (data) => {
    console.log('🔍 Original data received in transactionService.create:', JSON.stringify(data, null, 2));
    console.log('🔍 Data type:', typeof data);
    console.log('🔍 Is FormData?', data instanceof FormData);
    
    // Handle FormData separately (for file uploads)
    if (data instanceof FormData) {
      console.log('📁 Processing FormData for file upload');
      
      // Check if required fields exist in FormData
      const hasType = data.has('type');
      const hasAmount = data.has('amount');
      const hasDate = data.has('date');
      const hasTrxId = data.has('trx_id');
      const hasReceiptImage = data.has('receiptImage');
      
      console.log('📋 FormData fields check:', { hasType, hasAmount, hasDate, hasTrxId, hasReceiptImage });
      
      if (!hasType || !hasAmount || !hasDate || !hasTrxId) {
        console.error('❌ Missing required fields in FormData');
        throw new Error('Missing required fields: type, amount, date, trx_id');
      }
      
      // Validate receiptImage is a real file (not empty object)
      if (hasReceiptImage) {
        const receiptFile = data.get('receiptImage');
        if (!(receiptFile instanceof File)) {
          console.error('❌ receiptImage is not a File object:', receiptFile);
          throw new Error('receiptImage must be a valid file');
        }
      }
      
      console.log('🚀 Sending FormData to API (multipart/form-data)');
      const response = await apiClient.post('/transactions', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data ?? response.data;
    }
    
    // Handle JSON data (no file upload)
    if (data && typeof data === 'object') {
      console.log('🧹 Processing JSON data (no file upload)');
      
      // CRITICAL: Ensure receiptImage is never included in JSON payload
      if (data.receiptImage) {
        console.warn('⚠️ receiptImage found in JSON data - this should never happen!');
        delete data.receiptImage;
      }
      
      // Create a clean copy to avoid mutating original data
      const cleanData = { ...data };
      
      // Ensure amount is a number if it exists
      if (cleanData.amount && typeof cleanData.amount === 'string') {
        cleanData.amount = parseFloat(cleanData.amount);
        console.log('🔢 Converted amount to number:', cleanData.amount);
      }
      
      // Ensure trx_id is used (not trxId) to match backend validator
      if (cleanData.trxId && !cleanData.trx_id) {
        cleanData.trx_id = cleanData.trxId;
        delete cleanData.trxId;
        console.log('🔄 Converted trxId to trx_id for backend compatibility');
      }
      
      // Validate required fields
      const requiredFields = ['type', 'amount', 'date', 'trx_id'];
      const missingFields = requiredFields.filter(field => !cleanData[field]);
      
      if (missingFields.length > 0) {
        console.error('❌ Missing required fields:', missingFields);
        console.error('❌ Clean data:', JSON.stringify(cleanData, null, 2));
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }
      
      // CRITICAL: Double-check receiptImage is not in the final payload
      if ('receiptImage' in cleanData) {
        console.error('❌ receiptImage still present in cleanData - removing it');
        delete cleanData.receiptImage;
      }
      
      console.log('🚀 Clean JSON data being sent to API:', JSON.stringify(cleanData, null, 2));
      console.log('🔍 Final check - receiptImage in payload?', 'receiptImage' in cleanData);
      
      const response = await apiClient.post('/transactions', cleanData);
      return response.data.data ?? response.data;
    }
    
    console.error('❌ Invalid data type received');
    throw new Error('Invalid data provided');
  },
  update: async (id, data) => {
    console.log('🔍 Original data received in transactionService.update:', JSON.stringify(data, null, 2));
    console.log('🔍 Data type:', typeof data);
    console.log('🔍 Is FormData?', data instanceof FormData);
    
    // Handle FormData separately (for file uploads)
    if (data instanceof FormData) {
      console.log('📁 Processing FormData for file upload (update)');
      
      // Check if required fields exist in FormData
      const hasType = data.has('type');
      const hasAmount = data.has('amount');
      const hasDate = data.has('date');
      const hasTrxId = data.has('trx_id');
      const hasReceiptImage = data.has('receiptImage');
      
      console.log('📋 FormData fields check (update):', { hasType, hasAmount, hasDate, hasTrxId, hasReceiptImage });
      
      if (!hasType || !hasAmount || !hasDate || !hasTrxId) {
        console.error('❌ Missing required fields in FormData (update)');
        throw new Error('Missing required fields: type, amount, date, trx_id');
      }
      
      // Validate receiptImage is a real file (not empty object)
      if (hasReceiptImage) {
        const receiptFile = data.get('receiptImage');
        if (!(receiptFile instanceof File)) {
          console.error('❌ receiptImage is not a File object:', receiptFile);
          throw new Error('receiptImage must be a valid file');
        }
      }
      
      console.log('🚀 Sending FormData to API (update) - multipart/form-data');
      const response = await apiClient.put(`/transactions/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data ?? response.data;
    }
    
    // Handle JSON data (no file upload)
    if (data && typeof data === 'object') {
      console.log('🧹 Processing JSON data (update - no file upload)');
      
      // CRITICAL: Ensure receiptImage is never included in JSON payload
      if (data.receiptImage) {
        console.warn('⚠️ receiptImage found in JSON data (update) - this should never happen!');
        delete data.receiptImage;
      }
      
      // Create a clean copy to avoid mutating original data
      const cleanData = { ...data };
      
      // Ensure amount is a number if it exists
      if (cleanData.amount && typeof cleanData.amount === 'string') {
        cleanData.amount = parseFloat(cleanData.amount);
        console.log('🔢 Converted amount to number:', cleanData.amount);
      }
      
      // Ensure trx_id is used (not trxId) to match backend validator
      if (cleanData.trxId && !cleanData.trx_id) {
        cleanData.trx_id = cleanData.trxId;
        delete cleanData.trxId;
        console.log('🔄 Converted trxId to trx_id for backend compatibility');
      }
      
      // Validate required fields
      const requiredFields = ['type', 'amount', 'date', 'trx_id'];
      const missingFields = requiredFields.filter(field => !cleanData[field]);
      
      if (missingFields.length > 0) {
        console.error('❌ Missing required fields (update):', missingFields);
        console.error('❌ Clean data (update):', JSON.stringify(cleanData, null, 2));
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }
      
      // CRITICAL: Double-check receiptImage is not in the final payload
      if ('receiptImage' in cleanData) {
        console.error('❌ receiptImage still present in cleanData (update) - removing it');
        delete cleanData.receiptImage;
      }
      
      console.log('🚀 Clean JSON data being sent to API (update):', JSON.stringify(cleanData, null, 2));
      console.log('🔍 Final check (update) - receiptImage in payload?', 'receiptImage' in cleanData);
      
      const response = await apiClient.put(`/transactions/${id}`, cleanData);
      return response.data.data ?? response.data;
    }
    
    console.error('❌ Invalid data type received (update)');
    throw new Error('Invalid data provided');
  },
  delete: async (id) => {
    const response = await apiClient.delete(`/transactions/${id}`);
    return response.data.data ?? response.data;
  },
  getSummary: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    const queryString = params.toString();
    const response = await apiClient.get(`/transactions/summary${queryString ? `?${queryString}` : ''}`);
    return response.data.data ?? response.data;
  },
  getByCategory: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    const queryString = params.toString();
    const response = await apiClient.get(`/transactions/by-category${queryString ? `?${queryString}` : ''}`);
    return response.data.data ?? response.data;
  },
  getRevenueGrowth: async () => {
    const response = await apiClient.get('/transactions/revenue-growth');
    return response.data.data ?? response.data;
  },
};

