# 🧪 Comprehensive Testing Guide for "Unfuck Your Past"

## 🎯 **Testing Overview**
This guide provides step-by-step instructions to test all major features of the application to ensure everything is working correctly.

## 🚀 **Prerequisites**
- Development server running on `http://localhost:3001` (or `http://localhost:3000`)
- Valid API keys in `.env.local`:
  - `OPENAI_API_KEY`
  - `CLAUDE_API_KEY` (optional, for fallback)
  - `CLERK_SECRET_KEY`
  - `STRIPE_SECRET_KEY`
  - `DATABASE_URL`

## 📋 **Test Scenarios**

### **1. Authentication & Onboarding Flow**
**Goal**: Test user registration, sign-in, and onboarding process

**Steps**:
1. Navigate to `http://localhost:3001`
2. Click "Get Started" or "Sign Up"
3. Complete Clerk authentication (email/social login)
4. Complete the 10-step onboarding process:
   - Select tone: "gentle" or "direct"
   - Select voice: "friend", "coach", or "mentor"
   - Select rawness: "moderate", "intense", or "extreme"
   - Select depth: "surface", "deep", or "profound"
   - Select learning style: "text", "audio", or "interactive"
   - Select engagement: "passive", "active", "challenging", or "collaborative"
   - Configure safety settings
   - Select goals: "growth", "clarity", or "change"
   - Select experience level
   - Select time commitment

**Expected Result**: 
- ✅ User successfully completes onboarding
- ✅ Redirected to diagnostic page
- ✅ Personalized questions are generated

---

### **2. Diagnostic Questions Flow**
**Goal**: Test AI-generated personalized questions and response submission

**Steps**:
1. After completing onboarding, you should see the diagnostic page
2. Verify that personalized questions are displayed (not generic ones)
3. Answer the first question with a detailed response (test the 10,000 character limit)
4. Test both text and voice input modes
5. Submit the response and verify AI insight is generated
6. Continue through all questions (typically 5-7 questions)
7. Complete the diagnostic assessment

**Expected Result**:
- ✅ Questions are personalized based on onboarding preferences
- ✅ Text input works for long responses (up to 10,000 characters)
- ✅ Voice input works (if browser supports it)
- ✅ AI insights are generated after each response
- ✅ Progress bar updates correctly
- ✅ All questions can be answered and submitted

---

### **3. Diagnostic Results & Free Summary**
**Goal**: Test the diagnostic results page and free summary display

**Steps**:
1. After completing all diagnostic questions, you should be redirected to `/diagnostic/results`
2. Verify that a free summary is displayed with:
   - Key Insights
   - Primary Patterns
   - Immediate Recommendations
   - Next Steps
3. Check that the comprehensive report section shows a lock icon
4. Verify the "Purchase Full Report ($10)" button is present

**Expected Result**:
- ✅ Free summary displays immediately
- ✅ Summary contains relevant insights based on responses
- ✅ Paywall section is clearly marked with lock icon
- ✅ Purchase button is functional

---

### **4. Payment Flow for Diagnostic Report**
**Goal**: Test Stripe payment integration for diagnostic report

**Steps**:
1. Click "Purchase Full Report ($10)" button
2. Payment modal should open
3. Fill in test payment details:
   - Card Number: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/25`)
   - CVC: Any 3 digits (e.g., `123`)
   - Name: Any name
4. Click "Purchase Report"
5. Verify payment processing
6. Check redirect to payment success page
7. Return to diagnostic results page

**Expected Result**:
- ✅ Payment modal opens correctly
- ✅ Payment form accepts test card details
- ✅ Payment processes successfully
- ✅ User is redirected to success page
- ✅ Full report is unlocked after payment

---

### **5. Comprehensive Diagnostic Report**
**Goal**: Test the full diagnostic report display after purchase

**Steps**:
1. After successful payment, return to `/diagnostic/results`
2. Verify that the comprehensive report is now unlocked
3. Check that all sections are displayed:
   - **Trauma Avoidance Hierarchy** (ranked list with impact levels)
   - **Personality Breakdown** (traits, beliefs, patterns)
   - **Strengths & Weaknesses** (detailed analysis)
   - **Worldview Analysis** (limiting beliefs, values, barriers)
   - **Healing Recommendations** (primary technique, timeline, resources)
   - **Additional Insights** (growth potential, risk factors, support needs)
4. Verify that content is personalized and relevant to your responses
5. Check that visual elements (colors, icons) are properly displayed

**Expected Result**:
- ✅ All report sections are unlocked and visible
- ✅ Content is personalized based on diagnostic responses
- ✅ Visual design is clean and professional
- ✅ Information is comprehensive and valuable

---

### **6. Program Access & 30-Day Program**
**Goal**: Test program access and personalized program generation

**Steps**:
1. Navigate to `/program` or access via dashboard
2. If you haven't purchased the program, you should see a paywall
3. Purchase the 30-day program ($29.95) using the same test card
4. After purchase, verify that the program is unlocked
5. Check that personalized program content is generated
6. Verify that day-by-day content is displayed
7. Test program progress tracking

**Expected Result**:
- ✅ Program paywall works correctly
- ✅ Payment processes successfully
- ✅ Personalized program content is generated
- ✅ Daily content is relevant and actionable
- ✅ Progress tracking works

---

### **7. Dashboard & Navigation**
**Goal**: Test main navigation and dashboard functionality

**Steps**:
1. Navigate to `/dashboard`
2. Verify that all purchased content is accessible
3. Test navigation between different sections
4. Check that user authentication state is maintained
5. Test responsive design on different screen sizes
6. Verify that all links and buttons work correctly

**Expected Result**:
- ✅ Dashboard displays correctly
- ✅ All purchased content is accessible
- ✅ Navigation works smoothly
- ✅ Authentication state is maintained
- ✅ Responsive design works on mobile/desktop

---

### **8. Error Handling & Edge Cases**
**Goal**: Test error handling and edge cases

**Steps**:
1. Test with invalid API keys (temporarily modify `.env.local`)
2. Test with network connectivity issues
3. Test with very long responses (near the 10,000 character limit)
4. Test with empty or minimal responses
5. Test payment failures (use declined test card: `4000 0000 0000 0002`)
6. Test authentication edge cases (sign out, sign back in)

**Expected Result**:
- ✅ Graceful error handling for API failures
- ✅ Appropriate fallback content when AI services fail
- ✅ Clear error messages for users
- ✅ Payment failures are handled gracefully
- ✅ Authentication issues are resolved properly

---

## 🔧 **Debugging Tips**

### **Common Issues & Solutions**:

1. **Questions not generating**:
   - Check browser console for errors
   - Verify API keys in `.env.local`
   - Check terminal logs for AI service errors

2. **Payment not working**:
   - Verify Stripe keys are correct
   - Check that test mode is enabled
   - Verify webhook endpoints (if applicable)

3. **Database errors**:
   - Run `npm run db:push` to ensure schema is up to date
   - Check database connection in `.env.local`

4. **Authentication issues**:
   - Verify Clerk keys are correct
   - Check that user is properly signed in
   - Clear browser cache if needed

### **Terminal Logs to Monitor**:
- AI service responses
- Database queries
- Payment processing
- Authentication events

---

## ✅ **Success Criteria**

The application is considered fully functional when:
- [ ] Users can complete onboarding and get personalized questions
- [ ] Diagnostic questions can be answered with detailed responses
- [ ] AI insights are generated for each response
- [ ] Free summary is displayed on results page
- [ ] Payment flow works for both diagnostic report and program
- [ ] Comprehensive report is unlocked after payment
- [ ] All report sections display personalized content
- [ ] Navigation and dashboard work correctly
- [ ] Error handling is graceful and informative

---

## 🚨 **Known Issues to Watch For**:

1. **Claude API**: May show 401 errors (this is expected if API key is invalid)
2. **Long Responses**: Should now work with 10,000 character limit
3. **Database Tables**: New tables have been added and migrated
4. **Port Conflicts**: App may run on 3001 instead of 3000

---

## 📞 **Support**

If you encounter issues during testing:
1. Check the terminal logs for error messages
2. Verify all environment variables are set correctly
3. Ensure database migrations have been applied
4. Test with a fresh browser session/incognito mode

**Happy Testing! 🎉**
