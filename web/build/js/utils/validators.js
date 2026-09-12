function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  return input.replace(/<[^>]*>/g, '')
              .replace(/javascript:/gi, '')
              .replace(/on\w+\s*=/gi, '')
              .trim();
}

function validateInputLength(input, maxLength) {
  if (typeof input !== 'string') return false;
  return input.length <= (maxLength || 200);
}
