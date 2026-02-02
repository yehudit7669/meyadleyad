import jwt from 'jsonwebtoken';

const token = process.argv[2];

if (!token) {
  console.log('Usage: npx tsx test-token.ts <YOUR_TOKEN>');
  process.exit(1);
}

try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET!);
  console.log('✅ Token is valid');
  console.log('Decoded:', decoded);
} catch (error) {
  console.log('❌ Token is invalid');
  console.log('Error:', error instanceof Error ? error.message : String(error));
}
