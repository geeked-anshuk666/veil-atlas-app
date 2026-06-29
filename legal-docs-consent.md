# Plan: Legal Documents & Consent Flow

Integrate the necessary legal documents (Privacy Policy, Terms of Service) into the user onboarding flow and require user approval (checkbox consent) before allowing exploration.

## Proposed Changes

### Components

#### [MODIFY] [OnboardingModal.tsx](file:///d:/computer_science/hackathons/hack%20the%20zero%20with%20vercel%20v0%20and%20AWS/Veil-Atlas/components/OnboardingModal.tsx)
- Add State:
  - `agreedToTerms`: boolean (tracks consent checkbox)
  - `showDocModal`: 'privacy' | 'terms' | null (modal for viewing legal documents inline)
- Add checkbox + labels:
  - "I agree to the [Terms of Service] and [Privacy Policy]"
  - Buttons/links for "Terms of Service" and "Privacy Policy" will open the respective document in an overlay dialog.
- Disable "Begin Exploring" button until `agreedToTerms` is true.

#### [NEW] [PrivacyPolicy.tsx](file:///d:/computer_science/hackathons/hack%20the%20zero%20with%20vercel%20v0%20and%20AWS/Veil-Atlas/components/legal/PrivacyPolicy.tsx)
- Content: Explains zero identity mapping, location data gating, and encryption practices.

#### [NEW] [TermsOfService.tsx](file:///d:/computer_science/hackathons/hack%20the%20zero%20with%20vercel%20v0%20and%20AWS/Veil-Atlas/components/legal/TermsOfService.tsx)
- Content: Terms regarding anonymous submissions, content moderation guidelines, and mapping services.

---

## Verification Plan

### Manual Verification
1. Open the website.
2. Confirm the Onboarding Modal displays the consent checkbox.
3. Confirm "Begin Exploring" is disabled.
4. Click "Terms of Service" & "Privacy Policy" links; verify they open correctly.
5. Check the checkbox; verify "Begin Exploring" becomes active.
6. Click "Begin Exploring"; verify access to the map is granted.
