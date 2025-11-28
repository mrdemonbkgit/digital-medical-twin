# Manual Test Cases - Biomarker Standardization Features

> Last Updated: 2025-11-28

## Prerequisites

Before testing, ensure:
1. Database migrations have been applied (`user_profiles`, `biomarker_standards`)
2. Biomarker seed data has been loaded (~100 biomarkers)
3. Development server is running (`npm run dev`)

---

## Test Suite 1: User Profile System

### TC-1.1: Profile Gate - New User Redirect

**Objective:** Verify new users are redirected to profile setup

**Steps:**
1. Create a new account or clear existing profile from database
2. Log in to the application
3. Navigate to Dashboard (`/`)

**Expected Result:**
- User is automatically redirected to `/profile/setup`
- Profile setup wizard is displayed with Step 1 (Basic Information)

---

### TC-1.2: Profile Setup Wizard - Complete Flow

**Objective:** Verify the 6-step profile wizard works correctly

**Steps:**
1. Start at `/profile/setup`
2. **Step 1 - Basic Info:**
   - Select gender (Male/Female)
   - Enter date of birth
   - Optionally enter height and weight
   - Click "Next"
3. **Step 2 - Medical Conditions:**
   - Add conditions using presets or custom entry
   - Click "Next"
4. **Step 3 - Medications:**
   - Add any current medications
   - Add any supplements
   - Click "Next"
5. **Step 4 - Allergies:**
   - Add any known allergies
   - Click "Next"
6. **Step 5 - Family History:**
   - Add family health conditions with relatives
   - Click "Next"
7. **Step 6 - Lifestyle:**
   - Select smoking status
   - Select alcohol consumption
   - Select exercise frequency
   - Select diet type
   - Click "Complete Setup"

**Expected Result:**
- Each step saves data as you progress
- "Back" button works to go to previous steps
- After completing, redirected to Dashboard
- Profile data is saved to database

---

### TC-1.3: Profile Gate - Access After Setup

**Objective:** Verify users can access protected pages after profile setup

**Steps:**
1. Complete profile setup (TC-1.2)
2. Navigate to Dashboard (`/`)
3. Navigate to Lab Uploads (`/lab-uploads`)

**Expected Result:**
- Dashboard loads without redirect
- Lab Uploads page loads without redirect
- No profile setup prompts appear

---

### TC-1.4: Profile Edit Page

**Objective:** Verify profile can be edited after initial setup

**Steps:**
1. Navigate to `/profile`
2. Modify any field in each section
3. Click "Save Changes"

**Expected Result:**
- Current profile data is pre-filled
- Changes can be made to any section
- Save button updates the database
- Success message appears after save

---

## Test Suite 2: Biomarker Standards Browser

### TC-2.1: Biomarkers Page - Browse All

**Objective:** Verify biomarker reference page displays correctly

**Steps:**
1. Navigate to `/biomarkers`
2. Scroll through the page

**Expected Result:**
- Page title "Biomarker Reference" displayed
- Biomarkers grouped by category (Metabolic, Lipid Panel, CBC, etc.)
- Each category shows biomarker count
- Categories are collapsible/expandable

---

### TC-2.2: Biomarkers Page - Search

**Objective:** Verify biomarker search functionality

**Steps:**
1. Navigate to `/biomarkers`
2. Type "glucose" in search box
3. Clear search and type "LDL"
4. Clear search and type "cholesterol"

**Expected Result:**
- Results filter as you type (after 2+ characters)
- "glucose" shows Glucose Fasting, Glucose Random, HbA1c
- "LDL" shows LDL Cholesterol
- "cholesterol" shows LDL, HDL, Total Cholesterol, VLDL

---

### TC-2.3: Biomarkers Page - View Details

**Objective:** Verify biomarker details are displayed

**Steps:**
1. Navigate to `/biomarkers`
2. Expand "Lipid Panel" category
3. Click on "LDL Cholesterol"

**Expected Result:**
- Biomarker card shows:
  - Name and code (LDL)
  - Standard unit (mg/dL)
  - Male reference range
  - Female reference range
  - Description
  - Aliases (if any)

---

## Test Suite 3: Lab Upload Processing Pipeline

### TC-3.1: Upload PDF - Basic Flow

**Objective:** Verify PDF upload initiates processing

**Steps:**
1. Ensure profile is complete
2. Navigate to `/lab-uploads`
3. Upload a lab result PDF via drag & drop or file picker
4. Observe the upload card

**Expected Result:**
- Upload appears with "Pending" status
- Status changes to "Processing"
- Processing stages show in order:
  1. "Extracting with Gemini..."
  2. "Verifying with GPT..."
  3. "Matching biomarkers to standards..."
- Status changes to "Complete" when done

---

### TC-3.2: Processing Stages Display

**Objective:** Verify all processing stages are displayed correctly

**Steps:**
1. Upload a new PDF
2. Watch the processing status carefully

**Expected Result:**
- Stage messages appear in blue box:
  - "Fetching PDF..." (brief)
  - "Extracting with Gemini..."
  - "Verifying with GPT..."
  - "Matching biomarkers to standards..."
- Elapsed time counter shows (e.g., "0:15")
- Spinner animation during processing

---

### TC-3.3: Extraction Preview - Processed Biomarkers

**Objective:** Verify processed biomarkers display correctly

**Steps:**
1. Wait for upload to complete
2. Click "Preview" button on completed upload

**Expected Result:**
- Modal opens with "Extraction Preview" title
- Summary bar shows "X matched" and "Y unmatched"
- Table has 6 columns: Name, Value, Unit, Reference, Flag, Status
- Matched biomarkers show:
  - Standard name (with original if different)
  - Standard code in monospace (e.g., "LDL")
  - Converted value if unit changed
  - Reference range from standards
  - Flag badge (High/Low/Normal)
  - Green "Matched" badge

---

### TC-3.4: Extraction Preview - Unmatched Biomarkers

**Objective:** Verify unmatched biomarkers are highlighted

**Steps:**
1. Upload a PDF with uncommon biomarkers
2. Click "Preview" when complete

**Expected Result:**
- Unmatched biomarkers have:
  - Amber background on row
  - Original name displayed
  - Original value and unit
  - No reference range (shows "-")
  - No flag
  - Amber "Unmatched" badge
- Warning box appears at bottom:
  - "Unmatched Biomarkers Need Review"
  - Count of unmatched biomarkers
  - Explanation text

---

### TC-3.5: Extraction Preview - Unit Conversion

**Objective:** Verify unit conversions display correctly

**Steps:**
1. Upload a PDF with SI units (mmol/L for cholesterol)
2. Click "Preview" when complete

**Expected Result:**
- Cholesterol values show:
  - Converted value in mg/dL
  - "Original: X.XX mmol/L" below the value
- Glucose values show:
  - Converted value in mg/dL
  - "Original: X.X mmol/L" below if converted

---

### TC-3.6: Extraction Preview - Validation Issues

**Objective:** Verify validation issues are indicated

**Steps:**
1. Upload a PDF with unusual values
2. Click "Preview" when complete

**Expected Result:**
- Biomarkers with issues show:
  - Red "Issues" badge in Status column
  - Hover shows tooltip with issue description

---

### TC-3.7: Raw Biomarkers Fallback

**Objective:** Verify fallback when post-processing not available

**Steps:**
1. Find an old upload (before post-processing was added)
2. Or: Temporarily disable post-processing in API
3. Click "Preview"

**Expected Result:**
- Header shows "Biomarkers (X) (raw extraction)"
- Table has 5 columns (no Status column)
- No matched/unmatched summary
- Original extracted values displayed

---

## Test Suite 4: Integration Tests

### TC-4.1: Gender-Specific Reference Ranges

**Objective:** Verify profile gender affects reference ranges

**Steps:**
1. Set profile gender to "Male"
2. Upload a lab PDF
3. Note reference ranges in preview
4. Change profile gender to "Female"
5. Re-upload the same PDF
6. Compare reference ranges

**Expected Result:**
- Male reference ranges used for first upload
- Female reference ranges used for second upload
- Ranges differ for gender-specific biomarkers (HDL, hemoglobin, etc.)

---

### TC-4.2: Create Event from Upload

**Objective:** Verify processed biomarkers transfer to event

**Steps:**
1. Complete a lab upload with processed biomarkers
2. Click "Create Event" button
3. Review the pre-filled lab result form

**Expected Result:**
- Lab Result form opens
- Test date pre-filled from extraction
- Biomarkers pre-filled with:
  - Standardized names
  - Converted values
  - Standard units
  - Reference ranges
- Can save event successfully

---

### TC-4.3: Stuck Job Handling

**Objective:** Verify stuck jobs can be deleted

**Steps:**
1. Start a PDF upload
2. Wait 5+ minutes (or temporarily lower threshold in code)
3. Observe the card

**Expected Result:**
- After 5 minutes, card shows:
  - Amber background on progress bar
  - "Job appears stuck - you can delete and retry"
  - Delete button becomes enabled

---

## Test Suite 5: Error Handling

### TC-5.1: Invalid PDF Upload

**Objective:** Verify error handling for invalid files

**Steps:**
1. Try to upload a non-PDF file
2. Try to upload a corrupted PDF
3. Try to upload an image-only PDF

**Expected Result:**
- Invalid file type rejected at upload
- Corrupted PDF shows "Failed" status with error
- Image-only PDF may fail or extract minimal data

---

### TC-5.2: Network Error During Processing

**Objective:** Verify graceful handling of network issues

**Steps:**
1. Start a PDF upload
2. Disconnect network during processing
3. Reconnect network

**Expected Result:**
- Upload shows "Failed" status
- Error message displayed
- "Retry" button available
- Retry works after network restored

---

### TC-5.3: API Rate Limit

**Objective:** Verify handling of AI API limits

**Steps:**
1. Upload multiple PDFs in quick succession
2. Observe processing

**Expected Result:**
- Only one upload processes at a time
- Others queue as "Pending"
- Each processes in order when previous completes

---

## Quick Smoke Test

For rapid testing, run through these steps:

1. ✅ Login with fresh account → Redirects to profile setup
2. ✅ Complete profile wizard → Redirects to dashboard
3. ✅ Visit `/biomarkers` → Shows categorized biomarkers
4. ✅ Search for "glucose" → Filters results
5. ✅ Visit `/lab-uploads` → Page loads
6. ✅ Upload lab PDF → Processing starts
7. ✅ Wait for completion → Shows "Complete" status
8. ✅ Click Preview → Shows matched/unmatched biomarkers
9. ✅ Click Create Event → Form pre-filled with data
10. ✅ Save event → Returns to uploads with event linked

---

## Notes

- Processing time varies: 30-90 seconds typical
- Some biomarkers may not match if they're uncommon
- Unit conversion requires the biomarker to be in the standards database
- Reference ranges default to male if gender cannot be determined
