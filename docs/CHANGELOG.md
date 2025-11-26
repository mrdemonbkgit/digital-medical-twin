# Changelog

> Last Updated: 2025-11-26

## Summary

Version history and release notes for Digital Medical Twin. Lists all notable changes in reverse chronological order.

## Keywords

`version` `release` `changelog` `history` `updates`

## Table of Contents

- [Unreleased](#unreleased)
- [Phase 1 - Foundation](#phase-1---foundation)
- [Format](#format)

---

## Unreleased

### Added

- N/A

### Changed

- N/A

### Fixed

- N/A

---

## Phase 1 - Foundation

> 2025-11-26

### Added

- Project scaffolding with Vite, React 19, TypeScript 5
- Tailwind CSS v4 styling setup
- Supabase client integration
- Authentication system with email/password
  - Login page and form
  - Registration page and form
  - Auth context with session management
  - Protected route wrapper
- Common UI components (Button, Input, Card, LoadingSpinner)
- Layout components (Header, PageWrapper, AppLayout)
- Routing configuration with react-router-dom v7
- Dashboard page (empty state)
- Settings page (placeholder)
- 404 Not Found page
- TypeScript types for all event types (LabResult, DoctorVisit, Medication, Intervention, Metric)
- API layer structure with auth, events, and settings modules

### Changed

- AUTH_SYSTEM.md updated to reflect Supabase email/password auth (changed from custom username/password)

### Technical Details

- Build: Vite 7.2.4
- Framework: React 19.2.0
- Routing: react-router-dom 7.9.6
- Database: Supabase (@supabase/supabase-js 2.86.0)
- Styling: Tailwind CSS 4.1.17 with @tailwindcss/postcss
- Icons: lucide-react 0.555.0

---

## Format

This changelog follows [Keep a Changelog](https://keepachangelog.com/) format:

- **Added** for new features
- **Changed** for changes in existing functionality
- **Deprecated** for soon-to-be removed features
- **Removed** for now removed features
- **Fixed** for bug fixes
- **Security** for vulnerability fixes
