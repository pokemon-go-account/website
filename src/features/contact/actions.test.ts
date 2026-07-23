import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { submitContactMessage, getContactMessages, updateContactMessageStatus, deleteContactMessage } from './actions';
import ContactMessage from '@/models/ContactMessage';

describe('Contact Server Actions', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI as string);
    }
    // Clean up collection before testing
    await mongoose.connection.db?.collection('contactmessages').deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('should successfully submit a valid contact message and save it to the database', async () => {
    const formData = new FormData();
    formData.append('name', 'Test Submitter');
    formData.append('email', 'submitter@example.com');
    formData.append('subject', 'Test Contact Subject');
    formData.append('message', 'This is a test message that meets the length requirements.');

    const result = await submitContactMessage(null, formData);
    
    expect(result.success).toBe(true);
    expect(result.error).toBeNull();

    // Verify it saved in the actual database
    const savedMsg = await ContactMessage.findOne({ email: 'submitter@example.com' });
    expect(savedMsg).not.toBeNull();
    expect(savedMsg?.subject).toBe('Test Contact Subject');
    expect(savedMsg?.message).toContain('meets the length requirements');
  });

  it('should fail validation if the email is incorrectly formatted', async () => {
    const formData = new FormData();
    formData.append('name', 'Test User');
    formData.append('email', 'invalid-email-no-domain');
    formData.append('subject', 'Test Subject');
    formData.append('message', 'This is a test message that is long enough.');

    const result = await submitContactMessage(null, formData);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('valid email address');
  });

  it('should fetch contact messages for an admin', async () => {
    const result = await getContactMessages();
    expect(result.success).toBe(true);
    // Since we created one message in the first test, it should be here
    expect(result.messages?.length).toBeGreaterThanOrEqual(1);
    expect(result.messages?.[0].email).toBe('submitter@example.com');
  });

  it('should update the status of a contact message', async () => {
    const msg = await ContactMessage.findOne({ email: 'submitter@example.com' });
    expect(msg).toBeDefined();

    const result = await updateContactMessageStatus(msg!._id.toString(), 'READ');
    expect(result.success).toBe(true);

    const updatedMsg = await ContactMessage.findById(msg!._id);
    expect(updatedMsg?.status).toBe('READ');
  });

  it('should delete a contact message', async () => {
    const msg = await ContactMessage.findOne({ email: 'submitter@example.com' });
    expect(msg).toBeDefined();

    const result = await deleteContactMessage(msg!._id.toString());
    expect(result.success).toBe(true);

    const deletedMsg = await ContactMessage.findById(msg!._id);
    expect(deletedMsg).toBeNull();
  });
});
