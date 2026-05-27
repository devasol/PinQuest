export default async function parseResponse(response) {
  const contentType = (response.headers.get('content-type') || '').toLowerCase();

  // Read the raw text first so we can examine it safely
  const text = await response.text();

  // If the response claims to be JSON, try parsing it
  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(text);
    } catch (err) {
      throw new Error('Invalid JSON received from server');
    }
  }

  // If it looks like an HTML page, throw a clearer error
  const trimmed = text.trim();
  if (trimmed.startsWith('<!doctype') || trimmed.startsWith('<html') || trimmed.startsWith('<')) {
    const snippet = trimmed.substring(0, 1000);
    throw new Error(`Server returned an HTML error page (status ${response.status}). Response snippet: ${snippet}`);
  }

  // Try parsing JSON as a fallback for APIs that omit content-type
  try {
    return JSON.parse(text);
  } catch (err) {
    // Return raw text for non-JSON successful responses
    if (response.ok) return text;
    throw new Error(text || `HTTP error ${response.status}`);
  }
}
