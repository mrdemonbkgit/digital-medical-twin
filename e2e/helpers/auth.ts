import { Page } from '@playwright/test';
import {
  mockSession,
  mockUser,
  mockUserProfile,
  mockAISettings,
} from '../fixtures/mock-data';

/**
 * Sets up route mocks for an authenticated user session.
 * This bypasses actual Supabase auth and mocks all necessary API responses.
 */
export async function setupAuthenticatedMocks(page: Page) {
  // Set localStorage BEFORE any navigation - this must be first
  await page.addInitScript(() => {
    // Supabase storage key format: sb-{project-ref}-auth-token
    const mockStorageKey = 'sb-iepmzmelrdlopcaqkcyi-auth-token';
    const expiresAt = Math.floor(Date.now() / 1000) + 3600;
    const mockAuthData = {
      access_token: 'mock-access-token-12345',
      refresh_token: 'mock-refresh-token-12345',
      expires_at: expiresAt,
      expires_in: 3600,
      token_type: 'bearer',
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        aud: 'authenticated',
        role: 'authenticated',
        email_confirmed_at: '2024-01-01T00:00:00.000Z',
        app_metadata: { provider: 'email', providers: ['email'] },
        user_metadata: {},
        created_at: '2024-01-01T00:00:00.000Z',
      },
    };
    localStorage.setItem(mockStorageKey, JSON.stringify(mockAuthData));
  });

  // Mock ALL Supabase auth endpoints
  await page.route('**/auth/**', async (route) => {
    const url = route.request().url();

    if (url.includes('/token')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockSession),
      });
    } else if (url.includes('/user')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockUser),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    }
  });

  // Mock user profile
  await page.route('**/rest/v1/user_profiles*', async (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockUserProfile]),
      });
    } else {
      await route.fulfill({ status: 200, body: JSON.stringify(mockUserProfile) });
    }
  });

  // Mock AI settings
  await page.route('**/rest/v1/ai_settings*', async (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockAISettings]),
      });
    } else {
      await route.fulfill({ status: 200, body: JSON.stringify(mockAISettings) });
    }
  });

  // Mock user tags RPC
  await page.route('**/rest/v1/rpc/get_user_tags*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(['bloodwork', 'annual', 'checkup', 'supplements']),
    });
  });
}

/**
 * Sets up mocks specifically for the timeline page
 */
export async function setupTimelineMocks(page: Page) {
  await setupAuthenticatedMocks(page);

  // Import mock data
  const { mockEvents } = await import('../fixtures/mock-data');

  // Mock events API
  await page.route('**/rest/v1/events*', async (route) => {
    const url = new URL(route.request().url());

    let filteredEvents = [...mockEvents];

    // Handle PostgREST 'or' filter for search
    // Real app sends: or=(title.ilike.%term%,notes.ilike.%term%,...)
    const orFilter = url.searchParams.get('or');
    if (orFilter) {
      // Extract search term from ilike pattern: title.ilike.%term%
      const ilikeMatch = orFilter.match(/title\.ilike\.%([^%]+)%/);
      if (ilikeMatch) {
        const searchTerm = decodeURIComponent(ilikeMatch[1]).toLowerCase();
        filteredEvents = filteredEvents.filter(
          (e) =>
            e.title.toLowerCase().includes(searchTerm) ||
            e.notes?.toLowerCase().includes(searchTerm) ||
            e.doctor_name?.toLowerCase().includes(searchTerm) ||
            e.medication_name?.toLowerCase().includes(searchTerm) ||
            e.intervention_name?.toLowerCase().includes(searchTerm) ||
            e.metric_name?.toLowerCase().includes(searchTerm) ||
            e.lab_name?.toLowerCase().includes(searchTerm)
        );
      }
    }

    // Handle type filter: type=in.(lab_result,doctor_visit)
    const typeFilter = url.searchParams.get('type');
    if (typeFilter) {
      const inMatch = typeFilter.match(/^in\.\((.+)\)$/);
      if (inMatch) {
        const types = inMatch[1].split(',');
        filteredEvents = filteredEvents.filter((e) => types.includes(e.type));
      }
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: {
        'content-range': `0-${filteredEvents.length - 1}/${filteredEvents.length}`,
      },
      body: JSON.stringify(filteredEvents),
    });
  });
}

/**
 * Sets up mocks specifically for the AI chat page
 */
export async function setupAIChatMocks(page: Page) {
  await setupAuthenticatedMocks(page);

  // Import mock data
  const { mockConversations } = await import('../fixtures/mock-data');

  // Mock conversations list
  await page.route('**/rest/v1/conversations*', async (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockConversations),
      });
    } else if (method === 'POST') {
      const body = JSON.parse(route.request().postData() || '{}');
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'new-conv-' + Date.now(),
          ...body,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
      });
    } else if (method === 'PATCH' || method === 'DELETE') {
      await route.fulfill({ status: 200, body: '{}' });
    } else {
      await route.continue();
    }
  });

  // Mock conversation messages
  await page.route('**/rest/v1/conversation_messages*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });
}

/**
 * Sets up mocks specifically for the lab uploads page
 */
export async function setupLabUploadMocks(page: Page) {
  await setupAuthenticatedMocks(page);

  let uploadStatus = 'pending';
  let pollCount = 0;

  // Mock lab uploads list
  await page.route('**/rest/v1/lab_uploads*', async (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      pollCount++;
      // Simulate processing progress
      if (pollCount > 3) {
        uploadStatus = 'complete';
      } else if (pollCount > 1) {
        uploadStatus = 'processing';
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'upload-1',
            user_id: 'test-user-id',
            file_path: 'test-user-id/lab-report.pdf',
            original_filename: 'lab-report.pdf',
            status: uploadStatus,
            processing_stage: uploadStatus === 'complete' ? 'done' : 'extracting_gemini',
            extracted_data:
              uploadStatus === 'complete'
                ? {
                    biomarkers: [
                      { name: 'Glucose', value: 95, unit: 'mg/dL' },
                      { name: 'Cholesterol', value: 185, unit: 'mg/dL' },
                    ],
                  }
                : null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]),
      });
    } else if (method === 'POST') {
      pollCount = 0;
      uploadStatus = 'pending';
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'upload-1',
          status: 'pending',
        }),
      });
    } else {
      await route.continue();
    }
  });

  // Mock storage upload
  await page.route('**/storage/v1/object/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ Key: 'test-user-id/lab-report.pdf' }),
    });
  });

  // Mock lab upload processing API
  await page.route('**/api/ai/process-lab-upload', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });
}

/**
 * Sets up mocks for unauthenticated state (no AI configured)
 */
export async function setupUnconfiguredAIMocks(page: Page) {
  // Set localStorage BEFORE any navigation
  await page.addInitScript(() => {
    const mockStorageKey = 'sb-iepmzmelrdlopcaqkcyi-auth-token';
    const expiresAt = Math.floor(Date.now() / 1000) + 3600;
    const mockAuthData = {
      access_token: 'mock-access-token-12345',
      refresh_token: 'mock-refresh-token-12345',
      expires_at: expiresAt,
      expires_in: 3600,
      token_type: 'bearer',
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        aud: 'authenticated',
        role: 'authenticated',
        email_confirmed_at: '2024-01-01T00:00:00.000Z',
        app_metadata: { provider: 'email', providers: ['email'] },
        user_metadata: {},
        created_at: '2024-01-01T00:00:00.000Z',
      },
    };
    localStorage.setItem(mockStorageKey, JSON.stringify(mockAuthData));
  });

  // Mock auth endpoints
  await page.route('**/auth/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({}),
    });
  });

  // Mock user profile
  await page.route('**/rest/v1/user_profiles*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([mockUserProfile]),
    });
  });

  // AI settings returns empty (not configured)
  await page.route('**/rest/v1/ai_settings*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });
}
