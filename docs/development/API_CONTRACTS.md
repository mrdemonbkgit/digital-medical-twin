# API Contracts

> Last Updated: 2025-11-26

## Summary

API endpoint specifications for Digital Medical Twin. Covers authentication, events, and AI endpoints. All endpoints return JSON and require authentication unless specified.

## Keywords

`API` `endpoints` `REST` `contracts` `requests` `responses` `authentication`

## Table of Contents

- [API Overview](#api-overview)
- [Authentication Endpoints](#authentication-endpoints)
- [Events Endpoints](#events-endpoints)
- [AI Endpoints](#ai-endpoints)
- [Error Responses](#error-responses)

---

## API Overview

### Base URL

```
Production: https://api.digitalmedicaltwin.com/v1
Development: http://localhost:3000/api/v1
```

### Authentication

All endpoints (except auth) require Bearer token:

```
Authorization: Bearer <jwt_token>
```

### Common Headers

```
Content-Type: application/json
Accept: application/json
```

---

## Authentication Endpoints

### POST /auth/register

Create new user account.

**Request:**
```json
{
  "username": "string (3-30 chars)",
  "password": "string (min 8 chars)"
}
```

**Response (201):**
```json
{
  "message": "User created successfully"
}
```

**Errors:**
- 400: Validation failed
- 409: Username already exists

---

### POST /auth/login

Authenticate user and get token.

**Request:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response (200):**
```json
{
  "token": "jwt_token_string",
  "expiresAt": "2024-03-16T12:00:00Z",
  "user": {
    "id": "uuid",
    "username": "string"
  }
}
```

**Errors:**
- 401: Invalid credentials

---

### POST /auth/refresh

Refresh authentication token.

**Request:**
```json
{
  "refreshToken": "string"
}
```

**Response (200):**
```json
{
  "token": "new_jwt_token",
  "expiresAt": "2024-03-16T12:00:00Z"
}
```

**Errors:**
- 401: Invalid or expired refresh token

---

## Events Endpoints

### GET /events

Get user's health events with optional filtering.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| type | string | Filter by event type |
| startDate | ISO date | Filter from date |
| endDate | ISO date | Filter to date |
| search | string | Full-text search |
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 20, max: 100) |

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "type": "lab_result",
      "date": "2024-03-15T00:00:00Z",
      "title": "Annual Bloodwork",
      "notes": "string",
      "createdAt": "2024-03-15T10:30:00Z",
      "updatedAt": "2024-03-15T10:30:00Z",
      // Type-specific fields...
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "hasMore": true
  }
}
```

---

### GET /events/:id

Get single event by ID.

**Response (200):**
```json
{
  "id": "uuid",
  "type": "lab_result",
  "date": "2024-03-15T00:00:00Z",
  "title": "Annual Bloodwork",
  "labName": "Quest Diagnostics",
  "orderingDoctor": "Dr. Smith",
  "biomarkers": [
    {
      "name": "LDL Cholesterol",
      "value": 95,
      "unit": "mg/dL",
      "referenceMin": 0,
      "referenceMax": 100,
      "flag": "normal"
    }
  ],
  "notes": "Fasting blood draw",
  "createdAt": "2024-03-15T10:30:00Z",
  "updatedAt": "2024-03-15T10:30:00Z"
}
```

**Errors:**
- 404: Event not found

---

### POST /events

Create new health event.

**Request (Lab Result):**
```json
{
  "type": "lab_result",
  "date": "2024-03-15",
  "title": "Annual Bloodwork",
  "labName": "Quest Diagnostics",
  "orderingDoctor": "Dr. Smith",
  "biomarkers": [
    {
      "name": "LDL Cholesterol",
      "value": 95,
      "unit": "mg/dL",
      "referenceMin": 0,
      "referenceMax": 100
    }
  ],
  "notes": "Fasting blood draw"
}
```

**Request (Doctor Visit):**
```json
{
  "type": "doctor_visit",
  "date": "2024-03-15",
  "title": "Cardiology Follow-up",
  "doctorName": "Dr. Johnson",
  "specialty": "Cardiology",
  "facility": "Heart Center",
  "diagnosis": ["Hypertension"],
  "notes": "Blood pressure well controlled",
  "followUp": "Return in 6 months"
}
```

**Request (Medication):**
```json
{
  "type": "medication",
  "date": "2024-03-15",
  "medicationName": "Lisinopril",
  "dosage": "10mg",
  "frequency": "once daily",
  "startDate": "2024-03-15",
  "prescriber": "Dr. Johnson",
  "reason": "Blood pressure control"
}
```

**Request (Intervention):**
```json
{
  "type": "intervention",
  "date": "2024-03-15",
  "interventionName": "Intermittent Fasting",
  "category": "diet",
  "startDate": "2024-03-15",
  "protocol": "16:8 schedule, eating window 12pm-8pm",
  "notes": "Starting to improve metabolic health"
}
```

**Request (Metric):**
```json
{
  "type": "metric",
  "date": "2024-03-15",
  "source": "whoop",
  "metricName": "HRV",
  "value": 45,
  "unit": "ms"
}
```

**Response (201):**
Returns created event object.

**Errors:**
- 400: Validation failed

---

### PUT /events/:id

Update existing event.

**Request:**
Same as POST, but only include fields to update.

**Response (200):**
Returns updated event object.

**Errors:**
- 400: Validation failed
- 404: Event not found

---

### DELETE /events/:id

Delete event.

**Response (204):**
No content.

**Errors:**
- 404: Event not found

---

## AI Endpoints

### POST /ai/chat

Send message to AI Historian.

**Request:**
```json
{
  "message": "Compare my vitamin D levels over the past year",
  "provider": "openai",
  "model": "gpt-5.2"
}
```

**Response (200):**
```json
{
  "response": "Based on your lab results, here's a comparison...",
  "sources": [
    {
      "eventId": "uuid",
      "type": "lab_result",
      "date": "2024-03-15",
      "title": "Annual Bloodwork"
    }
  ],
  "tokensUsed": 1250
}
```

**Errors:**
- 400: Invalid request
- 401: AI provider authentication failed
- 429: Rate limited

---

### POST /ai/configure

Save AI configuration.

**Request:**
```json
{
  "provider": "openai",
  "model": "gpt-5.2",
  "temperature": 0.7
}
```

**Response (200):**
```json
{
  "message": "Configuration saved",
  "isValid": true
}
```

---

## Error Responses

### Standard Error Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable error message",
    "details": {
      "field": "username",
      "issue": "Must be at least 3 characters"
    }
  }
}
```

### Error Codes

| Code | Status | Description |
|------|--------|-------------|
| VALIDATION_ERROR | 400 | Request validation failed |
| UNAUTHORIZED | 401 | Authentication required |
| FORBIDDEN | 403 | Permission denied |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource already exists |
| RATE_LIMITED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |

---

## Related Documents

- /docs/architecture/AUTH_SYSTEM.md — Authentication details
- /docs/architecture/DATABASE_SCHEMA.md — Data models
- /docs/architecture/AI_INTEGRATION.md — AI system architecture
