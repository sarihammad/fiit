i# 🧪 Testing Guide - Features 1-3

**Features to Test:**

1. Food Photo Analysis (Feature 1)
2. Meal Log Flow with Tabs (Feature 2)
3. AI Caching & Fallback (Feature 3)

**Date:** October 7, 2025

---

## Prerequisites

### 1. Environment Setup

Make sure your `.env` file has these keys (optional for testing):

```bash
# Optional - will use mock data if missing
EXPO_PUBLIC_AI_PROVIDER=openai
EXPO_PUBLIC_NUTRITIONIX_APP_ID=your-id-here
EXPO_PUBLIC_NUTRITIONIX_API_KEY=your-key-here
EXPO_PUBLIC_CALORIEMAMA_API_KEY=your-key-here
```

**Note:** All features work with mock/fallback data if API keys are missing!

### 2. Start the App

```bash
# Install dependencies (if needed)
npm install

# Start Expo
npx expo start

# Then press:
# - 'i' for iOS simulator
# - 'a' for Android emulator
# - Scan QR code for physical device
```

---

## Test Suite

### ✅ Test 1: Meal Log Screen - Tab Navigation

**Goal:** Verify tab switching works

**Steps:**

1. Complete onboarding (or skip if already done)
2. Navigate to "Log" tab (camera icon in bottom tabs)
3. Verify 3 tabs appear: Photo | Search | Manual
4. Tap each tab
5. Verify content changes for each tab

**Expected Results:**

- ✅ Photo tab shows camera icon and "Open Camera" button
- ✅ Search tab shows search input and button
- ✅ Manual tab shows pencil icon and "Open Entry Form" button
- ✅ Active tab has colored background (green)
- ✅ Tab switches are instant (no lag)

**Status:** ⬜ PASS | ⬜ FAIL

---

### ✅ Test 2: Photo → Portion → Save (Happy Path)

**Goal:** Test full photo logging flow

**Prerequisites:**

- Device with camera OR use simulator (will fail gracefully)

**Steps:**

1. Tap "Photo" tab
2. Tap "Open Camera" button
3. Take photo of food (or any object if using simulator)
4. Wait up to 8 seconds for analysis
5. **Verify portion selector appears** with presets
6. Select different portion (e.g., "150g" or "1.5 cups")
7. **Verify macro preview updates in real-time**
8. Scroll down to see calorie breakdown bar
9. Tap "Save Meal" button
10. Verify modal closes
11. **Check "Today's Meals" section**

**Expected Results:**

- ✅ Camera opens successfully
- ✅ Loading indicator shows "Analyzing your meal... (up to 8 seconds)"
- ✅ Portion selector modal appears with 4+ presets
- ✅ Presets show: unit + calorie count
- ✅ Selecting preset updates macro preview instantly
- ✅ Macro preview shows: calories, protein, carbs, fat (with icons)
- ✅ Calorie breakdown bar shows P/C/F percentages
- ✅ "Save Meal" button is enabled
- ✅ Meal appears in "Today's Meals" with correct macros
- ✅ Daily totals update at bottom

**Status:** ⬜ PASS | ⬜ FAIL

**Screenshot Opportunities:**

- Portion selector screen
- Macro preview with breakdown bar

---

### ✅ Test 3: Photo Analysis Failure → Manual Entry

**Goal:** Verify graceful failure handling

**How to Trigger Failure:**

- **Option A:** Turn off WiFi/cellular before taking photo
- **Option B:** Point camera at completely black surface
- **Option C:** Set invalid `EXPO_PUBLIC_CALORIEMAMA_API_KEY` in .env

**Steps:**

1. Trigger failure condition (see above)
2. Tap "Photo" tab → "Open Camera"
3. Take photo
4. Wait for timeout/error
5. **Watch for toast notification**
6. **Verify Manual Entry modal opens automatically**

**Expected Results:**

- ✅ Toast appears with error message (e.g., "Photo analysis failed...")
- ✅ Manual Entry modal opens automatically (no user action needed)
- ✅ Modal shows form with fields: Name, Meal Time, Macros
- ✅ No crash or blank screen
- ✅ User can complete form and save successfully

**Status:** ⬜ PASS | ⬜ FAIL

---

### ✅ Test 4: Search → Portion → Save

**Goal:** Test search flow with portion selection

**Steps:**

1. Tap "Search" tab
2. Type "chicken breast" in search box
3. Tap "Search" button (or press Enter/Return)
4. Wait for results (should be fast)
5. **Tap any result**
6. Verify portion selector appears
7. Select a portion
8. Verify macro preview
9. Tap "Save Meal"

**Expected Results:**

- ✅ Search shows loading state briefly
- ✅ Results appear with name, calories, protein, quantity
- ✅ Tapping result opens portion selector (same as photo flow)
- ✅ Portion selector shows relevant presets for that food
- ✅ Meal saves successfully

**Test with different foods:**

- "salmon" (protein)
- "rice" (carbs)
- "broccoli" (vegetable)
- "apple" (fruit)

**Status:** ⬜ PASS | ⬜ FAIL

---

### ✅ Test 5: Manual Entry Flow

**Goal:** Test manual meal entry

**Steps:**

1. Tap "Manual" tab
2. Tap "Open Entry Form" button
3. Fill in form:
   - **Name:** "Protein Shake"
   - **Meal Time:** Tap "Snack"
   - **Calories:** 250
   - **Protein:** 30
   - **Carbs:** 10
   - **Fat:** 5
4. **Verify estimated calories** appears at bottom
5. Tap "Save Meal"

**Expected Results:**

- ✅ Modal opens with clean form
- ✅ Meal time buttons show icons (🌅 ☀️ 🌙 🍎)
- ✅ Selected meal time has colored background
- ✅ Number inputs accept only numbers
- ✅ Estimated calories shows: ~230 cal (formula: P*4 + C*4 + F\*9)
- ✅ "Save Meal" button disabled until Name + Calories filled
- ✅ Tapping "Cancel" closes modal without saving
- ✅ Meal appears in "Today's Meals"

**Status:** ⬜ PASS | ⬜ FAIL

---

### ✅ Test 6: AI Caching - Stale While Revalidate

**Goal:** Verify feedback caching works

**Prerequisites:**

- Log at least 2-3 meals first (use any method)
- Need internet connection initially

**Steps:**

1. Navigate to "Progress" tab
2. Tap "Insights" or similar to get daily feedback
3. Wait for AI feedback to load
4. **Note the feedback text**
5. Go back, then return to Insights
6. **Verify feedback loads instantly** (from cache)
7. Turn off WiFi/cellular
8. Close and reopen the Insights screen
9. **Verify cached feedback still appears**
10. Turn WiFi back on
11. Wait 30 seconds
12. Refresh Insights
13. Check console logs for background refresh

**Expected Results:**

- ✅ First load: Shows loading state, then feedback
- ✅ Second load: Feedback appears instantly (no loading)
- ✅ Offline load: Cached feedback appears (no error)
- ✅ No "Failed to load" message
- ✅ Background refresh happens silently (check logs)

**Console Logs to Look For:**

```
[AICache] Get: feedback-2024-10-07-...
[AICache] Cache hit (fresh)
[AICache] Background refresh triggered
```

**Status:** ⬜ PASS | ⬜ FAIL

---

### ✅ Test 7: AI Fallback Feedback

**Goal:** Verify fallback feedback when AI fails

**How to Test:**

1. **Option A:** Set `EXPO_PUBLIC_OPENAI_API_KEY=""` (empty) in .env
2. **Option B:** Set invalid key: `EXPO_PUBLIC_OPENAI_API_KEY="sk-invalid"`
3. Restart app: `npx expo start --clear`
4. Log 2-3 meals with varied macros
5. Navigate to Insights for daily feedback

**Expected Results:**

- ✅ Fallback feedback appears (no crash)
- ✅ Feedback includes **3 contextual bullets**:
  - Calorie status (over/under/on track)
  - Protein status (low/excellent/solid)
  - Meals logged count
- ✅ "Tomorrow Tip" shows specific meal suggestion
  - Example: "Swap your usual breakfast for: 3 eggs + 1 cup Greek yogurt..."
- ✅ **Hydration note** appears with oz target
  - Example: "Hydration target: 70 oz water (~9 glasses)"
- ✅ Mood badge shows (encouraging or celebratory)
- ✅ User has no idea AI failed (seamless UX)

**Status:** ⬜ PASS | ⬜ FAIL

---

### ✅ Test 8: Multiple Meals & Daily Totals

**Goal:** Verify totals calculation

**Steps:**

1. Log 3 different meals (any method)
   - Meal 1: ~300 cal, 20g protein
   - Meal 2: ~400 cal, 25g protein
   - Meal 3: ~350 cal, 30g protein
2. Scroll to "Daily Totals" at bottom
3. Verify math is correct

**Expected Results:**

- ✅ Totals show: ~1050 cal, ~75g protein
- ✅ Totals update immediately after adding meal
- ✅ Removing a meal updates totals
- ✅ Totals persist after closing/reopening app

**Status:** ⬜ PASS | ⬜ FAIL

---

### ✅ Test 9: Portion Presets for Different Foods

**Goal:** Verify smart portion presets

**Test Foods:**

**A) Chicken (protein):**

- Search "chicken breast"
- Expected presets: 100g, 150g, 200g, "1 palm-sized"

**B) Rice (carbs):**

- Search "rice"
- Expected presets: 1/2 cup, 1 cup, 1.5 cups

**C) Broccoli (vegetable):**

- Search "broccoli"
- Expected presets: 1 cup, 2 cups, 100g

**D) Banana (fruit):**

- Search "banana"
- Expected presets: 1 medium, 1 large, 1 small

**Expected Results:**

- ✅ Each food type gets relevant portion presets
- ✅ Presets are sensible for that food category
- ✅ Calorie estimates adjust correctly with each preset

**Status:** ⬜ PASS | ⬜ FAIL

---

### ✅ Test 10: Error States & Edge Cases

**A) Empty Search:**

- Try searching with empty input
- **Expected:** Search button disabled

**B) No Results:**

- Search for gibberish: "asdfqwerzxcv"
- **Expected:** Toast: "No results found. Try a different search."

**C) Network Error During Search:**

- Turn off internet
- Try searching
- **Expected:** Fallback to mock database (chicken, rice, etc.)

**D) Remove Meal:**

- Log a meal
- Tap "×" button on meal card
- **Expected:** Meal removed, totals update, toast confirmation

**E) Manual Entry - Invalid Input:**

- Try saving with only Name (no calories)
- **Expected:** "Save Meal" button disabled

**Status:** ⬜ PASS | ⬜ FAIL

---

## 📊 Test Results Summary

**Test Coverage:**

- [ ] Test 1: Tab Navigation
- [ ] Test 2: Photo → Portion → Save
- [ ] Test 3: Photo Failure → Manual
- [ ] Test 4: Search → Portion → Save
- [ ] Test 5: Manual Entry
- [ ] Test 6: AI Caching
- [ ] Test 7: AI Fallback
- [ ] Test 8: Daily Totals
- [ ] Test 9: Portion Presets
- [ ] Test 10: Error States

**Pass Rate:** **_/10 (_**%)

---

## 🐛 Issues Found

| #   | Test | Issue | Severity | Status |
| --- | ---- | ----- | -------- | ------ |
| 1   |      |       |          |        |
| 2   |      |       |          |        |
| 3   |      |       |          |        |

**Severity Levels:**

- 🔴 Critical - Blocks usage
- 🟡 Major - Degrades experience
- 🟢 Minor - Cosmetic/edge case

---

## 📸 Screenshots Needed

For documentation/App Store:

- [ ] Meal Log screen with tabs
- [ ] Portion selector with presets
- [ ] Macro preview with breakdown bar
- [ ] Manual entry form
- [ ] Today's meals list with totals
- [ ] Search results
- [ ] AI feedback (fallback version)

---

## ✅ Testing Checklist Complete

Once all tests pass:

- [ ] All 10 tests passed
- [ ] No critical bugs found
- [ ] Screenshots captured
- [ ] Ready to continue with Features 4-5

---

**Tester Notes:**

**Date Tested:** **\*\***\_\_\_**\*\***  
**Device/Simulator:** **\*\***\_\_\_**\*\***  
**OS Version:** **\*\***\_\_\_**\*\***
