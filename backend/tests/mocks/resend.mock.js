/**
 * Resend Email Service Mock for Testing
 * Simulates email sending without actual API calls
 */

class MockResend {
  constructor(apiKey) {
    if (mockResendInstance) {
      mockResendInstance.apiKey = apiKey;
      return mockResendInstance;
    }

    this.apiKey = apiKey;
    this.sentEmails = [];
    this.emails = {
      send: jest.fn(async (emailData) => {
        const emailId = `mock_email_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        // Store sent email for verification
        this.sentEmails.push({
          id: emailId,
          ...emailData,
          sentAt: new Date().toISOString()
        });

        // Simulate successful send
        return {
          data: { id: emailId },
          error: null
        };
      })
    };

    mockResendInstance = this;
  }

  getSentEmails() {
    return this.sentEmails;
  }

  clearSentEmails() {
    this.sentEmails = [];
    this.emails.send.mockClear();
  }
}

/**
 * Create mock Resend instance
 */
function createMockResend(apiKey) {
  return new MockResend(apiKey);
}

// Singleton instance for testing
let mockResendInstance = null;

/**
 * Get mock Resend instance (singleton)
 */
function getMockResend() {
  if (!mockResendInstance) {
    return new MockResend('test-key');
  }
  return mockResendInstance;
}

/**
 * Reset mock
 */
function resetMock() {
  if (mockResendInstance) {
    mockResendInstance.clearSentEmails();
  }
}

module.exports = {
  Resend: MockResend,
  createMockResend,
  getMockResend,
  resetMock
};
