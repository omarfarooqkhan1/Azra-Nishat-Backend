const request = require('supertest');
const app = require('../src/server');

describe('API Endpoints', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/health');
      
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.message).toBe('Server is running');
      expect(res.body.timestamp).toBeDefined();
    });
  });

  describe('GET /nonexistent', () => {
    it('should return 404 for nonexistent route', async () => {
      const res = await request(app).get('/nonexistent');
      
      expect(res.status).toBe(404);
      expect(res.body.status).toBe('fail');
    });
  });
});