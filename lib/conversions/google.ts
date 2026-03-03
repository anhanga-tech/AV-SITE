// lib/conversions/google.ts
// Google Ads Conversion API client (PLACEHOLDER)

interface GoogleConversionPayload {
  gclid?: string;
  email?: string;
  phone?: string;
  value?: number;
  currency?: string;
  timestamp?: string;
}

export async function sendGoogleConversion(
  eventName: 'lead_qualificado' | 'purchase',
  payload: GoogleConversionPayload
): Promise<{ success: boolean; error?: string }> {
  const conversionId = process.env.GOOGLE_ADS_CONVERSION_ID; // AW-XXXXXXXXX
  const conversionLabel = eventName === 'lead_qualificado'
    ? process.env.GOOGLE_ADS_CONVERSION_LABEL_LEAD
    : process.env.GOOGLE_ADS_CONVERSION_LABEL_PURCHASE;

  if (!conversionId || !conversionLabel) {
    console.warn('GOOGLE_ADS: Missing conversion ID or label');
    return { success: false, error: 'Missing configuration' };
  }

  try {
    console.log('GOOGLE_ADS: Would send conversion', { eventName, conversionId, conversionLabel, ...payload });
    // TODO: Implement Google Ads API call
    return { success: true };
  } catch (error) {
    console.error('GOOGLE_ADS: Conversion failed', error);
    return { success: false, error: String(error) };
  }
}
