import * as server from '../server';

describe('server module', () => {
  it('does not start server when imported', () => {
    expect(server).toBeDefined();
  });

  it('executeServerIfMain is callable with a module entry check', () => {
    expect(() => server.executeServerIfMain('test-file', 'other-file')).not.toThrow();
  });
});
