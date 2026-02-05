/**
 * Company Data Isolation Tests
 * 
 * This test suite verifies that company-based data isolation is working correctly
 * across all API endpoints. Each test ensures that users can only access data
 * belonging to their own company.
 */

const request = require('supertest');
const app = require('../server');
const { User, Customer, Company } = require('../models');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

describe('Company Data Isolation', () => {
  let company1Token, company2Token;
  let company1User, company2User;
  let company1Customer, company2Customer;
  let company1, company2;

  beforeAll(async () => {
    // Create test companies
    company1 = await Company.create({
      name: 'Test Company 1',
      email: 'company1@test.com',
      phone: '1234567890'
    });

    company2 = await Company.create({
      name: 'Test Company 2', 
      email: 'company2@test.com',
      phone: '0987654321'
    });

    // Create test users for each company
    company1User = await User.create({
      username: 'user1',
      email: 'user1@test.com',
      password: 'password123',
      role: 'Manager',
      company_id: company1.id
    });

    company2User = await User.create({
      username: 'user2',
      email: 'user2@test.com', 
      password: 'password123',
      role: 'Manager',
      company_id: company2.id
    });

    // Generate JWT tokens
    company1Token = jwt.sign(
      { userId: company1User.id, companyId: company1.id },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    company2Token = jwt.sign(
      { userId: company2User.id, companyId: company2.id },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Create test customers for each company
    company1Customer = await Customer.create({
      name: 'Customer 1',
      email: 'customer1@test.com',
      phone: '1111111111',
      pace_user_id: 'CUST001',
      company_id: company1.id
    });

    company2Customer = await Customer.create({
      name: 'Customer 2',
      email: 'customer2@test.com',
      phone: '2222222222', 
      pace_user_id: 'CUST002',
      company_id: company2.id
    });
  });

  afterAll(async () => {
    // Clean up test data
    await Customer.destroy({ where: { company_id: [company1.id, company2.id] } });
    await User.destroy({ where: { id: [company1User.id, company2User.id] } });
    await Company.destroy({ where: { id: [company1.id, company2.id] } });
  });

  describe('Customer API Isolation', () => {
    test('Company 1 should only access its own customers', async () => {
      const response = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${company1Token}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Customer 1');
      expect(response.body.data[0].company_id).toBe(company1.id);
    });

    test('Company 2 should only access its own customers', async () => {
      const response = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${company2Token}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Customer 2');
      expect(response.body.data[0].company_id).toBe(company2.id);
    });

    test('Company 1 should not access Company 2 customer by ID', async () => {
      const response = await request(app)
        .get(`/api/customers/${company2Customer.id}`)
        .set('Authorization', `Bearer ${company1Token}`)
        .expect(404);

      expect(response.body.error).toContain('not found');
    });

    test('Company 1 should not update Company 2 customer', async () => {
      const response = await request(app)
        .put(`/api/customers/${company2Customer.id}`)
        .set('Authorization', `Bearer ${company1Token}`)
        .send({ name: 'Hacked Name' })
        .expect(404);

      expect(response.body.error).toContain('not found');
    });
  });

  describe('Authentication Requirements', () => {
    test('Should reject requests without authentication', async () => {
      await request(app)
        .get('/api/customers')
        .expect(401);
    });

    test('Should reject requests with invalid token', async () => {
      await request(app)
        .get('/api/customers')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    test('Should reject requests without company identification', async () => {
      const invalidToken = jwt.sign(
        { userId: company1User.id }, // Missing companyId
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(403);

      expect(response.body.error).toContain('Company identification required');
    });
  });

  describe('Cross-Company Data Prevention', () => {
    test('Should prevent creating customer for different company', async () => {
      const maliciousData = {
        name: 'Malicious Customer',
        email: 'malicious@test.com',
        phone: '9999999999',
        pace_user_id: 'MAL001',
        company_id: company2.id // Trying to create for company2 while authenticated as company1
      };

      const response = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${company1Token}`)
        .send(maliciousData)
        .expect(201);

      // The created customer should belong to company1, not company2
      expect(response.body.data.customer.company_id).toBe(company1.id);
      expect(response.body.data.customer.company_id).not.toBe(company2.id);
    });
  });

  describe('API Response Headers', () => {
    test('Should include company isolation header', async () => {
      const response = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${company1Token}`)
        .expect(200);

      expect(response.headers['x-company-isolation']).toBe('enabled');
    });
  });
});

module.exports = {
  companyIsolationTests: describe
};
